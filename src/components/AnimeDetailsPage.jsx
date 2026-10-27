import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  kitsuFetch,
  normalizeAnimeList,
  getAnimeById,
  getAnimeCategories,
  getAnimeCharacters,
  getAnimeEpisodes,
  getAnimeRelations,
  getAnimeStreamingLinks,
  getAnimeByCategory,
  indexIncluded,
  findIncluded,
} from '../api/kitsu'
import AnimeCard from './AnimeCard'
import CommentsSection from './CommentsSection'
import { readWatchlist, toggleWatchlistEntry } from '../utils/watchlist'

const seasonFor = (iso) => {
  const m = iso ? Number(String(iso).slice(5, 7)) : Number.NaN
  if (Number.isNaN(m)) return ''
  if (m <= 3) return 'Winter'
  if (m <= 6) return 'Spring'
  if (m <= 9) return 'Summer'
  return 'Fall'
}

const hostFor = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Stream'
  }
}

const MetaRow = ({ label, value }) => {
  if (value == null || value === '') return null
  return (
    <div className="details-meta-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

const Section = ({ title, children, id }) => {
  return (
    <section className="details-section" id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

const DetailsSkeleton = () => {
  return (
    <div className="details-page" aria-label="Loading anime details">
      <div className="details-banner skel" />
      <div className="details-wrap">
        <div className="details-head">
          <div className="details-poster skel" />
          <div className="details-title-block">
            <div className="skel skel-line skel-title" />
            <div className="skel skel-line skel-sub" />
            <div className="skel skel-line skel-text" />
            <div className="skel skel-line skel-text" />
          </div>
        </div>
        <div className="details-body flex flex-col gap-8 px-4 mt-7 min-[901px]:flex-row">
          <div className="details-sidebar min-[901px]:w-[260px] min-[901px]:shrink-0">
            <div className="skel skel-line" />
            <div className="skel skel-line" />
            <div className="skel skel-line" />
            <div className="skel skel-line" />
          </div>
          <div className="details-main flex-1 min-w-0">
            <div className="skel skel-line skel-title" />
            <div className="skel skel-block" />
          </div>
        </div>
      </div>
    </div>
  )
}

const AnimeDetailsPage = () => {
  const { id } = useParams()
  const [anime, setAnime] = useState(null)
  const [categories, setCategories] = useState([])
  const [characters, setCharacters] = useState([])
  const [episodes, setEpisodes] = useState([])
  const [relations, setRelations] = useState([])
  const [streaming, setStreaming] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [inWatchlist, setInWatchlist] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setNotFound(false)
      setError('')
      setInWatchlist(readWatchlist().includes(String(id)))

      try {
        const json = await getAnimeById(id, controller.signal)
        if (cancelled) return
        const data = json.data
        if (!data) {
          setNotFound(true)
          return
        }
        setAnime(data)

        const settle = async (task, apply) => {
          try {
            const res = await task
            if (!cancelled) apply(res)
          } catch {
            return
          }
        }

        await Promise.all([
          settle(getAnimeCategories(id, controller.signal), (res) => {
            setCategories(Array.isArray(res.data) ? res.data : [])
          }),
          settle(getAnimeCharacters(id, controller.signal), (res) => {
            const index = indexIncluded(res.included)
            const list = (Array.isArray(res.data) ? res.data : [])
              .map((c) => {
                const ref = c.relationships?.character?.data
                return {
                  key: `${c.type}:${c.id}`,
                  role: c.attributes?.role ?? '',
                  character: findIncluded(index, ref?.type, ref?.id),
                }
              })
              .filter((c) => c.character)
            setCharacters(list)
          }),
          settle(getAnimeEpisodes(id, controller.signal), (res) => {
            setEpisodes(Array.isArray(res.data) ? res.data : [])
          }),
          settle(getAnimeRelations(id, controller.signal), (res) => {
            const index = indexIncluded(res.included)
            const list = (Array.isArray(res.data) ? res.data : [])
              .map((r) => {
                const ref = r.relationships?.destination?.data
                return {
                  key: `${r.type}:${r.id}`,
                  role: r.attributes?.role ?? '',
                  dest: findIncluded(index, ref?.type, ref?.id),
                  destType: ref?.type ?? '',
                }
              })
              .filter((r) => r.dest)
            setRelations(list)
          }),
          settle(getAnimeStreamingLinks(id, controller.signal), (res) => {
            setStreaming(Array.isArray(res.data) ? res.data : [])
          }),
        ])
        if (cancelled) return

        try {
          const cats = await getAnimeCategories(id, controller.signal)
          const first = Array.isArray(cats.data) ? cats.data[0] : null
          let recs = []
          if (first?.attributes?.slug) {
            const byCat = await getAnimeByCategory(
              first.attributes.slug,
              12,
              controller.signal,
            )
            recs = normalizeAnimeList(byCat.data).filter((a) => a.id !== String(id))
          }
          if (recs.length === 0) {
            const trending = await kitsuFetch(
              '/trending/anime?page[limit]=12',
              controller.signal,
            )
            recs = normalizeAnimeList(trending.data).filter((a) => a.id !== String(id))
          }
          if (!cancelled) setRecommendations(recs.slice(0, 12))
        } catch {
          return
        }
      } catch (err) {
        if (cancelled) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        const msg = err instanceof Error ? err.message : 'Failed to load'
        if (msg.includes('404')) setNotFound(true)
        else setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [id, retryKey])

  const toggleWatchlist = () => {
    setInWatchlist(toggleWatchlistEntry(id).includes(String(id)))
  }

  if (loading) return <DetailsSkeleton />

  if (notFound) {
    return (
      <div className="details-page details-status">
        <h2>Anime not found</h2>
        <p>No anime exists for ID “{id}”. It may have been removed.</p>
        <Link className="view-all-btn" to="/home">
          ← Back to browse
        </Link>
      </div>
    )
  }

  if (error || !anime) {
    return (
      <div className="details-page details-status">
        <h2>Couldn’t load this anime</h2>
        <p>{error || 'Unexpected response from Kitsu.'}</p>
        <p>
          <button className="view-all-btn" onClick={() => setRetryKey((k) => k + 1)}>
            Retry
          </button>{' '}
          <Link className="view-all-btn" to="/home">
            ← Back to browse
          </Link>
        </p>
      </div>
    )
  }

  const a = anime.attributes ?? {}
  const titles = a.titles ?? {}
  const poster = a.posterImage ?? {}
  const cover = a.coverImage ?? {}
  const rating = a.averageRating != null ? Number.parseFloat(a.averageRating) : Number.NaN
  const score = Number.isNaN(rating) ? null : Math.round((rating / 10) * 100) / 100
  const year = a.startDate ? String(a.startDate).slice(0, 4) : ''
  const season = seasonFor(a.startDate)
  const banner = cover.original ?? cover.large ?? ''
  const posterSrc = poster.medium ?? poster.small ?? poster.large ?? poster.original ?? ''

  return (
    <div className="details-page">
      <Link className="details-back view-all-btn" to="/home">
        ← Back to browse
      </Link>

      <header className="details-banner">
        {banner && <img className="details-banner-img" src={banner} alt="" />}
        <div className="details-banner-overlay" />
      </header>

      <div className="details-wrap">
        <div className="details-head">
          {posterSrc && (
            <div className="details-poster-col">
              <img className="details-poster" src={posterSrc} alt={a.canonicalTitle ?? ''} />
              <button
                className={inWatchlist ? 'watchlist-btn active' : 'watchlist-btn'}
                onClick={toggleWatchlist}
              >
                {inWatchlist ? '★ In Watchlist' : '☆ Add to Watchlist'}
              </button>
            </div>
          )}
          <div className="details-title-block">
            <h1>{a.canonicalTitle ?? ''}</h1>
            <p className="details-alt-titles">
              {[titles.en, titles.ja_jp].filter(Boolean).join(' • ')}
            </p>
            <p className="details-quick-stats">
              {[a.subtype, year, a.status, score != null ? `★ ${score}` : null]
                .filter(Boolean)
                .join(' • ')}
            </p>
            {a.synopsis && <p className="details-synopsis">{a.synopsis}</p>}
            {categories.length > 0 && (
              <div className="details-tags">
                {categories.map((c) => (
                  <span className="tag-pill" key={c.id}>
                    {c.attributes?.title ?? c.id}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="details-body flex flex-col gap-8 px-4 mt-7 min-[901px]:flex-row">
          <aside className="details-sidebar min-[901px]:w-[260px] min-[901px]:shrink-0">
            <h2>Details</h2>
            <dl>
              <MetaRow label="Format" value={a.subtype} />
              <MetaRow
                label="Episodes"
                value={
                  a.episodeCount != null
                    ? `${a.episodeCount}${a.episodeLength ? ` × ${a.episodeLength} min` : ''}`
                    : null
                }
              />
              <MetaRow label="Status" value={a.status} />
              <MetaRow
                label="Season"
                value={[season, year].filter(Boolean).join(' ') || null}
              />
              <MetaRow
                label="Aired"
                value={[a.startDate, a.endDate].filter(Boolean).join(' → ') || null}
              />
              <MetaRow
                label="Rating"
                value={
                  score != null
                    ? `★ ${score}${a.ratingRank ? ` (#${a.ratingRank})` : ''}`
                    : null
                }
              />
              <MetaRow
                label="Popularity"
                value={
                  a.popularityRank
                    ? `#${a.popularityRank}${a.userCount ? ` (${a.userCount.toLocaleString()} users)` : ''}`
                    : null
                }
              />
              <MetaRow
                label="Favorites"
                value={a.favoritesCount != null ? a.favoritesCount.toLocaleString() : null}
              />
              <MetaRow
                label="Age Rating"
                value={[a.ageRating, a.ageRatingGuide].filter(Boolean).join(' — ') || null}
              />
              <MetaRow label="NSFW" value={a.nsfw ? 'Yes' : 'No'} />
            </dl>
            {streaming.length > 0 && (
              <>
                <h2>Where to Watch</h2>
                <ul className="details-stream-list">
                  {streaming.map((s) => (
                    <li key={s.id}>
                      <a href={s.attributes?.url} target="_blank" rel="noreferrer">
                        {hostFor(s.attributes?.url ?? '')}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </aside>

          <div className="details-main flex-1 min-w-0">
            {relations.length > 0 && (
              <Section title="Relations">
                <div className="rel-grid flex flex-wrap gap-3.5 px-12 mx-[-3rem]">
                  {relations.map((r) => {
                    const attrs = r.dest.attributes ?? {}
                    const relPoster =
                      attrs.posterImage?.small ?? attrs.posterImage?.medium ?? ''
                    return r.destType === 'anime' ? (
                      <Link
                        className="rel-card flex-1 min-w-[130px]"
                        key={r.key}
                        to={`/anime/${r.dest.id}`}
                        aria-label={attrs.canonicalTitle ?? ''}
                      >
                        {relPoster && <img src={relPoster} alt="" loading="lazy" />}
                        <p className="rel-role">{r.role.replace(/_/g, ' ')}</p>
                        <p className="rel-title">{attrs.canonicalTitle ?? ''}</p>
                      </Link>
                    ) : (
                      <div className="rel-card flex-1 min-w-[130px]" key={r.key}>
                        {relPoster && <img src={relPoster} alt="" loading="lazy" />}
                        <p className="rel-role">
                          {r.destType} • {r.role.replace(/_/g, ' ')}
                        </p>
                        <p className="rel-title">{attrs.canonicalTitle ?? attrs.title ?? ''}</p>
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}

            {characters.length > 0 && (
              <Section title="Characters">
                <div className="char-row scrollbar-none ">
                  {characters.map((c) => {
                    const attrs = c.character.attributes ?? {}
                    const avatar =
                      attrs.image?.original ?? attrs.image?.medium ?? attrs.image?.small ?? ''
                    return (
                      <div className="char-card" key={c.key}>
                        {avatar && <img className="char-avatar" src={avatar} alt="" loading="lazy" />}
                        <p className="char-name">{attrs.canonicalName ?? attrs.name ?? ''}</p>
                        {c.role && <p className="char-role">{c.role}</p>}
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}

            {a.youtubeVideoId && (
              <Section title="Trailer">
                <div className="trailer-wrap">
                  <iframe
                    src={`https://www.youtube.com/embed/${a.youtubeVideoId}`}
                    title={`${a.canonicalTitle ?? 'Anime'} trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </Section>
            )}

            {episodes.length > 0 && (
              <Section title="Episodes">
                <div className="ep-grid flex flex-wrap gap-3.5 px-12 mx-[-3rem]">
                  {episodes.map((ep) => {
                    const attrs = ep.attributes ?? {}
                    const titlesEp = attrs.titles ?? {}
                    return (
                      <article className="ep-card flex-1 min-w-[200px]" key={ep.id}>
                        {attrs.thumbnail?.original && (
                          <img src={attrs.thumbnail.original} alt="" loading="lazy" />
                        )}
                        <p className="ep-title">
                          E{attrs.number ?? ep.id} —{' '}
                          {attrs.canonicalTitle ??
                            titlesEp.en_us ??
                            titlesEp.en ??
                            titlesEp.en_jp ??
                            'Untitled'}
                        </p>
                        {attrs.airdate && <p className="ep-airdate">{attrs.airdate}</p>}
                      </article>
                    )
                  })}
                </div>
              </Section>
            )}

            {recommendations.length > 0 && (
              <Section title="You Might Also Like" id="you-might-also-like">
                <div className="anime-grid">
                  {recommendations.map((item) => (
                    <AnimeCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      image={item.image}
                      score={item.score}
                      episodes={item.episodes}
                      startDate={item.startDate}
                    />
                  ))}
                </div>
              </Section>
            )}

            <CommentsSection key={String(id)} animeId={String(id)} />

            {loading === false &&
              relations.length === 0 &&
              characters.length === 0 &&
              episodes.length === 0 && (
                <p className="details-empty">
                  No extra sections available for this title yet.
                </p>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnimeDetailsPage
