#!/usr/bin/env python3
"""Ganbatte · servidor local do jogo. Só a biblioteca padrão do Python 3.8+ (Linux, Windows e Mac).

Uso:  python3 servidor.py [--porta 8642] [--dados PASTA] [--sem-navegador] [--instalar | --desinstalar]

Serve a página do jogo (web/) em http://127.0.0.1:PORTA/ e grava os dados do jogador numa pasta separada do código
(padrão ~/.ganbatte/, ou a variável GANBATTE_DADOS). Atualizar o código (git pull ou ZIP novo) nunca mexe nela:
  todo.txt, done.txt        tarefas no formato todo.txt (as concluídas de dias anteriores vão para o done.txt);
                            quem já tem um todo.txt em outra pasta usa --todo PASTA (ou GANBATTE_TODO) e o jogo lê e grava lá
  jogador.json              nome, tags, hábitos, disciplinas e Codeforces (o assistente da primeira entrada grava)
  avaliacoes.txt, notas.txt plano de avaliação das disciplinas e notas lançadas
  estado.json               loja, carteira, o que está equipado e os prêmios reais do jogador
  colecao/                  coleção permanente (#33): o que o jogador comprou, com uma cópia de cada item e da imagem dele;
                            só cresce, e nem a temporada nova nem uma versão nova do jogo mexem nela
  ajustes.txt, narradas.json caixa de entrada e cartas narradas (opcionais)
  conquistas.json           conquistas criadas pela IA (200 em diante) e o que foi resgatado
  planos/                   planos de ensino (PDF, HTML...) que a IA lê
  cf.json                   cache do Codeforces (problemas aceitos por dia e os marcados à mão)
  duo.json                  cache do Duolingo (a última ofensiva lida, os dias já creditados e desde quando está ligado)
  contrib.json              issues do jogador no GitHub fechadas como resolvidas (bug corrigido, ideia feita) e o dia em que o jogo as viu
  grupo.json, enviado.json  modo em grupo: os grupos (com o token) e o que já foi enviado a cada um; grupo/ guarda o último placar

Rotas (as mesmas que web/demo.js simula no modo demonstração):
  GET  /api/jogo                          tudo o que a página precisa
  GET  /api/backup                        ZIP da pasta de dados (botão "baixar meus dados" na aba Configurações)
  POST /api/act   {raw, action, value?, pri?}   done | reopen | delete | up | down | d1 | d7 | a1 | hoje | amanha | rmdue | setdate | edit
  POST /api/add   {text}                  linha no formato todo.txt; due:hoje|amanha|+N|DD/MM|AAAA-MM-DD
  POST /api/undo  {}                      desfaz a última operação deste servidor
  POST /api/reabre {raw, xp?}             reabre uma tarefa concluída que já está no done.txt (volta aberta para o todo.txt)
  POST /api/config {jogador, avaliacoes?} grava jogador.json (e avaliacoes.txt) e refaz os hábitos de hoje
  POST /api/ontem {id}                    "esqueci de marcar ontem": grava o hábito no done.txt como feito ontem
  POST /api/denovo {id}                   "fiz de novo": hábito semanal com a meta cumprida, feito mais uma vez hoje
  POST /api/autostart {ligar}             liga ou desliga o início junto com o computador
  POST /api/jogo/narrada {carta}         carta narrada colada da IA (aba Book) em narradas.json
  POST /api/jogo/planos {avaliacoes, notas} editor do chefão: grava os dois arquivos (o anterior fica em .bak)
  POST /api/jogo/nota {disc, aval, nota, parcial?} · /api/jogo/ajuste {texto} ou {quando, texto, aplicado} · /api/jogo/estado {estado}
  POST /api/colecao {itens}               guarda na coleção permanente os itens comprados que ainda não estão nela (#33)
  POST /api/cf/mao {menos?}               +1 problema do Codeforces hoje, marcado à mão (ITMO, grupo privado); menos = desfaz
  GET  /api/ia                            agentes de terminal achados, a escolha do jogador e os planos de ensino da pasta planos/
  POST /api/ia/config {agente?, cartas?}  liga a IA (claude | codex | gemini | agy) ou volta ao copiar e colar (chat)
  POST /api/ia/rodar {pedido, anexo?, leve?} roda o agente com o pedido da página → {id}; GET /api/ia/rodar?id= até ficar pronto
  POST /api/ia/plano {nome, base64}       guarda um plano de ensino em planos/
  POST /api/conquistas {acao, ...}        conquistas da IA: criar {itens} | resgatar {no, como, j|k} | descartar {no}
  GET  /api/atualizacao[?agora]           versão instalada e as mais novas publicadas no GitHub (confere a cada 6 h; ?agora = na hora)
  POST /api/atualizar {}                  baixa a versão nova (git pull ou ZIP do GitHub) e reinicia o servidor
  POST /api/canal {canal}                 troca entre a versão normal (main) e a de teste (beta), só em cópia git, e reinicia
  GET  /api/grupo                         modo em grupo: os grupos do jogador e o último placar de cada um (sem os tokens)
  POST /api/grupo/entrar {link}           entra com o link do convite (https://endereco/g/ID#CODIGO); sem o código, troca o
                                          endereço de um grupo em que já está (o grupo mudou de computador, #91)
  POST /api/grupo/sair {chave}            sai do grupo
  POST /api/grupo/sincronizar {resumo}    manda os dias que mudaram (motor.js → resumoGrupo) e traz o placar
  POST /api/grupo/vinculo {chave, habito, pessoal} liga um hábito pessoal a um hábito do catálogo do grupo ("" desliga)
  POST /api/grupo/frase {chave, texto}    a frase do líder da semana (#76), repassada ao servidor do grupo
  POST /api/grupo/admin {chave, acao, ...} ver | convite | cancelar | membro | config | habito | calibracao | placar | frase
  POST /api/grupo/host {acao, ...}        estado | servidor | funnel | criar {nome, endereco} | restaurar {banco, endereco} |
                                          mudar {endereco}: este computador como servidor do grupo
  GET  /api/grupo/copia                   cópia do banco do servidor do grupo desta máquina (só o dono)

Todo dia o servidor cria as recorrentes de hoje (um hábito por linha, rec:ID:DATA, e as do Codeforces e do Duolingo se ligados),
tira as que ficaram abertas de dias anteriores e conclui sozinho a do Codeforces quando a meta do dia é batida. Se a meta foi
batida num dia em que o jogo ficou fechado, o bônus é creditado depois, no done.txt (só a partir do dia em que o handle foi ligado).
O Duolingo (só o nome de usuário, perfil público, sem senha) conclui sozinho a rec:duo de cada dia com lição feita; os dias da
ofensiva desde o início da temporada entram no done.txt, e o dia salvo pelo bloqueio de ofensiva do Duolingo não conta. Os de
antes de ligar (duo.json → desde) ficam no heatmap e nas conquistas, sem XP nem Ten (o motor decide).

Iniciar com o computador (opcional): serviço do usuário no systemd (Linux; sem systemd, ~/.config/autostart), atalho .vbs na
pasta Inicializar (Windows) ou LaunchAgent (Mac). O servidor de segundo plano roda com --fundo e grava o log em servidor.log.
"""
import argparse
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
import zipfile
from datetime import date, timedelta
from io import BytesIO
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

VERSAO = "0.9.0-beta2"
VERSAO_NOME = "atualização da Torre Trick"   # nome da série 0.9 (aparece em Configurações → servidor)
REPO = Path(__file__).resolve().parent
WEB = REPO / "web"
DADOS = Path()   # definido em main()
TODO_DIR = Path()   # pasta do todo.txt e do done.txt: a de dados, ou a do --todo
APP = "ganbatte"   # nome no /api/ping, no User-Agent e no início automático
APP_ANTIGO = "hunter-todo"   # o nome até a 0.6.6-beta1 (#15): o servidor ainda reconhece e migra o que tinha esse nome


def env(nome):
    """A variável GANBATTE_NOME, ou a HUNTER_NOME de antes do #15 (aceita por um tempo)."""
    return os.environ.get("GANBATTE_" + nome) or os.environ.get("HUNTER_" + nome) or ""
lock = threading.RLock()
undo_stack = []


class Erro(Exception):
    def __init__(self, msg, code=400):
        super().__init__(msg)
        self.code = code


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)


# ---------- arquivos ----------
def caminho(nome):
    return (TODO_DIR if nome in ("todo.txt", "done.txt") else DADOS) / nome


def ler_txt(nome):
    f = caminho(nome)
    return f.read_text(encoding="utf-8") if f.exists() else ""


def gravar_txt(nome, texto):
    """Grava num .tmp e troca de uma vez: um corte de energia nunca deixa o arquivo pela metade."""
    f = caminho(nome)
    tmp = f.with_name(f.name + ".tmp")
    tmp.write_text(texto, encoding="utf-8")
    os.replace(tmp, f)


def ler_json(nome, padrao):
    try:
        v = json.loads(ler_txt(nome) or "null")
    except ValueError:
        log(f"{nome} inválido; usando o padrão")
        return padrao
    return padrao if v is None else v


def gravar_json(nome, obj):
    gravar_txt(nome, json.dumps(obj, ensure_ascii=False, indent=1) + "\n")


def ler(nome="todo.txt"):
    t = ler_txt(nome)
    linhas = t.replace("\r\n", "\n").split("\n")
    if linhas[-1] != "":
        linhas.append("")
    return linhas


def gravar(linhas, nome="todo.txt"):
    gravar_txt(nome, "\n".join(linhas))


def inserir(linhas, nova):
    """Acrescenta antes da linha vazia final do todo.txt."""
    if linhas and linhas[-1] == "":
        linhas.insert(len(linhas) - 1, nova)
    else:
        linhas.append(nova)


# ---------- regras do todo.txt (as mesmas do painel do autor) ----------
PRI = re.compile(r"^\(([A-Z])\) ")
DONE_RE = re.compile(r"^x (\d{4}-\d{2}-\d{2}) ")
DUE = re.compile(r"(?:(?<=\s)|^)due:(\d{4}-\d{2}-\d{2})(?=\s|$)")
REC = re.compile(r"(?:(?<=\s)|^)rec:([\w-]+):(\d{4}-\d{2}-\d{2})(?=\s|$)")
ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")
ORDEM = ["A", "B", "C", None]


def hoje():
    return date.today()


def parse_data(s):
    s = s.strip().lower()
    if s == "hoje":
        return hoje()
    if s in ("amanha", "amanhã"):
        return hoje() + timedelta(days=1)
    m = re.fullmatch(r"\+(\d{1,3})d?", s)
    if m:
        return hoje() + timedelta(days=int(m.group(1)))
    m = re.fullmatch(r"(\d{1,2})/(\d{1,2})(?:/(\d{2}|\d{4}))?", s)   # dd/mm[/aaaa], ou mm/dd[/aaaa] se o jogador escolheu
    if m:
        ano = m.group(3)
        dia, mes = (m.group(2), m.group(1)) if jogador().get("datas") == "mdy" else (m.group(1), m.group(2))
        try:
            d = date(int(ano if len(ano or "") == 4 else "20" + ano) if ano else hoje().year, int(mes), int(dia))
        except ValueError:
            return None
        return d if ano or d >= hoje() - timedelta(days=30) else d.replace(year=d.year + 1)
    if ISO.match(s):
        try:
            return date.fromisoformat(s)
        except ValueError:
            return None
    return None


def set_due(line, d):
    if d is None:
        return re.sub(r"\s+due:\d{4}-\d{2}-\d{2}(?=\s|$)", "", line, count=1)
    if DUE.search(line):
        return DUE.sub(f"due:{d.isoformat()}", line, count=1)
    return f"{line} due:{d.isoformat()}"


def set_pri(line, letra):
    base = PRI.sub("", line)
    return f"({letra}) {base}" if letra else base


def limpa(texto):
    texto = " ".join(str(texto).split())
    if not texto or len(texto) > 400 or any(ord(c) < 32 for c in texto):
        raise Erro("texto vazio ou inválido")
    return texto


def transformar(line, action, value=None):
    feita = bool(DONE_RE.match(line))
    if action == "done":
        if feita:
            raise Erro("a tarefa já está concluída")
        return f"x {hoje().isoformat()} {PRI.sub('', line)}"
    if action == "reopen":
        if not feita:
            raise Erro("a tarefa não está concluída")
        return DONE_RE.sub("", line, count=1)
    if feita:
        raise Erro("tarefa concluída: reabra antes de alterar")
    if action == "edit":
        m = re.match(r"^(\([A-Z]\) )?(\d{4}-\d{2}-\d{2} )?", line)
        return (m.group(1) or "") + (m.group(2) or "") + " ".join(normaliza_due(limpa(value or "").split()))
    if action in ("up", "down"):
        m = PRI.match(line)
        i = ORDEM.index(m.group(1)) if m and m.group(1) in ORDEM else len(ORDEM) - 1   # (D) em diante conta como sem prioridade
        j = i - 1 if action == "up" else i + 1
        if j < 0 or j >= len(ORDEM):
            raise Erro("prioridade já está no limite")
        return set_pri(line, ORDEM[j])
    m = DUE.search(line)
    base = date.fromisoformat(m.group(1)) if m else hoje()
    if action == "d1":
        return set_due(line, max(base, hoje()) + timedelta(days=1))
    if action == "d7":
        return set_due(line, base + timedelta(days=7))
    if action == "a1":
        return set_due(line, base - timedelta(days=1))
    if action == "hoje":
        return set_due(line, hoje())
    if action == "amanha":
        return set_due(line, hoje() + timedelta(days=1))
    if action == "rmdue":
        return set_due(line, None)
    if action == "setdate":
        d = parse_data(str(value or ""))
        if d is None:
            raise Erro("data inválida")
        return set_due(line, d)
    raise Erro("ação desconhecida")


def normaliza_due(palavras):
    """due:hoje, due:+3, due:09/10 ou due:09/10/2026 -> due:AAAA-MM-DD (no arquivo a data fica sempre no formato do todo.txt)."""
    out = []
    for w in palavras:
        d = re.fullmatch(r"due:(\S+)", w, re.I)
        if d:
            dt = parse_data(d.group(1))
            if dt is None:
                raise Erro(f"data inválida em {w}")
            w = f"due:{dt.isoformat()}"
        out.append(w)
    return out


def montar(texto):
    """Texto digitado -> linha do todo.txt (prioridade, data de criação, resto com due normalizado)."""
    texto = limpa(texto)
    m = re.match(r"^\(([A-Za-z])\)\s+", texto)
    pri = m.group(1).upper() if m else None
    if m:
        texto = texto[m.end():]
    palavras = normaliza_due(texto.split())
    if not palavras or palavras[0] == "x":
        raise Erro("texto vazio ou inválido")
    return (f"({pri}) " if pri else "") + hoje().isoformat() + " " + " ".join(palavras)


def operar(fn):
    """Roda fn(linhas) -> (antes, depois) sob o lock, grava e guarda para o desfazer."""
    with lock:
        linhas = ler()
        antes, depois = fn(linhas)
        gravar(linhas)
        undo_stack.append({"from": antes, "to": depois})
        del undo_stack[:-40]
        return {"ok": True, "from": antes, "to": depois, "undo": len(undo_stack)}


def achar(linhas, raw):
    if not isinstance(raw, str) or not raw.strip():
        raise Erro("linha ausente")
    if raw not in linhas:
        raise Erro("a linha mudou no todo.txt; recarregue a página", 409)
    return linhas.index(raw)


def api_act(d):
    def fn(linhas):
        i = achar(linhas, d.get("raw"))
        if d.get("action") == "delete":
            return linhas.pop(i), None
        nova = transformar(linhas[i], str(d.get("action")), d.get("value"))
        if d.get("action") == "edit" and "pri" in d:   # o editor completo da Lista troca a prioridade junto ("" = sem)
            letra = str(d.get("pri") or "").upper()
            if letra and not re.fullmatch(r"[A-Z]", letra):
                raise Erro("prioridade inválida")
            nova = set_pri(nova, letra or None)
        antes, linhas[i] = linhas[i], nova
        return antes, nova
    return operar(fn)


def api_reabre(d):
    """Reabre uma tarefa concluída que já foi para o done.txt (#27): a linha sai do done.txt e volta aberta para o todo.txt.
    Hábito, Codeforces e Duolingo (rec:) não: o servidor tira as recorrentes abertas de dias anteriores.
    xp = o XP que a tarefa deu: sai do XP gravado daquele dia (estado.json → xpDias, que de outro jeito só sobe), senão ela
    contaria duas vezes quando for feita de novo. Desfazer devolve a linha, e o motor regrava o dia."""
    raw = d.get("raw")
    if not isinstance(raw, str) or not DONE_RE.match(raw):
        raise Erro("linha ausente ou não concluída")
    if REC.search(raw):
        raise Erro("hábito de outro dia não se reabre")
    with lock:
        done = ler("done.txt")
        if raw not in done:
            raise Erro("a linha mudou no done.txt; recarregue a página", 409)
        nova = transformar(raw, "reopen")
        linhas = ler()
        done.remove(raw)
        inserir(linhas, nova)
        gravar(done, "done.txt")
        gravar(linhas)
        try:
            xp = max(0, int(d.get("xp") or 0))
        except (TypeError, ValueError):
            xp = 0
        est, dia = ler_json("estado.json", {}), DONE_RE.match(raw).group(1)
        xd = est.get("xpDias") if isinstance(est, dict) else None
        if xp and isinstance(xd, dict) and isinstance(xd.get(dia), (int, float)):
            xd[dia] = max(0, xd[dia] - xp)
            gravar_json("estado.json", est)
        undo_stack.append({"from": raw, "to": nova, "reabre": True})
        del undo_stack[:-40]
        return {"ok": True, "to": nova}


def api_add(d):
    def fn(linhas):
        nova = montar(d.get("text", ""))
        inserir(linhas, nova)
        return None, nova
    return operar(fn)


