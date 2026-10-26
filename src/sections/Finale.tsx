import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Transition } from '../components/Transition'
import { links, person } from '../content'

gsap.registerPlugin(ScrollTrigger)

export function Finale() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = root.current!
    const q = gsap.utils.selector(el)
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom bottom', scrub: true },
      })
      tl.set({}, {}, 100)
      // YOU'VE SEEN THE WORK. — monumental, behind the object
      tl.fromTo(q('.fin__a .mask__in'), { yPercent: 110 }, { yPercent: 0, duration: 14, stagger: 3, ease: 'power3.out' }, 20)
      tl.to(q('.fin__a'), { yPercent: -18, opacity: 0.08, scale: 0.92, duration: 16, ease: 'power2.inOut' }, 50)
      // NOW LET'S BUILD SOMETHING.
      tl.fromTo(q('.fin__b .mask__in'), { yPercent: 110 }, { yPercent: 0, duration: 12, stagger: 2.5, ease: 'expo.out' }, 56)
      tl.fromTo(q('.fin__id > *'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 10, stagger: 2 }, 70)
      tl.fromTo(q('.fin__line'), { scaleX: 0 }, { scaleX: 1, duration: 14, ease: 'power2.inOut' }, 78)
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section id="finale" ref={root} className="finale" aria-labelledby="fin-title">
      <Transition kind="frame" from="var(--ink)" />
      <div className="layer layer--back" aria-hidden="true">
        <div className="fin__a">
          <span className="mask">
            <span className="mask__in">You've seen</span>
          </span>
          <span className="mask">
            <span className="mask__in">the work.</span>
          </span>
        </div>
      </div>
      <div className="layer layer--front">
        <span className="fin__line" aria-hidden="true" />
        <div className="fin__panel">
          <h2 id="fin-title" className="fin__b">
            <span className="mask">
              <span className="mask__in">Now let's</span>
            </span>
            <span className="mask">
              <span className="mask__in">build something.</span>
            </span>
          </h2>
          <div className="fin__id">
            <p className="fin__name">{person.nameUpper}</p>
            <p className="fin__tag">{person.tagline}</p>
            <div className="fin__ctas">
              <a className="btn btn--primary magnetic fin__main" href={links.contact} data-cursor="OPEN">
                Discuss my application <i aria-hidden="true">→</i>
              </a>
              <a className="btn btn--ghost magnetic" href={links.flowstate} data-cursor="OPEN">
                Ouvrir FlowState AI
              </a>
              <a className="btn btn--ghost magnetic" href={links.portfolio} target="_blank" rel="noopener noreferrer" data-cursor="OPEN">
                Portfolio ↗
              </a>
            </div>
          </div>
        </div>
        <footer className="fin__foot">
          <span>© 2026 {person.name}</span>
          <span>Conçu et codé à la main · React · GSAP</span>
          <span className="fin__egg">
            Tapez <kbd>b</kbd> <kbd>u</kbd> <kbd>i</kbd> <kbd>l</kbd> <kbd>d</kbd>
          </span>
        </footer>
      </div>
    </section>
  )
}
