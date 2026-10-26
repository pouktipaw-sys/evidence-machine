// Builds publish/index.html (page body only; the host adds <html>/<head>/<body>) from dist/index.html.
import fs from 'node:fs'
const html = fs.readFileSync('dist/index.html', 'utf8')
const tags = [...html.matchAll(/<(script|link)[^>]*(src|href)="\.\/assets\/[^"]+"[^>]*>(<\/script>)?/g)].map((m) => m[0].replace(/ crossorigin/g, ''))
const icon = html.match(/<link rel="icon"[^>]*>/)?.[0] ?? ''
const page = `<title>Morjiane Aït Mokhtar</title>
<meta name="description" content="Candidature de Morjiane Aït Mokhtar : développement, IA et curiosité appliquée.">
<meta name="theme-color" content="#080808">
${icon}
<style>:root{color-scheme:dark}html,body{background:#080808}</style>
${tags.join('\n')}
<div id="root"></div>
<noscript>Morjiane Aït Mokhtar — Développement, IA et curiosité appliquée. Ce site nécessite JavaScript.</noscript>
`
fs.mkdirSync('publish', { recursive: true })
fs.writeFileSync('publish/index.html', page)
const files = Object.fromEntries(fs.readdirSync('dist/assets').map((f) => [`assets/${f}`, `dist/assets/${f}`]))
fs.writeFileSync('publish/files.json', JSON.stringify(files, null, 1))
console.log(page)
console.log(Object.keys(files).length, 'asset files')
