// Tira a foto do card de cada item como está hoje na vitrine (docs/lojas/*.html) e salva em hoje/<arquivo>-<id na vitrine>.png,
// para a bancada mostrar "como é hoje" ao lado do desenho novo. Firefox headless pelo WebDriver BiDi, como o navegador.mjs.
//   node docs/lojas/arte/hoje.mjs [ID ...]     (sem ID: todos os da itens.js que têm vit)
// O perfil temporário fica em os.tmpdir() e é apagado no fim: nada entra na pasta do repositório.
import {spawn} from 'node:child_process';
import {readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
// o CSS da licença hunter mora no jogo (web/grupo.js), não na vitrine: sem ele a prévia da licença sai em branco
const grupo = readFileSync(join(AQUI, '..', '..', '..', 'web', 'grupo.js'), 'utf8').split('\n');
const CSS_LIC = grupo.slice(grupo.findIndex(l => l.includes('/* licença hunter: um objeto')), grupo.findIndex(l => l.includes('.tl-pv .tt-lic{width:100%}')) + 1).join('\n')
  + '\n.pv:has(.lic-w){height:auto!important;padding:10px}.lic-w{width:100%}.lic-w .tt-lic{width:100%}'
  // a vitrine tem um .foto próprio (fundo de perfil) que cobriria a licença: aqui ele vira a foto quadrada do avatar
  + '\n.lic-w .foto{position:static;inset:auto;width:58%;aspect-ratio:1;background:var(--av,#222536) center/cover}.lic-w .emb{position:static;inset:auto}';
const ITENS = new Function(readFileSync(join(AQUI, 'itens.js'), 'utf8') + ';return ITENS')();
const pedidos = process.argv.slice(2);
const ids = (pedidos.length ? pedidos : Object.keys(ITENS)).filter(i => ITENS[i]?.vit);
if(!ids.length){ console.error('nenhum item com vit'); process.exit(1); }
mkdirSync(join(AQUI, 'hoje'), {recursive: true});

const prof = mkdtempSync(join(tmpdir(), 'hoje-'));
const ff = spawn('firefox', ['--headless', '--no-remote', '--profile', prof, '--remote-debugging-port=9335', '--window-size=1000,900'], {stdio: 'ignore'});
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for(let i = 0; i < 60; i++){ await sleep(500); try { ws = new WebSocket('ws://127.0.0.1:9335/session'); await new Promise((ok, err) => { ws.onopen = ok; ws.onerror = err; }); break; } catch(e) {} }
if(!ws){ console.error('sem conexão com o Firefox'); ff.kill(); process.exit(1); }
let n = 0; const pend = new Map();
ws.onmessage = m => { const j = JSON.parse(m.data); if(j.id && pend.has(j.id)){ pend.get(j.id)(j); pend.delete(j.id); } };
const cmd = (method, params) => new Promise(r => { const i = ++n; pend.set(i, r); ws.send(JSON.stringify({id: i, method, params})); })
  .then(r => { if(r.type === 'error') throw new Error(method + ': ' + r.message); return r.result; });
const js = (ctx, expr) => cmd('script.evaluate', {target: {context: ctx}, expression: `(async()=>{${expr}})()`, awaitPromise: true, resultOwnership: 'none'})
  .then(r => { if(r.type === 'exception') throw new Error(r.exceptionDetails.text); return r.result.value; });

// por arquivo: o card é montado com o próprio card() da página, no canto da tela, e fotografado
const pagina = {associacao: 'associacao.html', masadora: 'masadora.html'};
const monta = (arq, id) => arq === 'masadora'
  ? `const it = I.find(i => i[0] === ${JSON.stringify(id)}), nv = !it && N.find(i => i[0] === ${JSON.stringify(id)}); if(!it && !nv) throw new Error('sem ${id}'); const html = card(it || nv, !it);`
  : `let it = I.find(i => i[0] === ${JSON.stringify(id)}); if(!it) throw new Error('sem ${id}');
     if(!Object.keys(it[7] || {}).length && AP[${JSON.stringify(id)}]) it = [...it.slice(0, 7), AP[${JSON.stringify(id)}], ...it.slice(8)];  // card sem prévia: usa a ficha do provador
     const html = card(it);`;
// a vitrine marca a licença com lv-*, mas o CSS que existe é o do jogo (tl-*): troca uma pela outra
const LV = {'lv-verde': 'tl-cor-verde', 'lv-escarlate': 'tl-cor-escarlate', 'lv-preto': 'tl-est-preto', 'lv-ouro': 'tl-est-ouro',
  'lv-corrente': 'tl-bd-corrente', 'lv-brilho': 'tl-fx-brilho', 'lv-holo': 'tl-fx-holo', 'lv-verso': 'tl-vs-roxo'};
try {
  await cmd('session.new', {capabilities: {}});
  const ctx = (await cmd('browsingContext.create', {type: 'tab'})).context;
  for(const arq of Object.keys(pagina)){
    const lista = [...new Set(ids.filter(i => ITENS[i].vit.arq === arq).map(i => ITENS[i].vit.id))]; if(!lista.length) continue;
    await cmd('browsingContext.navigate', {context: ctx, url: pathToFileURL(join(AQUI, '..', pagina[arq])).href, wait: 'complete'});
    await sleep(1200);
    for(const vid of lista){
      const r = await js(ctx, `${monta(arq, vid)}
        if(${JSON.stringify(arq)} === 'associacao' && !document.getElementById('hoje-css')){ const s = document.createElement('style'); s.id = 'hoje-css'; s.textContent = ${JSON.stringify(CSS_LIC)}; document.head.append(s); }
        document.getElementById('hoje-x')?.remove();
        const w = document.createElement('div'); w.id = 'hoje-x'; w.className = 'grade';
        w.style.cssText = 'position:fixed;left:0;top:0;width:340px;padding:12px;z-index:99999;background:var(--bg,#0F1016);display:block';
        if(typeof AV !== 'undefined') w.style.setProperty('--av', 'url(' + AV + ')'); w.innerHTML = html; const LV = ${JSON.stringify(LV)}; w.querySelectorAll('.tt-lic').forEach(e => [...e.classList].forEach(c => LV[c] && e.classList.add(LV[c]))); document.body.append(w); await new Promise(r => setTimeout(r, 400));
        const b = w.getBoundingClientRect(); return JSON.stringify({x: 0, y: 0, width: Math.ceil(b.width), height: Math.floor(b.height)});`);
      const clip = {type: 'box', ...JSON.parse(r)};
      const s = await cmd('browsingContext.captureScreenshot', {context: ctx, clip});
      writeFileSync(join(AQUI, 'hoje', arq + '-' + vid + '.png'), Buffer.from(s.data, 'base64'));
      console.log('hoje/' + arq + '-' + vid + '.png');
    }
  }
} finally { ws.close(); ff.kill(); await sleep(500); rmSync(prof, {recursive: true, force: true}); }
