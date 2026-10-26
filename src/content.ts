/**
 * Tout le contenu éditable du site est ici.
 * Les liens marqués TODO doivent être renseignés par Morjiane avant publication.
 * Les données d'incident sont FICTIVES (démonstration) et signalées comme telles à l'écran.
 */

export const person = {
  name: 'Morjiane Aït Mokhtar',
  nameUpper: 'MORJIANE AÏT MOKHTAR',
  tagline: 'Développeuse · IA agentique · Claude Code & MCP.',
  email: 'morjiane.aitm@gmail.com',
  city: 'Lyon',
}

export const links = {
  // TODO: remplacer par l'adresse de contact réelle
  contact: 'mailto:morjiane.aitm@gmail.com?subject=Candidature%20Taly%20%E2%80%94%20Morjiane',
  // l'application FlowState AI (démo intégrée au site)
  flowstate: '#/app',
  portfolio: 'https://morjianeaitm.lovable.app',
  // the real FlowState project
  repo: 'https://github.com/pouktipaw-sys/AI-codex-',
  demo: 'https://flowstate-ai-demo.onrender.com',
}

export type Severity = 'info' | 'warn' | 'crit'

export interface DashEvent {
  id: string
  time: string
  source: string
  label: string
  severity: Severity
  detail: string
}

export interface Evidence {
  id: string
  kind: string
  title: string
  excerpt: string
  confidence: number
  supports: 'H1' | 'H2'
}

export const dashboard = {
  incident: 'INC-2047',
  title: 'Latence anormale sur checkout-api',
  env: 'prod · eu-west-3',
  opened: '03:14:07',
  events: [
    { id: 'EVT-0409', time: '03:02:41', source: 'deploy-bot', label: 'Déploiement checkout-api v2.14.3', severity: 'info', detail: 'Pipeline #8812, 3 fichiers modifiés dans /payments/retry.ts' },
    { id: 'EVT-0410', time: '03:09:12', source: 'pg-primary', label: 'Connexions actives 182 → 241', severity: 'warn', detail: 'Pool max = 250. Saturation à 96 %.' },
    { id: 'EVT-0411', time: '03:12:55', source: 'otel-traces', label: 'Spans retry() x4 par requête', severity: 'warn', detail: 'Médiane 4 tentatives, avant déploiement : 1.' },
    { id: 'EVT-0412', time: '03:14:07', source: 'prometheus', label: 'p95 checkout 2.4 s (seuil 800 ms)', severity: 'crit', detail: 'Alerte SLO-checkout-latency déclenchée.' },
    { id: 'EVT-0413', time: '03:15:30', source: 'stripe-webhook', label: 'Timeouts 3 % des confirmations', severity: 'crit', detail: '41 confirmations en échec sur 1 366.' },
    { id: 'EVT-0414', time: '03:16:02', source: 'status-page', label: 'Aucune annonce publique', severity: 'info', detail: 'Pas de communication client émise.' },
  ] as DashEvent[],
  evidence: [
    { id: 'E1', kind: 'DIFF', title: 'Boucle de retry sans backoff', excerpt: 'retry(fn, { attempts: 5 })  // backoff supprimé', confidence: 0.86, supports: 'H1' },
    { id: 'E2', kind: 'TRACES', title: '4 retries par requête', excerpt: 'checkout.pay → retry ×4 → pg.query', confidence: 0.78, supports: 'H1' },
    { id: 'E3', kind: 'METRICS', title: 'Pool Postgres saturé', excerpt: 'pg_active_connections 241 / 250', confidence: 0.71, supports: 'H1' },
    { id: 'E4', kind: 'LOGS', title: 'Lenteur Stripe ponctuelle', excerpt: 'stripe 504 · 03:15:28 · 3 occurrences', confidence: 0.32, supports: 'H2' },
  ] as Evidence[],
  hypotheses: [
    { id: 'H1', label: 'La v2.14.3 multiplie les retries et sature le pool Postgres', score: 0.82 },
    { id: 'H2', label: 'Dégradation côté fournisseur de paiement', score: 0.18 },
  ],
  decision: {
    action: 'Rollback checkout-api v2.14.3 → v2.14.2',
    reasoning: ['Corrélation temporelle avec le déploiement (−11 min)', 'Mécanisme explicable : retry ×4 → pool saturé', 'Rollback réversible, testé sur staging'],
    risk: 'Faible · réversible en 2 min',
    unknowns: ['Stripe a renvoyé 3 × 504 : coïncidence ou cause ?', 'Aucun test de charge sur v2.14.3'],
    confidence: 0.82,
  },
  latency: [310, 320, 305, 330, 318, 340, 335, 360, 420, 610, 980, 1420, 1880, 2210, 2400, 2350, 2290, 2380],
}

