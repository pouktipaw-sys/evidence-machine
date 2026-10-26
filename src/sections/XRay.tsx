import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Transition } from '../components/Transition'
import { layers } from '../content'
import { stage } from '../lib/stage'
import { sfx } from '../lib/sound'

gsap.registerPlugin(ScrollTrigger)

/** node layout per layer, in % of the plane — connectors drop from these points to the layer below */
const NODE_POS: [number, number][][] = [
  [
    [18, 30],
    [50, 62],
    [80, 34],
  ],
  [
    [22, 58],
    [50, 30],
    [78, 62],
  ],
  [
    [16, 40],
    [40, 68],
    [62, 32],
    [86, 64],
  ],
  [
    [24, 36],
    [52, 66],
    [80, 38],
  ],
]

export function XRay() {
  const [sel, setSel] = useState(0)
  const [flat, setFlat] = useState(() => stage.reducedMotion || window.innerWidth < 760)
  const root = useRef<HTMLElement>(null)
  const rig = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const on = () => window.innerWidth < 760 && setFlat(true)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  // the camera discovers the stack while scrolling in
  useLayoutEffect(() => {
    if (flat || stage.reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        rig.current,
        { '--rx': 20, '--rz': -8, '--sp': 20 },
        { '--rx': 56, '--rz': -34, '--sp': 100, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 85%', end: 'center 55%', scrub: 0.6 } },
      )
    }, root)
    return () => ctx.revert()
  }, [flat])

  const choose = (i: number) => {
    setSel(i)
    sfx('select')
  }

  return (
    <section id="xray" ref={root} className={`section xray ${flat ? 'xray--flat' : ''}`} aria-labelledby="xray-title">
      <Transition kind="frame" from="#0b0b0c" />
      <div className="xray__head">
        <p className="mk">
          <span className="xray__badge">Modèle conceptuel</span> distinct de l'implémentation vérifiée
        </p>
        <h2 id="xray-title" className="xray__title">
          Engineering <span>X-Ray</span>
        </h2>
        <button type="button" className="btn btn--line" onClick={() => setFlat(!flat)} aria-pressed={flat}>
          {flat ? 'Vue en profondeur' : 'Vue 2D'}
        </button>
      </div>

      <div className="xray__body">
        <ol className="xray__list" aria-label="Couches de l'architecture">
          {layers.map((l, i) => (
            <li key={l.id}>
              <button type="button" className={`xray__item ${sel === i ? 'is-on' : ''}`} onClick={() => choose(i)} aria-pressed={sel === i} data-cursor="INSPECT">
                <span className="xray__idx">{l.index}</span>
                <span className="xray__name">{l.name}</span>
                {(flat || sel === i) && (
                  <span className="xray__text">
                    {l.text}
                    <span className="xray__nodes">
                      {l.nodes.map((n) => (
                        <code key={n}>{n}</code>
                      ))}
                    </span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ol>

        {!flat && (
          <div className="xray__scene" aria-hidden="true">
            <div className="xray__rig" ref={rig}>
              {layers
                .map((l, i) => ({ l, i }))
                .reverse()
                .map(({ l, i }) => {
                  const depth = layers.length - 1 - i
                  const state = sel === i ? 'is-sel' : sel === i - 1 || sel === i + 1 ? 'is-near' : 'is-far'
                  return (
                    <div key={l.id} className={`plane ${state}`} style={{ ['--d' as string]: depth }} onClick={() => choose(i)}>
                      <span className="plane__label">
                        {l.index} {l.name}
                      </span>
                      <span className="plane__grid" />
                      {l.nodes.map((n, k) => {
                        const [x, y] = NODE_POS[i][k] ?? [50, 50]
                        return (
                          <span key={n} className="plane__node" style={{ left: `${x}%`, top: `${y}%` }}>
                            <i />
                            {n}
                            {i < layers.length - 1 && <b className={`plane__wire ${sel === i || sel === i + 1 ? 'is-hot' : ''}`} />}
                          </span>
                        )
                      })}
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
