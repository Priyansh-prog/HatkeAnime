const timeAgo = (iso) => {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Date.now() - then
  if (diff < 60 * 1000) return 'Just now'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`
  if (diff < 7 * 24 * 60 * 60 * 1000)
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`
  return new Date(iso).toLocaleDateString()
}

const CommentItem = ({ comment, onDelete = () => {} }) => {
  if (!comment) return null
  const name = comment.username ?? comment.author ?? ''
  const body = comment.text ?? comment.body ?? ''
  if (!String(body).trim()) return null
  const isMock = comment.isMock === true || String(comment.id).startsWith('mock-')

  return (
    <article className="comment-card rounded-lg border p-4">
      <div className="comment-head mb-1 flex items-baseline justify-between gap-3">
        <span className="comment-author text-sm font-bold">{name}</span>
        <span className="comment-time text-xs opacity-65">{timeAgo(comment.createdAt)}</span>
      </div>
      <p className={isMock ? 'comment-body mb-0 text-sm leading-relaxed' : 'comment-body mb-3 text-sm leading-relaxed'}>{body}</p>
      {!isMock && (
        <button
          className="comment-delete rounded-md border px-3 py-1 text-xs font-semibold"
          onClick={() => onDelete(comment.id)}
        >
          Delete
        </button>
      )}
    </article>
  )
}

export default CommentItem
