#!/usr/bin/env python3
"""Ganbatte · servidor do grupo (Associação, #38). Só a biblioteca padrão do Python 3.8+ (Linux, Windows e Mac).

Uso:  python3 grupo/servidor_grupo.py [--porta 8643] [--dados PASTA] [--instalar | --desinstalar]

Roda separado do jogo (serviço ganbatte-grupo, sobe com a máquina) e só escuta em localhost: quem o expõe na internet é o
host (Tailscale Funnel, outro túnel, VPS). Um servidor atende vários grupos, cada um em /g/<id>. Os dados ficam numa pasta
própria (padrão ~/.ganbatte-grupo/, ou a variável GANBATTE_GRUPO_DADOS), porque o servidor pode rodar sem jogo na máquina:
  grupo.db      SQLite: grupos, membros, convites, o catálogo de hábitos, os fatos de cada dia e os períodos fechados
  dono.token    o token do dono do servidor (criado na primeira vez). Quem lê o arquivo é o dono: o jogo do host o usa
                para criar grupos. Nunca "veio de localhost": o Funnel entrega os pedidos da internet por localhost
  copias/       uma cópia do banco por dia (as últimas COPIAS) e a de antes de cada restauração

Mudar de computador (#91): o dono baixa a cópia (/dono/copia), restaura no servidor novo (/dono/restaurar: os tokens
continuam valendo, porque o banco guarda o hash deles) e avisa no antigo o endereço novo (/dono/mudar). Daí em diante o
antigo responde a qualquer pedido de grupo com 410 e {mudou: endereço}, e o jogo de cada membro passa para o novo sozinho.

Os tokens (jogador, admin, convite) vão no cabeçalho Authorization: Bearer e o banco guarda só o hash deles.
O jogo manda fatos (o resumo do dia do motor, protocolo 1), nunca pontos: os andares da Torre Trick (#42), os placares
específicos, os títulos e a evolução (#67) são calculados aqui, em grupo/torre.py, a partir dos fatos guardados.
Hábitos do grupo (#41): um catálogo por grupo, que os admins editam. O Codeforces é o único automático (o jogo mede sozinho)
e já vem no grupo novo; os outros são de vínculo, sim/não por dia: cada jogador liga um hábito pessoal a ele no jogo, e só a
chave do grupo chega aqui. O envio guarda só as chaves do catálogo, a partir do "desde" de cada uma. Remover só arquiva.

Rotas (JSON):
  GET  /api/ping                              {app, versao, protocolo}
  dono (Bearer = dono.token)
  GET  /dono                                  grupos deste servidor
  POST /dono/grupo {nome, fuso?}              cria um grupo → {grupo, convite} (convite de administrador)
  POST /dono/convite {grupo}                  novo convite de administrador (o admin perdeu o acesso)
  GET  /dono/copia                            cópia do banco (SQLite)
  POST /dono/restaurar (corpo: o arquivo .db)   troca o banco por uma cópia → {grupos}
  POST /dono/mudar {endereco}                 avisa os membros do endereço novo (vazio desfaz)
  jogador
  POST /g/<id>/entrar {codigo, nome, avatar?} usa um convite → {token, membro, admin, grupo}
  POST /g/<id>/envio {protocolo, dias}        fatos dos dias novos ou que mudaram (sobrescreve por jogador e dia)
  GET  /g/<id>/placar                         o placar (só fatos) e quais dias já fecharam
  POST /g/<id>/sair {}                        sai do grupo (o histórico fica)
  POST /g/<id>/frase {texto}                  a frase do líder da última semana fechada (#76): uma vez só
  admin do grupo
  GET  /g/<id>/admin                          membros, convites abertos e a configuração
  POST /g/<id>/admin/convite {admin?, membro?} convite novo (membro = reconvite: liga ao mesmo perfil) → {codigo}
  POST /g/<id>/admin/cancelar {convite}       cancela um convite aberto
  POST /g/<id>/admin/membro {membro, admin?, remover?}
  POST /g/<id>/admin/config {nome?, fuso?, ini?, fim?}
  POST /g/<id>/admin/habito {nome} | {id, remover} cria um hábito de vínculo, arquiva (remover: true) ou traz de volta (false)
  POST /g/<id>/admin/calibracao {valores}     muda os números da Torre Trick (multiplicadores, base mínima, limite da frase)
  POST /g/<id>/admin/placar {id, on?, per?}   liga, desliga ou muda o período de um placar específico
  POST /g/<id>/admin/frase {semana}           apaga a frase de uma semana (o líder não escreve outra)
"""
import argparse
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import sys
import threading
import time
import urllib.parse
from datetime import date, datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))
import servidor as jogo  # noqa: E402  (versão, início automático e o log, os mesmos do jogo)
import torre  # noqa: E402  (as contas da Torre Trick e dos placares)

APP = "ganbatte-grupo"
PORTA = 8643
PROTOCOLO, PROTOCOLO_MIN = 1, 1   # o jogo manda o dele em cada envio; abaixo do mínimo, o servidor pede para atualizar
HORAS_LIGADO = 12   # horas de servidor ligado depois do prazo antes de fechar um período (#40, a calibrar)
FECHA = {"dia": 0, "semana": 3, "mes": 7}   # dias de folga depois do fim do período, sempre até as 6h do fuso do grupo
COPIAS = 14
CONVITE_DIAS = 7
JANELA = 35   # dias do placar
ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"   # sem 0/O e 1/I: o código pode ser lido em voz alta
ID_GRUPO = re.compile(r"^[a-z0-9][a-z0-9-]{1,30}$")
CHAVE_HAB = re.compile(r"^[a-z0-9][a-z0-9-]{0,39}$")
HAB_AUTO = {"cf": "Codeforces"}   # os hábitos que o jogo mede sozinho (um novo precisa de código no jogo)
HAB_MAX = 20   # hábitos ativos por grupo
AVATAR = re.compile(r"^[A-Za-z0-9_.-]{0,80}$")
DIA = re.compile(r"^\d{4}-\d\d-\d\d$")
FUSO = re.compile(r"^([+-])(\d{2}):(\d{2})$")
ENDERECO = re.compile(r"^https?://[^/\s#?]+$")
BANCO_MAX = 100_000_000   # tamanho máximo de uma cópia restaurada
DADOS = Path()
db_lock = threading.RLock()
CON = None
falhas = {}   # grupo → horários de convites errados (trava a força bruta)

