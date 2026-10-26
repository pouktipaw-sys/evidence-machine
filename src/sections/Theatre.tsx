import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Dashboard } from '../components/Dashboard'
import { links, person } from '../content'
import { dashBoxFor, layoutFor, type Rect } from '../lib/dashLayout'
import { stage } from '../lib/stage'
import { useViewport } from '../lib/hooks'

gsap.registerPlugin(ScrollTrigger)

const ZOOMS = [
  { key: 'events', n: '01', title: 'EVENTS', sub: 'La chronologie des signaux.', text: 'Chaque événement est horodaté, sourcé et classé par gravité. On lit l\'incident comme un récit, pas comme un flux de logs.', panels: ['events'], side: 'right' as const },
  { key: 'evidence', n: '02', title: 'EVIDENCE', sub: 'Ce qui explique l\'incident.', text: 'Chaque preuve est citée, scorée et reliée à une hypothèse. Une preuve faible reste visible : elle nourrit l\'incertitude. La confiance s\'exprime en catégories, jamais en pourcentage.', panels: ['ev1', 'ev2', 'ev3', 'ev4'], side: 'right' as const },
  { key: 'decision', n: '03', title: 'DECISION', sub: 'La proposition soumise à validation.', text: 'Le système propose, l\'humain décide : approuver, rejeter ou demander une preuve de plus. Ce qui reste à vérifier est affiché, pas caché.', panels: ['decision', 'actions'], side: 'left' as const },
]

function union(rs: Rect[]): Rect {
  const x1 = Math.min(...rs.map((r) => r[0]))
  const y1 = Math.min(...rs.map((r) => r[1]))
  const x2 = Math.max(...rs.map((r) => r[0] + r[2]))
  const y2 = Math.max(...rs.map((r) => r[1] + r[3]))
  return [x1, y1, x2 - x1, y2 - y1]
}

/** the opening plays once per visit, even if the section re-renders */
let introPlayed = false

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>=+'
/** letters cycle through random glyphs and lock in from left to right */
function scramble(el: Element, duration: number) {
  const final = el.textContent ?? ''
  const state = { p: 0 }
  return gsap.to(state, {
    p: 1,
    duration,
    ease: 'power1.inOut',
    onUpdate: () => {
      const locked = Math.floor(state.p * final.length)
      let out = ''
      for (let i = 0; i < final.length; i++) {
        const c = final[i]
        out += i < locked || c === ' ' || c === "'" || c === '.' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      }
      el.textContent = out
    },
    onComplete: () => {
      el.textContent = final
    },
  })
}

function Word({ children, className = '' }: { children: string; className?: string }) {
  return (
    <span className={`mask ${className}`}>
      <span className="mask__in">{children}</span>
    </span>
  )
}

