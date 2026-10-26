import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAnimeById, normalizeAnime } from '../api/kitsu'
import { readWatchlist, removeFromWatchlist } from '../utils/watchlist'
import AnimeCard from './AnimeCard'

const WatchlistPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const ids = readWatchlist()
      if (ids.length === 0) {
        setItems([])
        setLoading(false)
        return
      }
      try {
        const results = await Promise.all(
          ids.map((id) =>
            getAnimeById(id)
              .then((json) => normalizeAnime(json.data))
              .catch(() => null),
          ),
        )
        if (!cancelled) setItems(results.filter((a) => a && a.id))
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const remove = (id) => {
    const next = removeFromWatchlist(id)
    setItems((prev) => prev.filter((a) => next.includes(a.id)))
  }

  return (
    <main>
      <section className="anime-section">
        <div className="anime-section-head">
          <h2>My Watchlist</h2>
          <Link className="view-all-btn" to="/">
            ← Back to browse
          </Link>
        </div>

        {loading && <p>Loading watchlist...</p>}

        {!loading && items.length === 0 && (
          <p>
            Your watchlist is empty. Browse anime and tap “☆ Add to Watchlist” to save titles
            here.
          </p>
        )}

        {!loading && items.length > 0 && (
          <div className="anime-grid">
            {items.map((item) => (
              <div className="anime-card" key={item.id}>
                <AnimeCard
                  id={item.id}
                  title={item.title}
                  image={item.image}
                  score={item.score}
                  episodes={item.episodes}
                  startDate={item.startDate}
                />
                <button className="comment-delete" onClick={() => remove(item.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default WatchlistPage