ESQUEMA = """
CREATE TABLE IF NOT EXISTS grupos (id TEXT PRIMARY KEY, nome TEXT NOT NULL, fuso INTEGER NOT NULL, ini TEXT, fim TEXT, criado REAL NOT NULL);
CREATE TABLE IF NOT EXISTS membros (id INTEGER PRIMARY KEY, grupo TEXT NOT NULL, nome TEXT NOT NULL, avatar TEXT NOT NULL DEFAULT '',
  token TEXT UNIQUE, admin INTEGER NOT NULL DEFAULT 0, entrou REAL NOT NULL, envio REAL, saiu REAL);
CREATE TABLE IF NOT EXISTS convites (id INTEGER PRIMARY KEY, grupo TEXT NOT NULL, hash TEXT UNIQUE NOT NULL, admin INTEGER NOT NULL,
  membro INTEGER, criado REAL NOT NULL, vence REAL NOT NULL, usado REAL, cancelado INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS dias (grupo TEXT NOT NULL, membro INTEGER NOT NULL, dia TEXT NOT NULL, xp INTEGER NOT NULL, hab TEXT NOT NULL,
  missao INTEGER NOT NULL, ferias INTEGER NOT NULL, recebido REAL NOT NULL, PRIMARY KEY (grupo, membro, dia));
CREATE TABLE IF NOT EXISTS fechados (grupo TEXT NOT NULL, periodo TEXT NOT NULL, fechado REAL NOT NULL, dados TEXT NOT NULL, PRIMARY KEY (grupo, periodo));
CREATE TABLE IF NOT EXISTS ligado (id INTEGER PRIMARY KEY, ini REAL NOT NULL, fim REAL NOT NULL);
CREATE TABLE IF NOT EXISTS habitos (grupo TEXT NOT NULL, id TEXT NOT NULL, nome TEXT NOT NULL, fonte TEXT NOT NULL, desde TEXT NOT NULL,
  criado REAL NOT NULL, removido REAL, PRIMARY KEY (grupo, id));
CREATE TABLE IF NOT EXISTS servidor (chave TEXT PRIMARY KEY, valor TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS frases (grupo TEXT NOT NULL, semana TEXT NOT NULL, membro INTEGER NOT NULL, texto TEXT NOT NULL, criado REAL NOT NULL,
  apagada REAL, PRIMARY KEY (grupo, semana));
"""


class Erro(Exception):
    def __init__(self, msg, code=400):
        super().__init__(msg)
        self.code = code


log = jogo.log


def hash_de(token):
    return hashlib.sha256(token.encode()).hexdigest()


def agora():
    return time.time()


# ---------- banco ----------
def abre_banco():
    global CON
    CON = sqlite3.connect(str(DADOS / "grupo.db"), check_same_thread=False, isolation_level=None)
    CON.row_factory = sqlite3.Row
    CON.execute("PRAGMA journal_mode=WAL")
    CON.executescript(ESQUEMA)
    cols = {r["name"] for r in CON.execute("PRAGMA table_info(grupos)").fetchall()}
    for col in ("calib", "placares"):   # 0.9.0-beta1: grupos sem a calibração e a configuração dos placares (#42, #67)
        if col not in cols:
            CON.execute(f"ALTER TABLE grupos ADD COLUMN {col} TEXT NOT NULL DEFAULT '{{}}'")
    # grupos de antes do catálogo (0.9.0-beta1): começam com o Codeforces, como um grupo novo
    for g in CON.execute("SELECT id FROM grupos WHERE id NOT IN (SELECT DISTINCT grupo FROM habitos)").fetchall():
        poe_cf(CON, g["id"])


def q(sql, args=()):
    with db_lock:
        return CON.execute(sql, args).fetchall()


def q1(sql, args=()):
    r = q(sql, args)
    return r[0] if r else None


class transacao:
    """Várias gravações de uma vez: saldo e compras (0.9.1) precisam ser atômicos."""
    def __enter__(self):
        db_lock.acquire()
        CON.execute("BEGIN IMMEDIATE")
        return CON

    def __exit__(self, tipo, *_):
        try:
            CON.execute("ROLLBACK" if tipo else "COMMIT")
        finally:
            db_lock.release()


def token_dono():
    f = DADOS / "dono.token"
    if not f.exists():
        f.write_text(secrets.token_urlsafe(32) + "\n", encoding="utf-8")
        try:
            os.chmod(f, 0o600)
        except OSError:
            pass
    return f.read_text(encoding="utf-8").strip()


# ---------- tempo: fuso do grupo (deslocamento fixo em minutos) e o tempo em que o servidor ficou ligado ----------
def fuso_de(txt):
    m = FUSO.match(str(txt or ""))
    if not m:
        raise Erro("fuso inválido (use, por exemplo, -03:00)")
    minutos = (int(m.group(2)) * 60 + int(m.group(3))) * (-1 if m.group(1) == "-" else 1)
    if not -720 <= minutos <= 840:
        raise Erro("fuso inválido (use, por exemplo, -03:00)")
    return minutos


def fuso_txt(minutos):
    s = "-" if minutos < 0 else "+"
    return f"{s}{abs(minutos) // 60:02d}:{abs(minutos) % 60:02d}"


