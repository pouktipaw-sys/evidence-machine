import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Theatre } from './sections/Theatre'
import { WhiteRoom } from './sections/WhiteRoom'
import { IncidentLab } from './sections/IncidentLab'
import { XRay } from './sections/XRay'
import { Method } from './sections/Method'
import { Projects } from './sections/Projects'
import { Finale } from './sections/Finale'
import { Smalk } from './sections/Smalk'
import { Nav, Cursor, BuildNotes } from './components/Chrome'
import { FlowStateApp } from './app/FlowStateApp'
import './styles/app.css'
import { Grain } from './components/Grain'
import { stage } from './lib/stage'
import { prefersReducedMotion } from './lib/hooks'

stage.reducedMotion = prefersReducedMotion()
stage.isMobile = window.innerWidth < 760
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
// phones: the address bar showing/hiding must not re-layout every scroll scene
ScrollTrigger.config({ ignoreMobileResize: true })

const isAppRoute = () => window.location.hash.startsWith('#/app')

export function App() {
  const [inApp, setInApp] = useState(isAppRoute)

  // '#/app…' is the FlowState application, everything else is the candidature site
  useEffect(() => {
    const on = () => {
      const next = isAppRoute()
      setInApp((prev) => {
        if (prev && !next) window.scrollTo(0, 0)
        return next
      })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  // inertial scrolling for the site only, driven by GSAP's ticker so the DOM and ScrollTrigger share one clock
  useEffect(() => {
    if (inApp) return
    let lenis: Lenis | null = null
    let tick: ((t: number) => void) | null = null
    if (!stage.reducedMotion) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 })
      lenis.on('scroll', ScrollTrigger.update)
      tick = (time: number) => lenis!.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
    }
    // in-page anchors scroll smoothly; '#/…' links are routes and are left to the router
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href^="#"]') as HTMLAnchorElement | null
      const href = a?.getAttribute('href')
      if (!href || href.startsWith('#/') || href === '#') return
      const target = document.querySelector(href)
      if (!target) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(target as HTMLElement)
      else target.scrollIntoView()
    }
    document.addEventListener('click', onClick)
    requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => {
      document.removeEventListener('click', onClick)
      if (tick) gsap.ticker.remove(tick)
      lenis?.destroy()
    }
  }, [inApp])


  useEffect(() => {
    document.fonts?.ready.then(() => {
      document.documentElement.classList.add('fonts-ready')
      ScrollTrigger.refresh()
    })
  }, [])

  if (inApp) return <FlowStateApp />

  return (
    <>
      <a className="skip" href="#lab">
        Aller à l'Investigation Room
      </a>
      <Nav />
      <main id="main">
        <Theatre onExplore={() => (window.location.hash = '#/app/incidents/INC-1042/replay')} />
        <WhiteRoom />
        <IncidentLab />
        <XRay />
        <Method />
        <Projects />
        <Smalk />
        <Finale />
      </main>
      <BuildNotes />
      <Cursor />
      <Grain />
    </>
  )
}
