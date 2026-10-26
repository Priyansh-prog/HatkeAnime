
export const ROW_LIMIT = 12
export const PAGE_LIMIT = 20
const KITSU_MAX_LIMIT = 20

const limitFor = (limit) => Math.min(limit, KITSU_MAX_LIMIT)
const offsetFor = (page, limit) => (page - 1) * limitFor(limit)

export const SECTIONS = [
  {
    key: 'trending',
    title: 'Trending Now',
    path: (page, limit) =>
      `/trending/anime?page[limit]=${limitFor(limit)}&page[offset]=${offsetFor(page, limit)}`,
  },
  {
    key: 'popular-season',
    title: 'Popular This Season',
    path: (page, limit) =>
      `/anime?filter[season]=fall&filter[seasonYear]=2025&sort=-userCount&page[limit]=${limitFor(limit)}&page[offset]=${offsetFor(page, limit)}`,
  },
  {
    key: 'upcoming',
    title: 'Upcoming Next Season',
    path: (page, limit) =>
      `/anime?filter[status]=upcoming&sort=-userCount&page[limit]=${limitFor(limit)}&page[offset]=${offsetFor(page, limit)}`,
  },
  {
    key: 'latest',
    title: 'Latest Additions',
    path: (page, limit) =>
      `/anime?sort=-startDate&page[limit]=${limitFor(limit)}&page[offset]=${offsetFor(page, limit)}`,
  },
  {
    key: 'all-time',
    title: 'All Time Popular',
    path: (page, limit) =>
      `/anime?sort=-userCount&page[limit]=${limitFor(limit)}&page[offset]=${offsetFor(page, limit)}`,
  },
  {
    key: 'top-rated',
    title: 'Top Rated',
    path: (page, limit) =>
      `/anime?sort=-averageRating&page[limit]=${limitFor(limit)}&page[offset]=${offsetFor(page, limit)}`,
  },
  {
    key: 'top-score',
    title: 'Top by Score',
    path: (page, limit) =>
      `/anime?sort=ratingRank&page[limit]=${limitFor(limit)}&page[offset]=${offsetFor(page, limit)}`,
  },
]

export const getSection = (key) => {
  return SECTIONS.find((s) => s.key === key) ?? SECTIONS[0]
}

export const buildSearchPath = (query, page, limit) => {
  return `/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=${limitFor(limit)}&page[offset]=${offsetFor(page, limit)}`
}

export const buildDetailsPath = (id) => {
  return `/anime/${id}`
}

export const DEFAULT_FILTERS = {
  genres: [],
  year: 'any',
  season: 'any',
  format: 'any',
  status: 'any',
}

export const GENRE_OPTIONS = [
  { slug: 'action', label: 'Action' },
  { slug: 'adventure', label: 'Adventure' },
  { slug: 'comedy', label: 'Comedy' },
  { slug: 'drama', label: 'Drama' },
  { slug: 'fantasy', label: 'Fantasy' },
  { slug: 'horror', label: 'Horror' },
  { slug: 'mystery', label: 'Mystery' },
  { slug: 'psychological', label: 'Psychological' },
  { slug: 'romance', label: 'Romance' },
  { slug: 'school', label: 'School' },
  { slug: 'sci-fi', label: 'Sci-Fi' },
  { slug: 'slice-of-life', label: 'Slice of Life' },
  { slug: 'sports', label: 'Sports' },
  { slug: 'supernatural', label: 'Supernatural' },
  { slug: 'thriller', label: 'Thriller' },
]

export const YEAR_OPTIONS = [
  'any',
  ...Array.from({ length: 37 }, (_, i) => String(2026 - i)),
]

export const SEASON_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'winter', label: 'Winter' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'fall', label: 'Fall' },
]

export const FORMAT_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'TV', label: 'TV' },
  { value: 'movie', label: 'Movie' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'special', label: 'Special' },
  { value: 'music', label: 'Music' },
]

export const STATUS_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'current', label: 'Airing' },
  { value: 'finished', label: 'Finished' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'tba', label: 'TBA' },
]

export const hasActiveFilters = (filters) => {
  if (!filters) return false
  return (
    (Array.isArray(filters.genres) && filters.genres.length > 0) ||
    filters.year !== 'any' ||
    filters.season !== 'any' ||
    filters.format !== 'any' ||
    filters.status !== 'any'
  )
}

export const buildFilteredPath = (filters, page, limit, query = '') => {
  const f = filters ?? DEFAULT_FILTERS
  const params = []
  if (query.trim()) params.push(`filter[text]=${encodeURIComponent(query.trim())}`)
  if (Array.isArray(f.genres) && f.genres.length > 0)
    params.push(`filter[categories]=${f.genres.join(',')}`)
  if (f.season !== 'any') params.push(`filter[season]=${f.season}`)
  if (f.year !== 'any') params.push(`filter[seasonYear]=${f.year}`)
  if (f.format !== 'any') params.push(`filter[subtype]=${f.format}`)
  if (f.status !== 'any') params.push(`filter[status]=${f.status}`)
  params.push('sort=-userCount')
  params.push(`page[limit]=${limitFor(limit)}`)
  params.push(`page[offset]=${offsetFor(page, limit)}`)
  return `/anime?${params.join('&')}`
}
