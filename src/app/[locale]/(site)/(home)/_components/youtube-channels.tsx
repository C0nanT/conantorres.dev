import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCardFreshness } from '@/lib/format-freshness'
import { Link } from '@/lib/navigation'
import {
  getYouTubeVideoThumbnail,
  getYouTubeVideoUrl,
  site,
} from '@/lib/site-data'
import {
  formatChannelVideoCount,
  formatSubscribers,
  formatViews,
  getLiveStatsByChannelId,
  getLiveStatsByVideoId,
} from '@/lib/youtube/live-stats'
import { ExternalLink, Play, Youtube } from 'lucide-react'
import Image from 'next/image'
import { FreshnessClock } from './freshness-clock'

export async function YouTubeChannels() {
  const { recommendedChannels, recommendedVideos } = site.youtube
  const [liveStats, channelStats] = await Promise.all([
    getLiveStatsByVideoId(),
    getLiveStatsByChannelId(),
  ])

  return (
    <section className="bg-muted/30 py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <Badge
            variant="outline"
            className="px-3 py-1 hover:border-border hover:bg-transparent"
          >
            <Youtube className="mr-1 h-3 w-3 text-foreground" />
            YouTube
          </Badge>
          <h2 className="text-3xl font-bold lg:text-4xl">
            Canais e vídeos que <span className="gradient-text">recomendo</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Um canal, um vídeo para começar.
          </p>
        </div>

        <div className="divide-y divide-border">
          {recommendedChannels.map((channel) => {
            const video = recommendedVideos.find(
              (v) => v.channelId === channel.id
            )
            const videoStats = video && liveStats.get(video.videoId)
            const stats = channelStats.get(channel.id)
            const freshness = formatCardFreshness(videoStats, stats)

            return (
              <div
                key={channel.id}
                className="grid gap-6 py-8 first:pt-0 last:pb-0 md:grid-cols-[360px_1fr] md:items-center"
              >
                {video && (
                  <a
                    href={getYouTubeVideoUrl(video.videoId, video.startSeconds)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-video overflow-hidden rounded-lg bg-muted"
                  >
                    <Image
                      src={getYouTubeVideoThumbnail(video.videoId)}
                      alt={video.title}
                      fill={true}
                      className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 360px"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-white transition-transform duration-300 motion-safe:scale-75 motion-safe:group-hover:scale-100">
                        <Play className="ml-1 h-7 w-7" />
                      </div>
                    </div>
                  </a>
                )}

                <div className="space-y-3">
                  {video && (
                    <div>
                      <p className="text-sm font-medium text-primary">
                        {video.title}
                      </p>
                      {videoStats && (
                        <p className="text-xs text-muted-foreground">
                          {formatViews(videoStats)}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold">{channel.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {channel.handle} · {stats && formatSubscribers(stats)}{' '}
                      inscritos · {stats && formatChannelVideoCount(stats)}{' '}
                      vídeos
                      <FreshnessClock text={freshness} />
                    </p>
                  </div>
                  <p className="text-muted-foreground">{channel.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {channel.highlights.map((highlight) => (
                      <Badge
                        key={highlight}
                        variant="secondary"
                        className="text-xs hover:bg-secondary"
                      >
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                  <Button asChild={true} className="group w-fit">
                    <Link
                      href={channel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Youtube className="mr-2 h-4 w-4" />
                      Visitar canal
                      <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:scale-110" />
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
