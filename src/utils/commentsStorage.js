const STORAGE_KEY = 'anime-explorer:comments'

const defaultComments = [
  {
    id: 'mock-1',
    animeId: '',
    username: 'Aiko',
    text: 'The animation in the latest episode was stunning!',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isMock: true,
  },
  {
    id: 'mock-2',
    animeId: '',
    username: 'Kenji',
    text: 'Great character development. Highly recommend this one.',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    isMock: true,
  },
  {
    id: 'mock-3',
    animeId: '',
    username: 'Sakura',
    text: 'That cliffhanger left me speechless. Can’t wait for the next episode!',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isMock: true,
  },
]

const writeList = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    return
  }
}

export const getComments = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null) {
      writeList(defaultComments)
      return [...defaultComments]
    }
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export const addComment = (newComment = {}) => {
  const list = getComments()
  const next = [
    {
      id: `${Date.now()}`,
      animeId: newComment.animeId ?? '',
      username: (newComment.username ?? '').trim(),
      text: (newComment.text ?? '').trim(),
      createdAt: newComment.createdAt ?? new Date().toISOString(),
      isMock: false,
    },
    ...list,
  ]
  writeList(next)
  return next
}

export const deleteComment = (id) => {
  const next = getComments().filter((c) => String(c.id) !== String(id))
  writeList(next)
  return next
}