/* ───────────── Incident Lab ───────────── */

export type ScenarioKind = 'cascade' | 'regression' | 'fanin'

export interface LabEvent {
  id: string
  t: number // position 0..1 sur l'axe du temps
  label: string
  source: string
  payload: string
  key?: boolean
}

export interface Scenario {
  id: string
  kind: ScenarioKind
  code: string
  name: string
  signal: string
  events: LabEvent[]
  evidence: string[]
  hypotheses: { label: string; p: number }[]
  uncertainties: string[]
  proposal: string
  alternative: string
}

export const scenarios: Scenario[] = [
  {
    id: 'cascade',
    kind: 'cascade',
    code: 'SCN-A',
    name: 'Cascade de latence',
    signal: 'p95 /search passe de 180 ms à 3,1 s en 6 minutes',
    events: [
      { id: 'A1', t: 0.08, label: 'cache-redis · hit ratio 94 % → 41 %', source: 'redis', payload: '{ "hit_ratio": 0.41, "evictions/s": 1830 }', key: true },
      { id: 'A2', t: 0.27, label: 'search-api · requêtes DB ×3', source: 'otel', payload: '{ "db.calls/req": 3.2, "baseline": 1.0 }' },
      { id: 'A3', t: 0.46, label: 'elastic · file d\'attente 1 200', source: 'elastic', payload: '{ "queue": 1204, "rejected": 37 }' },
      { id: 'A4', t: 0.66, label: 'gateway · timeouts 5 %', source: 'nginx', payload: '{ "504": 512, "window": "5m" }' },
      { id: 'A5', t: 0.86, label: 'SLO search-latency violé', source: 'prometheus', payload: '{ "p95_ms": 3104, "slo_ms": 400 }', key: true },
    ],
    evidence: ['Évictions Redis ×9 après rotation de la clé de config', 'Chaque étage amplifie le précédent (propagation mesurée)', 'Aucun déploiement applicatif dans la fenêtre'],
    hypotheses: [
      { label: 'maxmemory Redis abaissé par la rotation de config', p: 0.74 },
      { label: 'Pic de trafic organique', p: 0.26 },
    ],
    uncertainties: ['La rotation a touché 2 clusters, un seul est observé', 'Trafic +12 % : contribue, n\'explique pas tout'],
    proposal: 'Restaurer maxmemory=8gb sur cache-redis-02',
    alternative: 'Activer le rate-limit adaptatif sur /search',
  },
  {
    id: 'regression',
    kind: 'regression',
    code: 'SCN-B',
    name: 'Régression de déploiement',
    signal: 'Taux d\'erreurs 5xx 0,2 % → 7,8 % sur orders-service',
    events: [
      { id: 'B1', t: 0.12, label: 'orders-service · erreurs nominales', source: 'prometheus', payload: '{ "5xx_rate": 0.002 }' },
      { id: 'B2', t: 0.34, label: 'DEPLOY orders v5.2.0', source: 'argo-cd', payload: '{ "commit": "a91f3e2", "files": 14 }', key: true },
      { id: 'B3', t: 0.52, label: 'NullPointer · OrderMapper', source: 'sentry', payload: '{ "count": 2311, "first_seen": "+38s" }' },
      { id: 'B4', t: 0.7, label: '5xx 7,8 % · 3 pods', source: 'prometheus', payload: '{ "5xx_rate": 0.078, "pods": 3 }' },
      { id: 'B5', t: 0.88, label: 'Panier abandonné +22 %', source: 'analytics', payload: '{ "abandon_delta": 0.22 }', key: true },
    ],
    evidence: ['Première erreur 38 s après le déploiement', 'Stack trace dans un fichier modifié par le commit', 'Les pods encore en v5.1.9 restent sains'],
    hypotheses: [
      { label: 'Champ optionnel non géré dans OrderMapper v5.2.0', p: 0.88 },
      { label: 'Schéma de base migré partiellement', p: 0.12 },
    ],
    uncertainties: ['La migration SQL associée est-elle réversible ?', '3 pods sur 8 seulement : canary ou incident ?'],
    proposal: 'Rollback orders-service vers v5.1.9',
    alternative: 'Désactiver le feature flag order-v2-mapper',
  },
  {
    id: 'fanin',
    kind: 'fanin',
    code: 'SCN-C',
    name: 'Accès anormal',
    signal: '4 services reçoivent des appels avec un même jeton de service',
    events: [
      { id: 'C1', t: 0.1, label: 'billing · appel depuis IP inconnue', source: 'audit-log', payload: '{ "ip": "203.0.113.42", "token": "svc-****9f" }' },
      { id: 'C2', t: 0.3, label: 'users-api · lecture massive', source: 'audit-log', payload: '{ "rows": 48210, "token": "svc-****9f" }', key: true },
      { id: 'C3', t: 0.5, label: 'exports · 3 archives générées', source: 's3', payload: '{ "objects": 3, "size": "1.2GB" }' },
      { id: 'C4', t: 0.68, label: 'reports · token hors horaires', source: 'audit-log', payload: '{ "hour": "04:12", "usual": "09-19" }' },
      { id: 'C5', t: 0.86, label: 'Jeton présent dans un log CI public', source: 'secret-scan', payload: '{ "repo": "infra-ci", "line": 212 }', key: true },
    ],
    evidence: ['Même jeton svc-****9f dans les 4 services', 'IP absente de l\'inventaire interne', 'Jeton exposé dans un log CI 2 h avant'],
    hypotheses: [
      { label: 'Jeton de service fuité via le log CI', p: 0.81 },
      { label: 'Job interne mal configuré', p: 0.19 },
    ],
    uncertainties: ['Les archives ont-elles quitté le bucket ?', 'Le jeton a-t-il d\'autres scopes non audités ?'],
    proposal: 'Révoquer svc-****9f et bloquer 203.0.113.42',
    alternative: 'Mettre le jeton en lecture seule et surveiller 30 min',
  },
]