export function Theatre({ onExplore }: { onExplore: () => void }) {
  const vp = useViewport()
  const root = useRef<HTMLElement>(null)
  const dashRef = useRef<HTMLDivElement>(null)
  const box = dashBoxFor(vp.w, vp.h, vp.mobile)

  useLayoutEffect(() => {
    const el = root.current!
    const rm = stage.reducedMotion
    const q = gsap.utils.selector(el)
    const ctx = gsap.context(() => {
      /* OPENING — boot sequence, ~2.4 s, skippable, never blocks input */
      const intro = gsap.timeline({ defaults: { ease: 'expo.out' } })
      if (rm || introPlayed) {
        intro.set(q('.mask__in'), { yPercent: 0 }).set(q('.hero-fade'), { opacity: 1, y: 0 }).set(q('.signal-line'), { scaleX: 1 }).set(q('.boot'), { display: 'none' })
      } else {
        introPlayed = true
        const count = q('.boot__count')[0] as HTMLElement
        const n = { v: 0 }
        intro
          // 1 · acquiring the signal
          .to(n, { v: 100, duration: 1.15, ease: 'power2.inOut', onUpdate: () => (count.textContent = String(Math.round(n.v)).padStart(3, '0')) }, 0)
          .fromTo(q('.boot__scan'), { xPercent: 0, x: 0 }, { x: () => window.innerWidth, duration: 1.15, ease: 'power2.inOut' }, 0)
          .fromTo(q('.boot__log li'), { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.32 }, 0.1)
          // 2 · the seam
          .to(q('.boot__hud, .boot__scan'), { opacity: 0, duration: 0.25, ease: 'power2.in' }, 1.15)
          .fromTo(q('.boot__seam'), { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'power3.inOut' }, 1.15)
          // 3 · the doors open onto the hero
          .to(q('.boot__a'), { yPercent: -101, duration: 0.75, ease: 'expo.inOut' }, 1.45)
          .to(q('.boot__b'), { yPercent: 101, duration: 0.75, ease: 'expo.inOut' }, 1.45)
          .to(q('.boot__seam'), { opacity: 0, duration: 0.3 }, 1.7)
          .set(q('.boot'), { display: 'none' }, 2.25)
          .fromTo(q('.signal-line'), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power3.inOut' }, 1.5)
          .fromTo(q('.hero-type .mask__in'), { yPercent: 108 }, { yPercent: 0, duration: 1.0, stagger: 0.09 }, 1.55)
        q('.hero-type .mask__in').forEach((w: Element, i: number) => intro.add(scramble(w, 0.9), 1.6 + i * 0.12))
        intro.fromTo(q('.hero-fade'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06 }, 2.1)
        // any scroll, key or tap fast-forwards the opening
        const skip = () => intro.timeScale(4)
        window.addEventListener('wheel', skip, { once: true, passive: true })
        window.addEventListener('touchstart', skip, { once: true, passive: true })
        window.addEventListener('keydown', skip, { once: true })
        window.addEventListener('pointerdown', skip, { once: true })
      }

      /* MASTER — section progress mapped to 0..100 */
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: true },
      })
      tl.set({}, {}, 100)

      // hero leaves
      tl.to(q('.hero-copy, .hero-meta'), { opacity: 0, y: -40, duration: 6 }, 2)
      tl.to(q('.hero-type'), { scale: 1.1, opacity: 0, duration: 7 }, 2)
      tl.to(q('.signal-line'), { opacity: 0, duration: 6 }, 4)

      // FROM SIGNAL.
      tl.fromTo(q('.kt-signal'), { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 6, ease: 'power2.out' }, 7.5)
      tl.to(q('.kt-signal'), { scale: 1.08, duration: 8 }, 17)
      tl.to(q('.kt-signal .mask__in'), { yPercent: -110, duration: 4, stagger: 1, ease: 'power2.in' }, 24)

      // TO CONTEXT. — a horizontal pass
      tl.fromTo(q('.kt-context'), { xPercent: 0, x: () => window.innerWidth }, { xPercent: -100, x: () => -window.innerWidth * 0.08, duration: 12 }, 28)
      tl.fromTo(q('.kt-context'), { opacity: 0 }, { opacity: 1, duration: 2 }, 28)
      tl.to(q('.kt-context'), { opacity: 0, duration: 2 }, 38)

      // TO ACTION. — snaps into focus, then splits like a door onto the product
      tl.fromTo(q('.kt-action'), { opacity: 0, scaleY: 2.4 }, { opacity: 1, scaleY: 1, duration: 6, ease: 'power3.out' }, 37)
      tl.to(q('.kt-action__top'), { y: () => -window.innerHeight * 0.62, duration: 8, ease: 'power2.in' }, 48)
      tl.to(q('.kt-action__bot'), { y: () => window.innerHeight * 0.62, duration: 8, ease: 'power2.in' }, 48)
      tl.to(q('.kt-action'), { autoAlpha: 0, duration: 2 }, 55)

      // the product
      tl.fromTo(q('.showcase'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 3 }, 50)
      tl.fromTo(q('.showcase .fs-p'), { '--draw': 0 }, { '--draw': 1, duration: 6, stagger: 0.3 }, 50)
      tl.fromTo(q('.showcase .fs-p > *'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 4, stagger: 0.05 }, 54)
      tl.fromTo(q('.showcase-head, .showcase-steps'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 3 }, 56)

      // zooms on the product
      const dash = dashRef.current!
      const rects = layoutFor(vp.mobile)
      const panelsEls = (keys: string[]) => keys.map((k) => dash.querySelector(`[data-panel="${k}"]`)).filter(Boolean) as HTMLElement[]
      const allPanels = Array.from(dash.querySelectorAll<HTMLElement>('[data-panel]'))
      ZOOMS.forEach((z, i) => {
        const u = union(z.panels.map((k) => rects[k as keyof typeof rects]))
        const s = Math.min(vp.mobile ? 1.35 : 2.1, (vp.h * 0.74) / (u[3] * box.h), ((vp.mobile ? 0.94 : 0.5) * vp.w) / (u[2] * box.w))
        const dx = (u[0] + u[2] / 2 - 0.5) * box.w
        const dy = (u[1] + u[3] / 2 - 0.5) * box.h
        const targetX = vp.mobile ? 0 : (z.side === 'right' ? -0.17 : 0.17) * vp.w
        const targetY = vp.mobile ? -vp.h * 0.06 : 0
        const at = 64 + i * 11
        tl.to(dash, { x: -dx * s + targetX, y: -dy * s + targetY, scale: s, duration: 5, ease: 'power2.inOut' }, at)
        tl.to(allPanels, { opacity: 0.16, duration: 3 }, at)
        tl.to(panelsEls(z.panels), { opacity: 1, duration: 3 }, at + 0.1)
        tl.fromTo(q(`.znote--${z.key}`), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 3 }, at + 2)
        tl.to(q(`.znote--${z.key}`), { autoAlpha: 0, y: -20, duration: 2.5 }, at + 9)
        tl.to(q(`.zstep--${z.key}`), { '--on': 1, duration: 1 }, at)
      })
      tl.to(dash, { x: 0, y: 0, scale: 1, duration: 4, ease: 'power2.inOut' }, 96)
      tl.to(allPanels, { opacity: 1, duration: 2 }, 96)
    }, el)
    return () => ctx.revert()
  }, [vp.w, vp.h, vp.mobile, box.w, box.h])

  return (
    <section id="theatre" ref={root} className="theatre" aria-label="Introduction et FlowState AI">
      <div className="boot" aria-hidden="true">
        <span className="boot__a" />
        <span className="boot__b" />
        <span className="boot__scan" />
        <span className="boot__seam" />
        <div className="boot__hud">
          <p className="boot__label">The Evidence Machine</p>
          <p className="boot__count">000</p>
          <ul className="boot__log">
            <li>Acquiring signal</li>
            <li>Correlating evidence</li>
            <li>Awaiting human decision</li>
          </ul>
        </div>
      </div>
      <div className="layer layer--back" aria-hidden="true">
        <div className="signal-line" />
        <div className="hero-type">
          <Word className="ht-1">DON'T</Word>
          <Word className="ht-2">JUST</Word>
          <Word className="ht-3">TELL.</Word>
        </div>
        <div className="kt kt-signal">
          <Word className="kt-signal__a">FROM</Word>
          <Word className="kt-signal__b">SIGNAL.</Word>
        </div>
        <div className="kt kt-action">
          <span className="kt-action__top">TO ACTION.</span>
          <span className="kt-action__bot">TO ACTION.</span>
        </div>
      </div>

      <div className="layer layer--front">
        <div className="hero-meta hero-fade" aria-hidden="true">
          <span>FS—001</span>
          <span>THE EVIDENCE MACHINE</span>
          <span>CANDIDATURE · 2026</span>
        </div>

        <header className="hero-copy">
          <p className="hero-kicker hero-fade">
            <span className="dot" /> Candidature — développeuse IA
          </p>
          <h1 className="hero-title hero-fade">
            <span className="sr-only">Don't just tell. </span>
            Show what <br />
            you build.
          </h1>
          <p className="hero-intro hero-fade">
            <strong>{person.name}.</strong> {person.tagline}
          </p>
          <div className="hero-cta hero-fade">
            <a className="btn btn--primary magnetic" href="#showcase-anchor" data-cursor="EXPLORE">
              <span>Voir FlowState AI</span>
              <i aria-hidden="true">↓</i>
            </a>
            <a className="btn btn--ghost magnetic" href={links.contact} data-cursor="OPEN">
              Discuss my application
            </a>
          </div>
          <a className="hero-portfolio hero-fade" href={links.portfolio} target="_blank" rel="noopener noreferrer" data-cursor="OPEN">
            Portfolio · morjianeaitm.lovable.app <i aria-hidden="true">↗</i>
          </a>
        </header>

        <div className="kt kt-context" aria-hidden="true">
          <span className="o">TO</span> CONTEXT.
        </div>

        <div className="showcase" id="flowstate">
          <div className="showcase-head">
            <p>
              <b>FLOWSTATE AI</b> <span>Des signaux à la décision.</span>
            </p>
            <button type="button" className="btn btn--line magnetic" onClick={onExplore} data-cursor="OPEN">
              Voir l'enquête en direct <i aria-hidden="true">↗</i>
            </button>
          </div>
          <div ref={dashRef} className="showcase-dash" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
            <Dashboard width={box.w} height={box.h} isMobile={vp.mobile} />
          </div>
          {ZOOMS.map((z) => (
            <aside key={z.key} className={`znote znote--${z.key} znote--${vp.mobile ? 'bottom' : z.side}`}>
              <span className="znote__n">{z.n}</span>
              <h3>{z.title}</h3>
              <p className="znote__sub">{z.sub}</p>
              <p>{z.text}</p>
            </aside>
          ))}
          <ol className="showcase-steps">
            {ZOOMS.map((z) => (
              <li key={z.key} className={`zstep zstep--${z.key}`}>
                <span>{z.n}</span> {z.title}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <span id="showcase-anchor" className="showcase-anchor" aria-hidden="true" />
    </section>
  )
}
