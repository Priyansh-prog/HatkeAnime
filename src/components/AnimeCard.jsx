import { Link } from 'react-router-dom'

const AnimeCard = ({ id, title, image, score, episodes, startDate }) => {
  if (!title.trim()) return null

  const body = (
    <div >
      <img className="anime-poster" src={image} alt={title} loading="lazy" />
      <h3 className="anime-title">{title}</h3>
      <p className="anime-score">{score ?? 'N/A'}</p>
    </div>
  )

  if (!id) {
    return <div className="anime-card">{body}</div>
  }

  return (
    <Link
      className="anime-card anime-card-link"
      to={`/anime/${id}`}
      aria-label={title}
      data-anime-card
      data-anime-id={id}
      data-episodes={episodes ?? '?'}
      data-date={startDate ?? ''}
    >
      {body}
    </Link>
  )
}

export default AnimeCard
