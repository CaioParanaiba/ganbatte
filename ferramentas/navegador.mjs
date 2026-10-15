// Testa a página no Firefox headless pelo WebDriver BiDi: node ferramentas/navegador.mjs <url> <roteiro.json>
// roteiro: [{js:"código"} | {click:"seletor"} | {key:"\uE007"} | {wait:ms} | {shot:"arquivo.png"} | {log:"expr"}]
import {spawn} from 'node:child_process';
import {readFileSync, writeFileSync, mkdtempSync} from 'node:fs';
const [url, rot] = process.argv.slice(2);
const steps = JSON.parse(readFileSync(rot, 'utf8'));
const prof = mkdtempSync(process.cwd() + '/prof-');
const ff = spawn('firefox', ['--headless', '--no-remote', '--profile', prof, '--remote-debugging-port=9333', '--window-size=1440,1000'], {stdio:'ignore'});
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for(let i = 0; i < 60; i++){ await sleep(500); try { ws = new WebSocket('ws://127.0.0.1:9333/session'); await new Promise((ok, err) => { ws.onopen = ok; ws.onerror = err; }); break; } catch(e){ ws = null; } }
if(!ws){ console.error('sem conexão'); ff.kill(); process.exit(1); }
let id = 0; const pend = new Map();
ws.onmessage = m => { const j = JSON.parse(m.data); if(j.id && pend.has(j.id)){ pend.get(j.id)(j); pend.delete(j.id); } };
const cmd = (method, params) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({id:i, method, params})); }).then(r => { if(r.type === 'error') throw new Error(method + ': ' + r.message); return r; });
try {
await cmd('session.new', {capabilities:{}});
const tab = await cmd('browsingContext.create', {type:'tab'});
const ctx = tab.result.context;
await cmd('browsingContext.navigate', {context:ctx, url, wait:'complete'});
await sleep(800);
for(const s of steps){
  if(s.wait) await sleep(s.wait);
  if(s.js){ const r = await cmd('script.evaluate', {target:{context:ctx}, expression:`(async()=>{${s.js}})()`, awaitPromise:true, resultOwnership:'none'}); if(r.result && r.result.type === 'exception') console.log('ERRO js:', JSON.stringify(r.result.exceptionDetails.text), s.js.slice(0,80)); await sleep(250); }
  if(s.click){
    const r = await cmd('script.evaluate', {target:{context:ctx}, expression:`JSON.stringify((() => { const el = document.querySelector(${JSON.stringify(s.click)}); el.scrollIntoView({block:'center'}); const r = el.getBoundingClientRect(), x = Math.round(r.x + r.width/2), y = Math.round(r.y + r.height/2); if(!r.width || !r.height || !el.contains(document.elementFromPoint(x,y))) throw new Error('Controle escondido ou coberto: ' + ${JSON.stringify(s.click)}); return {x,y}; })())`, awaitPromise:true});
    if(r.result?.type === 'exception') throw new Error(r.result.exceptionDetails.text);
    const {x, y} = JSON.parse(r.result.result.value);
    const a = await cmd('input.performActions', {context:ctx, actions:[{type:'pointer', id:'mouse', parameters:{pointerType:'mouse'}, actions:[{type:'pointerMove', x, y}, {type:'pointerDown', button:0}, {type:'pointerUp', button:0}]}]});
    if(a.type === 'error') throw new Error(a.message);
  }
  if(s.key){
    const r = await cmd('input.performActions', {context:ctx, actions:[{type:'key', id:'teclado', actions:[{type:'keyDown', value:s.key}, {type:'keyUp', value:s.key}]}]});
    if(r.type === 'error') throw new Error(r.message);
  }
  if(s.log){ const r = await cmd('script.evaluate', {target:{context:ctx}, expression:s.log, awaitPromise:true}); console.log('LOG', s.log.slice(0,50), '=>', JSON.stringify(r.result && (r.result.result ? r.result.result.value : r.result.exceptionDetails && r.result.exceptionDetails.text))); }
  if(s.shot){ const r = await cmd('browsingContext.captureScreenshot', {context:ctx}); writeFileSync(s.shot, Buffer.from(r.result.data, 'base64')); console.log('foto', s.shot); }
}
} finally { ws.close(); ff.kill(); }
