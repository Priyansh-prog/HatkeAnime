import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { getAnimeCategories } from '../api/kitsu'

const CustomCursor = () => {
  const cursorRef = useRef(null)
  const [cardInfo, setCardInfo] = useState(null)
  const resetRef = useRef(null)
  const { pathname } = useLocation()

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return
    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      opacity: 0,
      backgroundColor: '#FFF2B4',
      scale: 1,
    })

    let prevX = 0
    let prevY = 0
    let hasMoved = false
    let isHoveringBtn = false
    let isHoveringCard = false
    let currentCard = null
    let hoverToken = 0
    let boxOpen = false
    let pendingInfo = null

    const onMouseMove = (e) => {
      if (!hasMoved) {
        hasMoved = true
        prevX = e.clientX
        prevY = e.clientY
        gsap.set(cursor, { x: e.clientX, y: e.clientY, opacity: 0.6 })
        return
      }
      const dx = e.clientX - prevX
      const dy = e.clientY - prevY
      prevX = e.clientX
      prevY = e.clientY
      const speed = Math.hypot(dx, dy)
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.45,
        ease: 'power2.out',
        overwrite: 'auto',
      })
      if (isHoveringBtn || isHoveringCard) return
      const stretch = Math.min(speed * 0.012, 0.35)
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)
      gsap.to(cursor, {
        scaleX: 1 + stretch,
        scaleY: 1 - stretch * 0.35,
        rotation: angle,
        duration: 0.15,
        ease: 'power1.out',
        onComplete: () => {
          gsap.to(cursor, { scaleX: 1, scaleY: 1, rotation: 0, duration: 0.2 })
        },
      })
    }

    const onBtnEnter = () => {
      isHoveringBtn = true
      gsap.killTweensOf(cursor, 'scale,scaleX,scaleY,rotation')
      gsap.to(cursor, { scale: 0, duration: 0.22, ease: 'power2.out' })
    }

    const onBtnLeave = () => {
      isHoveringBtn = false
      gsap.to(cursor, {
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        backgroundColor: '#FFF2B4',
        duration: 0.22,
      })
    }

    const onCardEnter = (card) => {
      const id = card.dataset.animeId
      if (!id || currentCard === card) return
      currentCard = card
      isHoveringCard = true
      const token = ++hoverToken
      gsap.killTweensOf(cursor, 'scale,scaleX,scaleY,rotation,opacity,width,height,borderRadius')
      pendingInfo = {
        id,
        episodes: card.dataset.episodes ?? '?',
        date: card.dataset.date ?? '',
        tags: null,
      }
      if (boxOpen) {
        setCardInfo(pendingInfo)
      }

      gsap.to(cursor, {
        xPercent: -100,
        rotation: 0,
        width: 100,
        height: 100,
        borderRadius: 18,
        opacity: 0.9,
        backgroundColor: '#FFF2B4',
        duration: 0.25,
        ease: 'power2.out',
        onComplete: () => {
          if (hoverToken !== token) return
          boxOpen = true
          if (pendingInfo && pendingInfo.id === id) setCardInfo({ ...pendingInfo })
        },
      })
      getAnimeCategories(id)
        .then((res) => {
          if (hoverToken !== token) return
          const tags = (Array.isArray(res.data) ? res.data : [])
            .map((c) => c.attributes?.title)
            .filter(Boolean)
          if (pendingInfo && pendingInfo.id === id) pendingInfo = { ...pendingInfo, tags }
          setCardInfo((prev) => (prev && prev.id === id ? { ...prev, tags } : prev))
        })
        .catch(() => {
          if (hoverToken !== token) return
          if (pendingInfo && pendingInfo.id === id) pendingInfo = { ...pendingInfo, tags: [] }
          setCardInfo((prev) => (prev && prev.id === id ? { ...prev, tags: [] } : prev))
        })
    }

    const onCardLeave = () => {
      currentCard = null
      isHoveringCard = false
      boxOpen = false
      hoverToken += 1
      gsap.to(cursor, {
        rotation: 0,
        width: 16,
        height: 16,
        borderRadius: 9999,
        opacity: 0.6,
        backgroundColor: '#FFF2B4',
        duration: 0.22,
        ease: 'power2.out',
        onComplete: () => setCardInfo(null),
      })
    }

    const onMouseOver = (e) => {
      const card = e.target.closest && e.target.closest('.anime-card')
      if (card) {
        if (currentCard !== card) onCardEnter(card)
        return
      }
      if (e.target.closest('button, a')) onBtnEnter()
    }

    const onMouseOut = (e) => {
      const fromCard = e.target.closest && e.target.closest('.anime-card')
      const toCard =
        e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.anime-card')
      if (fromCard) {
        if (!toCard) onCardLeave()
        return
      }
      if (
        e.target.closest('button, a') &&
        !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('button, a'))
      )
        onBtnLeave()
    }

    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseout', onMouseOut)

    resetRef.current = () => {
      currentCard = null
      isHoveringBtn = false
      isHoveringCard = false
      boxOpen = false
      hoverToken += 1
      setCardInfo(null)
      gsap.killTweensOf(cursor)
      gsap.set(cursor, {
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        width: 16,
        height: 16,
        borderRadius: 9999,
        opacity: hasMoved ? 0.6 : 0,
        backgroundColor: '#FFF2B4',
      })
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseout', onMouseOut)
    }
  }, [])

  useEffect(() => {
    if (resetRef.current) resetRef.current()
  }, [pathname])

  return (
    <div
      ref={cursorRef}
      id="cursor"
      className="pointer-events-none fixed top-0 left-0 z-9999 h-4 w-4 overflow-hidden rounded-full bg-[#FFF2B4] opacity-0 select-none"
      style={{ zIndex: 9999 }}
    >
      {cardInfo && (
        <div className="cursor-info flex h-full flex-col items-center justify-center break-words px-2.5 py-2 text-center leading-snug text-[#22181C]">
          <p className="text-[11px] font-bold">Eps: {cardInfo.episodes}</p>
          <p className="text-[11px]">
            {cardInfo.date ? cardInfo.date.slice(0, 4) : 'Date TBD'}
          </p>
          <p className="text-[10px] opacity-80 flex text-wrap">
            {cardInfo.tags === null
              ? 'Loading tags…'
              : cardInfo.tags.slice(0, 3).join(' • ') || 'No tags yet'}
          </p>
        </div>
      )}
    </div>
  )
}

export default CustomCursor
