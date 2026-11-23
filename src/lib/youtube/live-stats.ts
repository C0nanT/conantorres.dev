import { site } from '@/lib/site-data'
import type {
  RecommendedYouTubeChannel,
  RecommendedYouTubeVideo,
} from '@/lib/site-data'
import { unstable_cache } from 'next/cache'
import {
  logFallbackUsed,
  recordScrapeFailure,
  recordScrapeSuccess,
} from './stats-log'
import type { StatsTarget } from './stats-log'

const REVALIDATE_SECONDS = 60 * 60 * 24
const FETCH_TIMEOUT_MS = 8000
const VIEW_COUNT_PATTERN = /"viewCount":"(\d+)"/
const SUBSCRIBERS_PATTERN = /"content":"(\d[^"]*?) (?:de )?inscritos"/
const CHANNEL_VIDEO_COUNT_PATTERN = /"content":"(\d[\d.]*) víde(?:o|os)"/
const COMPACT_MULTIPLIERS: Record<string, number> = {
  mil: 1e3,
  mi: 1e6,
  milhão: 1e6,
  milhões: 1e6,
}

export type LiveVideoStats =
  | { isFallback: false; views: number; fetchedAt: number }
  | { isFallback: true; views: string }

export type LiveChannelStats =
  | {
      isFallback: false
      subscribers: number
      videoCount: number
      fetchedAt: number
    }
  | { isFallback: true; subscribers: string; videoCount: string }

const compactFormatter = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 0,
})

async function fetchPageText(url: string) {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Accept-Language': 'pt-BR',
      'User-Agent': 'Mozilla/5.0 (compatible; conan-torres-site)',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.text()
}

// Parses pt-BR compact counts such as "414 mil", "30,3 mil" or "1,08 mi".
function parseCompactCount(text: string) {
  const [amount = '', unit] = text.trim().split(/\s+/)
  const multiplier = unit ? COMPACT_MULTIPLIERS[unit] : 1
  const value = Number(amount.replace(/\./g, '').replace(',', '.'))
  if (multiplier === undefined || Number.isNaN(value)) {
    throw new Error(`contagem inválida: ${text}`)
  }
  return Math.round(value * multiplier)
}

async function scrapeVideoViews(videoId: string) {
  const html = await fetchPageText(
    `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
  )
  const match = VIEW_COUNT_PATTERN.exec(html)
  if (!match?.[1]) {
    throw new Error('viewCount não encontrado')
  }
  return Number(match[1])
}

async function scrapeChannelStats(channelUrl: string) {
  const html = await fetchPageText(channelUrl)
  const subscribersMatch = SUBSCRIBERS_PATTERN.exec(html)
  if (!subscribersMatch?.[1]) {
    throw new Error('inscritos não encontrado')
  }
  const videoCountMatch = CHANNEL_VIDEO_COUNT_PATTERN.exec(html)
  if (!videoCountMatch?.[1]) {
    throw new Error('quantidade de vídeos não encontrada')
  }
  return {
    subscribers: parseCompactCount(subscribersMatch[1]),
    videoCount: parseCompactCount(videoCountMatch[1]),
  }
}

async function trackScrape<T>(target: StatsTarget, scrape: () => Promise<T>) {
  try {
    const result = await scrape()
    recordScrapeSuccess(target)
    return result
  } catch (error) {
    recordScrapeFailure(target, error)
    throw error
  }
}

// Throwing inside the cached function makes Next keep the previous entry.
function getCachedVideoViews(videoId: string) {
  return unstable_cache(
    async () => ({
      views: await trackScrape({ type: 'video', id: videoId }, () =>
        scrapeVideoViews(videoId)
      ),
      fetchedAt: Date.now(),
    }),
    ['youtube-live-stats', 'video-views', videoId],
    { revalidate: REVALIDATE_SECONDS }
  )()
}

function getCachedChannelStats(channel: RecommendedYouTubeChannel) {
  return unstable_cache(
    async () => ({
      ...(await trackScrape({ type: 'channel', id: channel.id }, () =>
        scrapeChannelStats(channel.url)
      )),
      fetchedAt: Date.now(),
    }),
    ['youtube-live-stats', 'channel-stats', channel.id, channel.url],
    { revalidate: REVALIDATE_SECONDS }
  )()
}

async function getLiveVideoStats(
  video: RecommendedYouTubeVideo
): Promise<LiveVideoStats> {
  try {
    const { views, fetchedAt } = await getCachedVideoViews(video.videoId)
    return { isFallback: false, views, fetchedAt }
  } catch (error) {
    logFallbackUsed({ type: 'video', id: video.videoId }, error)
    return { isFallback: true, views: video.views }
  }
}

async function getLiveChannelStats(
  channel: RecommendedYouTubeChannel
): Promise<LiveChannelStats> {
  try {
    const { subscribers, videoCount, fetchedAt } =
      await getCachedChannelStats(channel)
    return { isFallback: false, subscribers, videoCount, fetchedAt }
  } catch (error) {
    logFallbackUsed({ type: 'channel', id: channel.id }, error)
    return {
      isFallback: true,
      subscribers: channel.subscribers,
      videoCount: channel.videoCount,
    }
  }
}

export async function getLiveStatsByVideoId() {
  const entries = await Promise.all(
    site.youtube.recommendedVideos.map(
      async (video) => [video.videoId, await getLiveVideoStats(video)] as const
    )
  )
  return new Map(entries)
}

export async function getLiveStatsByChannelId() {
  const entries = await Promise.all(
    site.youtube.recommendedChannels.map(
      async (channel) =>
        [channel.id, await getLiveChannelStats(channel)] as const
    )
  )
  return new Map(entries)
}

// Fallback values are data/site strings, already formatted for display.
function formatCount(value: number | string) {
  return typeof value === 'string' ? value : compactFormatter.format(value)
}

export function formatViews(stats: LiveVideoStats) {
  return `${formatCount(stats.views)} visualizações`
}

export function formatSubscribers(stats: LiveChannelStats) {
  return formatCount(stats.subscribers)
}

export function formatChannelVideoCount(stats: LiveChannelStats) {
  return formatCount(stats.videoCount)
}
