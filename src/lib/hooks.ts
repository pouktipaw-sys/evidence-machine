import { useEffect, useState } from 'react'
import { stage } from './stage'

export function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight, mobile: window.innerWidth < 760 })
  const [vp, setVp] = useState(read)
  useEffect(() => {
    let id = 0
    let lastW = window.innerWidth
    const on = () => {
      clearTimeout(id)
      id = window.setTimeout(() => {
        // ignore mobile URL-bar height jitter: only react to width changes or big height changes
        const next = read()
        if (next.w === lastW && Math.abs(next.h - vp.h) < 120) return
        lastW = next.w
        stage.isMobile = next.mobile
        setVp(next)
      }, 160)
    }
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('resize', on)
      clearTimeout(id)
    }
  }, [vp.h])
  return vp
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