/* ───────────── Architecture (modèle conceptuel) ───────────── */

export const layers = [
  {
    id: 'front',
    index: '01',
    name: 'FRONTEND',
    nodes: ['Dashboard React', 'Timeline', 'Panneau de décision'],
    text: 'L\'interface présente le signal, la chronologie, les preuves et la proposition. Elle ne déclenche jamais d\'action sans clic humain explicite.',
  },
  {
    id: 'api',
    index: '02',
    name: 'API & ORCHESTRATION',
    nodes: ['API d\'incident', 'Orchestrateur', 'File d\'étapes'],
    text: 'L\'orchestrateur découpe l\'enquête en étapes : collecte, corrélation, hypothèses, proposition. Chaque étape est traçable.',
  },
  {
    id: 'mcp',
    index: '03',
    name: 'MCP TOOL LAYER',
    nodes: ['logs', 'metrics', 'traces', 'deploys'],
    text: 'Les sources sont exposées comme outils via le Model Context Protocol. Le modèle demande, l\'outil répond avec des données citables.',
  },
  {
    id: 'evidence',
    index: '04',
    name: 'EVIDENCE & REVIEW',
    nodes: ['Registre de preuves', 'Score de confiance', 'Validation humaine'],
    text: 'Chaque affirmation pointe vers une preuve. La décision finale reste humaine et journalisée.',
  },
]

/* ───────────── Méthode ───────────── */

export const method = {
  words: ['I QUESTION.', 'I BUILD.', 'I BREAK THINGS.', 'I FIX THEM.', 'I SHIP.'],
  // TODO: à ajuster par Morjiane pour refléter exactement son usage
  aiNote:
    'Ce site et FlowState AI ont été construits avec Claude Code et Codex comme partenaires d\'implémentation. Je cadre le problème, je découpe, je relis chaque diff, je teste et je tranche. L\'outil accélère l\'écriture ; la responsabilité du résultat reste la mienne.',
}

/* ───────────── Projets ───────────── */

