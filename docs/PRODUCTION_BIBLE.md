# THE EVIDENCE MACHINE — Production Bible

Candidature de **Morjiane Aït Mokhtar**. Le site est une installation : des signaux bruts deviennent une structure, la structure devient une enquête, l'enquête devient un outil (FlowState AI).

---

## 1. Concept

**Un seul fil conducteur : LA LIGNE DE SIGNAL.**
Une ligne orange de 1 px traverse tout le site. Elle naît dans le noir (ouverture), traverse la sculpture, devient les arêtes du graphe d'enquête, puis les séparateurs du dashboard, la ligne de temps de l'Investigation Room, les règles de la White Room et, à la fin, le fil qui relie la sculpture au bouton de contact.
Si l'on retire le texte, chaque scène reste reconnaissable grâce à ce fil et à la sculpture.

Trois registres seulement :

| Registre | Où | Langage |
|---|---|---|
| **Noir / installation** | Hero, désassemblage, Investigation Room, X-Ray, finale | Lumière localisée, chrome, orange = action |
| **Ivoire / document** | White Room, Méthode | Publication imprimée, grille, filets, typographie énorme |
| **Artefacts** | Projets | Chaque projet a son propre langage graphique (terminal, carte isométrique, bureau 2.5D) |

## 2. Références visuelles (board écrit)

- **Dieter Rams / Braun T1000** : métal anodisé noir, rainures fines, un seul accent couleur.
- **Teenage Engineering OP-1** : marquages techniques miniatures, typographie mono minuscule à côté de volumes massifs.
- **Affiches suisses (Müller-Brockmann)** : grille stricte, asymétrie, échelle typographique extrême.
- **Rapports d'accident (NTSB)** : numérotation, pièces à conviction, chronologie, « ce que l'on sait / ce qui reste à vérifier ».
- **Éclairage de produit studio** : key chaude, fill froide, contre-jour blanc qui dessine la silhouette sur fond noir.
- **Plans de coupe industriels** : vue éclatée, traits de rappel, cotes.

## 3. Système visuel

**Couleurs** — Black Ink `#080808` (profondeur), Signal Orange `#FF4D2D` (action, signal, jamais décoratif), Bone White `#F1EDE5` (pauses éditoriales), Cold Silver `#C5C9CE` (technologie), Graphite `#242424` (structure).
Règle : l'orange ne couvre jamais plus de ~3 % d'un écran. C'est un signal, pas un fond.

**Typographie**
- Display : **Syne 800** (variable). Utilisée à 14–22vw. Traitements : compression verticale (`scaleY`), masquage par lignes, texte plein derrière l'objet + contour devant l'objet (le mot « traverse » la sculpture), mots-fantômes qui deviennent le fond du mot suivant.
- Technique : **JetBrains Mono** 10–12 px, capitales, interlettrage +0.08em. Toujours accompagnée d'un index (`01`, `EVT-0412`, `Δ +312ms`).
- Contraste d'échelle minimum dans chaque scène : 1:20 entre le plus grand et le plus petit texte.

**Matières (Evidence Core)**
- Anodisé noir : métal 0.85, rugosité 0.42, rainures en bump map procédurale.
- Chrome argenté : métal 1, rugosité 0.16, reflète l'environnement studio procédural.
- Graphite mat : métal 0.2, rugosité 0.85, grain fin.
- Orange émissif : uniquement le cœur et la fente « Human Decision ».

**Lumière** — key chaude haut-gauche, fill froide droite, rim blanche arrière, point orange au cœur (portée 3 u). Environnement PMREM construit en code (softboxes), pas de HDR téléchargé, pas de dégradés CSS plein écran.

## 4. L'objet signature : THE EVIDENCE CORE

Sculpture asymétrique, ~4,5 u de haut, lisible de face comme de trois quarts.

| Pièce | Sens | Forme |
|---|---|---|
| Colonne fracturée (7 tranches octogonales décalées) + cœur orange visible dans les interstices | **REASONING** | Monolithe tranché |
| 3 tiges longues qui sortent du cadre à gauche + peigne de 7 ailettes | **INPUT** | Prise de signal |
| 9 plaques (anodisé/chrome), dont un plateau en porte-à-faux | **EVIDENCE** | Pièces à conviction |
| Bloc graphite à fente orange au bout du plateau, avec levier chrome | **HUMAN DECISION** | Le sceau, posé au bord, hors de la machine |
| Un arc partiel unique | structure | Balayage de silhouette |
| Panneaux de métadonnées flottants | annotations | Texte mono sur plaques |
| Lignes de données dynamiques + impulsions | connexions | 1 px, orange / argent |

