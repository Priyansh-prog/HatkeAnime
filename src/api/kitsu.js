
const BASE_URL = 'https://kitsu.io/api/edge'
const MAX_RETRIES = 2
const RETRYABLE = [429, 500, 502, 503, 504]
const REQUEST_TIMEOUT_MS = 15000

const cache = new Map()
const pending = new Map()

export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const request = async (path, signal) => {
  let delay = 1000

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }

    const combined = signal
      ? AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)])
      : AbortSignal.timeout(REQUEST_TIMEOUT_MS)

    let res
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        signal: combined,
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      })
    } catch (err) {
      if (signal?.aborted) throw err
      if (err instanceof DOMException && err.name === 'AbortError' && attempt < MAX_RETRIES) {
        await sleep(delay)
        delay = delay * 2
        continue
      }
      throw err
    }

    if (res.ok) {
      const json = await res.json()
      cache.set(path, json)
      return json
    }

    if (RETRYABLE.includes(res.status) && attempt < MAX_RETRIES) {
      const header = res.headers.get('Retry-After')
      const headerMs = header && !Number.isNaN(Number(header)) ? Number(header) * 1000 : delay
      await sleep(headerMs)
      delay = delay * 2
      continue
    }

    throw new Error(`Kitsu request failed: ${res.status} ${res.statusText}`)
  }

  throw new Error('Kitsu request failed: too many retries')
}

export const kitsuFetch = (path, signal) => {
  if (cache.has(path)) {
    return Promise.resolve(cache.get(path))
  }
  if (signal) {
    return request(path, signal)
  }
  if (pending.has(path)) {
    return pending.get(path)
  }

  const task = request(path).finally(() => {
    pending.delete(path)
  })
  pending.set(path, task)
  return task
}

export const normalizeAnime = (item) => {
  if (!item) return null
  const attrs = item.attributes ?? {}
  const titles = attrs.titles ?? {}
  const poster = attrs.posterImage ?? {}

  const rawRating = attrs.averageRating
  const parsed = rawRating != null ? Number.parseFloat(rawRating) : Number.NaN
  const score = Number.isNaN(parsed) ? null : Math.round((parsed / 10) * 100) / 100

  const title = attrs.canonicalTitle ?? titles.en_jp ?? titles.en ?? titles.ja_jp ?? ''
  const image = poster.small ?? poster.medium ?? poster.large ?? poster.original ?? ''

  return {
    id: String(item.id ?? ''),
    title,
    image,
    coverImage: image,
    posterImage: image,
    synopsis: attrs.synopsis ?? '',
    score,
    episodes: attrs.episodeCount ?? null,
    status: attrs.status ?? '',
    startDate: attrs.startDate ?? '',
  }
}

export const normalizeAnimeList = (data) => {
  if (!Array.isArray(data)) return []
  return data.map(normalizeAnime).filter((a) => a && a.id && a.title.trim())
}

export const hasNextPage = (json) => {
  return Boolean(json?.links?.next)
}

export const clearKitsuCache = () => {
  cache.clear()
  pending.clear()
}


export const getAnimeById = (id, signal) => {
  return kitsuFetch(`/anime/${id}`, signal)
}

export const getAnimeCategories = (id, signal) => {
  return kitsuFetch(`/anime/${id}/categories?page[limit]=20`, signal)
}

export const getAnimeCharacters = (id, signal) => {
  return kitsuFetch(`/anime/${id}/characters?include=character&page[limit]=12`, signal)
}

export const getAnimeEpisodes = (id, signal) => {
  return kitsuFetch(`/anime/${id}/episodes?sort=number&page[limit]=12`, signal)
}

export const getAnimeRelations = (id, signal) => {
  return kitsuFetch(`/anime/${id}/media-relationships?include=destination`, signal)
}

export const getAnimeStreamingLinks = (id, signal) => {
  return kitsuFetch(`/anime/${id}/streaming-links`, signal)
}

export const getAnimeByCategory = (slug, limit, signal) => {
  return kitsuFetch(
    `/anime?filter[categories]=${encodeURIComponent(slug)}&page[limit]=${limit}&page[offset]=0`,
    signal,
  )
}

export const indexIncluded = (included) => {
  const map = new Map()
  if (Array.isArray(included)) {
    for (const item of included) {
      if (item?.type && item?.id) map.set(`${item.type}:${item.id}`, item)
    }
  }
  return map
}

export const findIncluded = (index, type, id) => {
  if (!type || id == null) return null
  return index.get(`${type}:${id}`) ?? null
}