// TODO: descriptions et liens à valider par Morjiane
export const projects = [
  {
    id: 'agentops',
    index: '01',
    name: 'AgentOps Security',
    kicker: 'ANALYSE · SÉCURITÉ · AGENTS',
    text: 'Un outil qui inspecte des fichiers de projet, repère des points de vigilance de sécurité et produit un rapport lisible.',
    href: links.portfolio,
  },
  {
    id: 'peacefi',
    index: '02',
    name: 'PeaceFi',
    kicker: 'CARTE · ACCÈS · NAVIGATION',
    text: 'Une carte minimaliste qui rend visibles des points d\'accès et guide la navigation de l\'un à l\'autre.',
    href: links.portfolio,
  },
  {
    id: 'dreamcrm',
    index: '03',
    name: 'DreamCRM',
    kicker: 'CRM · CLIENTS · PIPELINE',
    text: 'Un CRM qui organise fiches clients, tableaux et suivi commercial dans une même vue de travail.',
    href: links.portfolio,
  },
]

/* ───────────── White Room (case file) ───────────── */

// TODO: à valider par Morjiane — formulé comme état d'un prototype, sans résultats inventés
export const caseFile = {
  known: [
    { n: '01', title: 'Le problème', text: 'Pendant un incident, l\'information est dispersée entre logs, métriques, traces et déploiements. Le temps passe à chercher, pas à décider.' },
    { n: '02', title: 'La réponse', text: 'FlowState AI rassemble les signaux, les relie en chronologie, cite ses preuves et formule une proposition d\'action.' },
    { n: '03', title: 'Le principe', text: 'Aucune action n\'est exécutée sans validation humaine explicite. Le système propose, une personne tranche.' },
    { n: '04', title: 'L\'état', text: 'Prototype de démonstration. Les incidents, chiffres et journaux présentés sur ce site sont fictifs.' },
  ],
  open: [
    'La justesse des hypothèses sur de vrais incidents de production.',
    'Les intégrations réelles avec les outils d\'observabilité.',
    'Le coût et la latence de l\'inférence sous charge.',
    'L\'avis d\'équipes d\'astreinte qui l\'utiliseraient vraiment.',
  ],
  raw: [
    '2026-03-11T03:02:41Z deploy-bot INFO checkout-api v2.14.3 rolled out (8812)',
    '2026-03-11T03:09:12Z pg-primary WARN active_connections=241 max=250',
    '2026-03-11T03:12:55Z otel WARN span checkout.pay retry.count=4',
    '2026-03-11T03:14:07Z prometheus CRIT slo=checkout-latency p95=2400ms',
    '2026-03-11T03:15:30Z stripe-webhook ERR timeout 41/1366',
  ],
  structured: [
    ['Déclencheur', 'Déploiement v2.14.3', '03:02'],
    ['Mécanisme', 'retry ×4 → pool Postgres saturé', '03:09'],
    ['Impact', 'p95 checkout 2,4 s · 3 % de paiements en échec', '03:14'],
    ['Proposition', 'Rollback v2.14.2 · réversible', 'à valider'],
  ],
}

/* ───────────── Pour Smalk ───────────── */

export const smalk = {
  lead: 'Taly travaille à la frontière entre les modèles et les usages concrets. Ce qui m’attire dans l’IA agentique, c’est précisément cette étape : transformer un modèle en un système utile, connecté à des outils, contrôlable et assez fiable pour être utilisé dans le monde réel.',
  points: [
    {
      n: '01',
      title: 'Passer du prompt au système',
      text: 'Je conçois des expériences qui ne s’arrêtent pas à une réponse de chatbot : contexte, étapes, outils, traces et validation humaine font partie du produit.',
      proof: 'Claude Code · prototypage · workflows',
    },
    {
      n: '02',
      title: 'Connecter les agents au réel',
      text: 'Avec FlowState AI, j’ai travaillé sur un serveur MCP à 8 outils et une couche LLM dont les sorties sont validées et ancrées dans les données. J’aime rendre les capacités d’un agent concrètes et testables.',
      proof: 'MCP · outils · données structurées',
    },
    {
      n: '03',
      title: 'Automatiser sans perdre le contrôle',
      text: 'Un agent utile doit aussi savoir expliciter ses limites. Je privilégie les sorties vérifiables, les erreurs visibles, la traçabilité et une validation humaine quand une action a des conséquences.',
      proof: 'Garde-fous · tests · traçabilité',
    },
  ],
  geo: 'Imaginez un workflow qui reçoit une demande, consulte les bons outils via MCP, rassemble les éléments utiles puis propose une action argumentée. FlowState est mon terrain d’expérimentation pour explorer cette logique. La démo utilise des données fictives : je distingue clairement le prototype de ce qui reste à intégrer et à valider en conditions réelles.',
}

