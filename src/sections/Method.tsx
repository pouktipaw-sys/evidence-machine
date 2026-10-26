import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Transition } from '../components/Transition'
import { method } from '../content'
import { stage } from '../lib/stage'

gsap.registerPlugin(ScrollTrigger)

/** fit a single line of display type to the container width */
function fit(el: HTMLElement, width: number) {
  el.style.fontSize = '100px'
  const w = el.scrollWidth
  el.style.fontSize = `${Math.floor((100 * width) / w)}px`
}

export function Method() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = root.current!
    const q = gsap.utils.selector(el)
    const words = q('.kw') as HTMLElement[]
    const doFit = () => {
      const W = el.clientWidth - (window.innerWidth < 760 ? 24 : 64)
      words.forEach((w) => fit(w, W))
    }
    doFit()
    document.fonts?.ready.then(() => {
      doFit()
      ScrollTrigger.refresh()
    })

    const rm = stage.reducedMotion
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: true },
      })
      tl.set({}, {}, 100)
      if (rm) {
        words.forEach((w, i) => {
          tl.fromTo(w, { opacity: 0 }, { opacity: 1, duration: 4 }, i * 18)
          if (i < words.length - 1) tl.to(w, { opacity: 0, duration: 4 }, i * 18 + 14)
        })
        tl.fromTo(q('.method__note'), { opacity: 0 }, { opacity: 1, duration: 4 }, 86)
        return
      }
      const [wQ, wB, wBr, wF, wS] = words
      // I QUESTION. — slides in horizontally, then becomes the background of the next line
      tl.fromTo(wQ, { xPercent: 105 }, { xPercent: 0, duration: 10, ease: 'expo.out' }, 0)
      tl.fromTo(q('.kw--0 .kw__q'), { rotate: 0 }, { rotate: 14, duration: 6, transformOrigin: '50% 80%' }, 6)
      tl.to(wQ, { scale: 2.4, opacity: 0.14, color: 'rgba(8,8,8,0)', duration: 10 }, 14)
      // I BUILD. — revealed by a rising mask
      tl.fromTo(wB, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 9 }, 16)
      tl.fromTo(wB, { yPercent: 20 }, { yPercent: 0, duration: 9 }, 16)
      tl.to(wB, { y: () => -window.innerHeight * 0.6, opacity: 0, duration: 7, ease: 'power2.in' }, 32)
      tl.to(wQ, { opacity: 0, duration: 5 }, 32)
      // I BREAK THINGS. — letters fracture apart
      const chars = q('.kw--2 .ch') as HTMLElement[]
      tl.fromTo(wBr, { opacity: 0 }, { opacity: 1, duration: 2 }, 36)
      tl.fromTo(chars, { yPercent: 120 }, { yPercent: 0, duration: 6, stagger: 0.25, ease: 'expo.out' }, 36)
      tl.to(
        chars,
        {
          yPercent: (i: number) => [-30, 40, -60, 25, -15, 55, -45, 30, -25, 50, -35, 20, -50, 35, -10][i % 15],
          rotate: (i: number) => [-14, 9, -6, 18, -11, 7, -20, 12, -8, 15, -5, 10, -16, 6, -9][i % 15],
          duration: 7,
          ease: 'power2.out',
        },
        44,
      )
      // I FIX THEM. — the fragments snap back into a line, an orange rule seals them
      tl.to(wBr, { opacity: 0.07, scale: 1.25, duration: 6 }, 52)
      tl.fromTo(q('.kw--3 .ch'), { yPercent: (i: number) => (i % 2 ? 90 : -90), opacity: 0 }, { yPercent: 0, opacity: 1, duration: 8, stagger: 0.2, ease: 'expo.out' }, 54)
      tl.fromTo(q('.kw--3 .kw__rule'), { scaleX: 0 }, { scaleX: 1, duration: 6, ease: 'expo.out' }, 62)
      tl.to(wF, { y: () => -window.innerHeight * 0.5, opacity: 0, duration: 6, ease: 'power2.in' }, 72)
      tl.to(wBr, { opacity: 0, duration: 4 }, 72)
      // I SHIP. — arrives oversized and settles; the signal leaves the frame
      tl.fromTo(wS, { scale: 2.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 9, ease: 'expo.out' }, 76)
      tl.fromTo(q('.method__ship'), { scaleX: 0 }, { scaleX: 1, duration: 8, ease: 'expo.in' }, 86)
      tl.fromTo(q('.method__note'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 6 }, 86)
      tl.fromTo(q('.method__count'), { '--p': 0 }, { '--p': 1, duration: 100, ease: 'none' }, 0)
    }, el)
    window.addEventListener('resize', doFit)
    return () => {
      ctx.revert()
      window.removeEventListener('resize', doFit)
    }
  }, [])

  const split = (s: string) =>
    s.split('').map((c, i) => (
      <span key={i} className="ch">
        {c === ' ' ? ' ' : c}
      </span>
    ))

  return (
    <section id="method" ref={root} className="section method" aria-labelledby="method-title">
      <Transition kind="diagonal" from="#0b0b0c" />
      <div className="method__pin">
        <h2 id="method-title" className="sr-only">
          Méthode : {method.words.join(' ')}
        </h2>
        <p className="method__label mk" aria-hidden="true">
          <span>Méthode</span> — 5 verbes, dans cet ordre
        </p>
        <div className="method__stack" aria-hidden="true">
          <div className="kw kw--0">
            I <span className="kw__q">Q</span>UESTION.
          </div>
          <div className="kw kw--1">I BUILD.</div>
          <div className="kw kw--2">{split('I BREAK THINGS.')}</div>
          <div className="kw kw--3">
            {split('I FIX THEM.')}
            <span className="kw__rule" />
          </div>
          <div className="kw kw--4">
            I SHIP<span className="kw__dot">.</span>
          </div>
        </div>
        <div className="method__ship" aria-hidden="true" />
        <aside className="method__note">
          <p className="mk">Note de méthode · IA</p>
          <p>{method.aiNote}</p>
        </aside>
        <div className="method__count mk" aria-hidden="true">
          <i />
        </div>
      </div>
    </section>
  )
}
