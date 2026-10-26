import { useState, useEffect, useRef } from 'react'
import { kitsuFetch, normalizeAnimeList, hasNextPage, sleep } from '../api/kitsu'
import { getSection, PAGE_LIMIT, buildSearchPath, buildFilteredPath, hasActiveFilters, DEFAULT_FILTERS } from '../api/sections'
import AnimeCard from './AnimeCard'
import { Spinner } from '@/components/ui/spinner'

const CategoryPage = ({ sectionKey = 'trending', query = '', filters = DEFAULT_FILTERS, onBack }) => {
  const section = getSection(sectionKey)
  const activeQuery = query.trim()
  const searching = activeQuery.length > 0
  const filtered = hasActiveFilters(filters)
  const filterSig = JSON.stringify(filters ?? DEFAULT_FILTERS)
  const title = searching ? `Results for "${activeQuery}"` : filtered ? 'Filtered Results' : section.title

  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [retryKey, setRetryKey] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const sentinelRef = useRef(null)
  const lastFetchAt = useRef(0)
  const hasMoreRef = useRef(hasMore)

  useEffect(() => {
    hasMoreRef.current = hasMore
  })

  useEffect(() => {
    if (!hasMoreRef.current && page > 1) return

    const controller = new AbortController()
    let cancelled = false

    const getData = async () => {
      setLoading(true)
      setError('')

      const wait = 1000 - (Date.now() - lastFetchAt.current)
      if (wait > 0) {
        await sleep(wait)
      }
      if (cancelled || controller.signal.aborted) return
      lastFetchAt.current = Date.now()

      try {
        const path = filtered
          ? buildFilteredPath(filters, page, PAGE_LIMIT, activeQuery)
          : searching
            ? buildSearchPath(activeQuery, page, PAGE_LIMIT)
            : section.path(page, PAGE_LIMIT)
        const json = await kitsuFetch(path, controller.signal)
        if (cancelled) return
        const list = normalizeAnimeList(json.data)
        setItems((prev) => {
          if (page === 1) return list
          const seen = new Set(prev.map((a) => a.id))
          return [...prev, ...list.filter((a) => !seen.has(a.id))]
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

    getData()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [sectionKey, section, page, retryKey, searching, activeQuery, filters, filtered, filterSig])

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
        <h2>{title}</h2>
        {onBack && (
          <button className="view-all-btn" onClick={onBack}>
            ← Back
          </button>
        )}
      </div>

      {error.trim() && items.length === 0 && (
        <p>
          {error}{' '}
          <button className="view-all-btn" onClick={() => setRetryKey((k) => k + 1)}>
            Retry
          </button>
        </p>
      )}

      <div className="anime-grid">
        {items.map((item) => {
          return (
            <AnimeCard
              key={item.id}
              id={item.id}
              title={item.title}
              image={item.image}
              score={item.score}
              episodes={item.episodes}
              startDate={item.startDate}
              
            />
          )
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-50 gap-2">
          <Spinner className="size-6 text-primary" />
          <span>Loading anime...</span>
        </div>
      )}
      {!loading && !error.trim() && items.length === 0 && searching && <p>No results found.</p>}
      
      {!hasMore && !loading && items.length > 0 }
      <div ref={sentinelRef} />
    </section>
  )
}

export default CategoryPage
