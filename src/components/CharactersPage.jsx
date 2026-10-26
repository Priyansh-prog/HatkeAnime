import { useState, useEffect, useRef } from 'react'
import { kitsuFetch, hasNextPage, sleep } from '../api/kitsu'
import { PAGE_LIMIT } from '../api/sections'
import { Spinner } from '@/components/ui/spinner'

const normalizeCharacters = (data) =>
  (Array.isArray(data) ? data : [])
    .map((item) => {
      const attrs = item.attributes ?? {}
      const image = attrs.image ?? {}
      return {
        id: String(item.id),
        name: attrs.canonicalName ?? attrs.name ?? '',
        image: image.original ?? image.medium ?? image.small ?? image.large ?? '',
      }
    })
    .filter((c) => c.name && c.image)

const CharactersPage = () => {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [retryKey, setRetryKey] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const sentinelRef = useRef(null)
  const lastFetchAt = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')

      const wait = 1000 - (Date.now() - lastFetchAt.current)
      if (wait > 0) await sleep(wait)
      if (cancelled || controller.signal.aborted) return
      lastFetchAt.current = Date.now()

      try {
        const offset = (page - 1) * PAGE_LIMIT
        const json = await kitsuFetch(
          `/characters?page[limit]=${PAGE_LIMIT}&page[offset]=${offset}`,
          controller.signal,
        )
        if (cancelled) return
        const list = normalizeCharacters(json.data)
        setItems((prev) => {
          if (page === 1) return list
          const seen = new Set(prev.map((c) => c.id))
          return [...prev, ...list.filter((c) => !seen.has(c.id))]
        })
        setHasMore(hasNextPage(json))
      } catch (err) {
        if (cancelled) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [page, retryKey])

  useEffect(() => {
    if (loading || !hasMore || error) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        observer.disconnect()
        setPage((p) => p + 1)
      },
      { rootMargin: '200px' },
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, loading, error, items.length])

  return (
    <section className="anime-section">
      <div className="anime-section-head">
        <h2>Characters</h2>
      </div>

      {error.trim() && items.length === 0 && (
        <p>
          {error}{' '}
          <button className="view-all-btn" onClick={() => setRetryKey((k) => k + 1)}>
            Retry
          </button>
        </p>
      )}

      <div className="char-grid">
        {items.map((c) => (
          <div className="char-card" key={c.id}>
            <img className="char-avatar" src={c.image} alt="" loading="lazy" />
            <p className="char-name">{c.name}</p>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-50 gap-2">
          <Spinner className="size-6 text-primary" />
          <span>Loading characters...</span>
        </div>
      )}

      {!loading && !error.trim() && items.length === 0 && <p>No characters found.</p>}

      <div ref={sentinelRef} />
    </section>
  )
}

export default CharactersPage
