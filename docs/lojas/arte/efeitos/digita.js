/* fx-digita, Terminal vivo (raro, #134): ao trocar de aba, os títulos aparecem digitados de verdade, letra por letra, com o
   cursor em bloco do terminal. Hoje é um recorte em CSS de 0,75 s (passa rápido demais para ler como digitação); aqui cada
   letra entra no seu tempo, com o ritmo de quem digita: um tropeço de vez em quando, uma pausa depois do espaço e da
   pontuação, e o cursor fica piscando um instante no fim antes de sumir. Os títulos começam um depois do outro, de cima
   para baixo. Título longo digita mais depressa, para nenhum passar de ~1,6 s.
   Dois modos: 'digita' (a letra nasce na hora) e 'decifra' (o resto do título fica em símbolos que trocam até a letra
   certa assentar, como uma senha sendo quebrada).
   Só mexe nos nós de texto (ícones e tags dentro do título ficam), devolve o texto original se a aba trocar no meio, e
   não faz nada com prefers-reduced-motion.

   GB_DIGITA.aba(raiz, op) -> para()      digita os títulos visíveis dentro de raiz
     op.sel     os títulos (padrão 'h1,h2,h3')
     op.ms      tempo médio por letra (padrão 42)
     op.modo    'digita' | 'decifra'
     op.max     teto por título em ms (padrão 1600)
     op.forca   liga mesmo com prefers-reduced-motion */
(function(){
const calmo = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } };
const SIMB = '#%&@$/\\<>*+=?01';
const sorte = () => SIMB[Math.floor(Math.random() * SIMB.length)];

const CSS = `.gb-dg-cur{display:inline-block;width:.58em;height:1.05em;margin-left:1px;vertical-align:-.16em;background:var(--prompt,var(--acc,#7AA2F7));
  animation:gbDgPisca .9s steps(1) infinite}
.gb-dg-cur.dig{animation:none}
@keyframes gbDgPisca{50%{opacity:0}}`;
function estilo(){ if(document.getElementById('gb-digita-css')) return; const s = document.createElement('style'); s.id = 'gb-digita-css'; s.textContent = CSS; document.head.append(s); }

let ativo = null;
function aba(raiz, op0){
  const op = Object.assign({sel:'h1,h2,h3', ms:42, modo:'digita', max:1600, forca:false}, op0);
  if(ativo) ativo();
  if(calmo() && !op.forca) return () => {};
  estilo();
  const els = [...(raiz || document).querySelectorAll(op.sel)].filter(e => e.offsetParent !== null && e.textContent.trim() && !e.closest('[hidden]'));
  const tarefas = [], timers = [];
  let atraso = 0;
  for(const el of els){
    const nos = [], tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while(tw.nextNode()) if(tw.currentNode.nodeValue) nos.push({n: tw.currentNode, txt: tw.currentNode.nodeValue});
    const total = nos.reduce((s, x) => s + x.txt.length, 0); if(!total) continue;
    const ms = Math.min(op.ms, op.max / total);   // título longo digita mais depressa
    /* o tempo de cada letra: ritmo de quem digita (pausa no espaço e na pontuação, um tropeço de vez em quando) */
    const tempos = []; let t = 0;
    for(const x of nos) for(const ch of x.txt){
      t += ms * (.55 + Math.random() * .9) * (ch === ' ' ? 1.7 : /[.,:;!?·—]/.test(ch) ? 2.4 : 1) * (Math.random() < .05 ? 3 : 1);
      tempos.push(t);
    }
    const cur = document.createElement('span'); cur.className = 'gb-dg-cur dig'; cur.setAttribute('aria-hidden', 'true');
    const tarefa = {el, nos, tempos, cur, ini: atraso, fim: atraso + t, feito: false};
    tarefa.alt = el.style.minHeight; el.style.minHeight = el.offsetHeight + 'px';   // vazio, o título encolheria e a tela pularia
    for(const x of nos) x.n.nodeValue = '';
    tarefas.push(tarefa);
    atraso += Math.min(260, t * .35);   // o próximo título começa antes de este acabar
  }
  if(!tarefas.length) return () => {};
  const t0 = performance.now();
  let raf = 0;
  const passo = now => {
    const dt = now - t0; let vivos = 0;
    for(const k of tarefas){
      if(k.feito) continue; vivos++;
      if(dt < k.ini) continue;
      if(!k.cur.isConnected) k.el.append(k.cur);
      const q = dt - k.ini; let i = 0; while(i < k.tempos.length && k.tempos[i] <= q) i++;
      /* posição p do título: até i a letra certa; no modo decifra, as 6 seguintes em símbolos que trocam; o resto não apareceu */
      const ate = op.modo === 'decifra' ? Math.min(k.tempos.length, i + 6) : i;
      let a = 0;
      for(const x of k.nos){
        let s = '';
        for(let j = 0; j < x.txt.length && a + j < ate; j++) s += a + j < i || x.txt[j] === ' ' ? x.txt[j] : sorte();
        x.n.nodeValue = s; a += x.txt.length;
      }
      if(i >= k.tempos.length){
        k.feito = true; k.nos.forEach(x => { x.n.nodeValue = x.txt; }); k.el.style.minHeight = k.alt;
        k.cur.classList.remove('dig');   // terminou: o cursor pisca um instante e some
        const c = k.cur; timers.push(setTimeout(() => c.remove(), 1100));
      }
    }
    if(vivos) raf = requestAnimationFrame(passo); else ativo = null;
  };
  raf = requestAnimationFrame(passo);
  const para = () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); for(const k of tarefas){ k.nos.forEach(x => { x.n.nodeValue = x.txt; }); k.cur.remove(); k.el.style.minHeight = k.alt; } ativo = null; };
  ativo = para;
  return para;
}
window.GB_DIGITA = {aba, CSS};
})();