/* ───────────── Profil (source : CV) ───────────── */

export const profile = {
  headline: 'Développeuse. Je construis avec l’IA.',
  about:
    'Diplômée d\'une Licence Informatique, je construis des applications de bout en bout et j\'utilise Claude Code, ChatGPT et Codex pour passer rapidement d\'une idée à un prototype fonctionnel. Je m\'intéresse particulièrement aux agents IA, au Model Context Protocol (MCP), aux outils qui leur donnent accès aux bonnes données et aux garde-fous qui rendent leurs résultats vérifiables. Je préfère montrer un système qui fonctionne plutôt que prétendre tout savoir.',
  ai: ['Claude & Claude Code', 'ChatGPT & Codex', 'Serveurs MCP', 'Prompting structuré', 'Sorties LLM validées', 'Agents IA'],
  built: [
    { name: 'FlowState AI', what: 'Plateforme d\'enquête sur incidents : preuves citées, hypothèses, validation humaine, serveur MCP à 8 outils.', stack: 'Python · FastAPI · React · LLM · MCP', ai: true, href: links.repo },
    { name: 'Application anti-gaspillage alimentaire', what: 'Application complète en Node.js pour lutter contre le gaspillage alimentaire.', stack: 'Node.js · Full-stack', ai: false },
    { name: 'Sisterhood Journal', what: 'Application SaaS full-stack : architecture, gestion des données, déploiement, développement sécurisé.', stack: 'JavaScript · PHP · SQL', ai: false },
    { name: 'Audit OWASP Juice Shop', what: 'Audit de sécurité contrôlé sous Docker/WSL2 : cartographie des endpoints, rapport avec preuves et recommandations.', stack: 'Docker · Burp Suite · OWASP', ai: false },
    { name: 'MONEASY', what: 'Gestion de comptes et transactions en C++, architecture MVC, en binôme.', stack: 'C++ · POO · MVC', ai: false },
    { name: 'The Evidence Machine', what: 'Ce site : candidature interactive et démo FlowState, construite avec Claude Code et Codex.', stack: 'React · TypeScript · GSAP', ai: true },
  ],
  education: [{ title: 'Licence Informatique', place: 'Université Lumière Lyon 2 · Bron', date: '2023 – 2026', detail: 'Programmation, bases de données, développement web, génie logiciel, réseaux, systèmes & Linux.' }],
  experience: [
    { title: 'Stagiaire développeuse web', place: 'La Maison des Parents · Saint-Fons', date: 'Mai – Juil. 2026', detail: 'Pages et fonctionnalités en HTML, CSS et JavaScript ; bases de données, tests et corrections.' },
    { title: 'Internet Safety Evaluator', place: 'TELUS Digital · télétravail', date: 'Août 2025 – Fév. 2026', detail: 'Évaluation de contenus numériques selon des critères de qualité et de sécurité.' },
    { title: 'Assistante d\'institut', place: 'Université Catholique de Lyon', date: 'Juil. – Août 2026', detail: 'Accompagnement des utilisateurs, résolution et suivi des demandes.' },
    { title: 'Rédactrice de sujets d\'examen', place: 'UCLy · Lyon', date: 'Oct. 2025 – Juin 2026', detail: 'Préparation et adaptation de supports d\'examen.' },
  ],
  skills: [
    ['Développement', 'JavaScript · Node.js · Python · PHP · SQL · C / C++ · Swift · HTML / CSS'],
    ['IA', 'Claude · ChatGPT · Claude Code · Codex · MCP'],
    ['Cybersécurité', 'OWASP · Burp Suite · Nmap · Wireshark · TryHackMe / HTB'],
    ['Systèmes', 'Linux · Docker / WSL2 · TCP/IP · DNS · HTTP · Bash · PowerShell'],
  ],
  languages: 'Français natif · Espagnol B2 · Anglais B1',
}
