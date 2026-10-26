import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Transition } from '../components/Transition'
import { caseFile } from '../content'
import { stage } from '../lib/stage'

gsap.registerPlugin(ScrollTrigger)

export function WhiteRoom() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = root.current!
    const q = gsap.utils.selector(el)
    const rm = stage.reducedMotion
    const ctx = gsap.context(() => {
      // the hard cut: an ivory wipe rises over the dark world
      // rules draw themselves
      q('.rule').forEach((r: Element) =>
        gsap.fromTo(r, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: r, start: 'top 88%' } }),
      )
      // giant number changes scale as you read
      gsap.fromTo(q('.case__num'), { scale: rm ? 1 : 1.35, yPercent: rm ? 0 : -8 }, { scale: 0.82, yPercent: 10, ease: 'none', scrollTrigger: { trigger: el, start: 'top 60%', end: 'bottom top', scrub: true } })
      // title lines reveal through masks
      gsap.fromTo(q('.case__title .mask__in'), { yPercent: 105 }, { yPercent: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: q('.case__title')[0], start: 'top 82%' } })
      // paragraphs in groups
      q('.case__known li, .case__open li').forEach((li: Element, i: number) =>
        gsap.fromTo(li, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.9, delay: (i % 4) * 0.08, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 90%' } }),
      )
      // exhibits drift on different planes
      if (!rm)
        q('.exhibit').forEach((ex: Element) => {
          const depth = Number((ex as HTMLElement).dataset.depth || 1)
          gsap.fromTo(ex, { y: 120 * depth }, { y: -160 * depth, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
        })
      // raw data becomes a structured report
      const rawTl = gsap.timeline({ scrollTrigger: { trigger: q('.case__xform')[0], start: 'top 70%', end: 'bottom 45%', scrub: true } })
      rawTl
        .to(q('.raw__line'), { '--strike': 1, stagger: 0.15, duration: 0.5 }, 0)
        .to(q('.raw__line'), { opacity: 0.25, stagger: 0.15, duration: 0.5 }, 0.3)
        .fromTo(q('.report__row'), { opacity: 0, x: 40 }, { opacity: 1, x: 0, stagger: 0.25, duration: 0.6 }, 0.5)
        .fromTo(q('.case__arrow'), { scaleX: 0 }, { scaleX: 1, duration: 0.8 }, 0.2)
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section id="case" ref={root} className="section case" aria-labelledby="case-title">
      <Transition kind="iris" from="var(--ink)" />
      <header className="case__top">
        <span>Case file / FlowState AI</span>
        <span className="case__ref">Réf. FS-001 · Pièce de démonstration</span>
        <span>Page 1 / 1</span>
      </header>
      <div className="rule" />
      <div className="case__ruler" aria-hidden="true">
        {Array.from({ length: 41 }, (_, i) => (
          <i key={i} className={i % 5 === 0 ? 'l' : ''}>
            {i % 10 === 0 ? <em>{i * 10}</em> : null}
          </i>
        ))}
      </div>

      <div className="case__hero">
        <div className="case__num" aria-hidden="true">
          001
        </div>
        <h2 id="case-title" className="case__title">
          <span className="mask">
            <span className="mask__in">Ce que l'on sait.</span>
          </span>
          <span className="mask">
            <span className="mask__in">
              Ce qu'il reste <em>à vérifier.</em>
            </span>
          </span>
        </h2>
        <p className="case__lede">
          Un bon outil d'investigation ne cache pas ce qu'il ignore. Voici le dossier du projet, rédigé comme un rapport d'incident : les faits d'un côté, les questions ouvertes de l'autre.
        </p>
      </div>

      <div className="exhibits" aria-hidden="true">
        <div className="exhibit exhibit--a" data-depth="1.2">
          <span>Pièce A · DIFF</span>
          <code>- retry(fn, {'{'} attempts: 5, backoff {'}'})</code>
          <code>+ retry(fn, {'{'} attempts: 5 {'}'})</code>
        </div>
        <div className="exhibit exhibit--b" data-depth="0.6">
          <span>Pièce B · TRACES</span>
          <div className="exhibit__bars">
            {[30, 34, 31, 80, 92, 88, 95].map((h, i) => (
              <i key={i} style={{ height: h * 0.5 }} className={h > 60 ? 'hot' : ''} />
            ))}
          </div>
        </div>
        <div className="exhibit exhibit--c" data-depth="1.6">
          <span>Pièce C · NOTE</span>
          <p>« Corrélation ≠ cause. Demander un test de charge avant de conclure. »</p>
        </div>
      </div>

      <div className="case__cols">
        <div className="case__col">
          <p className="case__colhead">
            <span>§ A</span> Ce que l'on sait
          </p>
          <div className="rule" />
          <ol className="case__known">
            {caseFile.known.map((k) => (
              <li key={k.n}>
                <span className="case__n">{k.n}</span>
                <div>
                  <h3>{k.title}</h3>
                  <p>{k.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="case__col case__col--open">
          <p className="case__colhead">
            <span>§ B</span> Ce qu'il reste à vérifier
          </p>
          <div className="rule" />
          <ul className="case__open">
            {caseFile.open.map((o, i) => (
              <li key={o}>
                <span className="case__q">?{i + 1}</span>
                {o}
              </li>
            ))}
          </ul>
          <p className="case__margin">Note de marge — ces questions sont le prochain travail, pas une faiblesse cachée.</p>
        </div>
      </div>

      <div className="case__xform">
        <div className="raw">
          <p className="case__colhead">
            <span>§ C</span> Données brutes
          </p>
          {caseFile.raw.map((r) => (
            <code key={r} className="raw__line">
              {r}
            </code>
          ))}
        </div>
        <div className="case__arrow" aria-hidden="true" />
        <div className="report">
          <p className="case__colhead">
            <span>§ D</span> Compte rendu structuré
          </p>
          <table>
            <tbody>
              {caseFile.structured.map(([k, v, t]) => (
                <tr key={k} className="report__row">
                  <th scope="row">{k}</th>
                  <td>{v}</td>
                  <td className="report__t">{t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
