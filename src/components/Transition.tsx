import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { stage } from '../lib/stage'

gsap.registerPlugin(ScrollTrigger)

export type TransitionKind = 'iris' | 'shutter' | 'diagonal' | 'blinds' | 'frame'

/**
 * Scene change between two sections. Placed as the first child of the incoming section:
 * an overlay painted in the previous section's colour covers the new scene's first screen,
 * then opens with the scroll. Fully scrubbed, so it plays backwards too.
 */
export function Transition({ kind, from }: { kind: TransitionKind; from: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current!
    const section = el.parentElement!
    if (stage.reducedMotion) {
      el.style.display = 'none'
      return
    }
    const q = gsap.utils.selector(el)
    const ctx = gsap.context(() => {
      const st = { trigger: section, start: 'top bottom', end: 'top top', scrub: true }
      if (kind === 'frame') {
        // the new scene grows from a framed card to full bleed
        el.style.display = 'none'
        gsap.fromTo(section, { clipPath: 'inset(0% 7% 0% 7% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { ...st, end: 'top 15%' } })
        return
      }
      const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: st })
      if (kind === 'iris') {
        tl.fromTo(el, { '--r': '0%' }, { '--r': '102%', duration: 1, ease: 'power2.in' })
      } else if (kind === 'shutter') {
        tl.fromTo(q('.tr__line'), { scaleX: 0 }, { scaleX: 1, duration: 0.35 }, 0)
          .to(q('.tr__a'), { yPercent: -101, duration: 0.65, ease: 'power3.in' }, 0.35)
          .to(q('.tr__b'), { yPercent: 101, duration: 0.65, ease: 'power3.in' }, 0.35)
          .to(q('.tr__line'), { opacity: 0, duration: 0.2 }, 0.8)
      } else if (kind === 'diagonal') {
        // the right edge lifts first, so the cut sweeps across on a slant
        tl.fromTo(el, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 100%)', duration: 0.5, ease: 'power1.in' })
          .to(el, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', duration: 0.5, ease: 'power2.in' })
      } else if (kind === 'blinds') {
        tl.to(q('.tr__blind'), { scaleY: 0, duration: 0.6, stagger: 0.08, ease: 'power2.in' })
      }
      tl.set(el, { visibility: 'hidden' }, 1)
    }, el)
    return () => ctx.revert()
  }, [kind])

  return (
    <div ref={ref} className={`tr tr--${kind}`} style={{ ['--from' as string]: from }} aria-hidden="true">
      {kind === 'shutter' && (
        <>
          <span className="tr__a" />
          <span className="tr__b" />
          <span className="tr__line" />
        </>
      )}
      {kind === 'blinds' && Array.from({ length: 7 }, (_, i) => <span key={i} className="tr__blind" />)}
    </div>
  )
}
