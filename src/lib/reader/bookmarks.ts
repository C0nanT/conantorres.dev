import type { Reader } from './access'
import { getDb } from './db'

// The pages each owner marked in each book (the blue ribbon). The only module
// with bookmark SQL: the reader page and its actions call these functions and
// never touch the database. A mark is just (owner, book, page); adding it twice
// is harmless.

export function listBookmarks(owner: Reader, bookId: string): number[] {
  return getDb()
    .prepare<[{ owner: string; bookId: string }], { page: number }>(
      `SELECT page FROM bookmarks
        WHERE owner = @owner AND book_id = @bookId
        ORDER BY page`
    )
    .all({ owner, bookId })
    .map((row) => row.page)
}

// The caller validates the page against the total first.
export function addBookmark(owner: Reader, bookId: string, page: number) {
  getDb()
    .prepare(
      `INSERT INTO bookmarks (owner, book_id, page, created_at)
       VALUES (@owner, @bookId, @page, @createdAt)
       ON CONFLICT (owner, book_id, page) DO NOTHING`
    )
    .run({ owner, bookId, page, createdAt: new Date().toISOString() })
}

export function removeBookmark(owner: Reader, bookId: string, page: number) {
  getDb()
    .prepare(
      `DELETE FROM bookmarks
        WHERE owner = @owner AND book_id = @bookId AND page = @page`
    )
    .run({ owner, bookId, page })
}
