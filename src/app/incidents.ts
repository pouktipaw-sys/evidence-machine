import { dashboard, type DashEvent, type Evidence } from '../content'

/**
 * FlowState AI — demo workspace. Every incident here is FICTIONAL and labelled as such in the UI.
 * Each incident carries everything the investigation view needs.
 */

export type Sev = 'SEV1' | 'SEV2' | 'SEV3'

export interface Incident {
  id: string
  title: string
  service: string
  env: string
  opened: string
  severity: Sev
  selectedEvent: string
  events: DashEvent[]
  evidence: Evidence[]
  hypotheses: { id: 'H1' | 'H2'; label: string; score: number }[]
  decision: {
    action: string
    cta: string
    approvedStatus: string
    reasoning: string[]
    unknowns: string[]
    confidence: number
    alternative: string
  }
  chart: {
    metric: string
    big: string
    bigUnit: string
    values: number[]
    max: number
    threshold: number
    thresholdLabel: string
    markerAt: number
    markerLabel: string
    peakAt: number
    peakLabel: string
    recoverTo: number
  }
  followUps: { approved: DashEvent; rejected: DashEvent; asked: DashEvent; askLabel: string }
  /** a similar past incident, when retrieval found one */
  related?: { id: string; title: string; note: string }
  /** draft written for customers: never states an unconfirmed cause */
  customerDraft: string
  /** scenario tag shown in the inbox */
  tag?: string
}

/** FlowState never shows confidence as a percentage: categories only */
export type ConfLevel = 'élevée' | 'moyenne' | 'faible'
export function confLevel(n: number): ConfLevel {
  return n >= 0.75 ? 'élevée' : n >= 0.5 ? 'moyenne' : 'faible'
}

