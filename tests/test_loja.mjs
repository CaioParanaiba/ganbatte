// Masadora (#135): faixas, pacotes, itens que saem e devolução dos retratos. node tests/test_loja.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ctx = {window:{}}; vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../web/motor.js', import.meta.url), 'utf8'), ctx);
const GB = ctx.window.GB, COS = GB.COS, item = id => COS.find(i => i.id === id);
const ok = nome => console.log('OK', nome);

// toda peça avulsa à venda tem faixa; pacote e peça exclusiva não têm
for(const it of COS){
  if(it.cat === 'full') assert.ok(!it.fa, it.id + ': pacote sem faixa');
  else if(it.excl || it.chefao || (GB.padrao(it) && it.cat !== 'chefe')) assert.ok(!it.fa, it.id + ': exclusiva ou vem com o jogo, sem faixa');
  else assert.ok(['comum','raro','epico','lenda'].includes(it.fa), it.id + ': faixa');
}
ok('faixa em cada item');
assert.equal(item('fx-shake').fa, 'raro'); assert.ok(item('fx-shake').hxh); assert.equal(item('fx-confete').fa, 'comum'); assert.equal(item('fx-drift').fa, 'raro'); assert.equal(item('fx-gyo').fa, 'epico');
assert.equal(item('px-map-tarde').fa, 'comum'); assert.ok(!item('tx-ceu').hxh && !item('fr-nen').hxh); assert.ok(item('fx-corrente').hxh);
ok('remanejamentos da vitrine');

assert.ok(!item('th-lenda'), 'tema sob encomenda saiu');
for(const id of ['fr-hunter','fr-carta','fr-escarlate','fr-giro','fr-aranha','fx-aura']) assert.ok(item(id).grupo, id + ' vai para o grupo');
assert.ok(!GB.padrao(item('fr-hunter')), 'item do grupo não vem com o jogo');
ok('itens que saem da Masadora');

const novos = COS.filter(i => i.prova);
assert.ok(novos.length >= 28, 'itens novos para provar');
for(const it of novos) assert.ok(!GB.padrao(it) && it.p === 0 && (it.eq || it.fx), it.id + ': só para provar, não vem com o jogo');   // efeito (fx) não tem eq
ok('itens novos só para provar');

for(const it of COS.filter(i => i.cat === 'chefe')) assert.ok(GB.padrao(it), it.id + ': retrato grátis');
for(const id of ['tt-godspeed','tt-floor','tt-ten','tt-estrela2','tt-mestre']) assert.ok(item(id).p === 0 && item(id).lock && !GB.padrao(item(id)), id + ': grátis ao liberar, com trava');
ok('retratos e títulos de conquista grátis');

// pacote: sem peças, o preço de hoje; com peças, desconta; a peça que saiu (antes) já vem descontada
const killua = item('th-killua'), asc = item('th-ascensao'), hisoka = item('th-hisoka');
assert.ok(!killua.parts.includes('fx-aura') && killua.antes.includes('fx-aura'));
assert.ok(GB.pacote(hisoka, new Set()).p === 8000, 'Hisoka sem peças: preço de hoje');
assert.ok(GB.pacote(killua, new Set()).p < 6000, 'Killua sem a Aura sai mais barato');
assert.ok(GB.pacote(asc, new Set()).p < 25000 && GB.pacote(asc, new Set()).p > 15000, 'Ascensão sem o Anel');
const p1 = GB.pacote(hisoka, new Set(['fx-shake']));
assert.ok(p1.p < 8000 && p1.tem === 1 && p1.n === 4 && !p1.completo, 'desconta a peça que já tem');
assert.ok(GB.pacote(hisoka, new Set(hisoka.parts)).completo, 'com todas as peças, completo');
assert.ok(GB.pacote(hisoka, new Set(['th-hisoka'])).completo, 'comprado, completo');
ok('preço do pacote');

// quem comprou o pacote antes continua com a peça que saiu; quem compra agora (compra com pacote:1) não ganha
assert.ok(GB.expandeOwn(new Set(['th-killua']), []).has('fx-aura'), 'compra antiga mantém a Aura');
assert.ok(!GB.expandeOwn(new Set(['th-killua']), [{tipo:'cos', id:'th-killua', j:5000, d:'2026-10-20', pacote:1}]).has('fx-aura'), 'compra nova não dá a Aura');
assert.ok(GB.expandeOwn(new Set(['th-killua']), []).has('fx-shim'), 'peças do pacote');
ok('peças que saíram do pacote');

// devolução dos retratos: só os retratos, uma vez, e fica gravada em acertos (o registro de compras perde as mais antigas)
const compras = [{d:'2026-10-14', tipo:'cos', id:'ch-hisoka', j:1500}, {d:'2026-10-14', tipo:'cos', id:'ch-feitan', j:1500},
  {d:'2026-10-14', tipo:'cos', id:'tt-floor', j:800}, {d:'2026-10-14', tipo:'premio', id:'premio', j:500}];
assert.equal(GB.retratosJ(compras), 3000);
const api = estado => ({hoje:'2026-10-15', todo:[], done:[], avaliacoes:'temporada | Teste | 2026-09-01 | 2026-12-01 | 2027-01-01', notas:'', jogador:{}, estado});
const base = {spent:4300, acertos:{'0.5.2':0, '0.6.4':0, recalculo:0}};   // já recalculado (#126): a carteira negativa do teste fica
const S = e => GB.estado(GB.carregar(api(e)));
const com = S({...base, compras}), sem = S({...base, compras:compras.slice(2)});
assert.equal(com.retJ, 3000); assert.equal(sem.retJ, 0);
assert.equal(com.jenny - sem.jenny, 3000, 'a carteira recebe os 3.000 J');
assert.equal(com.rec.acertos.retratos, 3000); assert.ok(com.rec.mudou, 'grava na primeira abertura');
const depois = S({...base, compras:[], acertos:{...com.rec.acertos}});
assert.equal(depois.jenny, com.jenny, 'gravada: o registro de compras encolher não tira a devolução');
assert.equal(S({...base, compras, acertos:{...com.rec.acertos}}).jenny, com.jenny, 'não devolve duas vezes');
assert.equal(com.acerto, sem.acerto, 'não entra na linha de acertos');
ok('devolução dos retratos');