Chaque pièce possède 5 états : **Assemblé → Éclaté → Graphe → Dashboard → Recomposé**. Les plaques ont dans l'état Dashboard la position exacte (calculée en pixels → monde) des panneaux de l'interface DOM. C'est ce qui rend la transformation continue.

## 5. Storyboard des trois moments

### MOMENT 1 — Hero « DON'T JUST TELL. »
| t | Plan | Caméra | Contenu |
|---|---|---|---|
| 0–400 ms | Noir. Une ligne orange se trace de gauche à droite à mi-hauteur. | fixe | Rien d'autre. |
| 400–900 ms | La sculpture émerge : la lumière monte (key → rim), dolly avant de 14 u à 9.5 u. | dolly + léger arc | Le cœur orange s'allume en dernier. |
| 900–1500 ms | DON'T / JUST / TELL. monte ligne par ligne derrière l'objet (masques). Copie en contour devant l'objet. | — | Le mot traverse la sculpture. |
| 1500–2000 ms | Annotations reliées par traits de rappel aux pièces, nom, CTA, index. | — | Interaction libre dès 0 ms. |

Silhouette : colonne verticale forte, plateau horizontal qui sort à droite, tiges qui sortent du cadre à gauche. Composition en croix asymétrique, 60 % de la zone centrale.
Interaction : survol d'une pièce → label + annotation active ; drag → rotation avec inertie ; curseur → parallaxe 0,15 rad max. Mobile : 4 repères tactiles.

### MOMENT 2 — The Disassembly → FlowState
Section collante de 6,5 écrans, entièrement réversible (scrub).
| Progression | Plan | 3D | Typo |
|---|---|---|---|
| 0–8 % | Hero tenu | assemblé | hero se retire |
| 8–25 % | Push-in vers le cœur | caméra 9.5 → 6.8 u, les tiges reculent | **FROM SIGNAL.** énorme derrière, monte en échelle |
| 25–40 % | Éclatement | pièces s'écartent sur 3 axes, interstices s'ouvrent | |
| 40–50 % | Connexions + événements | lignes visibles, étiquettes `EVT-` projetées sur les fragments | **TO CONTEXT.** traverse l'écran au premier plan |
| 50–62 % | Graphe | plaques alignées en 3 colonnes (signal → preuve → décision), caméra frontale | **TO ACTION.** comprimé verticalement |
| 62–72 % | Naissance du produit | plaques s'aplatissent en cadres de panneaux, tiges → séparateurs, colonne → logo | |
| 72–76 % | Relève | le DOM du dashboard apparaît exactement sur les cadres, la 3D s'efface | |
| 76–100 % | Zooms 01 EVENTS / 02 EVIDENCE / 03 DECISION | zoom sur la zone, le reste à 25 % | annotation éditoriale |

### MOMENT 3 — The Investigation Room
Espace noir, ligne orange horizontale pleine largeur = axe du temps.
1. Choix du scénario (3) → la ligne vibre, les capsules d'événements se posent sur la ligne.
2. **INITIATE INVESTIGATION** → révélation en 6 temps : signal, événements, preuves, hypothèses, incertitudes, proposition.
3. Chaque scénario a sa propre géométrie :
   - **Cascade de latence** : arcs de propagation au-dessus de la ligne, onde qui voyage.
   - **Régression de déploiement** : un marqueur vertical tranche le temps, tout ce qui suit bascule, branche.
   - **Accès anormal** : les événements convergent sous la ligne vers une source unique (éventail).
4. Décision humaine : **Approuver** → un câble orange ferme le schéma jusqu'au nœud ACTION. **Rejeter** → la proposition se retire, l'hypothèse alternative remonte, nouvelle branche.
Tout est local, aucune action réelle.

## 6. Accessibilité et repli
- `prefers-reduced-motion` : pas de rotation idle, pas de parallaxe, transitions en fondu.
- WebGL indisponible : sculpture SVG dessinée à la main (mêmes pièces, mêmes couleurs).
- X-Ray : vue 2D équivalente pour clavier, mobile, mouvement réduit.
- Toutes les interactions accessibles au clavier ; textes réels dans le DOM (jamais seulement dans une texture).

## 7. Honnêteté du contenu
- Données du dashboard et des scénarios : **fictives, de démonstration**, signalées comme telles.
- X-Ray : **modèle conceptuel**, distingué de l'implémentation vérifiée.
- Liens et descriptions de projets : centralisés dans `src/content.ts`, à valider par la candidate.