export const incidents: Incident[] = [
  {
    id: dashboard.incident,
    title: dashboard.title,
    service: 'checkout-api',
    env: dashboard.env,
    opened: dashboard.opened,
    severity: 'SEV1',
    selectedEvent: 'EVT-0412',
    events: dashboard.events,
    evidence: dashboard.evidence,
    hypotheses: dashboard.hypotheses as Incident['hypotheses'],
    decision: { ...dashboard.decision, cta: 'Approuver le rollback', approvedStatus: 'ROLLBACK APPROUVÉ', alternative: 'Ouvrir un ticket fournisseur et surveiller Stripe 15 min' },
    chart: {
      metric: 'p95 checkout-api',
      big: '2.4',
      bigUnit: 's',
      values: dashboard.latency,
      max: 2600,
      threshold: 800,
      thresholdLabel: 'SLO 800 ms',
      markerAt: 7.3,
      markerLabel: 'DEPLOY v2.14.3',
      peakAt: 14,
      peakLabel: 'pic 2 400 ms',
      recoverTo: 330,
    },
    followUps: {
      approved: { id: 'EVT-0415', time: '03:17:40', source: 'humain', label: 'Rollback approuvé par l\'opératrice', severity: 'info', detail: 'Décision journalisée. Exécution simulée, aucune action réelle.' },
      rejected: { id: 'EVT-0415', time: '03:17:40', source: 'humain', label: 'Proposition rejetée, H2 rouverte', severity: 'warn', detail: 'L\'enquête repart sur l\'hypothèse fournisseur.' },
      asked: { id: 'EVT-0416', time: '03:18:02', source: 'flowstate', label: 'Preuve demandée : test de charge', severity: 'info', detail: 'En attente d\'un résultat de test de charge sur v2.14.3.' },
      askLabel: 'test de charge',
    },
    related: { id: 'INC-1977', title: 'Retries en boucle sur payments-api', note: 'Même mécanisme : retry sans backoff, pool saturé. Résolu par rollback.' },
    customerDraft: 'Certains paiements sont plus lents que d\'habitude depuis 03:14. Nos équipes enquêtent ; la cause n\'est pas encore confirmée. Prochaine mise à jour dans 30 minutes.',
  },
  {
    id: 'INC-2051',
    title: 'Cascade de latence sur /search',
    service: 'search-api',
    env: 'prod · eu-west-3',
    opened: '11:42:18',
    severity: 'SEV2',
    selectedEvent: 'EVT-0507',
    events: [
      { id: 'EVT-0503', time: '11:36:02', source: 'config-bot', label: 'Rotation de config cache-redis-02', severity: 'info', detail: 'Clé maxmemory modifiée : 8gb → 2gb (rotation automatique).' },
      { id: 'EVT-0504', time: '11:37:40', source: 'redis', label: 'Hit ratio 94 % → 41 %', severity: 'warn', detail: '1 830 évictions par seconde sur cache-redis-02.' },
      { id: 'EVT-0505', time: '11:39:12', source: 'otel-traces', label: 'search-api : appels DB ×3 par requête', severity: 'warn', detail: 'Les requêtes non cachées retombent sur la base.' },
      { id: 'EVT-0506', time: '11:40:55', source: 'elastic', label: 'File d\'attente 1 204 requêtes', severity: 'warn', detail: '37 requêtes rejetées sur 5 minutes.' },
      { id: 'EVT-0507', time: '11:42:18', source: 'prometheus', label: 'p95 /search 3,1 s (seuil 400 ms)', severity: 'crit', detail: 'Alerte SLO-search-latency déclenchée.' },
      { id: 'EVT-0508', time: '11:43:01', source: 'nginx', label: 'Timeouts gateway 5 %', severity: 'crit', detail: '512 réponses 504 sur 5 minutes.' },
    ],
    evidence: [
      { id: 'E1', kind: 'CONFIG', title: 'maxmemory abaissé à 2gb', excerpt: 'cache-redis-02: maxmemory 8gb → 2gb', confidence: 0.84, supports: 'H1' },
      { id: 'E2', kind: 'METRICS', title: 'Évictions ×9 après rotation', excerpt: 'evicted_keys/s 200 → 1830', confidence: 0.79, supports: 'H1' },
      { id: 'E3', kind: 'TRACES', title: 'Chaque étage amplifie le précédent', excerpt: 'search → db ×3 → elastic queue', confidence: 0.7, supports: 'H1' },
      { id: 'E4', kind: 'TRAFFIC', title: 'Trafic organique +12 %', excerpt: 'rps 1 920 → 2 150', confidence: 0.3, supports: 'H2' },
    ],
    hypotheses: [
      { id: 'H1', label: 'La rotation de config a réduit le cache et déclenché la cascade', score: 0.74 },
      { id: 'H2', label: 'Pic de trafic organique', score: 0.26 },
    ],
    decision: {
      action: 'Restaurer maxmemory=8gb sur cache-redis-02',
      cta: 'Approuver la restauration',
      approvedStatus: 'CONFIG RESTAURÉE',
      reasoning: ['La cascade commence 98 s après la rotation', 'Mécanisme mesuré étage par étage', 'Changement réversible, sans déploiement'],
      unknowns: ['La rotation a touché 2 clusters, un seul est observé', 'Le trafic +12 % contribue-t-il ?'],
      confidence: 0.74,
      alternative: 'Activer le rate-limit adaptatif sur /search',
    },
    chart: {
      metric: 'p95 /search',
      big: '3.1',
      bigUnit: 's',
      values: [180, 175, 190, 185, 182, 195, 240, 420, 760, 1240, 1810, 2380, 2760, 3020, 3104, 3050, 2990, 3080],
      max: 3300,
      threshold: 400,
      thresholdLabel: 'SLO 400 ms',
      markerAt: 5.4,
      markerLabel: 'ROTATION CONFIG',
      peakAt: 14,
      peakLabel: 'pic 3 104 ms',
      recoverTo: 190,
    },
    followUps: {
      approved: { id: 'EVT-0509', time: '11:44:30', source: 'humain', label: 'Restauration de config approuvée', severity: 'info', detail: 'Décision journalisée. Exécution simulée, aucune action réelle.' },
      rejected: { id: 'EVT-0509', time: '11:44:30', source: 'humain', label: 'Proposition rejetée, piste trafic ouverte', severity: 'warn', detail: 'L\'enquête repart sur l\'hypothèse de trafic.' },
      asked: { id: 'EVT-0510', time: '11:45:02', source: 'flowstate', label: 'Preuve demandée : état du 2ᵉ cluster', severity: 'info', detail: 'En attente des métriques de cache-redis-03.' },
      askLabel: 'état du 2ᵉ cluster',
    },
    customerDraft: 'La recherche est ralentie depuis 11:42. Une piste est à l\'étude ; elle n\'est pas confirmée. Prochaine mise à jour dans 30 minutes.',
  },
  {
    id: 'INC-2049',
    title: 'Erreurs 5xx après déploiement de orders',
    service: 'orders-service',
    env: 'prod · eu-west-3',
    opened: '09:18:44',
    severity: 'SEV1',
    selectedEvent: 'EVT-0482',
    events: [
      { id: 'EVT-0480', time: '09:12:03', source: 'prometheus', label: 'orders-service : erreurs nominales 0,2 %', severity: 'info', detail: 'Ligne de base avant changement.' },
      { id: 'EVT-0481', time: '09:14:10', source: 'argo-cd', label: 'Déploiement orders v5.2.0', severity: 'info', detail: 'Commit a91f3e2, 14 fichiers, canary 3 pods sur 8.' },
      { id: 'EVT-0482', time: '09:14:48', source: 'sentry', label: 'NullPointer dans OrderMapper', severity: 'crit', detail: '2 311 occurrences, première 38 s après le déploiement.' },
      { id: 'EVT-0483', time: '09:16:20', source: 'prometheus', label: '5xx 7,8 % sur 3 pods', severity: 'crit', detail: 'Les 5 pods restés en v5.1.9 sont sains.' },
      { id: 'EVT-0484', time: '09:18:44', source: 'analytics', label: 'Paniers abandonnés +22 %', severity: 'warn', detail: 'Impact commercial mesuré sur 5 minutes.' },
    ],
    evidence: [
      { id: 'E1', kind: 'DIFF', title: 'Champ optionnel non géré', excerpt: 'order.coupon.code  // coupon peut être null', confidence: 0.88, supports: 'H1' },
      { id: 'E2', kind: 'LOGS', title: 'Stack trace dans le fichier modifié', excerpt: 'NPE at OrderMapper.java:142', confidence: 0.85, supports: 'H1' },
      { id: 'E3', kind: 'METRICS', title: 'Seuls les pods v5.2.0 échouent', excerpt: '3/8 pods · 5xx 7,8 % vs 0,2 %', confidence: 0.81, supports: 'H1' },
      { id: 'E4', kind: 'DB', title: 'Migration SQL partielle', excerpt: 'migration 0412 · 2/3 étapes', confidence: 0.22, supports: 'H2' },
    ],
    hypotheses: [
      { id: 'H1', label: 'OrderMapper v5.2.0 ne gère pas un coupon absent', score: 0.88 },
      { id: 'H2', label: 'Schéma de base migré partiellement', score: 0.12 },
    ],
    decision: {
      action: 'Rollback orders-service vers v5.1.9',
      cta: 'Approuver le rollback',
      approvedStatus: 'ROLLBACK APPROUVÉ',
      reasoning: ['Première erreur 38 s après le déploiement', 'Stack trace dans un fichier du commit', 'Les pods non mis à jour restent sains'],
      unknowns: ['La migration SQL associée est-elle réversible ?', 'Canary ou incident : faut-il bloquer le pipeline ?'],
      confidence: 0.88,
      alternative: 'Désactiver le feature flag order-v2-mapper',
    },
    chart: {
      metric: 'taux 5xx orders',
      big: '7.8',
      bigUnit: '%',
      values: [0.2, 0.25, 0.2, 0.22, 0.18, 0.2, 0.3, 2.4, 5.1, 6.9, 7.6, 7.8, 7.7, 7.9, 7.8, 7.6, 7.8, 7.7],
      max: 9,
      threshold: 1,
      thresholdLabel: 'SEUIL 1 %',
      markerAt: 6.2,
      markerLabel: 'DEPLOY v5.2.0',
      peakAt: 13,
      peakLabel: 'pic 7,9 %',
      recoverTo: 0.2,
    },
    followUps: {
      approved: { id: 'EVT-0485', time: '09:20:05', source: 'humain', label: 'Rollback v5.1.9 approuvé', severity: 'info', detail: 'Décision journalisée. Exécution simulée, aucune action réelle.' },
      rejected: { id: 'EVT-0485', time: '09:20:05', source: 'humain', label: 'Rollback rejeté, flag envisagé', severity: 'warn', detail: 'L\'enquête explore la désactivation du feature flag.' },
      asked: { id: 'EVT-0486', time: '09:20:40', source: 'flowstate', label: 'Preuve demandée : état de la migration', severity: 'info', detail: 'En attente du statut de la migration 0412.' },
      askLabel: 'état de la migration',
    },
    related: { id: 'INC-1890', title: 'Mapper non tolérant aux champs nuls', note: 'Un champ optionnel avait déjà provoqué des 5xx en v4.8.' },
    customerDraft: 'Une partie des commandes échoue depuis 09:14. Nous enquêtons ; la cause n\'est pas encore confirmée.',
  },
  {
    id: 'INC-2053',
    title: 'Accès anormal avec un jeton de service',
    service: 'identity',
    env: 'prod · eu-west-3',
    opened: '04:12:51',
    severity: 'SEV1',
    selectedEvent: 'EVT-0522',
    events: [
      { id: 'EVT-0519', time: '02:05:12', source: 'secret-scan', label: 'Jeton svc-****9f dans un log CI public', severity: 'warn', detail: 'Dépôt infra-ci, ligne 212.' },
      { id: 'EVT-0520', time: '04:02:33', source: 'audit-log', label: 'billing : appel depuis IP inconnue', severity: 'warn', detail: 'IP 203.0.113.42 absente de l\'inventaire.' },
      { id: 'EVT-0521', time: '04:06:47', source: 'audit-log', label: 'users-api : lecture de 48 210 lignes', severity: 'crit', detail: 'Volume 40× supérieur à l\'usage normal du jeton.' },
      { id: 'EVT-0522', time: '04:09:15', source: 's3', label: 'exports : 3 archives générées (1,2 Go)', severity: 'crit', detail: 'Archives créées hors des horaires habituels.' },
      { id: 'EVT-0523', time: '04:12:51', source: 'audit-log', label: 'reports : jeton utilisé à 04:12', severity: 'warn', detail: 'Usage habituel : 09:00 – 19:00.' },
    ],
    evidence: [
      { id: 'E1', kind: 'AUDIT', title: 'Même jeton dans 4 services', excerpt: 'token svc-****9f · billing, users, exports, reports', confidence: 0.83, supports: 'H1' },
      { id: 'E2', kind: 'NETWORK', title: 'IP hors inventaire', excerpt: '203.0.113.42 · aucun asset connu', confidence: 0.8, supports: 'H1' },
      { id: 'E3', kind: 'SECRET', title: 'Jeton exposé 2 h avant', excerpt: 'infra-ci/build.log:212', confidence: 0.86, supports: 'H1' },
      { id: 'E4', kind: 'CRON', title: 'Job d\'export planifié ?', excerpt: 'cron exports-nightly · désactivé depuis mars', confidence: 0.18, supports: 'H2' },
    ],
    hypotheses: [
      { id: 'H1', label: 'Jeton de service fuité via le log CI et réutilisé', score: 0.81 },
      { id: 'H2', label: 'Job interne mal configuré', score: 0.19 },
    ],
    decision: {
      action: 'Révoquer svc-****9f et bloquer 203.0.113.42',
      cta: 'Approuver la révocation',
      approvedStatus: 'JETON RÉVOQUÉ',
      reasoning: ['Jeton exposé publiquement 2 h avant', 'IP inconnue, horaires anormaux', 'Volume de lecture 40× la normale'],
      unknowns: ['Les archives ont-elles quitté le bucket ?', 'Le jeton a-t-il d\'autres scopes ?'],
      confidence: 0.81,
      alternative: 'Passer le jeton en lecture seule et surveiller 30 min',
    },
    chart: {
      metric: 'lectures / min · svc-****9f',
      big: '48k',
      bigUnit: '',
      values: [120, 140, 110, 130, 125, 118, 900, 6400, 18200, 31000, 44100, 48210, 39000, 22000, 9800, 4100, 2600, 1900],
      max: 52000,
      threshold: 2000,
      thresholdLabel: 'NORMALE 2 000',
      markerAt: 5.6,
      markerLabel: 'PREMIER APPEL IP INCONNUE',
      peakAt: 11,
      peakLabel: 'pic 48 210',
      recoverTo: 0,
    },
    followUps: {
      approved: { id: 'EVT-0524', time: '04:14:02', source: 'humain', label: 'Révocation approuvée', severity: 'info', detail: 'Décision journalisée. Exécution simulée, aucune action réelle.' },
      rejected: { id: 'EVT-0524', time: '04:14:02', source: 'humain', label: 'Révocation rejetée, surveillance renforcée', severity: 'warn', detail: 'Le jeton passe en lecture seule (simulation).' },
      asked: { id: 'EVT-0525', time: '04:14:40', source: 'flowstate', label: 'Preuve demandée : sortie réseau du bucket', severity: 'info', detail: 'En attente des logs d\'egress S3.' },
      askLabel: 'sortie réseau du bucket',
    },
    customerDraft: 'Nous analysons une activité inhabituelle sur un accès technique interne. Aucune conclusion n\'est établie à ce stade.',
  },
  {
    // the flagship case of the real FlowState demo (fictional Lumora Cloud fixtures)
    id: 'INC-1042',
    title: 'Northstar : échecs d\'authentification',
    service: 'auth-gateway',
    env: 'Lumora Cloud · prod',
    opened: '08:47:10',
    severity: 'SEV2',
    tag: 'Cas de la démo FlowState',
    selectedEvent: 'EVT-1042-3',
    events: [
      { id: 'CHG-281', time: '08:20:00', source: 'change', label: 'Déploiement progressif des permissions', severity: 'info', detail: 'Nouveau modèle de scopes déployé sur 30 % des tenants.' },
      { id: 'EVT-1042-1', time: '08:31:44', source: 'auth-gateway', label: '401 en hausse pour le tenant Northstar', severity: 'warn', detail: 'Les rejets concernent des jetons pourtant valides.' },
      { id: 'EVT-1042-2', time: '08:39:02', source: 'support', label: '3 tickets Northstar : « déconnexions »', severity: 'warn', detail: 'Les utilisateurs doivent se reconnecter plusieurs fois par heure.' },
      { id: 'EVT-1042-3', time: '08:47:10', source: 'monitoring', label: 'Taux d\'échec d\'auth 6,4 %', severity: 'crit', detail: 'Seuil d\'alerte : 1 %. Limité aux tenants du lot CHG-281 ?' },
      { id: 'EVT-1042-4', time: '08:52:30', source: 'traces', label: 'Traces client manquantes', severity: 'info', detail: 'Aucune trace côté client Northstar : impossible de confirmer le parcours.' },
    ],
    evidence: [
      { id: 'E1', kind: 'CHANGE', title: 'CHG-281 précède les échecs de 11 min', excerpt: 'CHG-281 · permissions rollout · 30 % des tenants', confidence: 0.64, supports: 'H1' },
      { id: 'E2', kind: 'RUNBOOK', title: 'KB-17 : vérifier les scopes après un rollout', excerpt: 'KB-17 · « comparer scopes avant/après »', confidence: 0.6, supports: 'H1' },
      { id: 'E3', kind: 'HISTORY', title: 'INC-998 : symptômes similaires', excerpt: 'INC-998 · scopes manquants après migration', confidence: 0.55, supports: 'H1' },
      { id: 'E4', kind: 'PROBE', title: 'KB-19 : la sonde de refresh passe', excerpt: 'KB-19 · token refresh probe : OK', confidence: 0.45, supports: 'H2' },
    ],
    hypotheses: [
      { id: 'H1', label: 'CHG-281 retire un scope requis par les clients Northstar', score: 0.62 },
      { id: 'H2', label: 'Le renouvellement des jetons échoue (contredit par la sonde KB-19)', score: 0.3 },
    ],
    decision: {
      action: 'Mettre en pause CHG-281 pour la cohorte de Northstar',
      cta: 'Approuver la pause',
      approvedStatus: 'PAUSE APPROUVÉE · NON EXÉCUTÉE',
      reasoning: ['Corrélation temporelle avec CHG-281 (ce n\'est pas une preuve)', 'Le runbook KB-17 décrit ce scénario', 'Pause réversible, limitée à une cohorte'],
      unknowns: ['Traces client Northstar manquantes', 'Cohorte exacte du tenant dans CHG-281 non confirmée'],
      confidence: 0.62,
      alternative: 'Collecter les traces client puis réévaluer H2',
    },
    chart: {
      metric: 'échecs d\'authentification',
      big: '6.4',
      bigUnit: '%',
      values: [0.3, 0.3, 0.4, 0.3, 0.3, 0.4, 0.9, 2.1, 3.8, 5.0, 5.9, 6.4, 6.2, 6.4, 6.3, 6.1, 6.4, 6.2],
      max: 7.5,
      threshold: 1,
      thresholdLabel: 'ALERTE 1 %',
      markerAt: 5.2,
      markerLabel: 'CHG-281',
      peakAt: 11,
      peakLabel: 'pic 6,4 %',
      recoverTo: 0.3,
    },
    followUps: {
      approved: { id: 'EVT-1042-5', time: '08:58:12', source: 'humain', label: 'Pause approuvée : intention enregistrée, non exécutée', severity: 'info', detail: 'L\'approbation enregistre une intention. Aucun rollback n\'est déclenché par FlowState.' },
      rejected: { id: 'EVT-1042-5', time: '08:58:12', source: 'humain', label: 'Pause rejetée, collecte de traces demandée', severity: 'warn', detail: 'L\'enquête repart sur la collecte des traces client.' },
      asked: { id: 'EVT-1042-6', time: '08:59:40', source: 'flowstate', label: 'Preuve demandée : cohorte du tenant', severity: 'info', detail: 'En attente de la liste des tenants inclus dans CHG-281.' },
      askLabel: 'cohorte du tenant',
    },
    related: { id: 'INC-998', title: 'Scopes manquants après migration', note: 'Symptômes proches ; la corrélation n\'implique pas la même cause.' },
    customerDraft: 'Certains utilisateurs de Northstar sont déconnectés de façon inattendue. Nous enquêtons ; la cause n\'est pas confirmée. Prochaine mise à jour dans 30 minutes.',
  },
  {
    // a GEO case: why a brand stopped being cited by AI answer engines (fictional brand)
    id: 'INC-2061',
    title: 'Visibilité IA : la marque disparaît des réponses',
    service: 'maison-arlo.fr',
    env: 'GEO · moteurs de réponse IA',
    opened: '10:05:00',
    severity: 'SEV2',
    tag: 'Scénario GEO',
    selectedEvent: 'EVT-GEO-4',
    events: [
      { id: 'EVT-GEO-1', time: 'J-12', source: 'deploy', label: 'Nouveau robots.txt mis en ligne', severity: 'info', detail: 'Refonte du site : règles crawler réécrites par le prestataire.' },
      { id: 'EVT-GEO-2', time: 'J-11', source: 'crawl-logs', label: 'Visites GPTBot et PerplexityBot : −96 %', severity: 'warn', detail: '1 240 visites/jour → 48. Googlebot inchangé.' },
      { id: 'EVT-GEO-3', time: 'J-6', source: 'sitemap', label: 'sitemap.xml en 404', severity: 'warn', detail: 'Ancienne URL du sitemap supprimée pendant la refonte.' },
      { id: 'EVT-GEO-4', time: 'J-2', source: 'ai-visibility', label: 'Part de citation 34 % → 7 %', severity: 'crit', detail: 'Sur 200 questions suivies (« meilleur canapé modulable »…).' },
      { id: 'EVT-GEO-5', time: 'J-1', source: 'ai-visibility', label: 'Un comparatif concurrent cité à sa place', severity: 'warn', detail: 'Perplexity cite désormais un guide d\'achat tiers dans 61 % des réponses.' },
    ],
    evidence: [
      { id: 'E1', kind: 'ROBOTS', title: 'GPTBot et PerplexityBot bloqués', excerpt: 'User-agent: GPTBot · Disallow: /', confidence: 0.86, supports: 'H1' },
      { id: 'E2', kind: 'CRAWL', title: 'Les crawlers IA ne passent plus', excerpt: 'PerplexityBot 640/j → 21/j depuis J-11', confidence: 0.82, supports: 'H1' },
      { id: 'E3', kind: 'SITEMAP', title: 'Sitemap introuvable', excerpt: 'GET /sitemap.xml → 404', confidence: 0.58, supports: 'H1' },
      { id: 'E4', kind: 'SEASON', title: 'Baisse saisonnière des requêtes ?', excerpt: 'volume de questions −8 % sur la période', confidence: 0.24, supports: 'H2' },
    ],
    hypotheses: [
      { id: 'H1', label: 'Le nouveau robots.txt bloque les crawlers des moteurs de réponse IA', score: 0.8 },
      { id: 'H2', label: 'Baisse saisonnière de l\'intérêt pour la catégorie', score: 0.2 },
    ],
    decision: {
      action: 'Rétablir l\'accès des crawlers IA et republier le sitemap',
      cta: 'Approuver le correctif',
      approvedStatus: 'CORRECTIF APPROUVÉ · NON EXÉCUTÉ',
      reasoning: ['La chute des visites suit le nouveau robots.txt (J-11)', 'Googlebot non touché : le blocage vise les agents IA', 'Changement réversible, sans impact SEO classique'],
      unknowns: ['Délai de recrawl des moteurs : non maîtrisé', 'Le comparatif concurrent restera-t-il cité ?'],
      confidence: 0.8,
      alternative: 'Mesurer 7 jours de plus avant d\'agir',
    },
    chart: {
      metric: 'part de citation dans les réponses IA',
      big: '7',
      bigUnit: '%',
      values: [34, 33, 35, 34, 36, 35, 33, 30, 24, 17, 12, 9, 8, 7, 7, 8, 7, 7],
      max: 40,
      threshold: 20,
      thresholdLabel: 'OBJECTIF 20 %',
      markerAt: 6.3,
      markerLabel: 'ROBOTS.TXT',
      peakAt: 13,
      peakLabel: 'creux 7 %',
      recoverTo: 33,
    },
    followUps: {
      approved: { id: 'EVT-GEO-6', time: 'J0', source: 'humain', label: 'Correctif approuvé : intention enregistrée', severity: 'info', detail: 'Rien n\'est modifié sur le site par FlowState : l\'équipe web applique le correctif.' },
      rejected: { id: 'EVT-GEO-6', time: 'J0', source: 'humain', label: 'Correctif rejeté, mesure prolongée', severity: 'warn', detail: 'Suivi des citations 7 jours de plus.' },
      asked: { id: 'EVT-GEO-7', time: 'J0', source: 'flowstate', label: 'Preuve demandée : réponses ChatGPT archivées', severity: 'info', detail: 'En attente des réponses capturées avant/après J-11.' },
      askLabel: 'réponses archivées avant/après',
    },
    related: { id: 'INC-1733', title: 'Pages produits en noindex après migration', note: 'Même famille : une refonte qui coupe un canal d\'acquisition sans alerte.' },
    customerDraft: 'Votre marque est moins citée par les assistants IA depuis dix jours. Une cause probable est identifiée (accès des robots IA) ; elle reste à confirmer après correctif.',
  },
]

export const incidentById = (id: string) => incidents.find((i) => i.id === id)
