export const WATCHLIST_KEY = 'anime-explorer:watchlist'

export const readWatchlist = () => {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.map(String) : []
  } catch {
    return []
  }
}

const writeWatchlist = (list) => {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list))
  } catch {
    return
  }
}

export const toggleWatchlistEntry = (id) => {
  const key = String(id)
  const list = readWatchlist()
  const next = list.includes(key) ? list.filter((v) => v !== key) : [...list, key]
  writeWatchlist(next)
  return next
}

export const removeFromWatchlist = (id) => {
  const next = readWatchlist().filter((v) => v !== String(id))
  writeWatchlist(next)
  return next
}
