import { getBooks } from '@/lib/reader/book-progress'
import { getTranslations } from 'next-intl/server'
import { BookItem } from './book-item'

export async function BookList() {
  const t = await getTranslations('books')
  const books = getBooks()

  return (
    <section className="section-tone py-16 lg:py-20">
      <div className="max-w-5xl mx-auto px-4">
        <header className="mb-10 max-w-3xl space-y-3">
          <h1 className="text-3xl font-bold lg:text-4xl">{t('title')}</h1>
          <p className="text-lg text-muted-foreground">{t('description')}</p>
        </header>

        <div className="divide-y divide-dotted divide-border">
          {books.map((book) => (
            <BookItem key={book.id} book={book} />
          ))}
        </div>
      </div>
    </section>
  )
}
