import { useState, useEffect } from 'react'
import { getComments, addComment, deleteComment } from '../utils/commentsStorage'
import CommentItem from './CommentItem'

const CommentsSection = ({ animeId = '' }) => {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')

  useEffect(() => {
    const load = async () => {
      setComments(getComments())
    }
    load()
  }, [])

  const submit = () => {
    if (!text.trim()) return
    const next = addComment({ animeId, username: 'Anonymous', text: text.trim() })
    setComments(next)
    setText('')
  }

  const remove = (id) => {
    setComments(deleteComment(id))
  }

  return (
    <section id="comments-section" className="details-section comments-section mt-8 border-t pt-6">
      <h2>Comments</h2>
      <div className="comments-form mb-5 flex max-w-2xl flex-col gap-2.5">
        <textarea
          id="comment-text"
          placeholder="Share your thoughts..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-22 w-full rounded-md border px-3 py-2.5 text-sm leading-relaxed"
        />
        <button
          id="submit-comment-btn"
          onClick={submit}
          className="self-start rounded-md px-5 py-2.5 text-sm font-bold text-white"
        >
          Post Comment
        </button>
      </div>
      <div id="comments-list" className="flex max-w-2xl flex-col gap-3">
        {comments.length === 0 ? (
          <p className="comments-empty text-sm opacity-70">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((c) => <CommentItem key={c.id} comment={c} onDelete={remove} />)
        )}
      </div>
    </section>
  )
}

export default CommentsSection
