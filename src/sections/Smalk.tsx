import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { links, smalk } from '../content'
import { stage } from '../lib/stage'
import { Transition } from '../components/Transition'

gsap.registerPlugin(ScrollTrigger)

export function Smalk() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (stage.reducedMotion) return
    const el = root.current!
    const q = gsap.utils.selector(el)
    const ctx = gsap.context(() => {
      gsap.fromTo(q('.sm__title .mask__in'), { yPercent: 105 }, { yPercent: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 60%' } })
      gsap.fromTo(q('.sm__pt'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: q('.sm__pts')[0], start: 'top 80%' } })
      gsap.fromTo(q('.sm__geo'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: q('.sm__geo')[0], start: 'top 80%' } })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section id="smalk" ref={root} className="section sm" aria-labelledby="sm-title">
      <Transition kind="shutter" from="var(--silver)" />
      <p className="mk sm__kicker">
        <span className="dot" /> Candidature · Smalk AI
      </p>
      <h2 id="sm-title" className="sm__title">
        <span className="mask">
          <span className="mask__in">Pourquoi</span>
        </span>
        <span className="mask">
          <span className="mask__in">
            Smalk<em>.</em>
          </span>
        </span>
      </h2>
      <p className="sm__lead">{smalk.lead}</p>

      <ol className="sm__pts">
        {smalk.points.map((p) => (
          <li key={p.n} className="sm__pt">
            <span className="sm__n">{p.n}</span>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
            <p className="sm__proof">{p.proof}</p>
          </li>
        ))}
      </ol>

      <div className="sm__geo">
        <div>
          <p className="mk">Scénario GEO · INC-2061</p>
          <p className="sm__geo-t">Votre marque n'est plus citée par les IA. Pourquoi ?</p>
          <p className="sm__geo-x">{smalk.geo}</p>
        </div>
        <div className="sm__geo-cta">
          <a className="btn btn--primary magnetic" href="#/app/incidents/INC-2061/replay" data-cursor="OPEN">
            Voir l'enquête en direct <i aria-hidden="true">→</i>
          </a>
          <a className="btn btn--ghost magnetic" href={links.repo} target="_blank" rel="noopener noreferrer" data-cursor="OPEN">
            Code source de FlowState ↗
          </a>
          <p className="sm__note">
            Démo complète (FastAPI + React) sur <a href={links.demo} target="_blank" rel="noopener noreferrer">Render</a>, accès sur demande.
          </p>
        </div>
      </div>
    </section>
  )
}
