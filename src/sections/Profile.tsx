import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { links, person, profile } from '../content'
import { stage } from '../lib/stage'
import { Transition } from '../components/Transition'

gsap.registerPlugin(ScrollTrigger)

export function Profile() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (stage.reducedMotion) return
    const el = root.current!
    const q = gsap.utils.selector(el)
    const ctx = gsap.context(() => {
      gsap.fromTo(q('.pf2__title .mask__in'), { yPercent: 105 }, { yPercent: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 60%' } })
      q('.pf2__card, .pf2__tl li, .pf2__skills > div').forEach((c: Element, i: number) =>
        gsap.fromTo(c, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, delay: (i % 3) * 0.07, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 90%' } }),
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section id="profil" ref={root} className="section pf2" aria-labelledby="pf2-title">
      <Transition kind="diagonal" from="var(--bone)" />
      <p className="mk pf2__kicker">
        <span className="dot" /> Profil · {person.city}
      </p>
      <h2 id="pf2-title" className="pf2__title">
        <span className="mask">
          <span className="mask__in">Développeuse.</span>
        </span>
        <span className="mask">
          <span className="mask__in pf2__o">Experte Claude</span>
        </span>
        <span className="mask">
          <span className="mask__in pf2__o">&amp; ChatGPT.</span>
        </span>
      </h2>

      <div className="pf2__intro">
        <p className="pf2__about">{profile.about}</p>
        <div className="pf2__side">
          <ul className="pf2__chips" aria-label="IA au quotidien">
            {profile.ai.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <p className="pf2__contact">
            <a href={`mailto:${person.email}`}>{person.email}</a>
            <span>{profile.languages}</span>
          </p>
          <div className="pf2__ctas">
            <a className="btn btn--primary magnetic" href={links.contact} data-cursor="OPEN">
              Me contacter
            </a>
            <a className="btn btn--ghost magnetic" href={links.portfolio} target="_blank" rel="noopener noreferrer" data-cursor="OPEN">
              Portfolio ↗
            </a>
          </div>
        </div>
      </div>

      <h3 className="pf2__h">Ce que j'ai construit</h3>
      <div className="pf2__grid">
        {profile.built.map((b) => {
          const Tag = b.href ? 'a' : 'div'
          return (
            <Tag key={b.name} className={`pf2__card ${b.ai ? 'is-ai' : ''}`} {...(b.href ? { href: b.href, target: '_blank', rel: 'noopener noreferrer' } : {})}>
              {b.ai && <span className="pf2__badge">IA</span>}
              <h4>{b.name}</h4>
              <p>{b.what}</p>
              <span className="pf2__stack">{b.stack}</span>
            </Tag>
          )
        })}
      </div>

      <div className="pf2__cols">
        <div>
          <h3 className="pf2__h">Parcours</h3>
          <ol className="pf2__tl">
            {[...profile.education.map((e) => ({ ...e, kind: 'Formation' })), ...profile.experience.map((e) => ({ ...e, kind: 'Expérience' }))].map((e) => (
              <li key={e.title + e.date}>
                <span className="pf2__date">{e.date}</span>
                <div>
                  <p className="pf2__kind">{e.kind}</p>
                  <h4>{e.title}</h4>
                  <p className="pf2__place">{e.place}</p>
                  <p>{e.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="pf2__h">Compétences</h3>
          <div className="pf2__skills">
            {profile.skills.map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <p>{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