def api_undo(_):
    with lock:
        if not undo_stack:
            raise Erro("nada para desfazer")
        op = undo_stack[-1]
        if op.get("reabre"):   # reabrir do done.txt: a linha volta concluída para o done.txt
            linhas = ler()
            if op["to"] not in linhas:
                raise Erro("a linha mudou depois da operação; não deu para desfazer", 409)
            linhas.remove(op["to"])
            done = ler("done.txt")
            inserir(done, op["from"])
            gravar(linhas)
            gravar(done, "done.txt")
            undo_stack.pop()
            return {"ok": True, "undo": len(undo_stack)}
        arq = op.get("arq", "todo.txt")
        linhas = ler(arq)
        if op["to"] is None:   # desfaz uma exclusão: a linha volta para o fim do arquivo
            if op["from"] in linhas:
                raise Erro(f"a linha já existe no {arq}; não deu para desfazer", 409)
            inserir(linhas, op["from"])
        else:
            if op["to"] not in linhas:
                raise Erro("a linha mudou depois da operação; não deu para desfazer", 409)
            i = linhas.index(op["to"])
            if op["from"] is None:
                del linhas[i]
            else:
                linhas[i] = op["from"]
        undo_stack.pop()
        gravar(linhas, arq)
        return {"ok": True, "undo": len(undo_stack)}


# ---------- jogador e recorrentes do dia ----------
JOGADOR_PADRAO = {"configurado": False, "tags": {}, "habitos": [], "cf": None, "duo": None}
ID_HAB = re.compile(r"^[a-z0-9][a-z0-9-]{0,40}$")
HANDLE = re.compile(r"^[A-Za-z0-9_.-]{1,40}$")


def jogador():
    j = ler_json("jogador.json", None)
    return j if isinstance(j, dict) else dict(JOGADOR_PADRAO)


def tag_habito(j):
    t = str((j.get("tags") or {}).get("hab") or "").split()
    return t[0] if t and t[0][0] in "+@" else "+rotina"


def habitos(j):
    """Hábitos válidos do jogador. "semana": N (1 a 6) = N vezes por semana; sem ele, todo dia."""
    out = []
    for h in j.get("habitos") or []:
        if isinstance(h, dict) and ID_HAB.match(str(h.get("id", ""))) and str(h.get("n", "")).strip():
            try:
                n = int(h.get("semana") or 0)
            except (TypeError, ValueError):
                n = 0
            out.append({"id": h["id"], "n": h["n"], "semana": n if 1 <= n <= 6 else 0})
    return out


def cf_conf(j):
    cf = j.get("cf")
    if not isinstance(cf, dict) or not HANDLE.match(str(cf.get("handle", ""))):
        return None
    try:
        meta = min(6, max(1, int(cf.get("meta") or 3)))
    except (TypeError, ValueError):
        meta = 3
    return {"handle": cf["handle"], "meta": meta}


def duo_conf(j):
    duo = j.get("duo")
    if not isinstance(duo, dict) or not HANDLE.match(str(duo.get("usuario", ""))):
        return None
    return {"usuario": duo["usuario"]}


def linha_habito(h, tag, d):
    return f"{d} {limpa(h['n'])} {tag} rec:{h['id']}:{d}"


def linha_cf(cf, tag, d):
    return f"(A) {d} Codeforces {cf['meta']} questões {tag} rec:cf:{d}"


def linha_duo(tag, d):
    return f"{d} Duolingo {tag} rec:duo:{d}"


def recorrentes_do_dia(linhas, j, refazer=False, done=()):
    """Deixa o todo.txt com as recorrentes de hoje. Concluídas de dias anteriores vão para o done.txt e recorrentes que
    ficaram abertas de dias anteriores saem (hábito perdido não pune: só não conta). Com refazer=True (a configuração mudou),
    os hábitos de hoje são recriados com os nomes novos, e os que já estavam marcados continuam marcados.
    Hábito semanal (N vezes por semana, seg a dom) só aparece enquanto a meta da semana não foi cumprida.
    Devolve as linhas que vão para o done.txt; muda `linhas` no lugar."""
    d = hoje().isoformat()
    arquivo, manter = [], []
    for l in linhas:
        m, r = DONE_RE.match(l), REC.search(l)
        if m and m.group(1) < d:
            arquivo.append(l)
        elif not m and r and r.group(2) < d:
            continue
        else:
            manter.append(l)
    tag, cf, duo = tag_habito(j), cf_conf(j), duo_conf(j)
    habs = habitos(j)
    ids = {h["id"] for h in habs}
    feitos = set()
    if refazer:
        resto = []
        for l in manter:
            r = REC.search(l)
            if r and r.group(2) == d and (r.group(1) not in ("cf", "duo") or not DONE_RE.match(l)):
                if DONE_RE.match(l):
                    feitos.add(r.group(1))
                continue   # refeita abaixo; a do Codeforces e a do Duolingo abertas também (desligados ou meta nova)
            resto.append(l)
        manter = resto
    existentes = {(r.group(1)) for r in (REC.search(l) for l in manter) if r and r.group(2) == d}
    seg = (hoje() - timedelta(days=hoje().weekday())).isoformat()
    na_semana = {}   # vezes que cada hábito já foi feito nesta semana, antes de hoje (pelo dia do hábito, não pelo dia em que marcou)
    for l in list(done) + arquivo + manter:
        r = REC.search(l)
        if DONE_RE.match(l) and r and seg <= r.group(2) < d:
            na_semana[r.group(1)] = na_semana.get(r.group(1), 0) + 1
    for h in habs:
        if h["semana"] and na_semana.get(h["id"], 0) >= h["semana"] and h["id"] not in feitos:
            continue   # meta da semana cumprida
        if h["id"] not in existentes:
            nova = linha_habito(h, tag, d)
            inserir(manter, f"x {d} {nova}" if h["id"] in feitos else nova)
    if cf and "cf" not in existentes:
        inserir(manter, linha_cf(cf, tag, d))
    if duo and "duo" not in existentes:
        inserir(manter, linha_duo(tag, d))
    if not manter or manter[-1] != "":
        manter.append("")
    linhas[:] = manter
    return arquivo


def nome_rec(l):
    """O nome do hábito numa linha rec: o texto entre as datas (e a prioridade) e a primeira tag, rec: ou chave:valor."""
    ts = l.split()
    while ts and (ts[0] == "x" or re.fullmatch(r"\d{4}-\d{2}-\d{2}|\([A-Z]\)", ts[0])):
        ts.pop(0)
    nome = []
    for t in ts:
        if t[0] in "+@" or ":" in t:
            break
        nome.append(t)
    return " ".join(nome).casefold()


def religa_habitos(j, linhas, done):
    """Até a 0.6.5-beta1, salvar Configurações refazia o id de todo hábito pelo nome (h-nome): quem tinha outro id (de uma versão
    antiga, ou renomeado) ficava com o histórico preso no id velho, e o hábito voltava ao nível 1. Hábito sem dia feito antes do
    histórico de um id que nenhum hábito usa mais, com o mesmo nome, volta a usar esse id (jogador.json e as linhas rec: do id
    novo). Só com um candidato. Devolve True se mudou algo; muda j, linhas e done no lugar."""
    habs = habitos(j)
    usados, dias, nomes = {h["id"] for h in habs} | {"cf", "duo"}, {}, {}
    for l in done + linhas:
        r = REC.search(l)
        if r and DONE_RE.match(l):
            dias.setdefault(r.group(1), []).append(r.group(2))
            nomes.setdefault(r.group(1), set()).add(nome_rec(l))
    mudou = False
    for h in habs:
        nome, novos = " ".join(str(h["n"]).split()).casefold(), sorted(dias.get(h["id"], []))
        cands = [o for o in dias if o not in usados and nomes[o] == {nome} and (not novos or max(dias[o]) < novos[0])]
        if len(cands) != 1:
            continue
        velho, marca = cands[0], re.compile(rf"(?:(?<=\s)|^)rec:{re.escape(h['id'])}:(?=\d{{4}}-)")
        for ls in (linhas, done):
            ls[:] = [marca.sub(f"rec:{velho}:", l) for l in ls]
        for x in j.get("habitos") or []:
            if isinstance(x, dict) and x.get("id") == h["id"]:
                x["id"] = velho
        usados.add(velho)
        mudou = True
        log(f"hábito {h['n']}: voltou ao id {velho}, com o histórico ({len(dias[velho])} dias)")
    return mudou


def arruma_dia(refazer=False):
    with lock:
        linhas = ler()
        antes = list(linhas)
        j, done = jogador(), ler("done.txt")
        if religa_habitos(j, linhas, done):
            gravar_json("jogador.json", j)
            gravar(done, "done.txt")
        arquivo = recorrentes_do_dia(linhas, j, refazer, done)
        if arquivo:
            t = ler_txt("done.txt")
            gravar_txt("done.txt", t + ("" if not t or t.endswith("\n") else "\n") + "\n".join(arquivo) + "\n")
        if linhas != antes:
            gravar(linhas)
            if arquivo or refazer:
                undo_stack.clear()   # as linhas mudaram de lugar: desfazer antigo não vale mais


def api_ontem(d):
    """Botão "esqueci de marcar ontem": grava no done.txt o hábito como feito ontem (conta para ontem: XP, Ten e heatmap)."""
    ont = (hoje() - timedelta(days=1)).isoformat()
    j = jogador()
    h = next((h for h in habitos(j) if h["id"] == str(d.get("id", ""))), None)
    if not h:
        raise Erro("hábito não encontrado")
    marca = f"rec:{h['id']}:{ont}"
    with lock:
        arruma_dia()   # as linhas de ontem já estão no done.txt
        done = ler("done.txt")
        if any(marca in l.split() and DONE_RE.match(l) for l in done + ler()):
            raise Erro("esse hábito já está marcado ontem")
        nova = f"x {ont} {linha_habito(h, tag_habito(j), ont)}"
        inserir(done, nova)
        gravar(done, "done.txt")
        undo_stack.append({"from": None, "to": nova, "arq": "done.txt"})
        del undo_stack[:-40]
    return {"ok": True}


def api_denovo(d):
    """Botão "fiz de novo": hábito semanal com a meta da semana já cumprida (o servidor não criou a linha de hoje) feito
    mais uma vez hoje. Grava concluído no todo.txt; o motor conta as vezes acima da meta com XP em dobro."""
    hj = hoje().isoformat()
    j = jogador()
    h = next((h for h in habitos(j) if h["id"] == str(d.get("id", ""))), None)
    if not h or not h["semana"]:
        raise Erro("hábito semanal não encontrado")
    marca = f"rec:{h['id']}:{hj}"
    with lock:
        arruma_dia()
        linhas = ler()
        if any(marca in l.split() for l in linhas):
            raise Erro("esse hábito já está na Lista de hoje (uma vez por dia)")
        nova = f"x {hj} {linha_habito(h, tag_habito(j), hj)}"
        inserir(linhas, nova)
        gravar(linhas)
        undo_stack.append({"from": None, "to": nova})
        del undo_stack[:-40]
    return {"ok": True}


def api_config(d):
    j = d.get("jogador")
    if not isinstance(j, dict):
        raise Erro("jogador inválido")
    corpo = json.dumps(j, ensure_ascii=False)
    if len(corpo) > 20000:
        raise Erro("configuração grande demais", 413)
    av = d.get("avaliacoes")
    if av is not None and (not isinstance(av, str) or len(av) > 60000):
        raise Erro("avaliacoes inválido")
    with lock:
        if "ia" not in j and "ia" in jogador():   # a escolha da IA tem rota própria: o assistente não a apaga
            j["ia"] = jogador()["ia"]
        gravar_json("jogador.json", j)
        if av is not None:
            gravar_txt("avaliacoes.txt", av if av.endswith("\n") else av + "\n")
        arruma_dia(refazer=True)
    cf_vivo["t"] = duo_vivo["t"] = contrib_vivo["t"] = 0.0   # handle ou usuários podem ter mudado: consulta de novo na próxima leitura
    return {"ok": True}


# ---------- Codeforces ----------
cf_vivo = {"t": 0.0, "rodando": False}


def inicio_temporada():
    """Início da temporada (linha "temporada | 2026-2 | INÍCIO | fim | volta" do avaliacoes.txt; "?" = estimado).
    Sem a linha, os últimos seis meses."""
    for l in ler_txt("avaliacoes.txt").splitlines():
        p = [x.strip().replace("?", "") for x in l.split("|")]
        if len(p) > 2 and p[0].lower() == "temporada":
            try:
                return date.fromisoformat(p[2])
            except ValueError:
                break
    return hoje() - timedelta(days=183)


def cf_envios(handle, desde):
    """Envios do handle feitos desde o início da temporada. A API não filtra por data, mas devolve do mais novo para o
    mais velho: lê de 1000 em 1000 até passar do início (no máximo 10 páginas, com a pausa de 2 s que a API pede).
    Devolve (envios, completo): completo = chegou ao início da temporada; senão, os dias mais velhos ficaram de fora."""
    lim = time.mktime(desde.timetuple())
    envios = []
    for pg in range(10):
        if pg:
            time.sleep(2)
        url = "https://codeforces.com/api/user.status?" + urllib.parse.urlencode({"handle": handle, "from": 1 + pg * 1000, "count": 1000})
        req = urllib.request.Request(url, headers={"User-Agent": f"{APP}/{VERSAO}"})
        with urllib.request.urlopen(req, timeout=10) as r:
            j = json.load(r)
        if j.get("status") != "OK":
            raise ValueError(j.get("comment") or "resposta inesperada")
        envios += [s for s in j["result"] if s.get("creationTimeSeconds", 0) >= lim]
        if len(j["result"]) < 1000 or j["result"][-1].get("creationTimeSeconds", 0) < lim:
            return envios, True
    return envios, False


def cf_atualiza(cf):
    """Conta os problemas distintos aceitos por dia (pela data do 1º AC, no fuso desta máquina), só desde o início da
    temporada: o que veio antes não conta XP nem entra no heatmap. Roda numa thread."""
    try:
        ini = inicio_temporada()
        envios, completo = cf_envios(cf["handle"], ini)
        primeiro = {}
        for sub in reversed(envios):
            if sub.get("verdict") == "OK":
                k = (sub["problem"].get("contestId"), sub["problem"].get("index"))
                primeiro.setdefault(k, time.strftime("%Y-%m-%d", time.localtime(sub["creationTimeSeconds"])))
        conta = {}
        for dia in primeiro.values():
            conta[dia] = conta.get(dia, 0) + 1
        with lock:
            cache = ler_json("cf.json", {})
            if cache.get("handle") != cf["handle"] or not cache.get("desde"):   # handle novo: o bônus atrasado conta só daqui para a frente
                cache = {"desde": hoje().isoformat(), "creditados": []}
            if not completo and envios:   # mais de 10 mil envios: os dias antes da janela lida ficam como estavam (#1)
                corte = time.strftime("%Y-%m-%d", time.localtime(envios[-1]["creationTimeSeconds"]))
                for dia, n in (cache.get("por_dia") or {}).items():
                    if ini.isoformat() <= dia <= corte:   # o dia do corte foi lido pela metade
                        conta[dia] = max(conta.get(dia, 0), n)
            cache.update(handle=cf["handle"], por_dia=conta)
            gravar_json("cf.json", cache)
        conta = cf_soma(cache)
        cf_auto_conclui(cf, conta)
        cf_bonus_atrasado(cf, conta)
    except Exception as e:   # sem internet, handle errado ou API fora do ar: fica o que estava no cf.json
        log("codeforces:", e)
    finally:
        cf_vivo["t"] = time.time()
        cf_vivo["rodando"] = False


def cf_auto_conclui(cf, conta):
    """Meta do dia batida -> conclui sozinho a recorrente rec:cf:HOJE. Uma vez por dia: se reabrir à mão, não conclui de novo."""
    d = hoje().isoformat()
    if conta.get(d, 0) < cf["meta"]:
        return
    with lock:
        cache = ler_json("cf.json", {})
        if cache.get("auto") == d:
            return
        linhas = ler()
        for i, l in enumerate(linhas):
            if f"rec:cf:{d}" in l.split() and not DONE_RE.match(l):
                linhas[i] = transformar(l, "done")
                gravar(linhas)
                log(f"codeforces: meta do dia batida ({conta[d]}), recorrente concluída")
                break
        cache["auto"] = d
        cache["creditados"] = sorted(set(cache.get("creditados") or []) | {d})[-90:]
        gravar_json("cf.json", cache)


def cf_bonus_atrasado(cf, conta):
    """Dias anteriores em que a meta foi batida com o jogo fechado (a recorrente nem chegou a ser criada): grava no done.txt
    a recorrente do Codeforces concluída naquele dia, e o bônus da meta conta. Cada dia é creditado uma vez só."""
    d = hoje().isoformat()
    with lock:
        cache = ler_json("cf.json", {})
        feitos = set(cache.get("creditados") or [])
        dias = [x for x in sorted(conta) if cache.get("desde", d) <= x < d and conta[x] >= cf["meta"] and x not in feitos]
        if not dias:
            return
        done = ler("done.txt")
        ja = {r.group(2) for r in (REC.search(l) for l in done + ler() if DONE_RE.match(l)) if r and r.group(1) == "cf"}
        tag = tag_habito(jogador())
        for x in dias:
            if x not in ja:
                inserir(done, f"x {x} {PRI.sub('', linha_cf(cf, tag, x))}")
                log(f"codeforces: meta de {x} batida com o jogo fechado, bônus creditado")
            feitos.add(x)
        gravar(done, "done.txt")
        cache["creditados"] = sorted(feitos)[-90:]
        gravar_json("cf.json", cache)


def cf_soma(cache):
    """Problemas por dia: os que a API do Codeforces enxerga mais os marcados à mão (ITMO Academy, grupos privados)."""
    conta = dict(cache.get("por_dia") or {})
    for d, n in (cache.get("manual") or {}).items():
        conta[d] = conta.get(d, 0) + n
    return conta


def api_cf_mao(d):
    """Botão discreto "marcar à mão": +1 problema hoje (ou -1, para desfazer). Sem limite: vale a confiança do jogador.
    Conta igual aos da API, para a meta do dia e o XP."""
    cf = cf_conf(jogador())
    if not cf:
        raise Erro("ligue o Codeforces na aba Configurações primeiro")
    dia, passo = hoje().isoformat(), -1 if d.get("menos") else 1
    with lock:
        cache = ler_json("cf.json", {})
        if cache.get("handle") != cf["handle"]:
            raise Erro("o Codeforces ainda não foi consultado; tente de novo em alguns segundos", 409)
        manual = cache.get("manual") or {}
        manual[dia] = max(0, manual.get(dia, 0) + passo)
        cache["manual"] = {k: v for k, v in sorted(manual.items())[-400:] if v}
        gravar_json("cf.json", cache)
        conta = cf_soma(cache)
    cf_auto_conclui(cf, conta)
    return {"ok": True, "hoje": conta.get(dia, 0), "mao": cache["manual"].get(dia, 0)}