def fuso_local():
    off = datetime.now().astimezone().utcoffset()
    return int(off.total_seconds() // 60) if off else 0


def hoje_no(fuso):
    return (datetime.now(timezone.utc) + timedelta(minutes=fuso)).date()


def instante(dia, fuso, horas=6):
    """O momento (epoch) de dia às `horas` no fuso do grupo."""
    return datetime(dia.year, dia.month, dia.day, horas, tzinfo=timezone(timedelta(minutes=fuso))).timestamp()


LIGADO = {"id": None}


def marca_ligado():
    """Anota que o servidor está ligado (um intervalo por vez que ele sobe, estendido a cada minuto)."""
    t = agora()
    with db_lock:
        if LIGADO["id"] is None:
            LIGADO["id"] = CON.execute("INSERT INTO ligado (ini, fim) VALUES (?, ?)", (t, t)).lastrowid
        else:
            CON.execute("UPDATE ligado SET fim = ? WHERE id = ?", (t, LIGADO["id"]))


def horas_ligado_desde(t):
    r = q1("SELECT COALESCE(SUM(fim - MAX(ini, ?)), 0) AS s FROM ligado WHERE fim > ?", (t, t))
    return (r["s"] or 0) / 3600


# ---------- fechamento dos períodos (#40) ----------
def periodos_do(dia):
    """(chave, último dia) de cada período que termina neste dia."""
    out = [("dia:" + dia.isoformat(), dia)]
    if dia.isoweekday() == 7:
        a, s, _ = dia.isocalendar()
        out.append((f"semana:{a}-W{s:02d}", dia))
    if (dia + timedelta(days=1)).day == 1:
        out.append((f"mes:{dia.year}-{dia.month:02d}", dia))
    return out


def dias_do(periodo):
    tipo, v = periodo.split(":", 1)
    if tipo == "dia":
        d = date.fromisoformat(v)
        return d, d
    if tipo == "semana":
        a, s = v.split("-W")
        ini = date.fromisocalendar(int(a), int(s), 1)
        return ini, ini + timedelta(days=6)
    a, m = (int(x) for x in v.split("-"))
    fim = (date(a + (m == 12), m % 12 + 1, 1)) - timedelta(days=1)
    return date(a, m, 1), fim


def mediana(v):
    v = sorted(v)
    if not v:
        return 0
    n = len(v)
    return v[n // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2


def numeros(grupo, ini, fim):
    """O que congela num período: os números do grupo (para calibrar o teto e a superação, #42)."""
    membros = [r["id"] for r in q("SELECT id FROM membros WHERE grupo = ? AND saiu IS NULL", (grupo,))]
    linhas = q("SELECT membro, dia, xp, hab FROM dias WHERE grupo = ? AND dia BETWEEN ? AND ?", (grupo, ini.isoformat(), fim.isoformat()))
    xp = {(r["membro"], r["dia"]): r["xp"] for r in linhas}
    n = (fim - ini).days + 1
    todos = [xp.get((m, (ini + timedelta(days=i)).isoformat()), 0) for m in membros for i in range(n)]
    hab = {}
    for r in linhas:
        for k, v in json.loads(r["hab"]).items():
            hab[k] = hab.get(k, 0) + v
    return {"membros": len(membros), "dias": n, "dias_com_xp": sum(1 for x in todos if x > 0), "mediana_xp": mediana(todos),
            "mediana_ativos": mediana([x for x in todos if x > 0]), "hab": hab}


def fecha_periodos(t=None):
    """Fecha o que passou do prazo (fim do período + folga, às 6h no fuso do grupo) com HORAS_LIGADO de servidor ligado
    depois dele. Num servidor que nunca desliga isso só adia HORAS_LIGADO; num notebook, dá tempo de todos sincronizarem."""
    t = agora() if t is None else t
    fechou = []
    for g in q("SELECT * FROM grupos"):
        feitos = {r["periodo"] for r in q("SELECT periodo FROM fechados WHERE grupo = ?", (g["id"],))}
        primeiro = q1("SELECT MIN(dia) AS d FROM dias WHERE grupo = ?", (g["id"],))["d"]
        ini = g["ini"] or primeiro
        if not ini:
            continue
        ultimo = hoje_no(g["fuso"]) - timedelta(days=1)
        if g["fim"]:
            ultimo = min(ultimo, date.fromisoformat(g["fim"]))
        d = date.fromisoformat(ini)
        while d <= ultimo:
            for chave, fim in periodos_do(d):
                if chave in feitos:
                    continue
                prazo = instante(fim + timedelta(days=1 + FECHA[chave.split(":")[0]]), g["fuso"])
                if t < prazo or horas_ligado_desde(prazo) < HORAS_LIGADO:
                    continue
                a, b = dias_do(chave)
                with transacao() as c:
                    c.execute("INSERT OR IGNORE INTO fechados (grupo, periodo, fechado, dados) VALUES (?, ?, ?, ?)",
                              (g["id"], chave, t, json.dumps(numeros(g["id"], max(a, date.fromisoformat(ini)), b))))
                fechou.append((g["id"], chave))
            d += timedelta(days=1)
    return fechou


# ---------- cópias do banco ----------
def faz_copia(destino):
    with db_lock:
        alvo = sqlite3.connect(str(destino))
        try:
            CON.backup(alvo)
        finally:
            alvo.close()


def copia_do_dia():
    pasta = DADOS / "copias"
    pasta.mkdir(exist_ok=True)
    f = pasta / f"grupo-{date.today().isoformat()}.db"
    if not f.exists():
        tmp = f.with_name(f.name + ".tmp")
        faz_copia(tmp)
        os.replace(tmp, f)
        log("cópia do banco:", f.name)
    for velha in sorted(pasta.glob("grupo-*.db"))[:-COPIAS]:
        velha.unlink()


# ---------- mudar de computador (#91) ----------
def mudou():
    """O endereço novo do servidor, se o dono avisou que o grupo mudou de computador; vazio se não."""
    r = q1("SELECT valor FROM servidor WHERE chave = 'mudou'")
    return r["valor"] if r else ""


def muda_para(d):
    end = str(d.get("endereco") or "").strip().rstrip("/")
    if end and not ENDERECO.match(end):
        raise Erro("endereço inválido (ex.: https://notebook.tailXXXX.ts.net)")
    with transacao() as c:
        if end:
            c.execute("INSERT OR REPLACE INTO servidor (chave, valor) VALUES ('mudou', ?)", (end,))
        else:
            c.execute("DELETE FROM servidor WHERE chave = 'mudou'")
    log("mudou para:", end or "(cancelado)")
    return {"ok": True, "mudou": end}


def restaura(corpo):
    """Troca o banco pela cópia de outro computador. Confere o arquivo antes, guarda o banco atual em copias/ e tira da cópia
    o aviso de mudança (uma cópia baixada depois de avisar não pode mandar os membros de volta)."""
    if not corpo.startswith(b"SQLite format 3\x00"):
        raise Erro("o arquivo não é uma cópia do servidor do grupo (o .db de baixar cópia do servidor)")
    tmp = DADOS / f".restaura-{secrets.token_hex(4)}.db"
    try:
        tmp.write_bytes(corpo)
        try:
            c = sqlite3.connect(str(tmp), isolation_level=None)
            try:
                ok = c.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
                tabelas = {r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}
                if "servidor" in tabelas:
                    c.execute("DELETE FROM servidor WHERE chave = 'mudou'")
                c.execute("PRAGMA journal_mode=DELETE")
            finally:
                c.close()
        except sqlite3.DatabaseError:
            ok = False
        if not ok or not {"grupos", "membros", "dias"} <= tabelas:
            raise Erro("a cópia está corrompida ou não é do servidor do grupo")
        with db_lock:
            (DADOS / "copias").mkdir(exist_ok=True)
            faz_copia(DADOS / "copias" / f"antes-de-restaurar-{datetime.now().strftime('%Y-%m-%d-%H%M%S')}.db")
            CON.close()
            for resto in ("grupo.db-wal", "grupo.db-shm"):
                if (DADOS / resto).exists():
                    (DADOS / resto).unlink()
            os.replace(tmp, DADOS / "grupo.db")
            abre_banco()
            LIGADO["id"] = None
            marca_ligado()
    finally:
        if tmp.exists():
            tmp.unlink()
    gs = [{"id": g["id"], "nome": g["nome"]} for g in q("SELECT id, nome FROM grupos ORDER BY criado")]
    log("cópia restaurada:", ", ".join(g["id"] for g in gs) or "sem grupos")
    return {"ok": True, "grupos": gs}


def rotina():
    """A cada minuto: marca que está ligado; a cada 5, fecha os períodos e faz a cópia do dia."""
    n = 0
    while True:
        try:
            marca_ligado()
            if n % 5 == 0:
                for g, p in fecha_periodos():
                    log("fechado:", g, p)
                copia_do_dia()
        except Exception as e:   # banco ocupado ou disco cheio: tenta de novo no próximo minuto
            log("rotina:", repr(e))
        n += 1
        time.sleep(60)


# ---------- grupos, convites e membros ----------
def slug(nome):
    import unicodedata
    s = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:24] or "grupo"
    return s if len(s) > 1 else s + "-g"


def nome_ok(nome, campo="nome"):
    nome = " ".join(str(nome or "").split())
    if not 1 <= len(nome) <= 40:
        raise Erro(f"{campo} precisa de 1 a 40 letras")
    return nome


def novo_convite(c, grupo, admin, membro=None):
    codigo = "".join(secrets.choice(ALFABETO) for _ in range(8))
    t = agora()
    c.execute("INSERT INTO convites (grupo, hash, admin, membro, criado, vence) VALUES (?, ?, ?, ?, ?, ?)",
              (grupo, hash_de(codigo), int(bool(admin)), membro, t, t + CONVITE_DIAS * 86400))
    return codigo


def cria_grupo(d):
    nome = nome_ok(d.get("nome"), "o nome do grupo")
    fuso = fuso_de(d["fuso"]) if d.get("fuso") else fuso_local()
    with transacao() as c:
        base = slug(nome)
        gid, i = base, 2
        while c.execute("SELECT 1 FROM grupos WHERE id = ?", (gid,)).fetchone():
            gid, i = f"{base}-{i}", i + 1
        c.execute("INSERT INTO grupos (id, nome, fuso, criado) VALUES (?, ?, ?, ?)", (gid, nome, fuso, agora()))
        poe_cf(c, gid)
        codigo = novo_convite(c, gid, True)
    log("grupo criado:", gid)
    return {"ok": True, "grupo": {"id": gid, "nome": nome, "fuso": fuso_txt(fuso)}, "convite": codigo}


def grupo_ou_404(gid):
    g = q1("SELECT * FROM grupos WHERE id = ?", (gid,)) if ID_GRUPO.match(gid or "") else None
    if not g:
        raise Erro("grupo não encontrado", 404)
    return g


def freia(gid):
    t = agora()
    v = [x for x in falhas.get(gid, []) if t - x < 600]
    falhas[gid] = v
    if len(v) >= 20:
        raise Erro("muitas tentativas com convite errado; espere 10 minutos", 429)


def entrar(gid, d):
    g = grupo_ou_404(gid)
    freia(gid)
    codigo = re.sub(r"[^A-Z0-9]", "", str(d.get("codigo", "")).upper())
    nome = nome_ok(d.get("nome"))
    avatar = str(d.get("avatar") or "")
    if not AVATAR.match(avatar) or avatar.startswith("."):
        avatar = ""
    token = secrets.token_urlsafe(32)
    with transacao() as c:
        cv = c.execute("SELECT * FROM convites WHERE grupo = ? AND hash = ?", (gid, hash_de(codigo))).fetchone()
        if not cv or cv["usado"] or cv["cancelado"] or cv["vence"] < agora():
            falhas.setdefault(gid, []).append(agora())
            raise Erro("convite inválido, já usado, cancelado ou vencido (peça outro a um admin do grupo)", 403)
        if cv["membro"]:   # reconvite: o mesmo perfil, com o histórico, e um token novo
            m = cv["membro"]
            c.execute("UPDATE membros SET token = ?, nome = ?, avatar = ?, saiu = NULL, admin = MAX(admin, ?) WHERE id = ? AND grupo = ?",
                      (hash_de(token), nome, avatar, cv["admin"], m, gid))
        else:
            m = c.execute("INSERT INTO membros (grupo, nome, avatar, token, admin, entrou) VALUES (?, ?, ?, ?, ?, ?)",
                          (gid, nome, avatar, hash_de(token), cv["admin"], agora())).lastrowid
        c.execute("UPDATE convites SET usado = ? WHERE id = ?", (agora(), cv["id"]))
        admin = c.execute("SELECT admin FROM membros WHERE id = ?", (m,)).fetchone()["admin"]
    log("entrou no grupo", gid, "membro", m)
    return {"ok": True, "token": token, "membro": m, "admin": bool(admin), "grupo": {"id": gid, "nome": g["nome"]}, "protocolo": PROTOCOLO}


def membro_do(gid, token, admin=False):
    m = q1("SELECT * FROM membros WHERE grupo = ? AND token = ? AND saiu IS NULL", (gid, hash_de(token))) if token else None
    if not m:
        raise Erro("você não está neste grupo (o token não vale mais: peça um reconvite a um admin)", 401)
    if admin and not m["admin"]:
        raise Erro("só um admin do grupo pode fazer isso", 403)
    return m


def le_dia(x, g, cat):
    """Um dia do resumo do jogo (servidor.py → envio_do_grupo), validado. None = fora da temporada do grupo. Dos hábitos, fica
    só o que está no catálogo (mesmo arquivado, para um dia reenviado não perder o que já tinha) a partir do desde."""
    if not isinstance(x, dict) or not DIA.match(str(x.get("dia", ""))):
        raise Erro("dia inválido no envio")
    dia = x["dia"]
    date.fromisoformat(dia)
    if (g["ini"] and dia < g["ini"]) or (g["fim"] and dia > g["fim"]) or dia > (hoje_no(g["fuso"]) + timedelta(days=1)).isoformat():
        return None
    xp = x.get("xp", 0)
    if not isinstance(xp, (int, float)) or not 0 <= xp <= 100000:
        raise Erro("XP inválido no envio")
    hab = x.get("hab") or {}
    if not isinstance(hab, dict) or len(hab) > 30:
        raise Erro("hábitos inválidos no envio")
    for k, v in hab.items():
        if not CHAVE_HAB.match(str(k)) or not isinstance(v, (int, float)) or not 0 <= v <= 100000:
            raise Erro("hábitos inválidos no envio")
    hab = {k: (v if cat[k]["fonte"] == "automatico" else int(bool(v))) for k, v in hab.items() if k in cat and dia >= cat[k]["desde"]}
    return (dia, int(round(xp)), json.dumps(hab, sort_keys=True), int(bool(x.get("missao"))), int(bool(x.get("ferias"))))


def envio(gid, token, d):
    g = grupo_ou_404(gid)
    m = membro_do(gid, token)
    if not isinstance(d.get("protocolo"), int) or d["protocolo"] < PROTOCOLO_MIN:
        raise Erro("o seu jogo está numa versão antiga demais para este grupo: atualize o Ganbatte", 426)
    dias = d.get("dias")
    if not isinstance(dias, list) or len(dias) > 800:
        raise Erro("envio inválido")
    cat = {h["id"]: h for h in catalogo(gid, arquivados=True)}
    linhas = [v for v in (le_dia(x, g, cat) for x in dias) if v]
    t = agora()
    with transacao() as c:
        c.executemany("INSERT OR REPLACE INTO dias (grupo, membro, dia, xp, hab, missao, ferias, recebido) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                      [(gid, m["id"]) + v + (t,) for v in linhas])
        c.execute("UPDATE membros SET envio = ? WHERE id = ?", (t, m["id"]))
    return {"ok": True, "gravados": len(linhas), "ignorados": len(dias) - len(linhas)}


def sequencia(ativos, hoje):
    """Dias seguidos com XP até hoje (ou até ontem, se hoje ainda não teve)."""
    d = hoje if hoje.isoformat() in ativos else hoje - timedelta(days=1)
    n = 0
    while d.isoformat() in ativos:
        n, d = n + 1, d - timedelta(days=1)
    return n


def retrato(g):
    """O grupo como a torre.py o lê: os membros, todos os dias guardados, o catálogo, os períodos fechados e a calibração."""
    ms = [{"id": m["id"], "nome": m["nome"]} for m in q("SELECT id, nome FROM membros WHERE grupo = ? AND saiu IS NULL ORDER BY entrou", (g["id"],))]
    dias = {}
    for r in q("SELECT membro, dia, xp, hab, ferias FROM dias WHERE grupo = ?", (g["id"],)):
        dias.setdefault(r["membro"], {})[r["dia"]] = {"xp": r["xp"], "hab": json.loads(r["hab"]), "f": bool(r["ferias"])}
    fech = {r["periodo"]: json.loads(r["dados"]) for r in q("SELECT periodo, dados FROM fechados WHERE grupo = ?", (g["id"],))}
    return torre.Grupo(ms, dias, catalogo(g["id"]), fech, hoje_no(g["fuso"]), g["ini"] or "", g["fim"] or "",
                       json.loads(g["calib"] or "{}"), json.loads(g["placares"] or "{}"))


def frase_da_semana(g, G, eu=None):
    """A frase do líder da última semana fechada (#76): quem mais desceu naquela semana escreve uma vez, e ela fica até a
    semana seguinte fechar."""
    r = q1("SELECT MAX(periodo) AS p FROM fechados WHERE grupo = ? AND periodo LIKE 'semana:%'", (g["id"],))
    if not r or not r["p"]:
        return {"semana": "", "lider": None}
    sem = r["p"]
    a = torre._inicio(sem)
    andares = {m: G.andares_semana(m, a, a + timedelta(days=6)) for m in G.ids}
    lider = max(G.ids, key=lambda m: (andares[m], -G.ids.index(m))) if andares and max(andares.values()) > 0 else None
    f = q1("SELECT * FROM frases WHERE grupo = ? AND semana = ?", (g["id"], sem))
    out = {"semana": sem[7:], "lider": lider, "andares": andares.get(lider), "limite": int(G.calib["frase_max"]),
           "texto": f["texto"] if f and not f["apagada"] else "", "escrita": f["criado"] if f else None, "apagada": bool(f and f["apagada"])}
    out["pode_escrever"] = bool(eu and lider == eu and not f)
    return out


def frase(gid, token, d):
    g = grupo_ou_404(gid)
    eu = membro_do(gid, token)
    G = retrato(g)
    f = frase_da_semana(g, G, eu["id"])
    if f["lider"] != eu["id"]:
        raise Erro("só o líder da última semana fechada escreve a frase", 403)
    if not f["pode_escrever"]:
        raise Erro("você já escreveu a frase desta semana (dá uma vez só)", 409)
    texto = " ".join(str(d.get("texto") or "").split())
    if not 1 <= len(texto) <= f["limite"]:
        raise Erro(f"a frase precisa de 1 a {f['limite']} letras")
    with transacao() as c:
        if c.execute("SELECT 1 FROM frases WHERE grupo = ? AND semana = ?", (gid, "semana:" + f["semana"])).fetchone():
            raise Erro("você já escreveu a frase desta semana (dá uma vez só)", 409)
        c.execute("INSERT INTO frases (grupo, semana, membro, texto, criado) VALUES (?, ?, ?, ?, ?)", (gid, "semana:" + f["semana"], eu["id"], texto, agora()))
    return {"ok": True, "frase": frase_da_semana(g, retrato(g), eu["id"])}


def placar(gid, token):
    """Os fatos (quem está no grupo, quando sincronizou e, por dia, se teve XP, o Codeforces e os hábitos do grupo) e a
    Torre Trick calculada a partir deles (torre.calcula). O XP de cada um não aparece: o placar público nunca compara XP
    de tarefa entre pessoas, só os andares (o XP com teto, em tetos)."""
    g = grupo_ou_404(gid)
    eu = membro_do(gid, token)
    hoje = hoje_no(g["fuso"])
    ini = hoje - timedelta(days=JANELA - 1)
    cat = catalogo(gid)
    vale = {h["id"] for h in cat}
    membros = []
    for m in q("SELECT * FROM membros WHERE grupo = ? AND saiu IS NULL ORDER BY entrou", (gid,)):
        dias, ativos = {}, set()
        for r in q("SELECT dia, xp, hab, missao FROM dias WHERE grupo = ? AND membro = ? AND dia >= ?", (gid, m["id"], ini.isoformat())):
            f = {k: v for k, v in json.loads(r["hab"]).items() if v and k in vale}
            if r["xp"] > 0:
                f["a"] = 1
                ativos.add(r["dia"])
            if r["missao"]:
                f["m"] = 1
            if f:
                dias[r["dia"]] = f
        com_xp = q1("SELECT COUNT(*) AS n FROM dias WHERE grupo = ? AND membro = ? AND xp > 0", (gid, m["id"]))["n"]
        membros.append({"id": m["id"], "nome": m["nome"], "avatar": m["avatar"], "admin": bool(m["admin"]), "envio": m["envio"],
                        "sequencia": sequencia(ativos, hoje), "dias_com_xp": com_xp, "dias": dias})
    fechado = q1("SELECT MAX(periodo) AS p FROM fechados WHERE grupo = ? AND periodo LIKE 'dia:%'", (gid,))["p"]
    G = retrato(g)
    t = torre.calcula(G)
    t.pop("config")
    t["frase"] = frase_da_semana(g, G, eu["id"])
    return {"ok": True, "grupo": {"id": gid, "nome": g["nome"], "fuso": fuso_txt(g["fuso"]), "ini": g["ini"] or "", "fim": g["fim"] or ""},
            "hoje": hoje.isoformat(), "janela": ini.isoformat(), "fechado_ate": fechado[4:] if fechado else "",
            "voce": {"membro": eu["id"], "admin": bool(eu["admin"])}, "habitos": cat, "membros": membros, "torre": t, "protocolo": PROTOCOLO}


def sair(gid, token):
    m = membro_do(gid, token)
    with transacao() as c:
        if m["admin"] and c.execute("SELECT COUNT(*) FROM membros WHERE grupo = ? AND admin = 1 AND saiu IS NULL", (gid,)).fetchone()[0] == 1 \
                and c.execute("SELECT COUNT(*) FROM membros WHERE grupo = ? AND saiu IS NULL", (gid,)).fetchone()[0] > 1:
            raise Erro("você é o único admin: passe o poder a outro membro antes de sair")
        c.execute("UPDATE membros SET saiu = ?, token = NULL WHERE id = ?", (agora(), m["id"]))
    return {"ok": True}


def admin_ver(gid, token):
    g = grupo_ou_404(gid)
    membro_do(gid, token, admin=True)
    ms = [{"id": m["id"], "nome": m["nome"], "admin": bool(m["admin"]), "entrou": m["entrou"], "envio": m["envio"], "saiu": m["saiu"]}
          for m in q("SELECT * FROM membros WHERE grupo = ? ORDER BY entrou", (gid,))]
    cs = [{"id": c["id"], "admin": bool(c["admin"]), "membro": c["membro"], "criado": c["criado"], "vence": c["vence"]}
          for c in q("SELECT * FROM convites WHERE grupo = ? AND usado IS NULL AND cancelado = 0 AND vence > ? ORDER BY criado", (gid, agora()))]
    G = retrato(g)
    nomes = {m["id"]: m["nome"] for m in ms}
    fr = [{"semana": f["semana"][7:], "membro": f["membro"], "nome": nomes.get(f["membro"], "?"), "texto": f["texto"], "apagada": bool(f["apagada"])}
          for f in q("SELECT * FROM frases WHERE grupo = ? ORDER BY semana DESC LIMIT 10", (gid,))]
    return {"ok": True, "grupo": {"id": gid, "nome": g["nome"], "fuso": fuso_txt(g["fuso"]), "ini": g["ini"] or "", "fim": g["fim"] or ""},
            "membros": ms, "convites": cs, "habitos": catalogo(gid, arquivados=True),
            "calibracao": {"valores": G.calib, "padrao": torre.CALIB, "limites": torre.CALIB_LIMITES},
            "placares": [{k: s[k] for k in ("id", "nome", "on", "per", "pers")} for s in G.specs()], "frases": fr}


def admin_convite(gid, token, d):
    grupo_ou_404(gid)
    membro_do(gid, token, admin=True)
    alvo = d.get("membro")
    with transacao() as c:
        if alvo is not None and not c.execute("SELECT 1 FROM membros WHERE id = ? AND grupo = ?", (alvo, gid)).fetchone():
            raise Erro("membro não encontrado")
        codigo = novo_convite(c, gid, bool(d.get("admin")), alvo)
    return {"ok": True, "codigo": codigo, "vence_em_dias": CONVITE_DIAS}


def admin_cancelar(gid, token, d):
    membro_do(gid, token, admin=True)
    with transacao() as c:
        n = c.execute("UPDATE convites SET cancelado = 1 WHERE id = ? AND grupo = ? AND usado IS NULL", (d.get("convite"), gid)).rowcount
    if not n:
        raise Erro("convite não encontrado ou já usado")
    return {"ok": True}


def admin_membro(gid, token, d):
    eu = membro_do(gid, token, admin=True)
    with transacao() as c:
        m = c.execute("SELECT * FROM membros WHERE id = ? AND grupo = ?", (d.get("membro"), gid)).fetchone()
        if not m:
            raise Erro("membro não encontrado")
        if d.get("remover"):
            c.execute("UPDATE membros SET saiu = ?, token = NULL, admin = 0 WHERE id = ?", (agora(), m["id"]))
        elif "admin" in d:
            c.execute("UPDATE membros SET admin = ? WHERE id = ?", (int(bool(d["admin"])), m["id"]))
        if not c.execute("SELECT COUNT(*) FROM membros WHERE grupo = ? AND admin = 1 AND saiu IS NULL", (gid,)).fetchone()[0]:
            raise Erro("o grupo precisa de pelo menos um admin")
    log("admin", eu["id"], "mudou o membro", m["id"], "no grupo", gid)
    return {"ok": True}


def admin_config(gid, token, d):
    grupo_ou_404(gid)
    membro_do(gid, token, admin=True)
    mud = {}
    if "nome" in d:
        mud["nome"] = nome_ok(d["nome"], "o nome do grupo")
    if "fuso" in d:
        mud["fuso"] = fuso_de(d["fuso"])
    for k in ("ini", "fim"):
        if k in d:
            v = str(d[k] or "")
            if v and not DIA.match(v):
                raise Erro("data inválida (use AAAA-MM-DD)")
            mud[k] = v or None
    if mud.get("ini") and mud.get("fim") and mud["ini"] > mud["fim"]:
        raise Erro("o início da temporada vem depois do fim")
    with transacao() as c:
        for k, v in mud.items():
            c.execute(f"UPDATE grupos SET {k} = ? WHERE id = ?", (v, gid))
    return admin_ver(gid, token)


def admin_calibracao(gid, token, d):
    """{valores: {chave: número}}: os números da Torre Trick (#42). Mudar recalcula o que está aberto; o teto e os períodos
    fechados ficam como estavam (#40)."""
    g = grupo_ou_404(gid)
    eu = membro_do(gid, token, admin=True)
    v = d.get("valores")
    if not isinstance(v, dict) or not v:
        raise Erro("nada para mudar")
    atual = json.loads(g["calib"] or "{}")
    for k, x in v.items():
        if k not in torre.CALIB_LIMITES:
            raise Erro(f"número desconhecido: {k}")
        lo, hi = torre.CALIB_LIMITES[k]
        if not isinstance(x, (int, float)) or isinstance(x, bool) or not lo <= x <= hi:
            raise Erro(f"{k} precisa ficar entre {torre.num(lo, 2)} e {torre.num(hi, 2)}")
        atual[k] = int(x) if k == "frase_max" else float(x)
    with transacao() as c:
        c.execute("UPDATE grupos SET calib = ? WHERE id = ?", (json.dumps(atual, sort_keys=True), gid))
    log("admin", eu["id"], "mudou a calibração do grupo", gid)
    return admin_ver(gid, token)


def admin_placar(gid, token, d):
    """{id, on?, per?}: liga, desliga ou muda o período de um placar específico (#67), sem lançar versão."""
    g = grupo_ou_404(gid)
    membro_do(gid, token, admin=True)
    s = next((x for x in retrato(g).specs() if x["id"] == d.get("id")), None)
    if not s:
        raise Erro("placar não encontrado")
    cfg = json.loads(g["placares"] or "{}")
    c_ = cfg.setdefault(s["id"], {})
    if "on" in d:
        c_["on"] = bool(d["on"])
    if "per" in d:
        if d["per"] not in s["pers"]:
            raise Erro("período inválido para este placar")
        c_["per"] = d["per"]
    with transacao() as c:
        c.execute("UPDATE grupos SET placares = ? WHERE id = ?", (json.dumps(cfg, sort_keys=True), gid))
    return admin_ver(gid, token)


def admin_frase(gid, token, d):
    """{semana}: apaga a frase de uma semana (#76). Ela some do placar e o líder não escreve outra."""
    grupo_ou_404(gid)
    eu = membro_do(gid, token, admin=True)
    with transacao() as c:
        n = c.execute("UPDATE frases SET apagada = ? WHERE grupo = ? AND semana = ? AND apagada IS NULL", (agora(), gid, "semana:" + str(d.get("semana", "")))).rowcount
    if not n:
        raise Erro("frase não encontrada")
    log("admin", eu["id"], "apagou a frase da semana", d.get("semana"), "no grupo", gid)
    return admin_ver(gid, token)


# ---------- catálogo de hábitos do grupo (#41) ----------
def poe_cf(c, gid):
    c.execute("INSERT OR IGNORE INTO habitos (grupo, id, nome, fonte, desde, criado) VALUES (?, 'cf', ?, 'automatico', '', ?)",
              (gid, HAB_AUTO["cf"], agora()))


def catalogo(gid, arquivados=False):
    """[{id, nome, fonte, desde, removido?}] na ordem de criação. desde vazio = desde sempre (os automáticos)."""
    out = []
    for h in q("SELECT * FROM habitos WHERE grupo = ? ORDER BY criado, id", (gid,)):
        if h["removido"] and not arquivados:
            continue
        x = {"id": h["id"], "nome": h["nome"], "fonte": h["fonte"], "desde": h["desde"]}
        if arquivados:
            x["removido"] = bool(h["removido"])
        out.append(x)
    return out


def admin_habito(gid, token, d):
    g = grupo_ou_404(gid)
    eu = membro_do(gid, token, admin=True)
    with transacao() as c:
        if "id" in d:
            h = c.execute("SELECT * FROM habitos WHERE grupo = ? AND id = ?", (gid, str(d["id"]))).fetchone()
            if not h:
                raise Erro("hábito não encontrado")
            volta = not d.get("remover")
            if volta and h["removido"] and c.execute("SELECT COUNT(*) FROM habitos WHERE grupo = ? AND removido IS NULL", (gid,)).fetchone()[0] >= HAB_MAX:
                raise Erro(f"o grupo já tem {HAB_MAX} hábitos")
            c.execute("UPDATE habitos SET removido = ? WHERE grupo = ? AND id = ?", (None if volta else agora(), gid, h["id"]))
        else:
            nome = nome_ok(d.get("nome"), "o nome do hábito")
            if c.execute("SELECT COUNT(*) FROM habitos WHERE grupo = ? AND removido IS NULL", (gid,)).fetchone()[0] >= HAB_MAX:
                raise Erro(f"o grupo já tem {HAB_MAX} hábitos")
            base = slug(nome)[:36]
            if base in HAB_AUTO:
                base += "-h"
            hid, i = base, 2
            while True:
                h = c.execute("SELECT * FROM habitos WHERE grupo = ? AND id = ?", (gid, hid)).fetchone()
                if not h:
                    break
                if h["removido"] and h["fonte"] == "vinculo" and h["nome"] == nome:   # o mesmo de antes: volta, com o histórico
                    c.execute("UPDATE habitos SET removido = NULL WHERE grupo = ? AND id = ?", (gid, hid))
                    break
                if not h["removido"] and h["nome"].lower() == nome.lower():
                    raise Erro("o grupo já tem um hábito com esse nome")
                hid, i = f"{base}-{i}", i + 1
            if not h:
                c.execute("INSERT INTO habitos (grupo, id, nome, fonte, desde, criado) VALUES (?, ?, ?, 'vinculo', ?, ?)",
                          (gid, hid, nome, hoje_no(g["fuso"]).isoformat(), agora()))
    log("admin", eu["id"], "mudou o catálogo de hábitos do grupo", gid)
    return admin_ver(gid, token)


# ---------- HTTP ----------
PAGINA = """<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ganbatte · grupo</title><body style="font:16px/1.5 system-ui,sans-serif;max-width:560px;margin:48px auto;padding:0 16px;color:#222;background:#fafafa">
<h1 style="font-size:22px">Servidor de grupo do Ganbatte</h1>
<p>Recebeu um convite? Copie o link inteiro e cole no seu jogo, em <b>Configurações → grupo</b>. Não precisa de conta nem de senha.</p>
<p style="color:#666;font-size:14px">Ainda não joga? Veja como instalar em <a href="https://github.com/CaioParanaiba/ganbatte">github.com/CaioParanaiba/ganbatte</a>.</p></body></html>"""


class H(BaseHTTPRequestHandler):
    server_version = APP + "/" + jogo.VERSAO

    def log_message(self, fmt, *a):
        pass

    def _resp(self, code, body, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, code, obj):
        self._resp(code, json.dumps(obj, ensure_ascii=False).encode(), "application/json; charset=utf-8")

    def _token(self):
        a = self.headers.get("Authorization", "")
        return a[7:].strip() if a.startswith("Bearer ") else ""

    def _dono(self):
        if not hmac.compare_digest(self._token().encode(), token_dono().encode()):
            raise Erro("só o dono do servidor (o jogo da máquina do servidor) pode fazer isso", 403)

    def _corpo(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > 2_000_000:
            raise Erro("corpo grande demais", 413)
        d = json.loads(self.rfile.read(n) or b"{}")
        if not isinstance(d, dict):
            raise Erro("JSON inválido")
        return d

    def _bruto(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > BANCO_MAX:
            raise Erro("cópia grande demais", 413)
        return self.rfile.read(n)

    def _rota(self, metodo):
        caminho = urllib.parse.unquote(self.path.split("?", 1)[0]).rstrip("/") or "/"
        p = caminho.strip("/").split("/")
        if metodo == "GET" and caminho == "/api/ping":
            return self._json(200, {"ok": True, "app": APP, "versao": jogo.VERSAO, "protocolo": PROTOCOLO})
        if metodo == "GET" and (caminho == "/" or (len(p) == 2 and p[0] == "g")):
            return self._resp(200, PAGINA.encode(), "text/html; charset=utf-8")
        if p[0] == "dono":
            self._dono()
            if metodo == "GET" and caminho == "/dono":
                gs = [{"id": g["id"], "nome": g["nome"], "fuso": fuso_txt(g["fuso"]),
                       "membros": q1("SELECT COUNT(*) AS n FROM membros WHERE grupo = ? AND saiu IS NULL", (g["id"],))["n"]}
                      for g in q("SELECT * FROM grupos ORDER BY criado")]
                return self._json(200, {"ok": True, "grupos": gs, "versao": jogo.VERSAO, "dados": str(DADOS), "mudou": mudou()})
            if metodo == "GET" and caminho == "/dono/copia":
                f = DADOS / f".copia-{secrets.token_hex(4)}.db"
                try:
                    faz_copia(f)
                    body = f.read_bytes()
                finally:
                    if f.exists():
                        f.unlink()
                return self._resp(200, body, "application/vnd.sqlite3")
            if metodo == "POST" and caminho == "/dono/restaurar":
                return self._json(200, restaura(self._bruto()))
            if metodo == "POST" and caminho == "/dono/mudar":
                return self._json(200, muda_para(self._corpo()))
            if metodo == "POST" and caminho == "/dono/grupo":
                return self._json(200, cria_grupo(self._corpo()))
            if metodo == "POST" and caminho == "/dono/convite":
                gid = grupo_ou_404(str(self._corpo().get("grupo", "")))["id"]
                with transacao() as c:
                    return self._json(200, {"ok": True, "convite": novo_convite(c, gid, True)})
        if len(p) >= 3 and p[0] == "g":
            novo = mudou()
            if novo:   # o grupo foi para outro computador: o jogo do membro passa a falar com o novo
                return self._json(410, {"ok": False, "error": f"o grupo mudou de servidor: agora fica em {novo}", "mudou": novo})
            gid, resto, tk = p[1], "/".join(p[2:]), self._token()
            if metodo == "GET":
                fn = {"placar": lambda: placar(gid, tk), "admin": lambda: admin_ver(gid, tk)}.get(resto)
            else:
                d = self._corpo()
                fn = {"entrar": lambda: entrar(gid, d), "envio": lambda: envio(gid, tk, d), "sair": lambda: sair(gid, tk), "frase": lambda: frase(gid, tk, d),
                      "admin/convite": lambda: admin_convite(gid, tk, d), "admin/cancelar": lambda: admin_cancelar(gid, tk, d),
                      "admin/membro": lambda: admin_membro(gid, tk, d), "admin/config": lambda: admin_config(gid, tk, d),
                      "admin/habito": lambda: admin_habito(gid, tk, d), "admin/calibracao": lambda: admin_calibracao(gid, tk, d),
                      "admin/placar": lambda: admin_placar(gid, tk, d), "admin/frase": lambda: admin_frase(gid, tk, d)}.get(resto)
            if fn:
                return self._json(200, fn())
        raise Erro("não encontrado", 404)

    def _trata(self, metodo):
        try:
            self._rota(metodo)
        except Erro as e:
            self._json(e.code, {"ok": False, "error": str(e)})
        except (ValueError, UnicodeDecodeError):
            self._json(400, {"ok": False, "error": "JSON inválido"})
        except Exception as e:
            log("erro:", repr(e))
            self._json(500, {"ok": False, "error": "erro interno no servidor do grupo"})

    def do_GET(self):
        self._trata("GET")

    def do_POST(self):
        self._trata("POST")


def comando_fundo(porta, dados):
    exe = Path(sys.executable)
    if jogo.sistema() == "windows" and exe.with_name("pythonw.exe").exists():
        exe = exe.with_name("pythonw.exe")
    return [str(exe), str(Path(__file__).resolve()), "--fundo", "--porta", str(porta), "--dados", str(dados)]


DESC = "Ganbatte (servidor do grupo)"


def instala(porta, dados):
    """Sobe junto com a máquina (o grupo não cai quando o host fecha o jogo) e liga agora."""
    cmd = comando_fundo(porta, dados)
    jogo.auto_ligar(APP, cmd, DESC)
    jogo.iniciar_fundo(APP, cmd)


def vigia_codigo(srv):
    """git pull com o servidor ligado: ele se reinicia com o código novo (como o do jogo)."""
    f = Path(__file__).resolve()
    antes = f.stat().st_mtime
    while True:
        time.sleep(20)
        try:
            if f.stat().st_mtime != antes:
                compile(f.read_text(encoding="utf-8"), str(f), "exec")
                log("código novo do servidor do grupo: reiniciando")
                srv.recarregar = True
                srv.shutdown()
                return
        except (OSError, SyntaxError, ValueError):
            pass


def pasta_padrao():
    return Path(jogo.env("GRUPO_DADOS") or Path.home() / ".ganbatte-grupo")


def main():
    global DADOS
    ap = argparse.ArgumentParser(description="Ganbatte: servidor do grupo (Associação)")
    ap.add_argument("--porta", type=int, default=int(jogo.env("GRUPO_PORTA") or PORTA))
    ap.add_argument("--dados", default=str(pasta_padrao()), help="pasta do servidor (padrão: ~/.ganbatte-grupo)")
    ap.add_argument("--instalar", action="store_true", help="inicia o servidor do grupo junto com o computador, em segundo plano")
    ap.add_argument("--desinstalar", action="store_true", help="deixa de iniciar junto com o computador")
    ap.add_argument("--fundo", action="store_true", help=argparse.SUPPRESS)
    a = ap.parse_args()
    if sys.version_info < (3, 8):
        sys.exit("Precisa do Python 3.8 ou mais novo.")
    DADOS = Path(a.dados).expanduser().resolve()
    DADOS.mkdir(parents=True, exist_ok=True)
    if a.instalar or a.desinstalar:
        try:
            if a.desinstalar:
                jogo.auto_desligar(APP)
                return print("Pronto: o servidor do grupo não inicia mais com o computador (se estiver rodando, continua até reiniciar).")
            instala(a.porta, DADOS)
            return print(f"Pronto: o servidor do grupo roda em segundo plano na porta {a.porta} e inicia com o computador. Dados em {DADOS}")
        except (jogo.Erro, OSError) as e:
            sys.exit(f"Não deu: {e}")
    if a.fundo:
        f = DADOS / "servidor-grupo.log"
        if f.exists() and f.stat().st_size > 1_000_000:
            f.unlink()
        sys.stdout = sys.stderr = open(f, "a", encoding="utf-8", buffering=1)
    abre_banco()
    token_dono()
    try:
        srv = ThreadingHTTPServer(("127.0.0.1", a.porta), H)
    except OSError:
        sys.exit(0 if a.fundo else f"A porta {a.porta} está ocupada (o servidor do grupo já está rodando?). Outra porta: --porta 8644")
    srv.recarregar = False
    marca_ligado()
    threading.Thread(target=rotina, daemon=True).start()
    threading.Thread(target=vigia_codigo, args=(srv,), daemon=True).start()
    print(f"Ganbatte · servidor do grupo em http://127.0.0.1:{a.porta}/ (só nesta máquina; o host o expõe pelo Tailscale Funnel)")
    print(f"Dados: {DADOS}")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor do grupo parado.")
        return
    if srv.recarregar:
        srv.server_close()
        os.execv(sys.executable, [sys.executable, str(Path(__file__).resolve())] + sys.argv[1:])


if __name__ == "__main__":
    main()
