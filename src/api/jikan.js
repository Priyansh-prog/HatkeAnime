
const BASE_URL = 'https://api.jikan.moe/v4'
const MAX_RETRIES = 2
const RETRYABLE = [429, 504]
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
      res = await fetch(`${BASE_URL}${path}`, { signal: combined })
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

    throw new Error(`Jikan request failed: ${res.status} ${res.statusText}`)
  }

  throw new Error('Jikan request failed: too many retries')
}

export const jikanFetch = (path, signal) => {
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