def cf_leitura(j):
    cf = cf_conf(j)
    if not cf:
        return None
    if time.time() - cf_vivo["t"] > 600 and not cf_vivo["rodando"]:
        cf_vivo["rodando"] = True
        threading.Thread(target=cf_atualiza, args=(cf,), daemon=True).start()
    cache = ler_json("cf.json", {})
    if cache.get("handle") != cf["handle"]:
        return {"handle": cf["handle"], "por_dia": {}, "manual": {}}
    return {"handle": cf["handle"], "por_dia": cf_soma(cache), "manual": cache.get("manual") or {}}


# ---------- Duolingo ----------
# Sem API oficial e sem senha: o perfil público (GET /2017-06-30/users?username=) dá a ofensiva atual (streakData:
# início, fim e tamanho). O tamanho só cresce em dia com lição feita; o dia salvo pelo bloqueio de ofensiva estica o fim
# sem aumentar o tamanho. Entre duas leituras, então, sobem exatamente tantos dias feitos quanto o tamanho cresceu.
# Com o jogo aberto todo dia isso é exato; se ficou fechado e houve bloqueio no meio, sabe-se quantos dias foram
# feitos, não quais: o jogo credita os mais recentes da janela.
duo_vivo = {"t": 0.0, "rodando": False}


def duo_perfil(usuario):
    url = "https://www.duolingo.com/2017-06-30/users?" + urllib.parse.urlencode({"username": usuario, "fields": "users{id,username,streak,streakData}"})
    req = urllib.request.Request(url, headers={"User-Agent": f"Mozilla/5.0 ({APP}/{VERSAO})"})
    with urllib.request.urlopen(req, timeout=10) as r:
        us = json.load(r).get("users") or []
    u = next((u for u in us if str(u.get("username", "")).lower() == usuario.lower()), None)
    if not u:
        raise ValueError(f"usuário {usuario} não encontrado no Duolingo")
    s = ((u.get("streakData") or {}).get("currentStreak")) or {}
    try:
        ini, fim, n = date.fromisoformat(s["startDate"]), date.fromisoformat(s["endDate"]), int(s["length"])
    except (KeyError, TypeError, ValueError):
        return None   # sem ofensiva agora
    return {"ini": ini.isoformat(), "fim": fim.isoformat(), "n": n} if n > 0 and ini <= fim else None


def duo_dias_novos(ult, of):
    """Dias com lição feita desde a leitura anterior. Mesma ofensiva: os dias depois do fim antigo, tantos quanto o tamanho
    cresceu. Ofensiva nova (ou a primeira leitura): a ofensiva inteira, tantos dias quanto o tamanho. Sempre os mais recentes."""
    if not of:
        return []
    fim = date.fromisoformat(of["fim"])
    if ult and ult.get("ini") == of["ini"] and ult.get("fim", "") <= of["fim"]:
        de, n = date.fromisoformat(ult["fim"]) + timedelta(days=1), of["n"] - int(ult.get("n") or 0)
    else:
        de, n = date.fromisoformat(of["ini"]), of["n"]
    janela = (fim - de).days + 1
    n = max(0, min(n, janela))
    return [(fim - timedelta(days=i)).isoformat() for i in range(n)]


def duo_atualiza(duo):
    """Lê a ofensiva e credita os dias feitos desde a leitura anterior, só desde o início da temporada: o dia de hoje conclui a
    rec:duo de hoje (uma vez por dia; reaberta à mão, não conclui de novo) e os anteriores vão concluídos para o done.txt.
    Roda numa thread."""
    try:
        of = duo_perfil(duo["usuario"])
        ini, d = inicio_temporada().isoformat(), hoje().isoformat()
        with lock:
            cache = ler_json("duo.json", {})
            if cache.get("usuario") != duo["usuario"]:   # usuário novo: a ofensiva inteira dele entra (na temporada)
                cache = {"usuario": duo["usuario"], "creditados": [], "desde": d}   # desde: os dias antes dele não dão XP (motor)
            feitos = set(cache.get("creditados") or [])
            novos = sorted(x for x in duo_dias_novos(cache.get("ult"), of) if ini <= x <= d and x not in feitos)
            if novos:
                linhas, done = ler(), ler("done.txt")
                ja = {r.group(2) for r in (REC.search(l) for l in done + linhas if DONE_RE.match(l)) if r and r.group(1) == "duo"}
                tag = tag_habito(jogador())
                passados = [x for x in novos if x < d and x not in ja]
                for x in passados:
                    inserir(done, f"x {x} {linha_duo(tag, x)}")
                if passados:
                    gravar(done, "done.txt")
                    log(f"duolingo: {len(passados)} dia(s) da ofensiva creditados ({passados[0]} a {passados[-1]})")
                if d in novos and d not in ja:
                    i = next((i for i, l in enumerate(linhas) if f"rec:duo:{d}" in l.split()), None)
                    if i is None:
                        inserir(linhas, f"x {d} {linha_duo(tag, d)}")
                    else:
                        linhas[i] = transformar(linhas[i], "done")
                    gravar(linhas)
                    log("duolingo: lição de hoje feita, recorrente concluída")
                feitos |= set(novos)
            cache.update(ult=of, ofensiva=of["n"] if of else 0, creditados=sorted(feitos)[-400:])
            gravar_json("duo.json", cache)
    except Exception as e:   # sem internet, usuário errado ou o Duolingo mudou a resposta: fica o que estava no duo.json
        log("duolingo:", e)
    finally:
        duo_vivo["t"] = time.time()
        duo_vivo["rodando"] = False


def duo_leitura(j):
    duo = duo_conf(j)
    if not duo:
        return None
    if time.time() - duo_vivo["t"] > 600 and not duo_vivo["rodando"]:
        duo_vivo["rodando"] = True
        threading.Thread(target=duo_atualiza, args=(duo,), daemon=True).start()
    cache = ler_json("duo.json", {})
    if cache.get("usuario") != duo["usuario"]:
        return {"usuario": duo["usuario"], "ofensiva": None}
    return {"usuario": duo["usuario"], "ofensiva": cache.get("ofensiva"), "desde": cache.get("desde"), "ini": (cache.get("ult") or {}).get("ini")}


# ---------- contribuições (#23) ----------
# Quem informa o usuário do GitHub em Configurações ganha XP e Jenny por bug ou ideia que abriu no repositório, mas só
# quando a issue é fechada como resolvida (state_reason "completed"). Repetida, recusada ("not planned"), dúvida ou com o
# label "sem recompensa" não conta: reportar qualquer coisa não rende nada. A conta (quanto vale cada tipo) fica no motor.
contrib_vivo = {"t": 0.0, "rodando": False}
DONO = "CaioParanaiba"   # quem desenvolve: as issues dele são anotações do desenvolvimento


