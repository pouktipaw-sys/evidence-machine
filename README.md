# The Evidence Machine — candidature de Morjiane Aït Mokhtar

En ligne : https://pouktipaw-sys.github.io/evidence-machine/ (GitHub Pages) · déployé aussi sur Vercel à chaque push sur `main`.

Site-installation : une typographie monumentale mène, au scroll, au dashboard FlowState AI, puis à une salle d’enquête interactive.

```bash
npm install
npm run dev        # développement
npm run build      # typecheck + build de production (dist/)
npm test           # invariants (morph sculpture → dashboard, scénarios)
npm run preview    # sert dist/ sur :4173
node scripts/shots.mjs http://localhost:4173/ shots          # captures 1440 px + 390 px
node scripts/interact.mjs http://localhost:4173/ shots       # Incident Lab, X-Ray, interface complète
```

- Bible de production / storyboard : `docs/PRODUCTION_BIBLE.md`
- Tout le contenu éditable (textes, liens, données fictives) : `src/content.ts` — **les liens marqués TODO sont à renseigner**.
- **FlowState AI** est une application à part entière, accessible depuis le site ou directement à l'adresse `/#/app` :
  incidents (recherche, filtres), enquête par incident (décision humaine), journal des décisions (export JSON),
  bibliothèque de preuves, réglages (seuil de confiance, sources). Démo : données fictives, état conservé dans le navigateur.
  QA : `node scripts/app-check.mjs http://localhost:4173/ shots`
- Portfolio : https://morjianeaitm.lovable.app (lien dans la navigation, le hero, les projets et le final).
- Easter egg : tapez `build` sur la page.