def contrib_issues(usuario):
    q = f"repo:{DONO}/ganbatte is:issue author:{usuario} reason:completed"
    url = "https://api.github.com/search/issues?" + urllib.parse.urlencode({"q": q, "per_page": 100})
    req = urllib.request.Request(url, headers={"User-Agent": f"{APP}/{VERSAO}", "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        itens = json.load(r).get("items") or []
    out = {}
    for it in itens:
        if str((it.get("user") or {}).get("login", "")).lower() != usuario.lower() or it.get("state_reason") != "completed":
            continue
        labels = {str(l.get("name", "")).lower() for l in it.get("labels") or []}
        tipo = "bug" if "bug" in labels else "ideia" if "enhancement" in labels else None
        if tipo and "sem recompensa" not in labels:
            out[str(it["number"])] = {"tipo": tipo, "titulo": str(it.get("title", ""))[:120]}
    return out


def contrib_atualiza(usuario):
    """Confere as issues resolvidas (no máximo a cada 6 h). Cada uma ganha o dia em que o jogo a viu fechada pela primeira vez:
    o XP entra nesse dia, sem mexer nos dias passados. Roda numa thread."""
    try:
        achadas = contrib_issues(usuario)
        with lock:
            cache = ler_json("contrib.json", {})
            if cache.get("usuario") != usuario:
                cache = {"usuario": usuario, "issues": {}}
            iss = cache.get("issues") or {}
            for n, i in achadas.items():
                if n not in iss:
                    iss[n] = {**i, "dia": hoje().isoformat()}
                    log(f"contribuição: issue #{n} resolvida ({i['tipo']}), recompensa creditada")
            cache["issues"] = iss
            gravar_json("contrib.json", cache)
    except Exception as e:   # sem internet ou limite da API do GitHub: fica o que estava
        log("contribuições:", e)
    finally:
        contrib_vivo["t"] = time.time()
        contrib_vivo["rodando"] = False


def contrib_leitura(j):
    gh = j.get("github")
    usuario = str(gh.get("usuario", "")) if isinstance(gh, dict) else ""
    if not HANDLE.match(usuario) or usuario.lower() == DONO.lower():
        return None
    if time.time() - contrib_vivo["t"] > 6 * 3600 and not contrib_vivo["rodando"]:
        contrib_vivo["rodando"] = True
        threading.Thread(target=contrib_atualiza, args=(usuario,), daemon=True).start()
    cache = ler_json("contrib.json", {})
    if cache.get("usuario") != usuario:
        return {"usuario": usuario, "issues": []}
    return {"usuario": usuario, "issues": [{"n": int(n), **i} for n, i in sorted((cache.get("issues") or {}).items(), key=lambda x: int(x[0]))]}


# ---------- jogo: leitura e as três gravações ----------
NOME_AV = re.compile(r"^[A-Za-z0-9_.-]{1,80}$")
SIGLA = re.compile(r"^[A-Z0-9]{1,12}$")
CHAVE = re.compile(r"^[A-Za-z0-9]{1,8}$")


def avatares():
    """Fotos de perfil: o banco de web/a/ (o jogador não envia fotos; quem desenvolve põe PNG lá)."""
    return sorted(f.stem for f in (WEB / "a").glob("*.png") if NOME_AV.match(f.stem) and not f.stem.startswith("."))


def api_jogo_get():
    arruma_dia()
    j = jogador()
    cf, duo, contrib = cf_leitura(j), duo_leitura(j), contrib_leitura(j)
    narradas = ler_json("narradas.json", [])
    conquistas = ler_json("conquistas.json", [])
    estado = ler_json("estado.json", {})
    with lock:
        todo, done = ler(), ler_txt("done.txt").split("\n")
    return {"ok": True, "hoje": hoje().isoformat(), "todo": todo, "done": done, "avaliacoes": ler_txt("avaliacoes.txt"),
            "notas": ler_txt("notas.txt"), "ajustes": ler_txt("ajustes.txt"), "estado": estado if isinstance(estado, dict) else {},
            "cf": cf, "duo": duo, "contrib": contrib, "avatares": avatares(), "narradas": narradas if isinstance(narradas, list) else [], "jogador": j,
            "conquistas": conquistas if isinstance(conquistas, list) else [], "temporadas": temporadas(), "colecao": colecao(),
            "servidor": {"versao": VERSAO, "nome": VERSAO_NOME, "sistema": sistema(), "auto": auto_ligado(), "fundo": EXEC["fundo"], "dados": str(DADOS),
                         "canal": canal(), "metodo": metodo_atualizar()}}


def acrescenta(nome, linha):
    with lock:
        t = ler_txt(nome)
        gravar_txt(nome, t + ("" if not t or t.endswith("\n") else "\n") + linha + "\n")
    return {"ok": True}


def api_jogo_nota(d):
    disc, aval = str(d.get("disc", "")).upper(), str(d.get("aval", ""))
    try:
        nota = float(d.get("nota"))
    except (TypeError, ValueError):
        raise Erro("nota inválida")
    if not SIGLA.match(disc) or not CHAVE.match(aval) or not 0 <= nota <= 10:
        raise Erro("disciplina, avaliação ou nota inválida")
    txt = f"{nota:g}".replace(".", ",")
    return acrescenta("notas.txt", f"{hoje().isoformat()} | {disc} | {aval} | {txt}" + (" | parcial" if d.get("parcial") else ""))


def api_jogo_ajuste(d):
    if "quando" in d:   # marca um lembrete como aplicado (ou volta a pendente): acha a linha pela data/hora e pelo texto
        quando, texto, novo = str(d.get("quando", "")), str(d.get("texto", "")), "aplicado" if d.get("aplicado") else "pendente"
        with lock:
            linhas = ler_txt("ajustes.txt").split("\n")
            for i, l in enumerate(linhas):
                p = [x.strip() for x in l.split("|")]
                if not l.strip().startswith("#") and len(p) >= 3 and p[0] == quando and p[2] == texto:
                    p[1] = novo
                    linhas[i] = " | ".join(p)
                    gravar_txt("ajustes.txt", "\n".join(linhas))
                    return {"ok": True}
        raise Erro("lembrete não encontrado (o ajustes.txt mudou?)", 404)
    t = " ".join(str(d.get("texto", "")).split()).replace("|", "/")
    if not 1 <= len(t) <= 500:
        raise Erro("escreva de 1 a 500 caracteres")
    return acrescenta("ajustes.txt", f"{time.strftime('%Y-%m-%d %H:%M')} | pendente | {t}")


def api_jogo_planos(d):
    """Editor do chefão: grava o avaliacoes.txt e o notas.txt inteiros (a página só muda o bloco da disciplina editada).
    A versão anterior de cada um fica em .bak, para dar para voltar à mão."""
    novos = {}
    for chave, nome in (("avaliacoes", "avaliacoes.txt"), ("notas", "notas.txt")):
        t = d.get(chave)
        if t is None:
            continue
        if not isinstance(t, str) or len(t) > 60000:
            raise Erro(f"{nome} inválido")
        novos[nome] = t if t.endswith("\n") or not t else t + "\n"
    with lock:
        for nome, t in novos.items():
            if caminho(nome).exists():
                gravar_txt(nome + ".bak", ler_txt(nome))
            gravar_txt(nome, t)
    return {"ok": True}


ICONES = set("int tra con esp man emi spider tower card flame moon island crown scroll".split())
PERIODO = {"semana": re.compile(r"^\d{4}-W\d{2}$"), "mes": re.compile(r"^\d{4}-\d{2}$"), "semestre": re.compile(r"^\d{4}-[12]$"), "ano": re.compile(r"^\d{4}$")}


def api_jogo_narrada(d):
    """Carta narrada colada da IA (aba Book): acrescenta em narradas.json; a do mesmo período substitui a anterior."""
    c = d.get("carta")
    if not isinstance(c, dict):
        raise Erro("carta inválida")
    tipo, per = str(c.get("tipo", "")), str(c.get("periodo", ""))
    if tipo not in PERIODO or not PERIODO[tipo].match(per):
        raise Erro("tipo ou período inválido")
    campos = {k: " ".join(str(c.get(k) or "").replace("\r", "").split(" ")).strip() for k in ("titulo", "texto", "cronica")}
    if not campos["titulo"] or not campos["texto"]:
        raise Erro("a carta precisa de título e texto")
    if len(campos["titulo"]) > 120 or len(campos["texto"]) > 5000 or len(campos["cronica"]) > 8000:
        raise Erro("carta grande demais")
    carta = {"no": f"N-{per}", "tipo": tipo, "periodo": per, "escrita": hoje().isoformat(),
             "ic": c.get("ic") if c.get("ic") in ICONES else "scroll", **campos}
    with lock:
        lista = ler_json("narradas.json", [])
        lista = [x for x in (lista if isinstance(lista, list) else []) if not (isinstance(x, dict) and x.get("no") == carta["no"])] + [carta]
        gravar_json("narradas.json", lista)
    return {"ok": True, "no": carta["no"]}


COMPRAS_MAX = 3000   # compras guardadas no registro (as mais antigas saem primeiro)


def devolve_filtra(e):
    """Devolução (#51, devolucao() no motor.js): o que voltou para a loja não volta para o jogador quando uma aba antiga grava o
    estado. Comprado de novo depois da devolução (registro de compras), fica."""
    dv = e.get("devolve")
    if not isinstance(dv, dict):
        return
    quando = (str(dv.get("em", "")), str(dv.get("h", "")))
    de_novo = {c.get("id") for c in e.get("compras", []) if isinstance(c, dict) and (str(c.get("d", "")), str(c.get("h", ""))) > quando}
    tira = {x for x in dv.get("own") or [] if isinstance(x, str)} - de_novo
    if isinstance(e.get("own"), list):
        e["own"] = [x for x in e["own"] if x not in tira]
    sem, fe = dv.get("semana"), {x for x in dv.get("feiticos") or [] if isinstance(x, str)} - de_novo
    if isinstance(e.get("bought"), dict) and isinstance(e["bought"].get(sem), list):
        e["bought"][sem] = [k for k in e["bought"][sem] if k not in fe]


RECIBOS = ("notasJ", "furias", "acertos", "xpDias", "cacadas", "expedicoes", "travas")   # bônus de nota, fúria, acertos, XP dos dias fechados, caçadas, expedições e a imagem travada dos chefões derrotados (#33)


def api_jogo_estado(d):
    e = d.get("estado")
    if not isinstance(e, dict):
        raise Erro("estado inválido")
    ok = {"spent": (int, float), "cofreUsado": (int, float), "own": list, "resg": list, "bought": dict, "usados": dict, "usos": list,
          "equip": dict, "tour": dict, "premios": list, "cofreMes": (int, float), "visto": str,
          "notasJ": dict, "furias": dict, "acertos": dict, "xpDias": dict, "cacadas": dict, "expedicoes": dict, "compras": list,
          "migra": dict, "tenRec": (int, float), "devolve": dict, "travas": dict}   # acerto da 0.6.4 (web/motor.js: rec.migra, rec.tenRec) e a devolução (#51)
    for k, v in e.items():
        if k not in ok or not isinstance(v, ok[k]):
            raise Erro(f"campo inválido no estado: {k}")
    for x in e.get("premios", []):   # prêmios reais do jogador (Masadora → editar meus prêmios)
        if not (isinstance(x, dict) and isinstance(x.get("n"), str) and 0 < len(x["n"]) <= 80
                and all(isinstance(x.get(c, 0), (int, float)) and x.get(c, 0) >= 0 for c in ("p", "rs"))):
            raise Erro("prêmio inválido: precisa de nome (até 80 letras) e preço")
    if len(e.get("premios", [])) > 60 or e.get("cofreMes", 0) < 0:
        raise Erro("prêmios demais (máx. 60) ou cofre negativo")
    if not all(isinstance(v, str) and len(k) <= 60 and len(v) <= 60 for k, v in e.get("travas", {}).items()):   # "TEMPORADA:SIGLA": id do retrato ou "" (o ícone padrão)
        raise Erro("trava de chefão inválida")
    for c in e.get("compras", []):   # registro de compras (relatório de balanceamento): {d, h, tipo, id, j}
        if not (isinstance(c, dict) and re.fullmatch(r"\d{4}-\d\d-\d\d", str(c.get("d", ""))) and isinstance(c.get("h", ""), str)
                and c.get("tipo") in ("cos", "feitico", "premio") and isinstance(c.get("id"), str) and len(c["id"]) <= 60
                and isinstance(c.get("j"), (int, float)) and c["j"] >= 0):
            raise Erro("compra inválida no registro")
    with lock:
        antigo = ler_json("estado.json", {})
        for k in RECIBOS:   # recibos da carteira: uma aba antiga aberta não apaga o que outra já gravou
            if isinstance(antigo, dict) and isinstance(antigo.get(k), dict):
                e[k] = {**e.get(k, {}), **antigo[k]} if k == "travas" else {**antigo[k], **e.get(k, {})}   # trava de chefão: vale a primeira
                if k == "xpDias":   # XP de um dia fechado só sobe
                    e[k] = {d: max(v, antigo[k][d]) if isinstance(v, (int, float)) and isinstance(antigo[k].get(d), (int, float)) else v
                            for d, v in e[k].items()}
        if isinstance(antigo, dict) and isinstance(antigo.get("compras"), list):   # o registro de compras só cresce: junta o das duas abas
            ja = {json.dumps(c, sort_keys=True) for c in e.get("compras", [])}
            e["compras"] = sorted(e.get("compras", []) + [c for c in antigo["compras"] if json.dumps(c, sort_keys=True) not in ja],
                                  key=lambda c: (str(c.get("d", "")), str(c.get("h", ""))))
        if isinstance(antigo, dict) and isinstance(antigo.get("devolve"), dict):   # devolução (#51): vale a primeira
            e["devolve"] = antigo["devolve"]
        devolve_filtra(e)
        e["compras"] = e.get("compras", [])[-COMPRAS_MAX:]
        if not e["compras"]:
            del e["compras"]
        corpo = json.dumps(e, ensure_ascii=False, indent=1)
        if len(corpo) > 500000:
            raise Erro("estado grande demais", 413)
        gravar_txt("estado.json", corpo + "\n")
    return {"ok": True}


# ---------- temporadas guardadas (#7) ----------
# Quando a temporada acaba, a página calcula a cápsula (GB.capsula em web/motor.js: números finais congelados, chaves neutras
# e os nomes do tema) e o servidor grava temporadas/NOME/ com ela e uma cópia dos arquivos daquele momento.
NOME_TEMP = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$")
DIA = re.compile(r"^\d{4}-\d\d-\d\d$")
COPIAS_TEMP = ("avaliacoes.txt", "notas.txt", "done.txt", "narradas.json", "conquistas.json", "estado.json", "jogador.json")


def temporadas():
    """As temporadas guardadas: nome, até que dia os números vão e quando foi guardada."""
    out = []
    for f in sorted((DADOS / "temporadas").glob("*/resumo.json")):
        r = ler_json(f"temporadas/{f.parent.name}/resumo.json", {})
        if isinstance(r, dict):
            out.append({"nome": f.parent.name, "ate": str(r.get("ate", "")), "guardada": str(r.get("guardada", ""))})
    return out


def api_temporada(d):
    """Grava a cápsula. Uma foto parcial (guardada antes do fim) é trocada pela mais completa; a mais completa nunca é
    trocada por uma parcial (duas abas abertas, ou o relógio de um computador atrasado)."""
    r = d.get("resumo")
    if not isinstance(r, dict):
        raise Erro("resumo inválido")
    nome, ate = str(r.get("nome", "")), str(r.get("ate", ""))
    if not NOME_TEMP.match(nome) or not DIA.match(ate):
        raise Erro("nome ou data da temporada inválido")
    with lock:
        antigo = ler_json(f"temporadas/{nome}/resumo.json", {})
        if isinstance(antigo, dict) and str(antigo.get("ate", "")) > ate:
            return {"ok": True, "guardada": False}
        (DADOS / "temporadas" / nome).mkdir(parents=True, exist_ok=True)
        for arq in COPIAS_TEMP:
            if caminho(arq).is_file():
                gravar_txt(f"temporadas/{nome}/{arq}", ler_txt(arq))
        gravar_json(f"temporadas/{nome}/resumo.json", r)
    log(f"temporada {nome} guardada (números até {ate})")
    return {"ok": True, "guardada": True}


# ---------- coleção permanente (#33) ----------
# O que o jogador compra fica em colecao/ da pasta de dados, separado da loja: colecao.json com uma cópia de cada item (nome,
# categoria, como equipar, de onde veio e quando) e colecao/arquivos/ com a imagem dele (foto de perfil, retrato de chefão).
# Só acrescenta: nada aqui é apagado ou trocado. Assim, trocar de temporada, tirar um item da loja numa versão nova ou comprar
# na loja do grupo (origem "grupo", #43; a loja pública segue a mesma regra) não mexe no que já é do jogador. O estado.json
# continua com o own (compatibilidade). Rastreio: cada item tem um uid e um histórico (hist) que só cresce, com como ele chegou
# (compra, chefao = foto liberada ao derrotar um chefão, migracao = já era do jogador antes da coleção), de onde, a temporada e
# a Jenny. Ainda não há troca nem venda; o hist está pronto para receber esses eventos (ex.: trocado pelo grupo).
COLECAO_CATS = {"avatar", "pal", "tex", "fx", "frame", "title", "font", "som", "full", "px", "chefe"}
COLECAO_ORIGENS = {"masadora", "grupo"}
COLECAO_COMO = {"compra", "chefao", "migracao"}
COLECAO_CAMPOS = {"id": str, "cat": str, "n": str, "d": str, "p": (int, float), "origem": str, "quando": str, "img": str,
                  "eq": dict, "fx": str, "fxs": list, "parts": list, "skin": list, "ev": (bool, int), "sw": list,
                  "chefao": str, "como": str, "temporada": str}
COLECAO_MAX = 2000
ID_ITEM = re.compile(r"^[A-Za-z0-9_.-]{1,60}$")
IMG_ITEM = re.compile(r"^(a|chefoes)/([A-Za-z0-9_-][A-Za-z0-9_.-]{0,79})\.png$")


def colecao():
    c = ler_json("colecao/colecao.json", {})
    itens = c.get("itens") if isinstance(c, dict) else None
    return {"itens": itens if isinstance(itens, dict) else {}}


def colecao_item(x):
    """Confere um item mandado pela página e devolve só os campos conhecidos."""
    if not isinstance(x, dict) or not ID_ITEM.match(str(x.get("id", ""))) or x.get("cat") not in COLECAO_CATS:
        raise Erro("item inválido na coleção")
    it = {k: v for k, v in x.items() if k in COLECAO_CAMPOS and isinstance(v, COLECAO_CAMPOS[k])}
    if not 0 < len(it.get("n", "")) <= 80 or len(it.get("d", "")) > 300 or it.get("origem", "masadora") not in COLECAO_ORIGENS:
        raise Erro("item inválido na coleção: nome, descrição ou origem")
    if "quando" in it and not DIA.match(it["quando"]):
        raise Erro("item inválido na coleção: data")
    if it.get("como", "compra") not in COLECAO_COMO or len(it.get("temporada", "")) > 40:
        raise Erro("item inválido na coleção: como ou temporada")
    if "img" in it and not IMG_ITEM.match(it["img"]):
        del it["img"]
    if len(json.dumps(it, ensure_ascii=False)) > 3000:
        raise Erro("item grande demais na coleção")
    return it


def api_colecao(d):
    """Guarda na coleção os itens que ainda não estão nela, com a imagem copiada de web/. Quem já está fica como está."""
    itens = d.get("itens")
    if not isinstance(itens, list) or len(itens) > 400:
        raise Erro("lista de itens inválida")
    novos = [colecao_item(x) for x in itens]
    with lock:
        c = colecao()
        for it in novos:
            if it["id"] in c["itens"] or len(c["itens"]) >= COLECAO_MAX:
                continue
            it.setdefault("origem", "masadora")
            it.setdefault("quando", hoje().isoformat())
            it.setdefault("como", "compra")
            it["uid"] = os.urandom(6).hex()
            it["hist"] = [{k: it[k] for k in ("quando", "como", "origem", "temporada", "p") if k in it}]
            m = IMG_ITEM.match(it.get("img", ""))
            if m and (WEB / it["img"]).is_file():
                arq = f"{m.group(1)}-{m.group(2)}.png"
                (DADOS / "colecao" / "arquivos").mkdir(parents=True, exist_ok=True)
                if not (DADOS / "colecao" / "arquivos" / arq).is_file():
                    shutil.copyfile(WEB / it["img"], DADOS / "colecao" / "arquivos" / arq)
                it["arquivo"] = arq
            c["itens"][it["id"]] = it
        (DADOS / "colecao").mkdir(parents=True, exist_ok=True)
        gravar_json("colecao/colecao.json", c)
    return {"ok": True, "colecao": c}


CONQ_REGRAS = {"contagem", "sequencia", "nota", "constancia", "semana"}
CONQ_VAGAS = {"D": 4, "C": 3, "B": 2, "A": 1}   # abertas (não resgatadas) por rank: fácil, média, difícil, lendária (o mesmo do motor.js)
CONQ_MAX = sum(CONQ_VAGAS.values())
CONQ_RANKS = {"D", "C", "B", "A"}
CONQ_METAS = {"D": (7, 14, 2, 2, 8), "C": (14, 35, 4, 4, 9), "B": (30, 90, 6, 8, 9.5), "A": (60, 180, 8, 12, 10)}


def conq_alvo(c):
    if c.get("regra") == "contagem":
        return ("contagem", c.get("palavra", ""), c.get("disc", ""), c.get("tipo", ""), bool(c.get("prazo")))
    if c.get("regra") == "sequencia":
        return ("sequencia", c.get("hab"))
    if c.get("regra") == "nota":
        return ("nota", c.get("disc"))
    return (c.get("regra"),)


def conq_item(p):
    """Confere o formato de uma conquista criada pela IA (as regras de verdade e o rank são calculados pelo motor.js)."""
    if not isinstance(p, dict) or p.get("regra") not in CONQ_REGRAS:
        raise Erro("conquista com regra desconhecida")
    c = {"regra": p["regra"]}
    for k in ("n", "xp"):
        if k in p:
            if not isinstance(p[k], int) or not 1 <= p[k] <= 5000:
                raise Erro(f"número inválido na conquista: {k}")
            c[k] = p[k]
    for k in ("media", "nota"):
        if k in p:
            if not isinstance(p[k], (int, float)) or not 0 < p[k] <= 10:
                raise Erro(f"nota inválida na conquista: {k}")
            c[k] = p[k]
    for k, rx in (("palavra", r"^[^|\n]{2,30}$"), ("disc", r"^[A-Z0-9]{1,8}$"), ("tipo", r"^(ent|est|fac|tre|vid)$"), ("hab", r"^[\w-]{1,30}$"), ("aval", r"^[A-Za-z0-9]{1,8}$")):
        if p.get(k):
            if not isinstance(p[k], str) or not re.match(rx, p[k]):
                raise Erro(f"campo inválido na conquista: {k}")
            c[k] = p[k]
    if p.get("prazo") is True:
        c["prazo"] = True
    nome, texto = " ".join(str(p.get("nome", "")).split()), " ".join(str(p.get("texto", "")).split())
    if not 1 <= len(nome) <= 60 or len(texto) > 400:
        raise Erro("a conquista precisa de nome (até 60 letras) e texto de até 400")
    if p.get("rk") not in CONQ_RANKS:
        raise Erro("rank inválido")
    if "versao" in p:
        if type(p["versao"]) is not int or p["versao"] != 2:
            raise Erro("versão de conquista inválida")
        dias, tarefas, semanas, semanas_hab, nota = CONQ_METAS[p["rk"]]
        if c["regra"] == "contagem":
            if type(p.get("diasMin")) is not int or p["diasMin"] != dias or c.get("n", 0) < tarefas:
                raise Erro("meta de tarefas insuficiente para esse rank")
            c["diasMin"] = dias
            if not any(c.get(k) for k in ("palavra", "disc", "tipo", "prazo")):
                raise Erro("escolha pelo menos um filtro de tarefas")
        if c["regra"] in ("sequencia", "constancia"):
            habitos = ler_json("jogador.json", {}).get("habitos", [])
            semanal = c["regra"] == "sequencia" and any(h.get("id") == c.get("hab") and h.get("semana") for h in habitos)
            if type(c.get("n")) is not int or c["n"] < (semanas_hab if semanal else dias):
                raise Erro("sequência insuficiente para esse rank")
        if c["regra"] == "nota" and (c.get("nota") or c.get("media") or 0) < nota:
            raise Erro("nota insuficiente para esse rank")
        if c["regra"] == "semana":
            if type(p.get("semanas")) is not int or not semanas <= p["semanas"] <= 20:
                raise Erro("meta de semanas insuficiente para esse rank")
            c["semanas"] = p["semanas"]
        c["versao"] = 2
        c["inicio"] = (hoje() if c["regra"] == "nota" else hoje() + timedelta(days=1)).isoformat()
    return {**c, "nome": nome, "texto": texto, "ic": p.get("ic") if p.get("ic") in ICONES else "card", "rk": p["rk"],
            "temporada": str(p.get("temporada", ""))[:40]}


def api_conquistas(d):
    """Conquistas criadas pela IA (aba Book): {acao: criar, itens} · {acao: resgatar, no, como: jenny|feitico, j?, k?} · {acao: descartar, no}.
    Ficam em conquistas.json, numeradas de 200 em diante (o número de uma descartada não volta)."""
    acao = d.get("acao")
    with lock:
        lista = ler_json("conquistas.json", [])
        lista = [x for x in lista if isinstance(x, dict)] if isinstance(lista, list) else []
        abertas = [x for x in lista if not x.get("resgate") and not x.get("descartada")]
        if acao == "criar":
            itens = d.get("itens")
            if not isinstance(itens, list) or not 1 <= len(itens) <= CONQ_MAX:
                raise Erro("nenhuma conquista para criar")
            for rk, vagas in CONQ_VAGAS.items():
                if sum(x.get("rk") == rk for x in abertas) + sum(isinstance(p, dict) and p.get("rk") == rk for p in itens) > vagas:
                    raise Erro(f"no máximo {vagas} conquista(s) da IA de rank {rk} abertas: conquiste ou descarte alguma antes")
            prox = max([int(x["no"]) for x in lista if str(x.get("no", "")).isdigit()] + [199]) + 1
            novas = []
            for i, p in enumerate(itens):
                c = conq_item(p)
                if c.get("versao") == 2 and any(conq_alvo(x) == conq_alvo(c) for x in abertas + novas):
                    raise Erro("já existe uma conquista aberta para esse alvo")
                novas.append({"no": str(prox + i), **c, "criada": hoje().isoformat()})
            gravar_json("conquistas.json", lista + novas)
            return {"ok": True, "nos": [c["no"] for c in novas]}
        c = next((x for x in lista if x.get("no") == str(d.get("no", ""))), None)
        if not c:
            raise Erro("conquista não encontrada", 404)
        if c.get("resgate"):
            raise Erro("essa conquista já foi resgatada")
        if acao == "descartar":
            c["descartada"] = hoje().isoformat()
        elif acao == "resgatar":
            como = d.get("como")
            if como == "jenny" and isinstance(d.get("j"), int) and 0 < d["j"] <= 20000:
                c["resgate"] = {"como": "jenny", "j": d["j"], "em": hoje().isoformat()}
            elif como == "feitico" and isinstance(d.get("k"), str) and re.match(r"^[a-z]{2,10}$", d["k"]):
                c["resgate"] = {"como": "feitico", "k": d["k"], "em": hoje().isoformat()}
            else:
                raise Erro("recompensa inválida")
        else:
            raise Erro("ação desconhecida")
        gravar_json("conquistas.json", lista)
    return {"ok": True}


# ---------- atualização: confere no GitHub se há versão nova e, se o jogador pedir, atualiza ----------
GITHUB = "https://github.com/CaioParanaiba/ganbatte"
RAW = env("RAW")   # GANBATTE_RAW: outro endereço, para testar; vazio = a branch do canal


CANAIS = ("main", "beta")   # estável e versões de teste
ANTIGOS = {"grupo": "beta"}   # canal que acabou → o que a cópia passa a seguir (a grupo entrou na beta na 0.9.0-beta2)


def branch_atual():
    """A branch atual de uma cópia git; "" no ZIP ou se o git falhar."""
    if metodo_atualizar() == "git":
        try:
            r = subprocess.run(["git", "-C", str(REPO), "rev-parse", "--abbrev-ref", "HEAD"], capture_output=True, text=True, timeout=10)
            return r.stdout.strip()
        except (OSError, subprocess.SubprocessError):
            pass
    return ""


def canal():
    """Branch que esta cópia segue: a branch atual, se for um dos CANAIS (ou um dos ANTIGOS, que segue o novo); senão (ZIP, outra branch) "main"."""
    b = branch_atual()
    return b if b in CANAIS else ANTIGOS.get(b, "main")
ATUAL = {"quando": 0.0, "remota": None, "erro": ""}
atual_lock = threading.Lock()


def vtupla(v):
    """"0.5.8-beta2" → (0, 5, 8, 0, 2): toda beta vem antes da versão normal de mesmo número, e a beta2 depois da beta1."""
    m = re.match(r"\s*(\d+)\.(\d+)(?:\.(\d+))?(?:-beta(\d+))?", str(v))
    if not m:
        return (0,)
    return (int(m[1]), int(m[2]), int(m[3] or 0)) + ((0, int(m[4])) if m[4] else (1, 0))


def novidades_de(texto):
    """A lista de versões do web/novidades.js: o JSON entre /*NOVIDADES*/ e /*FIM*/."""
    i, j = texto.find("/*NOVIDADES*/"), texto.find("/*FIM*/")
    lista = json.loads(texto[i + len("/*NOVIDADES*/"):j]) if 0 <= i < j else []
    return [x for x in lista if isinstance(x, dict) and x.get("versao")]


def confere_github(forcar=False):
    """Lê o novidades.js da versão publicada, no máximo uma vez a cada 6 horas (ou na hora, se o jogador pedir)."""
    with atual_lock:
        if not forcar and time.time() - ATUAL["quando"] < 6 * 3600:
            return
        try:
            with urllib.request.urlopen(urllib.request.Request((RAW or f"https://raw.githubusercontent.com/CaioParanaiba/ganbatte/{canal()}/") + "web/novidades.js", headers={"User-Agent": APP + "/" + VERSAO}), timeout=8) as r:
                ATUAL.update(remota=novidades_de(r.read(400_000).decode("utf-8")), erro="")
        except urllib.error.HTTPError as e:   # 404: a versão publicada ainda não tem o novidades.js (é anterior à 0.5)
            ATUAL.update(remota=[], erro="" if e.code == 404 else "o GitHub não respondeu direito")
        except (OSError, ValueError) as e:
            ATUAL["erro"] = "não consegui falar com o GitHub (sem internet?)"
            log("conferir atualização:", repr(e))
        ATUAL["quando"] = time.time()


def metodo_atualizar():
    return "git" if (REPO / ".git").is_dir() and shutil.which("git") else "zip"


def api_atualizacao_get(forcar):
    confere_github(forcar)
    novas = [x for x in (ATUAL["remota"] or []) if vtupla(x["versao"]) > vtupla(VERSAO)]
    return {"ok": True, "versao": VERSAO, "nome": VERSAO_NOME, "canal": canal(), "novas": novas, "erro": ATUAL["erro"], "metodo": metodo_atualizar(),
            "conferido": time.strftime("%Y-%m-%d %H:%M", time.localtime(ATUAL["quando"])) if ATUAL["quando"] else ""}


def baixa_zip():
    """Sem git: baixa o ZIP da versão publicada e copia os arquivos por cima do código (os dados ficam em outra pasta)."""
    with urllib.request.urlopen(urllib.request.Request(GITHUB + "/archive/refs/heads/main.zip", headers={"User-Agent": APP + "/" + VERSAO}), timeout=60) as r:
        corpo = r.read(60_000_000)
    with zipfile.ZipFile(BytesIO(corpo)) as z:
        nomes = [n for n in z.namelist() if not n.endswith("/")]
        raiz = nomes[0].split("/", 1)[0] + "/" if nomes else ""
        if "servidor.py" not in {n[len(raiz):] for n in nomes}:
            raise Erro("o arquivo baixado não é o jogo")
        for n in nomes:
            rel = Path(n[len(raiz):])
            if not n.startswith(raiz) or rel.is_absolute() or ".." in rel.parts:
                continue
            destino = REPO / rel
            destino.parent.mkdir(parents=True, exist_ok=True)
            tmp = destino.with_name(destino.name + ".novo")
            tmp.write_bytes(z.read(n))
            os.replace(tmp, destino)


def api_atualizar(_):
    if ia_lock.locked():
        raise Erro("a IA está trabalhando num pedido: espere terminar e tente de novo")
    if branch_atual() in ANTIGOS:   # a branch dela acabou: troca para a que segue agora (mesma conta do trocar canal)
        troca_branch(canal())
    elif metodo_atualizar() == "git":
        # sem terminal: o git não pode parar pedindo senha; e o servidor sobe sem o agente SSH,
        # então se o remoto for SSH e falhar, puxa a mesma branch pelo HTTPS público
        env = {**os.environ, "GIT_TERMINAL_PROMPT": "0", "GIT_SSH_COMMAND": "ssh -o BatchMode=yes"}
        try:
            r = subprocess.run(["git", "-C", str(REPO), "pull", "--ff-only"], capture_output=True, text=True, timeout=120, env=env)
            if r.returncode != 0:
                r = subprocess.run(["git", "-C", str(REPO), "pull", "--ff-only", GITHUB + ".git", canal()], capture_output=True, text=True, timeout=120, env=env)
        except (OSError, subprocess.SubprocessError) as e:
            raise Erro(f"o git não rodou ({e})")
        if r.returncode != 0:
            ult = (r.stderr or r.stdout).strip().splitlines()
            raise Erro("o git não conseguiu atualizar" + (f" ({ult[-1]})" if ult else "") + ". Rode o instalador de novo.")
    else:
        try:
            baixa_zip()
        except (OSError, zipfile.BadZipFile) as e:
            raise Erro(f"não consegui baixar a versão nova ({e})")
    log("jogo atualizado pela página: reiniciando")
    def reinicia():
        EXEC["recarregar"] = True
        EXEC["srv"].shutdown()
    threading.Timer(1.0, reinicia).start()
    return {"ok": True}


def troca_branch(alvo):
    """Troca a cópia git para a branch alvo (buscando no GitHub antes), só andando para a frente."""
    env = {**os.environ, "GIT_TERMINAL_PROMPT": "0", "GIT_SSH_COMMAND": "ssh -o BatchMode=yes"}
    def git(*args, tempo=30):
        try:
            return subprocess.run(["git", "-C", str(REPO), *args], capture_output=True, text=True, timeout=tempo, env=env)
        except (OSError, subprocess.SubprocessError) as e:
            raise Erro(f"o git não rodou ({e})")
    if git("status", "--porcelain", "--untracked-files=no").stdout.strip():
        raise Erro("há arquivos do jogo mudados à mão nesta pasta; o git não troca de canal por cima deles")
    # mesma ideia do atualizar: se o remoto for SSH e falhar sem o agente, busca pelo HTTPS público
    r = git("fetch", "origin", f"+refs/heads/{alvo}:refs/remotes/origin/{alvo}", tempo=120)
    if r.returncode != 0:
        r = git("fetch", GITHUB + ".git", f"+refs/heads/{alvo}:refs/remotes/origin/{alvo}", tempo=120)
    if r.returncode == 0:
        tem = git("rev-parse", "--verify", "--quiet", f"refs/heads/{alvo}").returncode == 0
        # a branch local precisa só andar para a frente; confere antes de trocar, para não parar no meio
        if tem and git("merge-base", "--is-ancestor", alvo, f"origin/{alvo}").returncode != 0:
            raise Erro(f"a cópia local da {alvo} tem mudanças que o GitHub não tem; troque pelo terminal (git switch {alvo})")
        r = git("switch", alvo) if tem else git("switch", "-c", alvo, "--track", f"origin/{alvo}")
        if r.returncode == 0 and tem:
            r = git("merge", "--ff-only", f"origin/{alvo}")
    if r.returncode != 0:
        ult = (r.stderr or r.stdout).strip().splitlines()
        raise Erro("o git não conseguiu trocar de canal" + (f" ({ult[-1]})" if ult else ""))
    with atual_lock:
        ATUAL.update(quando=0.0, remota=None, erro="")   # o próximo aviso de versão nova confere o canal novo


def api_canal(d):
    """Versões de teste: troca a cópia git para outro dos CANAIS (main, beta) e reinicia com o código dela."""
    alvo = d.get("canal")
    if alvo not in CANAIS:
        raise Erro("canal deve ser " + ", ".join(CANAIS))
    if metodo_atualizar() != "git":
        raise Erro("só dá para trocar de canal num jogo instalado com git; o instalado pelo ZIP fica na versão normal")
    if ia_lock.locked():
        raise Erro("a IA está trabalhando num pedido: espere terminar e tente de novo")
    if branch_atual() == alvo:
        return {"ok": True, "igual": True}
    troca_branch(alvo)
    log(f"canal trocado para {alvo} pela página: reiniciando")
    def reinicia():
        EXEC["recarregar"] = True
        EXEC["srv"].shutdown()
    threading.Timer(1.0, reinicia).start()
    return {"ok": True}


def backup():
    """ZIP com tudo o que está na pasta de dados (menos o log do servidor), para guardar ou levar para outro computador."""
    buf = BytesIO()
    with lock, zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(DADOS.rglob("*")):
            if f.is_file() and f.name != "servidor.log":
                z.write(f, f.relative_to(DADOS).as_posix())
        if TODO_DIR != DADOS:   # todo.txt em outra pasta (--todo): vai junto no ZIP
            for nome in ("todo.txt", "done.txt"):
                if caminho(nome).is_file():
                    z.write(caminho(nome), nome)
    return buf.getvalue()


# ---------- IA integrada (opcional): o jogo chama o agente de terminal do jogador e só lê o texto que ele devolve ----------
# A página monta o pedido (web/ia.js, o mesmo do modo chat) e confere a resposta; o agente roda sem poder gravar nada,
# numa pasta temporária com o pedido e o anexo. Ligar e escolher o agente: aba Configurações (jogador.json → "ia").
AGENTES = {
    "claude": {"nome": "Claude Code", "login": "claude   (na primeira vez ele pede o login)"},
    "codex": {"nome": "Codex", "login": "codex login"},
    "gemini": {"nome": "Gemini CLI", "login": "gemini   (na primeira vez ele pede o login)"},
    "agy": {"nome": "Antigravity CLI", "login": "agy   (na primeira vez ele pede o login)"},
}
PEDIDO_ARQ = ".pedido.txt"   # o agy não lê a entrada padrão: o pedido vai num arquivo da pasta temporária
IA_TEMPO = 600   # segundos por pedido
PLANO_EXT = {".pdf", ".html", ".htm", ".txt", ".md", ".docx"}
NOME_PLANO = re.compile(r"^[\w .()\-]{1,80}$")
ia_tarefas = {}   # id → {"estado": rodando|pronto|erro, "texto", "erro", "ini", "seg"}
ia_lock = threading.Lock()   # um pedido por vez


def caminhos_extra():
    """Pastas onde os instaladores costumam pôr os agentes. O serviço de início automático roda com um PATH curto."""
    h = Path.home()
    extra = [h / ".local" / "bin", h / ".npm-global" / "bin", h / ".bun" / "bin", h / ".volta" / "bin", h / ".cargo" / "bin",
             h / ".local" / "share" / "pnpm", h / ".yarn" / "bin", h / "bin", Path("/usr/local/bin"), Path("/opt/homebrew/bin"),
             Path("/home/linuxbrew/.linuxbrew/bin"), Path("/snap/bin"), Path("/usr/bin")]
    if sistema() == "windows":
        extra.append(Path(os.environ.get("APPDATA") or h / "AppData" / "Roaming") / "npm")
    extra += sorted((h / ".nvm" / "versions" / "node").glob("*/bin"), reverse=True)
    extra += sorted((h / ".local" / "share" / "fnm" / "node-versions").glob("*/installation/bin"), reverse=True)
    return [str(p) for p in extra if p.is_dir()]


_path_shell = {}


def path_shell():
    """PATH do terminal do usuário (lido uma vez): o serviço do início automático não carrega o .bashrc/.zshrc, onde o
    nvm, o npm e outros instaladores costumam pôr os agentes."""
    if "v" not in _path_shell:
        _path_shell["v"] = ""
        sh = os.environ.get("SHELL") or "/bin/sh"
        if sistema() != "windows" and Path(sh).exists():
            for flags in ("-lic", "-lc"):
                try:
                    r = subprocess.run([sh, flags, "echo __P__$PATH"], capture_output=True, text=True, timeout=8, stdin=subprocess.DEVNULL)
                    m = re.search(r"__P__(\S+)", r.stdout or "")
                    if m:
                        _path_shell["v"] = m.group(1)
                        break
                except (OSError, subprocess.SubprocessError):
                    pass
    return _path_shell["v"]


def path_agentes():
    return os.pathsep.join(p for p in [os.environ.get("PATH", ""), path_shell()] + caminhos_extra() if p)


def acha_agente(ag):
    import shutil
    return shutil.which(ag, path=path_agentes())


def ia_conf(j=None):
    c = (j or jogador()).get("ia")
    c = c if isinstance(c, dict) else {}
    ag = c.get("agente") if c.get("agente") in AGENTES else "chat"
    return {"agente": ag, "desde": str(c.get("desde") or ""), "cartas": c.get("cartas", True) is not False}


def planos():
    p = DADOS / "planos"
    return sorted(f.name for f in p.iterdir() if f.is_file() and f.suffix.lower() in PLANO_EXT) if p.is_dir() else []


def api_ia_get():
    return {"ok": True, "conf": ia_conf(), "planos": planos(), "pasta": str(DADOS / "planos"),
            "agentes": [{"id": k, "nome": v["nome"], "login": v["login"], "achado": bool(acha_agente(k))} for k, v in AGENTES.items()]}


def api_ia_config(d):
    """Escolhe o agente (ou "chat" = copiar e colar) e liga/desliga as cartas automáticas. "desde" marca o dia em que a IA
    foi ligada: as cartas automáticas começam nos períodos fechados a partir dele (as antigas, só pelo botão)."""
    ag = d.get("agente", None)
    with lock:
        j = jogador()
        c = ia_conf(j)
        if ag is not None:
            if ag != "chat" and ag not in AGENTES:
                raise Erro("agente desconhecido")
            if ag != "chat" and not c["desde"]:
                c["desde"] = hoje().isoformat()
            c["agente"] = ag
        if "cartas" in d:
            c["cartas"] = bool(d["cartas"])
        j["ia"] = c
        gravar_json("jogador.json", j)
    return {"ok": True, "conf": c}


def comando_agente(ag, exe, pasta, saida, leve=False):
    """Linha de comando de cada agente, sem permissão de escrita. O pedido vai pela entrada padrão (no agy, em PEDIDO_ARQ).
    leve: pedido pequeno (tipo de uma tarefa), com o modelo mais barato e rápido de cada um (no agy, o modelo de sempre:
    os nomes dele mudam a cada versão e um nome velho faz o pedido falhar)."""
    if ag == "claude":
        return [exe, "-p", "--tools", "Read", "--permission-mode", "dontAsk", "--no-session-persistence", "--strict-mcp-config"] + (["--model", "haiku"] if leve else [])
    if ag == "codex":
        return [exe, "exec", "--sandbox", "read-only", "--skip-git-repo-check", "--color", "never", "--cd", pasta, "--output-last-message", saida]\
            + (["-c", 'model_reasoning_effort="low"'] if leve else []) + ["-"]
    if ag == "agy":   # --mode plan: só lê (sem ele, o agy grava arquivos na pasta)
        return [exe, "--mode", "plan", "-p", f"O pedido está no arquivo {PEDIDO_ARQ}, na pasta {pasta}. Leia-o inteiro e responda "
                "seguindo as regras dele. Não rode comandos nem crie arquivos."]
    return [exe, "-p", "Responda ao pedido acima, seguindo as regras dele."] + (["-m", "gemini-2.5-flash"] if leve else [])


def explica_erro(ag, saida):
    tudo = " ".join(saida.split())
    s = tudo[-400:]
    if re.search(r"no longer supported|IneligibleTier|migrate to the Antigravity", tudo, re.I):   # vem antes do rastro de erro
        return ("O Google não aceita mais o Gemini CLI com conta pessoal gratuita. Instale o Antigravity CLI (agy), entre na "
                "conta rodando agy no terminal e escolha-o aqui em Configurações → IA.")
    if re.search(r"not running in a trusted directory", tudo, re.I):
        return ("O Gemini CLI recusou a pasta temporária do jogo (pasta não confiável). Atualize o Gemini CLI "
                "(npm install -g @google/gemini-cli) e tente de novo. Mensagem: " + s)
    if re.search(r"headless mode cannot prompt|denied_actions", tudo, re.I):
        return f"O {AGENTES[ag]['nome']} tentou usar uma ferramenta sem permissão e parou sem responder. Tente de novo."
    if re.search(r"log ?in|logged|auth|credential|api key|401|403|unauthorized", s, re.I):
        return f"Parece que falta entrar na conta do {AGENTES[ag]['nome']}. Rode no terminal: {AGENTES[ag]['login']}. Mensagem: {s}"
    return s or "o agente terminou sem responder"


def ia_executa(tid, ag, exe, pedido, anexos, leve):
    import tempfile
    t = ia_tarefas[tid]
    try:
        with tempfile.TemporaryDirectory(prefix="ganbatte-ia-") as pasta:
            if anexos:
                import shutil
                for a in anexos:
                    shutil.copy2(DADOS / "planos" / a, Path(pasta) / a)
                pedido += "\n\n" + (f"O arquivo {anexos[0]} está na pasta atual: leia-o." if len(anexos) == 1
                                     else "Os arquivos estão na pasta atual: " + ", ".join(anexos) + ". Leia-os.")
            saida = str(Path(pasta) / ".resposta.txt")
            if ag == "agy":
                Path(pasta, PEDIDO_ARQ).write_text(pedido, encoding="utf-8")
                pedido = ""
            # GEMINI_CLI_TRUST_WORKSPACE: o Gemini CLI só roda sem perguntar em pasta confiável, e a temporária é nova a cada pedido
            env = dict(os.environ, PATH=os.pathsep.join([str(Path(exe).parent), path_agentes()]), GEMINI_CLI_TRUST_WORKSPACE="true")
            r = subprocess.run(comando_agente(ag, exe, pasta, saida, leve), input=pedido, capture_output=True, text=True, encoding="utf-8",
                               errors="replace", cwd=pasta, env=env, timeout=IA_TEMPO)
            texto = Path(saida).read_text(encoding="utf-8") if ag == "codex" and Path(saida).exists() else r.stdout
            if r.returncode != 0 or not texto.strip():
                raise Erro(explica_erro(ag, (r.stderr or "") + " " + (r.stdout or "")))
            t.update(estado="pronto", texto=texto.strip())
    except subprocess.TimeoutExpired:
        t.update(estado="erro", erro=f"o agente passou de {IA_TEMPO // 60} minutos sem responder")
    except (Erro, OSError) as e:
        t.update(estado="erro", erro=str(e))
    finally:
        t["seg"] = round(time.time() - t["ini"])
        ia_lock.release()
        log("ia:", ag, t["estado"], f"{t['seg']}s")


def api_ia_rodar(d):
    """{pedido, anexo?: "arquivo" | ["arquivos"] da pasta planos/, leve?: true para um pedido pequeno}"""
    pedido, anexos = d.get("pedido"), d.get("anexo") or []
    anexos = [anexos] if isinstance(anexos, str) else anexos
    if not isinstance(pedido, str) or not 1 <= len(pedido) <= 200000:
        raise Erro("pedido inválido")
    if not isinstance(anexos, list) or len(anexos) > 30 or any(a not in planos() for a in anexos):
        raise Erro("arquivo do plano não encontrado na pasta planos")
    ag = ia_conf()["agente"]
    if ag == "chat":
        raise Erro("a IA não está ligada (aba Configurações → IA)")
    exe = acha_agente(ag)
    if not exe:
        raise Erro(f"não achei o {AGENTES[ag]['nome']} neste computador")
    if not ia_lock.acquire(blocking=False):
        raise Erro("a IA já está trabalhando num pedido; espere ele terminar", 409)
    tid = str(int(time.time() * 1000))
    for velho in sorted(ia_tarefas)[:-20]:
        del ia_tarefas[velho]
    ia_tarefas[tid] = {"estado": "rodando", "texto": "", "erro": "", "ini": time.time(), "seg": 0, "agente": ag}
    threading.Thread(target=ia_executa, args=(tid, ag, exe, pedido, anexos, bool(d.get("leve"))), daemon=True).start()
    return {"ok": True, "id": tid}


def api_ia_tarefa(tid):
    t = ia_tarefas.get(tid)
    if not t:
        raise Erro("pedido não encontrado (o servidor reiniciou?)", 404)
    seg = t["seg"] if t["estado"] != "rodando" else round(time.time() - t["ini"])
    return {"ok": True, "estado": t["estado"], "texto": t["texto"], "erro": t["erro"], "seg": seg}


def api_ia_plano(d):
    """Recebe um plano de ensino escolhido na página e guarda em DADOS/planos (também dá para pôr o arquivo lá à mão)."""
    import base64
    nome = Path(str(d.get("nome", ""))).name.strip()
    if not NOME_PLANO.match(nome) or Path(nome).suffix.lower() not in PLANO_EXT or nome.startswith("."):
        raise Erro("nome de arquivo inválido (use PDF, HTML, DOCX, TXT ou MD)")
    try:
        corpo = base64.b64decode(str(d.get("base64", "")), validate=True)
    except ValueError:
        raise Erro("arquivo inválido")
    if not corpo or len(corpo) > 15_000_000:
        raise Erro("arquivo vazio ou maior que 15 MB")
    p = DADOS / "planos"
    p.mkdir(exist_ok=True)
    (p / nome).write_bytes(corpo)
    return {"ok": True, "nome": nome, "planos": planos()}


# ---------- modo em grupo (0.9, #38–#40): o jogo conversa com o servidor do grupo (grupo/servidor_grupo.py) ----------
# A página calcula o resumo dos dias (motor.js → resumoGrupo: só números e os hábitos do grupo) e este servidor manda ao do
# grupo só os dias novos ou que mudaram. O token fica aqui, nunca na página. Na pasta de dados (só acrescenta):
#   grupo.json    lista dos grupos em que o jogador está: {url, id, nome, membro, token, admin, publico?, entrou, vinculos?}
#                 vinculos = {hábito do grupo: id do hábito pessoal} (#41): o nome do pessoal nunca sai daqui
#   enviado.json  {"url|id": {dia: assinatura}}: o que já chegou ao servidor (o resto vai na próxima sincronização)
#   grupo/        o último placar de cada grupo, para a aba continuar mostrando quando o servidor está fora do ar
GRUPO_PORTA = 8643
GRUPO_APP = "ganbatte-grupo"
PROTOCOLO_GRUPO = 1
LINK_GRUPO = re.compile(r"^(https?://[^/\s#?]+)/g/([a-z0-9][a-z0-9-]{1,30})/?#([A-Za-z0-9]{6,12})$")
LINK_NOVO = re.compile(r"^(https?://[^/\s#?]+)/g/([a-z0-9][a-z0-9-]{1,30})/?$")   # o grupo mudou de computador (#91): o link sem código
ENDERECO_GRUPO = re.compile(r"^https?://[^/\s#?]+$")


class GrupoFora(Erro):
    """O servidor do grupo não respondeu (sem internet, Funnel desligado, notebook do host dormindo)."""


class GrupoMudou(Erro):
    """O grupo foi para outro computador (#91): o servidor antigo responde 410 com o endereço novo."""
    def __init__(self, msg, para):
        super().__init__(msg, 410)
        self.para = para


def grupo_pasta_servidor():
    return Path(env("GRUPO_DADOS") or Path.home() / ".ganbatte-grupo")


def grupo_local():
    return f"http://127.0.0.1:{int(env('GRUPO_PORTA') or GRUPO_PORTA)}"


def grupo_pede(url, metodo, rota, corpo=None, token="", tempo=15, bruto=False, arquivo=None):
    h = {"User-Agent": f"{APP}/{VERSAO}", "Content-Type": "application/octet-stream" if arquivo is not None else "application/json"}
    if token:
        h["Authorization"] = "Bearer " + token
    dados = arquivo if arquivo is not None else None if corpo is None else json.dumps(corpo).encode()
    req = urllib.request.Request(url.rstrip("/") + rota, data=dados, method=metodo, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=tempo) as r:
            return r.read() if bruto else json.load(r)
    except urllib.error.HTTPError as e:
        try:
            j = json.load(e)
            msg = j.get("error") or ""
        except ValueError:
            j, msg = {}, ""
        if e.code == 410 and ENDERECO_GRUPO.match(str(j.get("mudou") or "")):
            raise GrupoMudou(msg, j["mudou"])
        if not msg or e.code in (502, 503, 504):   # o túnel respondeu, mas o servidor do grupo atrás dele não
            raise GrupoFora(f"o servidor do grupo não respondeu ({e.code})", 502)
        raise Erro(msg, e.code if e.code in (401, 403, 404, 409, 426, 429) else 400)
    except (urllib.error.URLError, OSError, ValueError) as e:
        raise GrupoFora(f"o servidor do grupo está fora do ar ({getattr(e, 'reason', e)})", 502)


def grupos():
    g = ler_json("grupo.json", [])
    return [x for x in g if isinstance(x, dict) and x.get("url") and x.get("id")] if isinstance(g, list) else []


def chave_grupo(g):
    return f"{g['url']}|{g['id']}"


def arquivo_placar(g):
    return DADOS / "grupo" / (re.sub(r"[^a-z0-9]+", "-", g["url"].lower().split("//", 1)[-1]).strip("-") + "--" + g["id"] + ".json")


def grupo_da(chave):
    g = next((x for x in grupos() if chave_grupo(x) == chave), None)
    if not g:
        raise Erro("grupo não encontrado neste jogo")
    return g


def muda_grupo(g, novo):
    """Passa o grupo g para o endereço novo (#91), depois de conferir que o servidor de lá conhece o seu token. A chave muda
    junto, então o enviado.json começa do zero para ela e a próxima sincronização manda a temporada inteira ao servidor novo."""
    novo = novo.rstrip("/")
    for _ in range(3):   # mudou duas vezes seguidas: segue o aviso do servidor do meio
        try:
            p = grupo_pede(novo, "GET", f"/g/{g['id']}/placar", token=g["token"])
            break
        except GrupoMudou as e:
            novo = e.para.rstrip("/")
        except GrupoFora:
            raise GrupoFora(f"o grupo mudou para {novo}, que ainda não respondeu", 502)
        except Erro as e:
            if e.code in (401, 403, 404):
                raise Erro(f"o servidor novo ({novo}) não reconhece o seu acesso a este grupo: peça um reconvite a um admin", e.code)
            raise
    else:
        raise Erro("o grupo mudou de servidor várias vezes seguidas; peça o link novo a um admin")
    with lock:
        lista = grupos()
        for x in lista:
            if chave_grupo(x) == chave_grupo(g):
                x["url"] = novo
                x.pop("publico", None)
                x["nome"] = p.get("grupo", {}).get("nome") or x.get("nome")
                novo_g = x
        gravar_json("grupo.json", lista)
        env_ = ler_json("enviado.json", {})
        env_.pop(chave_grupo(g), None)
        gravar_json("enviado.json", env_)
    velho = arquivo_placar(g)
    if velho.exists():
        velho.unlink()
    p["recebido"] = time.time()
    f = arquivo_placar(novo_g)
    f.parent.mkdir(exist_ok=True)
    f.write_text(json.dumps(p, ensure_ascii=False), encoding="utf-8")
    log(f"grupo {g['id']} mudou de servidor: {novo}")
    return novo_g


def pede_g(g, metodo, rota, corpo=None):
    """grupo_pede com o token do grupo g, seguindo o aviso de mudança de computador (g é atualizado no lugar)."""
    try:
        return grupo_pede(g["url"], metodo, rota, corpo, g["token"], tempo=30)
    except GrupoMudou as e:
        g.update(muda_grupo(g, e.para))
        return grupo_pede(g["url"], metodo, rota, corpo, g["token"], tempo=30)


def api_grupo_get():
    lista = []
    for g in grupos():
        p = ler_json_arquivo(arquivo_placar(g))
        lista.append({"chave": chave_grupo(g), "id": g["id"], "nome": g.get("nome") or g["id"], "admin": bool(g.get("admin")),
                      "convite": (g.get("publico") or g["url"]).rstrip("/") + f"/g/{g['id']}", "placar": p, "vinculos": vinculos_de(g)})
    return {"ok": True, "grupos": lista, "host": (grupo_pasta_servidor() / "dono.token").is_file()}


def ler_json_arquivo(f):
    try:
        return json.loads(f.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def entra_grupo(url, gid, codigo, nome, avatar, publico=""):
    r = grupo_pede(url, "POST", f"/g/{gid}/entrar", {"codigo": codigo, "nome": nome, "avatar": avatar})
    with lock:
        lista = [x for x in grupos() if not (x["url"] == url and x["id"] == gid)]
        novo = {"url": url, "id": gid, "nome": r["grupo"]["nome"], "membro": r["membro"], "token": r["token"], "admin": r["admin"],
                "entrou": hoje().isoformat()}
        if publico:
            novo["publico"] = publico
        gravar_json("grupo.json", lista + [novo])
        env_ = ler_json("enviado.json", {})
        env_.pop(f"{url}|{gid}", None)   # perfil novo ou reconvite: manda a temporada inteira de novo
        gravar_json("enviado.json", env_)
    return {"ok": True, "chave": f"{url}|{gid}", "nome": r["grupo"]["nome"], "admin": r["admin"]}


def nome_publico(d):
    j = jogador()
    nome = " ".join(str(d.get("nome") or j.get("nick") or j.get("nome") or "").split())[:40]
    if not nome:
        raise Erro("escreva o seu nome no jogo (Configurações) antes de entrar num grupo")
    av = str(d.get("avatar") or "")
    return nome, (av if NOME_AV.match(av) and (WEB / "a" / f"{av}.png").is_file() else "")


def api_grupo_entrar(d):
    """{link: https://endereco/g/ID#CODIGO, nome?, avatar?}: o link do convite, colado em Configurações → grupo."""
    link = str(d.get("link", "")).strip()
    n = LINK_NOVO.match(link)
    if n:
        return novo_endereco(n.group(1), n.group(2))
    m = LINK_GRUPO.match(link)
    if not m:
        raise Erro("link de convite inválido: copie o link inteiro, do https:// até o código depois do #")
    nome, av = nome_publico(d)
    url, publico = m.group(1), ""
    if ping_grupo() and url.split("//", 1)[1].split(":")[0] == tailscale_nome():
        url, publico = grupo_local(), url   # convite do servidor desta máquina: fala com ele direto, sem dar a volta pela internet
    return entra_grupo(url, m.group(2), m.group(3).upper(), nome, av, publico)


def novo_endereco(url, gid):
    """O link do grupo sem código (#91): o servidor do grupo foi para outro computador e o aviso não chegou a este jogo (a
    máquina antiga já não liga). Troca o endereço e mantém o perfil, se o servidor novo conhece o token."""
    meus = [x for x in grupos() if x["id"] == gid]
    if not meus:
        raise Erro("esse link é de um grupo em que você não está: falta o código do convite depois do #")
    if ping_grupo() and url.split("//", 1)[1].split(":")[0] == tailscale_nome():
        url = grupo_local()   # o servidor novo é esta máquina
    g = next((x for x in meus if x["url"] != url), meus[0])
    novo = muda_grupo(g, url)
    return {"ok": True, "chave": chave_grupo(novo), "nome": novo.get("nome") or gid, "admin": bool(novo.get("admin")), "mudou": True}


def api_grupo_sair(d):
    g = grupo_da(d.get("chave"))
    try:
        pede_g(g, "POST", f"/g/{g['id']}/sair", {})
    except Erro as e:
        if not isinstance(e, GrupoFora) and e.code != 401:
            raise   # ex.: o único admin precisa passar o poder antes
    with lock:
        gravar_json("grupo.json", [x for x in grupos() if chave_grupo(x) != chave_grupo(g)])
        env_ = ler_json("enviado.json", {})
        env_.pop(chave_grupo(g), None)
        gravar_json("enviado.json", env_)
    f = arquivo_placar(g)
    if f.exists():
        f.unlink()
    return {"ok": True}


def vinculos_de(g):
    v = g.get("vinculos")
    return {k: p for k, p in v.items() if isinstance(p, str) and p} if isinstance(v, dict) else {}


def envio_do_grupo(x, cat, vinc):
    """Um dia do resumo como este grupo o recebe (#41): o Codeforces se está no catálogo e, de cada hábito de vínculo, 1 se o
    pessoal ligado a ele foi feito no dia. O `pes` (os ids dos hábitos pessoais) fica aqui."""
    hab, pes, out = x.get("hab") or {}, x.get("pes") or {}, {}
    for h in cat:
        if h.get("fonte") == "automatico":
            if h["id"] in hab:
                out[h["id"]] = hab[h["id"]]
        elif vinc.get(h["id"]):
            out[h["id"]] = 1 if pes.get(vinc[h["id"]]) else 0
    return {**{k: v for k, v in x.items() if k != "pes"}, "hab": out}


def assinatura(dia):
    return hashlib.sha1(json.dumps(dia, sort_keys=True).encode()).hexdigest()[:16]


def api_grupo_sincronizar(d):
    """{resumo} (motor.js → resumoGrupo): manda a cada grupo os dias novos ou que mudaram e traz o placar. Fora do ar, o
    placar guardado volta com offline; o que não foi fica para a próxima (enviado.json só marca o que o servidor recebeu)."""
    r = d.get("resumo") or {}
    dias = r.get("dias")
    if not isinstance(dias, list):
        raise Erro("resumo inválido")
    out = {}
    for g in grupos():
        k = chave_grupo(g)
        try:
            try:
                out[k] = sincroniza_grupo(g, dias)
            except GrupoMudou as e:
                out.pop(k, None)
                g = muda_grupo(g, e.para)
                k = chave_grupo(g)
                out[k] = dict(sincroniza_grupo(g, dias), mudou=True)
        except GrupoFora as e:
            out[k] = {"placar": ler_json_arquivo(arquivo_placar(g)), "offline": True, "erro": str(e)}
        except Erro as e:
            out[k] = {"placar": ler_json_arquivo(arquivo_placar(g)), "erro": str(e), "sem_acesso": e.code == 401}
    return {"ok": True, "grupos": out}


def sincroniza_grupo(g, dias):
    """Um grupo da sincronização: manda os dias novos ou que mudaram e traz o placar."""
    k = chave_grupo(g)
    with lock:
        feito = ler_json("enviado.json", {}).get(k, {})
    p = ler_json_arquivo(arquivo_placar(g))
    if not p or "habitos" not in p:   # sem o catálogo ainda (grupo novo ou placar da 0.9.0-beta1): busca antes
        p = grupo_pede(g["url"], "GET", f"/g/{g['id']}/placar", token=g["token"])
    cat, vinc = p.get("habitos") or [], vinculos_de(g)
    dias_g = [envio_do_grupo(x, cat, vinc) for x in dias if isinstance(x, dict)]
    novos = [x for x in dias_g if feito.get(x.get("dia")) != assinatura(x)]
    for i in range(0, len(novos), 400):
        parte = novos[i:i + 400]
        grupo_pede(g["url"], "POST", f"/g/{g['id']}/envio", {"protocolo": PROTOCOLO_GRUPO, "dias": parte}, g["token"], tempo=30)
        with lock:
            env_ = ler_json("enviado.json", {})
            env_.setdefault(k, {}).update({x["dia"]: assinatura(x) for x in parte})
            gravar_json("enviado.json", env_)
    p = grupo_pede(g["url"], "GET", f"/g/{g['id']}/placar", token=g["token"])
    p["recebido"] = time.time()
    f = arquivo_placar(g)
    f.parent.mkdir(exist_ok=True)
    f.write_text(json.dumps(p, ensure_ascii=False), encoding="utf-8")
    if p.get("voce", {}).get("admin") != g.get("admin") or p.get("grupo", {}).get("nome") != g.get("nome"):
        with lock:
            lista = grupos()
            for x in lista:
                if chave_grupo(x) == k:
                    x.update(admin=p["voce"]["admin"], nome=p["grupo"]["nome"])
            gravar_json("grupo.json", lista)
    return {"placar": p, "enviados": len(novos)}


def api_grupo_vinculo(d):
    """{chave, habito, pessoal}: liga um hábito pessoal (ou o Duolingo, "duo") a um hábito de vínculo do grupo; pessoal vazio
    desliga. Os dias mudam de assinatura, então a próxima sincronização manda a temporada de novo, já com o vínculo."""
    g = grupo_da(d.get("chave"))
    hid, pes = str(d.get("habito", "")), str(d.get("pessoal") or "")
    cat = (ler_json_arquivo(arquivo_placar(g)) or {}).get("habitos") or []
    if not any(h.get("id") == hid and h.get("fonte") == "vinculo" for h in cat):
        raise Erro("hábito do grupo não encontrado (sincronize e tente de novo)")
    j = jogador()
    if pes and pes not in [h["id"] for h in habitos(j)] + (["duo"] if duo_conf(j) else []):
        raise Erro("hábito pessoal não encontrado")
    with lock:
        lista = grupos()
        for x in lista:
            if chave_grupo(x) == chave_grupo(g):
                v = vinculos_de(x)
                if pes:
                    v[hid] = pes
                else:
                    v.pop(hid, None)
                x["vinculos"] = v
        gravar_json("grupo.json", lista)
    return {"ok": True}


ADMIN_ACOES = {"convite": "admin/convite", "cancelar": "admin/cancelar", "membro": "admin/membro", "config": "admin/config",
               "habito": "admin/habito", "calibracao": "admin/calibracao", "placar": "admin/placar", "frase": "admin/frase"}


def api_grupo_admin(d):
    """{chave, acao: ver | convite | cancelar | membro | config | habito | calibracao | placar | frase, ...}: a aba Administrar,
    repassada ao servidor do grupo."""
    g = grupo_da(d.get("chave"))
    acao = d.get("acao")
    if acao == "ver":
        return pede_g(g, "GET", f"/g/{g['id']}/admin")
    if acao not in ADMIN_ACOES:
        raise Erro("ação desconhecida")
    corpo = {k: v for k, v in d.items() if k not in ("chave", "acao")}
    r = pede_g(g, "POST", f"/g/{g['id']}/{ADMIN_ACOES[acao]}", corpo)
    if acao == "convite":
        r["link"] = (g.get("publico") or g["url"]).rstrip("/") + f"/g/{g['id']}#{r['codigo']}"
    return r


def api_grupo_frase(d):
    """{chave, texto}: a frase do líder da semana (#76). O servidor do grupo confere se é o líder e se ainda não escreveu."""
    g = grupo_da(d.get("chave"))
    return pede_g(g, "POST", f"/g/{g['id']}/frase", {"texto": str(d.get("texto") or "")})


# ---------- host: o servidor do grupo nesta máquina e o Tailscale Funnel (decidido em 13/10: modo misto) ----------
def ping_grupo():
    try:
        with urllib.request.urlopen(grupo_local() + "/api/ping", timeout=2) as r:
            return json.load(r).get("app") == GRUPO_APP
    except Exception:
        return False


def liga_servidor_grupo():
    """Instala o ganbatte-grupo para subir com a máquina e liga agora (se já não estiver ligado)."""
    if ping_grupo():
        return
    exe = Path(sys.executable)
    if sistema() == "windows" and exe.with_name("pythonw.exe").exists():
        exe = exe.with_name("pythonw.exe")
    cmd = [str(exe), str(REPO / "grupo" / "servidor_grupo.py"), "--fundo", "--porta", grupo_local().rsplit(":", 1)[1], "--dados", str(grupo_pasta_servidor())]
    auto_ligar(GRUPO_APP, cmd, "Ganbatte (servidor do grupo)")
    iniciar_fundo(GRUPO_APP, cmd)
    for _ in range(40):
        if ping_grupo():
            return
        time.sleep(0.25)
    raise Erro("o servidor do grupo não subiu (veja servidor-grupo.log em " + str(grupo_pasta_servidor()) + ")", 500)


def dono_token():
    try:
        return (grupo_pasta_servidor() / "dono.token").read_text(encoding="utf-8").strip()
    except OSError:
        raise Erro("este computador não é o servidor do grupo (falta o dono.token)", 403)


def acha_tailscale():
    t = shutil.which("tailscale", path=path_agentes())
    if t:
        return t
    for p in (Path("/Applications/Tailscale.app/Contents/MacOS/Tailscale"),
              Path(os.environ.get("ProgramFiles") or "C:\\Program Files") / "Tailscale" / "tailscale.exe"):
        if p.is_file():
            return str(p)
    return None


def tailscale_status(exe):
    try:
        r = subprocess.run([exe, "status", "--json"], capture_output=True, text=True, timeout=10, stdin=subprocess.DEVNULL)
        return json.loads(r.stdout or "{}")
    except (OSError, subprocess.SubprocessError, ValueError):
        return {}


def tailscale_nome():
    exe = acha_tailscale()
    dns = ((tailscale_status(exe).get("Self") or {}).get("DNSName") or "").rstrip(".") if exe else ""
    return dns


def saida_de(e):
    v = (getattr(e, "stdout", None) or b"", getattr(e, "stderr", None) or b"")
    return " ".join(x.decode("utf-8", "replace") if isinstance(x, bytes) else x for x in v)


def liga_funnel():
    """Tenta ligar o Funnel na porta do servidor do grupo. Devolve {estado: ok | sem | login | autorizar | sudo | erro, ...}:
    a autorização da primeira vez (um link) e o sudo do Linux não dá para fazer por aqui, então a página mostra o que fazer."""
    exe = acha_tailscale()
    if not exe:
        return {"estado": "sem"}
    st = tailscale_status(exe)
    if st.get("BackendState") != "Running":
        return {"estado": "login", "comando": ("sudo tailscale up" if sistema() == "linux" else "abra o Tailscale e entre na conta")}
    porta = grupo_local().rsplit(":", 1)[1]
    try:
        r = subprocess.run([exe, "funnel", "--bg", porta], capture_output=True, text=True, timeout=20, stdin=subprocess.DEVNULL)
        saida, ok = (r.stdout or "") + " " + (r.stderr or ""), r.returncode == 0
    except subprocess.TimeoutExpired as e:   # esperando a autorização no navegador
        saida, ok = saida_de(e), False
    except OSError as e:
        return {"estado": "erro", "msg": str(e)}
    link = re.search(r"https://login\.tailscale\.com/\S+", saida)
    if link:
        return {"estado": "autorizar", "link": link.group(0).rstrip(".,)")}
    if not ok and re.search(r"access denied|permission denied|must be root|operator|sudo", saida, re.I):
        return {"estado": "sudo", "comando": f"sudo tailscale set --operator=$USER   (ou: sudo tailscale funnel --bg {porta})"}
    dns = ((st.get("Self") or {}).get("DNSName") or "").rstrip(".")
    if ok and dns:
        return {"estado": "ok", "endereco": "https://" + dns}
    return {"estado": "erro", "msg": " ".join(saida.split())[-300:] or "o tailscale não respondeu"}


def api_grupo_host(d):
    """{acao: estado | servidor | funnel | criar {nome, endereco}}: o host cria um grupo pelo jogo."""
    acao = d.get("acao")
    if acao == "estado":
        ligado, dono, dns = ping_grupo(), (grupo_pasta_servidor() / "dono.token").is_file(), tailscale_nome()
        srv = grupo_pede(grupo_local(), "GET", "/dono", token=dono_token()) if ligado and dono else {}
        return {"ok": True, "servidor": ligado, "dono": dono, "tailscale": bool(acha_tailscale()), "endereco": "https://" + dns if dns else "",
                "grupos": srv.get("grupos") or [], "mudou": srv.get("mudou") or ""}
    if acao == "servidor":
        liga_servidor_grupo()
        return {"ok": True}
    if acao == "funnel":
        liga_servidor_grupo()
        return dict(liga_funnel(), ok=True)
    if acao == "criar":
        end = str(d.get("endereco") or "").strip().rstrip("/")
        if not re.match(r"^https?://[^/\s#?]+$", end):
            raise Erro("endereço do servidor inválido (ex.: https://notebook.tailXXXX.ts.net)")
        liga_servidor_grupo()
        r = grupo_pede(grupo_local(), "POST", "/dono/grupo", {"nome": d.get("nome")}, dono_token())
        nome, av = nome_publico({"avatar": d.get("avatar")})   # o "nome" daqui é o do grupo; o do jogador vem do jogador.json
        e = entra_grupo(grupo_local(), r["grupo"]["id"], r["convite"], nome, av, publico=end)
        return dict(e, ok=True)
    if acao == "restaurar":
        return restaura_grupo(d)
    if acao == "mudar":
        return avisa_mudanca(str(d.get("endereco") or "").strip().rstrip("/"))
    raise Erro("ação desconhecida")


# ---------- mudar o servidor do grupo de computador (#91) ----------
def restaura_grupo(d):
    """{banco: o .db em base64, endereco}: no computador novo, troca o banco do servidor do grupo pela cópia do antigo. Os
    grupos deste jogo que falam com o servidor daqui passam a usar o endereço público novo nos convites e mandam a temporada
    de novo (a cópia pode ser mais velha do que o que já tinha chegado)."""
    end = str(d.get("endereco") or "").strip().rstrip("/")
    if end and not ENDERECO_GRUPO.match(end):
        raise Erro("endereço público inválido (ex.: https://notebook.tailXXXX.ts.net)")
    try:
        banco = base64.b64decode(str(d.get("banco") or ""), validate=True)
    except ValueError:
        raise Erro("arquivo inválido")
    liga_servidor_grupo()
    r = grupo_pede(grupo_local(), "POST", "/dono/restaurar", token=dono_token(), tempo=120, arquivo=banco)
    with lock:
        lista, env_ = grupos(), ler_json("enviado.json", {})
        for x in lista:
            if x["url"] == grupo_local():
                env_.pop(chave_grupo(x), None)
                if end:
                    x["publico"] = end
        gravar_json("grupo.json", lista)
        gravar_json("enviado.json", env_)
    return dict(r, ok=True)


def avisa_mudanca(end):
    """No computador antigo: o servidor do grupo passa a responder aos membros com o endereço novo (vazio desfaz). Antes,
    confere que lá já tem um servidor do grupo respondendo e que não é este mesmo (os membros ficariam dando voltas)."""
    if end:
        if not ENDERECO_GRUPO.match(end):
            raise Erro("endereço inválido (ex.: https://notebook.tailXXXX.ts.net)")
        dns = tailscale_nome()
        if (dns and end.split("//", 1)[1].split(":")[0] == dns) or any(x.get("publico") == end for x in grupos() if x["url"] == grupo_local()):
            raise Erro("esse é o endereço deste computador: use o endereço do computador novo")
        try:
            ok = grupo_pede(end, "GET", "/api/ping", tempo=15).get("app") == GRUPO_APP
        except Erro:
            ok = False
        if not ok:
            raise Erro(f"nenhum servidor do grupo respondeu em {end}: ligue-o no computador novo e restaure a cópia lá antes")
    return dict(grupo_pede(grupo_local(), "POST", "/dono/mudar", {"endereco": end}, dono_token()), ok=True)


def copia_grupo():
    return grupo_pede(grupo_local(), "GET", "/dono/copia", token=dono_token(), tempo=60, bruto=True)


# ---------- iniciar com o computador (opcional: liga e desliga na aba Configurações, ou com --instalar / --desinstalar) ----------
SERVICO = APP
EXEC = {"fundo": False, "porta": 8642, "srv": None, "passou": False, "systemd": None}


def sistema():
    if sys.platform.startswith("win"):
        return "windows"
    return "mac" if sys.platform == "darwin" else "linux"


def tem_systemd():
    if EXEC["systemd"] is None:
        try:
            EXEC["systemd"] = subprocess.run(["systemctl", "--user", "show-environment"], capture_output=True, timeout=5).returncode == 0
        except (OSError, subprocess.SubprocessError):
            EXEC["systemd"] = False
    return EXEC["systemd"]


def comando_fundo():
    exe = Path(sys.executable)
    if sistema() == "windows" and exe.with_name("pythonw.exe").exists():
        exe = exe.with_name("pythonw.exe")   # sem janela de terminal
    return [str(exe), str(REPO / "servidor.py"), "--fundo", "--porta", str(EXEC["porta"]), "--dados", str(DADOS)] + (
        ["--todo", str(TODO_DIR)] if TODO_DIR != DADOS else [])


def arquivo_auto(nome=SERVICO):
    so = sistema()
    if so == "windows":
        return Path(os.environ.get("APPDATA") or Path.home() / "AppData" / "Roaming") / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup" / f"{nome}.vbs"
    if so == "mac":
        return Path.home() / "Library" / "LaunchAgents" / f"com.{nome}.servidor.plist"
    if tem_systemd():
        return Path.home() / ".config" / "systemd" / "user" / f"{nome}.service"
    return Path(os.environ.get("XDG_CONFIG_HOME") or Path.home() / ".config") / "autostart" / f"{nome}.desktop"


def conteudo_auto(f, cmd=None, nome=SERVICO, desc="Ganbatte (servidor local do jogo)"):
    """cmd e nome: outro serviço com o mesmo esquema (o ganbatte-grupo, do servidor do grupo)."""
    cmd = cmd or comando_fundo()
    if f.suffix == ".vbs":
        linha = " ".join('""' + x + '""' for x in cmd)
        return f'CreateObject("WScript.Shell").Run "{linha}", 0, False\r\n'
    if f.suffix == ".plist":
        from xml.sax.saxutils import escape
        args = "".join(f"<string>{escape(x)}</string>" for x in cmd)
        return ('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'
                f'<plist version="1.0"><dict><key>Label</key><string>com.{nome}.servidor</string><key>ProgramArguments</key><array>{args}</array>'
                '<key>RunAtLoad</key><true/><key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict></dict></plist>\n')
    aspas = lambda x: '"' + re.sub(r'(["\\`$])', r"\\\1", x).replace("%", "%%") + '"'
    exec_ = " ".join(aspas(x) for x in cmd)
    if f.suffix == ".service":
        return (f"[Unit]\nDescription={desc}\n\n[Service]\nExecStart={exec_}\nRestart=on-failure\nRestartSec=10\n\n"
                "[Install]\nWantedBy=default.target\n")
    return f"[Desktop Entry]\nType=Application\nName={desc.split(' (')[0]}\nExec={exec_}\nNoDisplay=true\nX-GNOME-Autostart-enabled=true\n"


def systemctl(*args):
    r = subprocess.run(["systemctl", "--user", *args], capture_output=True, text=True, timeout=15)
    if r.returncode != 0:
        raise Erro(f"systemctl {' '.join(args)}: {(r.stderr or r.stdout).strip()[:200]}", 500)


def auto_ligado():
    return arquivo_auto().exists()


def auto_ligar(nome=SERVICO, cmd=None, desc="Ganbatte (servidor local do jogo)"):
    f = arquivo_auto(nome)
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(conteudo_auto(f, cmd, nome, desc), encoding="utf-8")
    if f.suffix == ".service":
        systemctl("daemon-reload")
        systemctl("enable", f.name)


def auto_desligar(nome=SERVICO):
    """Não derruba o servidor que está rodando agora (a página continua aberta); só deixa de iniciar com o computador."""
    f = arquivo_auto(nome)
    if f.suffix == ".service" and f.exists():
        systemctl("disable", f.name)
    if f.exists():
        f.unlink()
    if f.suffix == ".service":
        systemctl("daemon-reload")


def migra_pasta(p):
    """#15: a pasta padrão era ~/.hunter-todo. Se o jogo abriu nela (o padrão, ou o --dados que o início automático
    gravou antes), ela vira ~/.ganbatte e fica um atalho no lugar da antiga (Linux e Mac). Outra pasta fica onde está."""
    velha, nova = Path.home() / ".hunter-todo", Path.home() / ".ganbatte"
    if p.absolute() not in (velha.absolute(), nova.absolute()):
        return p
    if velha.is_dir() and not velha.is_symlink() and not nova.exists():
        try:
            velha.rename(nova)
        except OSError as e:
            log("não consegui mover a pasta de dados para ~/.ganbatte:", e)
            return velha
        log("pasta de dados movida de ~/.hunter-todo para ~/.ganbatte")
        try:
            velha.symlink_to(nova, target_is_directory=True)
        except OSError:
            pass
    return nova if nova.is_dir() and (velha.is_symlink() or not velha.exists()) else p


def migra_servico():
    """#15: o início automático se chamava hunter-todo. Grava o do ganbatte (já com a pasta nova) e apaga o antigo, sem
    pedir nada ao jogador. O servidor que está rodando continua; o do nome novo assume no próximo login."""
    velho = arquivo_auto(APP_ANTIGO)
    if not velho.exists():
        return
    try:
        auto_ligar()
        auto_desligar(APP_ANTIGO)
        log("início automático trocado de hunter-todo para ganbatte")
    except (Erro, OSError, subprocess.SubprocessError) as e:
        log("não consegui trocar o início automático:", e)


def iniciar_fundo(nome=SERVICO, cmd=None):
    """Liga o servidor em segundo plano agora (a porta precisa estar livre). nome e cmd: outro serviço (ganbatte-grupo)."""
    f = arquivo_auto(nome)
    cmd = cmd or comando_fundo()
    if f.suffix == ".service":
        return systemctl("start", "--no-block", f.name)
    if f.suffix == ".plist":
        subprocess.run(["launchctl", "load", "-w", str(f)], capture_output=True, timeout=15)
        return
    nulo = subprocess.DEVNULL
    if sistema() == "windows":
        subprocess.Popen(cmd, creationflags=0x00000008 | 0x00000200, close_fds=True, stdin=nulo, stdout=nulo, stderr=nulo)
    else:
        subprocess.Popen(cmd, start_new_session=True, stdin=nulo, stdout=nulo, stderr=nulo)


def passar_para_fundo():
    """O servidor do terminal sai e o de segundo plano assume a mesma porta: a página só precisa recarregar."""
    time.sleep(0.5)
    EXEC["passou"] = True
    EXEC["srv"].shutdown()   # main() libera a porta e liga o de segundo plano


def api_autostart(d):
    if d.get("ligar"):
        auto_ligar()
        if EXEC["fundo"]:
            return {"ok": True, "ligado": True, "msg": "Ligado: o servidor inicia sozinho com o computador."}
        threading.Thread(target=passar_para_fundo, daemon=True).start()
        return {"ok": True, "ligado": True, "recarregar": True,
                "msg": "Ligado: o servidor passou a rodar em segundo plano e inicia sozinho com o computador. Pode fechar a janela do terminal."}
    auto_desligar()
    return {"ok": True, "ligado": False, "msg": "Desligado: o servidor não inicia mais com o computador."
            + (" Este continua rodando até você reiniciar o PC." if EXEC["fundo"] else "")}


ROTAS = {"/api/act": api_act, "/api/add": api_add, "/api/undo": api_undo, "/api/reabre": api_reabre, "/api/config": api_config, "/api/ontem": api_ontem, "/api/denovo": api_denovo, "/api/autostart": api_autostart,
         "/api/jogo/nota": api_jogo_nota, "/api/jogo/planos": api_jogo_planos, "/api/jogo/narrada": api_jogo_narrada, "/api/jogo/ajuste": api_jogo_ajuste, "/api/jogo/estado": api_jogo_estado,
         "/api/cf/mao": api_cf_mao, "/api/ia/config": api_ia_config, "/api/ia/rodar": api_ia_rodar, "/api/ia/plano": api_ia_plano,
         "/api/conquistas": api_conquistas, "/api/atualizar": api_atualizar, "/api/canal": api_canal, "/api/temporada": api_temporada, "/api/colecao": api_colecao,
         "/api/grupo/entrar": api_grupo_entrar, "/api/grupo/sair": api_grupo_sair, "/api/grupo/sincronizar": api_grupo_sincronizar,
         "/api/grupo/admin": api_grupo_admin, "/api/grupo/host": api_grupo_host, "/api/grupo/vinculo": api_grupo_vinculo,
         "/api/grupo/frase": api_grupo_frase}
LIMITE = {"/api/temporada": 3_000_000, "/api/colecao": 600000, "/api/conquistas": 20000, "/api/ia/rodar": 300000, "/api/ia/plano": 21_000_000, "/api/jogo/narrada": 40000, "/api/config": 90000, "/api/jogo/estado": 520000, "/api/jogo/planos": 130000, "/api/grupo/sincronizar": 1_000_000, "/api/grupo/host": 140_000_000}
ESTATICOS = {"/": ("index.html", "text/html; charset=utf-8"), "/index.html": ("index.html", "text/html; charset=utf-8"),
             "/motor.js": ("motor.js", "text/javascript; charset=utf-8"), "/guia.js": ("guia.js", "text/javascript; charset=utf-8"),
             "/demo.js": ("demo.js", "text/javascript; charset=utf-8"), "/chefes.js": ("chefes.js", "text/javascript; charset=utf-8"),
             "/ia.js": ("ia.js", "text/javascript; charset=utf-8"), "/conquistas.js": ("conquistas.js", "text/javascript; charset=utf-8"),
             "/novidades.js": ("novidades.js", "text/javascript; charset=utf-8"), "/expedicoes.js": ("expedicoes.js", "text/javascript; charset=utf-8"),
             "/feedback.js": ("feedback.js", "text/javascript; charset=utf-8"), "/temporadas.js": ("temporadas.js", "text/javascript; charset=utf-8"),
             "/efeitos.js": ("efeitos.js", "text/javascript; charset=utf-8"), "/grupo.js": ("grupo.js", "text/javascript; charset=utf-8")}


class H(BaseHTTPRequestHandler):
    server_version = APP + "/" + VERSAO
    porta = 0

    def log_message(self, fmt, *a):
        pass   # silencioso; os erros aparecem pelo log()

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _arquivo(self, f, ctype, cache="no-cache"):
        if not f.is_file():
            return self._json(404, {"ok": False, "error": "arquivo não encontrado"})
        body = f.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", cache)
        self.end_headers()
        self.wfile.write(body)

    def _host_ok(self):
        # só aceita o próprio endereço: outra página aberta no navegador não consegue ler nem gravar seus dados
        return self.headers.get("Host", "") in (f"127.0.0.1:{self.porta}", f"localhost:{self.porta}")

    def do_GET(self):
        if not self._host_ok():
            return self._json(403, {"ok": False, "error": "host não permitido"})
        caminho = urllib.parse.unquote(self.path.split("?", 1)[0])
        if caminho in ESTATICOS:
            nome, ctype = ESTATICOS[caminho]
            return self._arquivo(WEB / nome, ctype)
        if caminho.startswith("/a/") and caminho.endswith(".png") and NOME_AV.match(caminho[3:-4]) and not caminho[3:].startswith("."):
            if (WEB / "a" / caminho[3:]).is_file():
                return self._arquivo(WEB / "a" / caminho[3:], "image/png", "max-age=3600")
            return self._json(404, {"ok": False, "error": "foto não encontrada"})
        m = re.match(r"^/(chefoes|colecao)/([A-Za-z0-9_-][A-Za-z0-9_.-]{0,99})\.png$", caminho)
        if m:   # retratos dos chefões (web/chefoes/) e as imagens da coleção permanente (colecao/arquivos/ da pasta de dados)
            pasta = WEB / "chefoes" if m.group(1) == "chefoes" else DADOS / "colecao" / "arquivos"
            if (pasta / (m.group(2) + ".png")).is_file():
                return self._arquivo(pasta / (m.group(2) + ".png"), "image/png", "max-age=3600")
            return self._json(404, {"ok": False, "error": "imagem não encontrada"})
        if caminho == "/api/ping":
            return self._json(200, {"ok": True, "app": APP, "versao": VERSAO, "pid": os.getpid(), "canal": canal()})
        if caminho == "/api/backup":
            try:
                corpo = backup()
            except OSError as e:
                log("erro no backup:", repr(e))
                return self._json(500, {"ok": False, "error": "não consegui ler a pasta de dados"})
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", f'attachment; filename="{APP}-dados-{hoje().isoformat()}.zip"')
            self.send_header("Content-Length", str(len(corpo)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return self.wfile.write(corpo)
        if caminho == "/api/grupo":
            return self._json(200, api_grupo_get())
        if caminho == "/api/grupo/copia":
            try:
                corpo = copia_grupo()
            except Erro as e:
                return self._json(e.code, {"ok": False, "error": str(e)})
            self.send_response(200)
            self.send_header("Content-Type", "application/vnd.sqlite3")
            self.send_header("Content-Disposition", f'attachment; filename="{GRUPO_APP}-{hoje().isoformat()}.db"')
            self.send_header("Content-Length", str(len(corpo)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return self.wfile.write(corpo)
        if caminho == "/api/atualizacao":
            return self._json(200, api_atualizacao_get("agora" in urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query, keep_blank_values=True)))
        if caminho in ("/api/ia", "/api/ia/rodar"):
            q = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
            try:
                return self._json(200, api_ia_get() if caminho == "/api/ia" else api_ia_tarefa((q.get("id") or [""])[0]))
            except Erro as e:
                return self._json(e.code, {"ok": False, "error": str(e)})
        if caminho == "/api/jogo":
            try:
                return self._json(200, api_jogo_get())
            except Exception as e:
                log("erro:", repr(e))
                return self._json(500, {"ok": False, "error": "erro interno (veja o terminal do servidor)"})
        self._json(404, {"ok": False, "error": "não encontrado"})

    def do_POST(self):
        if not self._host_ok():
            return self._json(403, {"ok": False, "error": "host não permitido"})
        origem = self.headers.get("Origin")
        if origem and origem not in (f"http://127.0.0.1:{self.porta}", f"http://localhost:{self.porta}"):
            return self._json(403, {"ok": False, "error": "origem não permitida"})
        if self.headers.get("X-Painel") != "1":
            return self._json(403, {"ok": False, "error": "cabeçalho X-Painel ausente"})
        fn = ROTAS.get(self.path)
        if not fn:
            return self._json(404, {"ok": False, "error": "não encontrado"})
        try:
            n = int(self.headers.get("Content-Length") or 0)
            if n > LIMITE.get(self.path, 8192):
                raise Erro("corpo grande demais", 413)
            dados = json.loads(self.rfile.read(n) or b"{}")
            if not isinstance(dados, dict):
                raise Erro("JSON inválido")
            self._json(200, fn(dados))
        except Erro as e:
            self._json(e.code, {"ok": False, "error": str(e)})
        except (ValueError, UnicodeDecodeError):
            self._json(400, {"ok": False, "error": "JSON inválido"})
        except Exception as e:
            log("erro:", repr(e))
            self._json(500, {"ok": False, "error": "erro interno (veja o terminal do servidor)"})


def comando():
    """Como a pessoa roda o servidor neste sistema, com o caminho completo (funciona de qualquer pasta)."""
    return f'{"py" if sistema() == "windows" else "python3"} "{REPO / "servidor.py"}"'


def boas_vindas(a, url):
    """Primeira vez num terminal: explica o que é o servidor e pergunta se ele inicia com o computador.
    Devolve True se o servidor já ficou rodando em segundo plano (não precisa abrir aqui)."""
    marca = DADOS / ".boas-vindas"
    if marca.exists() or a.fundo or not (sys.stdin and sys.stdin.isatty()):
        return False
    marca.write_text(time.strftime("%Y-%m-%d %H:%M") + "\n", encoding="utf-8")
    linha = "=" * 64
    print(f"""
{linha}
  Bem-vindo ao Ganbatte {VERSAO}
{linha}
O jogo roda no seu computador. Este programa (o "servidor") guarda as suas
tarefas em {TODO_DIR}
e mostra o jogo no navegador, em {url}

Ele precisa estar ligado enquanto você joga. Você escolhe:
  - iniciar sempre com o computador, em segundo plano (recomendado):
    é só abrir o endereço acima quando quiser jogar;
  - ou rodar só quando quiser, deixando esta janela aberta.

Para mudar depois: aba Configurações do jogo, ou no terminal
  {comando()} --instalar      (inicia com o computador)
  {comando()} --desinstalar   (deixa de iniciar)
  {comando()} --help          (todas as opções)
{linha}""")
    try:
        r = input("Iniciar sempre com o computador? [S/n] ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        print()
        return False
    if r not in ("", "s", "sim", "y", "yes"):
        print("Certo: rode este mesmo comando quando quiser jogar.\n")
        return False
    try:
        auto_ligar()
        iniciar_fundo()
        for _ in range(20):
            if ja_rodando(a.porta):
                break
            time.sleep(0.25)
        else:
            raise OSError("o servidor em segundo plano não respondeu")
    except (Erro, OSError, subprocess.SubprocessError) as e:
        print(f"Não deu para iniciar em segundo plano ({e}). Seguindo nesta janela.\n")
        return False
    print(f"Pronto: o servidor está rodando em segundo plano e vai iniciar sozinho com o computador.\nAbra {url} (vale salvar nos favoritos). Pode fechar esta janela.")
    if not a.sem_navegador:
        webbrowser.open(url)
    return True


def ping(porta):
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{porta}/api/ping", timeout=2) as r:
            j = json.load(r)
            return j if j.get("app") in (APP, APP_ANTIGO) else None
    except Exception:
        return None


def ja_rodando(porta):
    return ping(porta) is not None


def pid_na_porta(porta):
    """Quem escuta na porta (Linux e Mac), para trocar um servidor antigo que não informa o pid no /api/ping."""
    for cmd in (["ss", "-ltnpH", f"sport = :{porta}"], ["lsof", "-t", f"-iTCP:{porta}", "-sTCP:LISTEN"]):
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        except (OSError, subprocess.SubprocessError):
            continue
        m = re.search(r"pid=(\d+)", r.stdout) or re.match(r"\s*(\d+)", r.stdout)
        if m:
            return int(m.group(1))
    return None


def troca_antigo(porta, info):
    """Atualizou o jogo com o servidor antigo ainda ligado (em segundo plano): desliga o antigo para o novo assumir.
    Devolve True se a porta ficou livre (ou se o serviço já subiu com o código novo)."""
    log(f"servidor antigo ({info.get('versao')}) rodando na porta {porta}: trocando pelo {VERSAO}")
    f = arquivo_auto()
    try:
        if f.suffix == ".service" and f.exists():
            systemctl("restart", f.name)
        elif f.suffix == ".plist" and f.exists():
            subprocess.run(["launchctl", "kickstart", "-k", f"gui/{os.getuid()}/com.{SERVICO}.servidor"], capture_output=True, timeout=15)
        else:
            pid = info.get("pid") or pid_na_porta(porta)
            if not pid:
                return False
            if sistema() == "windows":
                subprocess.run(["taskkill", "/PID", str(pid), "/F"], capture_output=True, timeout=15)
            else:
                import signal
                os.kill(pid, signal.SIGTERM)
    except (Erro, OSError, subprocess.SubprocessError) as e:
        log("não consegui desligar o servidor antigo:", e)
        return False
    for _ in range(40):
        time.sleep(0.25)
        p = ping(porta)
        if p is None or p.get("versao") == VERSAO:
            return True
    return False


def vigia_codigo():
    """Atualizou o código (git pull, instalador) com o servidor ligado: ele se reinicia sozinho com o código novo."""
    f = REPO / "servidor.py"
    antes = f.stat().st_mtime
    while True:
        time.sleep(20)
        try:
            if f.stat().st_mtime != antes and not ia_lock.locked():
                compile(f.read_text(encoding="utf-8"), str(f), "exec")   # só troca se o arquivo novo estiver inteiro
                log("código novo do servidor: reiniciando")
                EXEC["recarregar"] = True
                EXEC["srv"].shutdown()
                return
        except (OSError, SyntaxError, ValueError):
            pass


def vira_dia():
    """Virou o dia com o servidor ligado: cria as recorrentes de hoje sem esperar a página abrir
    (quem também usa o todo.txt em outro lugar, como o todo.sh ou um painel, já as encontra lá)."""
    dia = hoje()
    while True:
        time.sleep(60)
        if hoje() != dia:
            try:
                arruma_dia()
                dia = hoje()
            except Exception as e:   # arquivo ocupado ou ilegível: tenta de novo no próximo minuto
                log("virada do dia:", repr(e))


def main():
    global DADOS, TODO_DIR
    ap = argparse.ArgumentParser(description="Ganbatte: servidor local do jogo")
    ap.add_argument("--porta", type=int, default=int(env("PORTA") or 8642))
    ap.add_argument("--dados", default=env("DADOS") or str(Path.home() / ".ganbatte"),
                    help="pasta dos seus dados (padrão: ~/.ganbatte)")
    ap.add_argument("--todo", default=env("TODO"),
                    help="pasta de um todo.txt que você já usa (padrão: a pasta de dados)")
    ap.add_argument("--sem-navegador", action="store_true", help="não abre o navegador")
    ap.add_argument("--instalar", action="store_true", help="passa a iniciar o servidor junto com o computador, em segundo plano")
    ap.add_argument("--desinstalar", action="store_true", help="deixa de iniciar junto com o computador")
    ap.add_argument("--fundo", action="store_true", help=argparse.SUPPRESS)   # usado pelo início automático
    a = ap.parse_args()
    if sys.version_info < (3, 8):
        sys.exit("Precisa do Python 3.8 ou mais novo.")
    DADOS = migra_pasta(Path(a.dados).expanduser()).resolve()
    DADOS.mkdir(parents=True, exist_ok=True)
    TODO_DIR = Path(a.todo).expanduser().resolve() if a.todo else DADOS
    if not TODO_DIR.is_dir():
        sys.exit(f"A pasta do --todo não existe: {TODO_DIR}")
    EXEC.update(porta=a.porta, fundo=a.fundo)
    url = f"http://127.0.0.1:{a.porta}/"
    if not a.desinstalar:
        migra_servico()
    else:
        auto_desligar(APP_ANTIGO)
    if a.instalar or a.desinstalar:
        try:
            if a.desinstalar:
                auto_desligar()
                return print("Pronto: o Ganbatte não inicia mais com o computador. Se ele estiver rodando agora, continua até você reiniciar.")
            auto_ligar()
            if ja_rodando(a.porta):
                return print(f"Pronto: o Ganbatte vai iniciar sozinho a partir do próximo login. Agora ele já está em {url}")
            iniciar_fundo()
            return print(f"Pronto: o Ganbatte está rodando em segundo plano em {url} e vai iniciar sozinho com o computador.")
        except (Erro, OSError, subprocess.SubprocessError) as e:
            sys.exit(f"Não deu: {e}")
    if a.fundo or sys.stdout is None:   # sem terminal (pythonw no Windows): o log vai para servidor.log na pasta de dados
        f = DADOS / "servidor.log"
        if f.exists() and f.stat().st_size > 1_000_000:
            f.unlink()
        sys.stdout = sys.stderr = open(f, "a", encoding="utf-8", buffering=1)
    for nome in ("todo.txt", "done.txt"):
        if not caminho(nome).exists():
            gravar_txt(nome, "")
    H.porta = a.porta
    antigo = ping(a.porta)
    if antigo and antigo.get("versao") != VERSAO and troca_antigo(a.porta, antigo) and ja_rodando(a.porta):
        print(f"Ganbatte atualizado para a {VERSAO} (o servidor em segundo plano foi reiniciado): {url}")
        if not a.sem_navegador and not a.fundo:
            webbrowser.open(url)
        return
    if not ja_rodando(a.porta) and boas_vindas(a, url):
        return
    try:
        srv = ThreadingHTTPServer(("127.0.0.1", a.porta), H)
    except OSError:
        if ja_rodando(a.porta):
            if a.fundo:
                sys.exit(0)
            print(f"O Ganbatte já está rodando em {url}")
            if not a.sem_navegador:
                webbrowser.open(url)
            return
        sys.exit(f"A porta {a.porta} está ocupada por outro programa. Rode com outra: python3 servidor.py --porta 8643")
    EXEC["srv"] = srv
    threading.Thread(target=vigia_codigo, daemon=True).start()
    threading.Thread(target=vira_dia, daemon=True).start()
    arruma_dia()
    print(f"Ganbatte {VERSAO} ({VERSAO_NOME}) em {url}")
    print(f"Seus dados: {DADOS}" + (f" (tarefas em {TODO_DIR})" if TODO_DIR != DADOS else ""))
    if not a.fundo:
        print("Deixe esta janela aberta enquanto joga. Para parar: Ctrl+C.")
        if not auto_ligado():
            print(f"Dica: para não precisar abrir isto toda vez, ligue \"iniciar com o computador\" na aba Configurações ou rode {comando()} --instalar")
    if not a.sem_navegador and not a.fundo:
        threading.Timer(0.6, webbrowser.open, args=(url,)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nAté a próxima.")
        return
    if EXEC.get("recarregar"):
        srv.server_close()
        args = [a for a in sys.argv[1:] if a != "--sem-navegador"] + ["--sem-navegador"]
        os.execv(sys.executable, [sys.executable, str(REPO / "servidor.py")] + args)
    if EXEC["passou"]:
        srv.server_close()
        try:
            iniciar_fundo()
            print("O servidor passou a rodar em segundo plano. Pode fechar esta janela.")
        except Exception as e:
            sys.exit(f"Não consegui ligar o servidor em segundo plano ({e}). Rode de novo: python3 servidor.py")


if __name__ == "__main__":
    main()
