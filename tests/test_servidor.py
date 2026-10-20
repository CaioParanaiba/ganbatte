"""Testes do servidor.py (#12). Rodam com um comando, na pasta do jogo:  python3 -m unittest discover tests

Cada teste usa uma pasta de dados temporária (nunca a ~/.ganbatte) e um "hoje" fixo; o que iria para a internet
(Codeforces, Duolingo, GitHub) é trocado por respostas prontas. Só a biblioteca padrão, como o servidor.
"""
import json
import os
import sys
import tempfile
import time
import unittest
from datetime import date, timedelta
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import servidor as s  # noqa: E402

HOJE = date(2026, 10, 12)
TEMPORADA = "temporada | 2026-2 | 2026-10-01 | 2026-12-15 | 2027-02-20\n"


class Base(unittest.TestCase):
    """Pasta de dados vazia, hoje = 12/10/2026, temporada desde 01/10 e um jogador com um hábito diário."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        s.DADOS = s.TODO_DIR = Path(self.tmp.name)
        s.undo_stack.clear()
        for v in (s.cf_vivo, s.duo_vivo, s.contrib_vivo):
            v.update(t=time.time(), rodando=False)   # nenhuma thread de rede sai sozinha durante o teste
        p = mock.patch.object(s, "hoje", lambda: HOJE)
        p.start()
        self.addCleanup(p.stop)
        self.addCleanup(self.tmp.cleanup)
        s.gravar_txt("avaliacoes.txt", TEMPORADA)
        self.jogador({})

    def jogador(self, extra):
        j = {"configurado": True, "nome": "Teste", "tags": {}, "habitos": [{"id": "h-leitura", "n": "Leitura"}]}
        j.update(extra)
        s.gravar_json("jogador.json", j)

    def todo(self):
        return [l for l in s.ler() if l]

    def done(self):
        return [l for l in s.ler("done.txt") if l]


class Dia(Base):
    def test_cria_os_habitos_de_hoje(self):
        s.arruma_dia()
        self.assertEqual(self.todo(), ["2026-10-12 Leitura +rotina rec:h-leitura:2026-10-12"])

    def test_virada_do_dia(self):
        """Concluída de ontem vai para o done.txt; recorrente aberta de ontem some (hábito perdido não pune)."""
        s.gravar(["x 2026-10-11 2026-10-11 Leitura +rotina rec:h-leitura:2026-10-11",
                  "2026-10-10 Leitura +rotina rec:h-leitura:2026-10-10", "2026-10-09 Tarefa solta", ""])
        s.arruma_dia()
        self.assertEqual(self.done(), ["x 2026-10-11 2026-10-11 Leitura +rotina rec:h-leitura:2026-10-11"])
        self.assertEqual(self.todo(), ["2026-10-09 Tarefa solta", "2026-10-12 Leitura +rotina rec:h-leitura:2026-10-12"])

    def test_refazer_mantem_o_que_ja_foi_marcado(self):
        s.gravar(["x 2026-10-12 2026-10-12 Leitura +rotina rec:h-leitura:2026-10-12", ""])
        self.jogador({"habitos": [{"id": "h-leitura", "n": "Leitura (20 min)"}]})
        s.arruma_dia(refazer=True)
        self.assertEqual(self.todo(), ["x 2026-10-12 2026-10-12 Leitura (20 min) +rotina rec:h-leitura:2026-10-12"])

    def test_semanal_some_com_a_meta_cumprida(self):
        self.jogador({"habitos": [{"id": "h-academia", "n": "Academia", "semana": 1}]})
        s.gravar_txt("done.txt", "x 2026-10-12 2026-10-12 Academia +rotina rec:h-academia:2026-10-12\n")   # segunda
        with mock.patch.object(s, "hoje", lambda: HOJE + timedelta(days=2)):   # quarta da mesma semana
            s.arruma_dia()
        self.assertEqual(self.todo(), [])

    def test_codeforces_e_duolingo_ligados(self):
        self.jogador({"cf": {"handle": "tourist", "meta": 2}, "duo": {"usuario": "luis"}})
        s.arruma_dia()
        self.assertIn("(A) 2026-10-12 Codeforces 2 questões +rotina rec:cf:2026-10-12", self.todo())
        self.assertIn("2026-10-12 Duolingo +rotina rec:duo:2026-10-12", self.todo())

    def test_esqueci_de_marcar_ontem(self):
        s.api_ontem({"id": "h-leitura"})
        self.assertIn("x 2026-10-11 2026-10-11 Leitura +rotina rec:h-leitura:2026-10-11", self.done())
        with self.assertRaises(s.Erro):
            s.api_ontem({"id": "h-leitura"})


class Tarefas(Base):
    def test_adicionar_concluir_desfazer(self):
        s.api_add({"text": "(b) Lista 3 due:15/10"})
        linha = "(B) 2026-10-12 Lista 3 due:2026-10-15"
        self.assertIn(linha, self.todo())
        s.api_act({"raw": linha, "action": "done"})
        self.assertIn("x 2026-10-12 2026-10-12 Lista 3 due:2026-10-15", self.todo())
        s.api_undo({})
        self.assertIn(linha, self.todo())

    def test_data_invalida(self):
        with self.assertRaises(s.Erro):
            s.api_add({"text": "Prova due:31/02"})

    def test_reabrir_do_done(self):
        """#27: a etapa que já foi para o done.txt volta aberta; o XP dela sai do dia gravado; desfazer devolve."""
        raw = "x 2026-10-05 2026-10-04 Etapa 1 +cac.app"
        s.gravar_txt("done.txt", raw + "\n")
        s.gravar_json("estado.json", {"xpDias": {"2026-10-05": 40}})
        s.api_reabre({"raw": raw, "xp": 15})
        self.assertEqual(self.done(), [])
        self.assertIn("2026-10-04 Etapa 1 +cac.app", self.todo())
        self.assertEqual(s.ler_json("estado.json", {})["xpDias"]["2026-10-05"], 25)
        s.api_undo({})
        self.assertEqual(self.done(), [raw])
        self.assertNotIn("2026-10-04 Etapa 1 +cac.app", self.todo())

    def test_nao_reabre_habito_nem_linha_que_mudou(self):
        rec = "x 2026-10-05 2026-10-05 Leitura +rotina rec:h-leitura:2026-10-05"
        s.gravar_txt("done.txt", rec + "\n")
        with self.assertRaises(s.Erro):
            s.api_reabre({"raw": rec})
        with self.assertRaises(s.Erro):
            s.api_reabre({"raw": "x 2026-10-05 2026-10-05 Não existe"})

    def test_estado_xp_dos_dias_so_sobe(self):
        s.api_jogo_estado({"estado": {"xpDias": {"2026-10-05": 40}}})
        s.api_jogo_estado({"estado": {"xpDias": {"2026-10-05": 10}}})
        self.assertEqual(s.ler_json("estado.json", {})["xpDias"]["2026-10-05"], 40)
        with self.assertRaises(s.Erro):
            s.api_jogo_estado({"estado": {"campo_estranho": 1}})

    def test_estado_recalculo_troca_os_dias(self):   # #126: o recálculo desce e apaga dias; aba antiga não volta os números
        s.api_jogo_estado({"estado": {"xpDias": {"2025-03-01": 10, "2026-10-05": 40}}})
        rc = {"recalculo": {"ini": "2026-08-10", "em": "2026-10-15", "antes": 50, "depois": 25}}
        s.api_jogo_estado({"estado": {"xpDias": {"2026-10-05": 25}, "migra": rc}})
        self.assertEqual(s.ler_json("estado.json", {})["xpDias"], {"2026-10-05": 25})
        s.api_jogo_estado({"estado": {"xpDias": {"2025-03-01": 10, "2026-10-05": 40}, "migra": {"0.6.4": {"xp": 0}}}})
        e = s.ler_json("estado.json", {})
        self.assertEqual(e["xpDias"], {"2026-10-05": 25})
        self.assertEqual(e["migra"]["recalculo"], rc["recalculo"])
        s.api_jogo_estado({"estado": {"xpDias": {"2026-10-05": 30, "2026-10-06": 12}, "migra": rc}})
        self.assertEqual(s.ler_json("estado.json", {})["xpDias"], {"2026-10-05": 30, "2026-10-06": 12})

    def test_registro_de_compras_so_cresce(self):
        """Uma aba antiga, sem a compra que a outra gravou, não apaga essa compra do registro."""
        a = {"d": "2026-10-10", "h": "10:00:00", "tipo": "cos", "id": "pal-gon", "j": 800}
        b = {"d": "2026-10-11", "h": "09:00:00", "tipo": "premio", "id": "premio", "j": 250}
        s.api_jogo_estado({"estado": {"spent": 1050, "compras": [a, b]}})
        s.api_jogo_estado({"estado": {"spent": 800, "compras": [a]}})
        self.assertEqual(s.ler_json("estado.json", {})["compras"], [a, b])
        with self.assertRaises(s.Erro):
            s.api_jogo_estado({"estado": {"compras": [{"d": "ontem", "tipo": "cos", "id": "x", "j": 1}]}})


class Recorrentes(Base):
    """#113: tarefa com rep: (hoje = segunda, 12/10/2026). Concluir cria a próxima; a fixa conta do prazo, a outra da conclusão."""

    def concluir(self, linha):
        s.gravar([linha, ""])
        s.api_act({"raw": linha, "action": "done"})
        return [l for l in self.todo() if not l.startswith("x ")]

    def test_sem_prazo_ganha_a_primeira_data(self):
        s.api_add({"text": "Pagar aluguel rep:MES-1"})
        s.api_add({"text": "Ligar para a avó rep:sem-seg"})
        s.api_add({"text": "Trocar a escova rep:+3mes"})
        self.assertEqual(self.todo(), ["2026-10-12 Pagar aluguel rep:mes-1 due:2026-11-01",
                                       "2026-10-12 Ligar para a avó rep:sem-seg due:2026-10-12",
                                       "2026-10-12 Trocar a escova rep:+3mes due:2026-10-12"])
        for ruim in ("X rep:mes-32", "X rep:+0d", "X rep:ano-02-30", "X rep:mes-1 rep:mes-2", "X rep:todo-dia"):
            with self.assertRaises(s.Erro):
                s.api_add({"text": ruim})

    def test_fixa_conta_do_prazo(self):
        """Atrasada: a próxima é a data seguinte da regra; antes do prazo: a seguinte ao prazo, não a de hoje."""
        self.assertEqual(self.concluir("(A) 2026-09-20 Aluguel rep:mes-1 due:2026-10-01"), ["(A) 2026-10-12 Aluguel rep:mes-1 due:2026-11-01"])
        self.assertEqual(self.concluir("2026-10-01 Aluguel rep:mes-1 due:2026-11-01"), ["2026-10-12 Aluguel rep:mes-1 due:2026-12-01"])
        self.assertEqual(self.concluir("2026-08-20 Aluguel rep:mes-1 due:2026-09-01"), ["2026-10-12 Aluguel rep:mes-1 due:2026-11-01"])
        self.assertEqual(self.concluir("2026-09-20 Dentista rep:6mes-1 due:2026-10-01"), ["2026-10-12 Dentista rep:6mes-1 due:2027-04-01"])
        self.assertEqual(self.concluir("2026-10-01 Lixo rep:sem-seg due:2026-10-12"), ["2026-10-12 Lixo rep:sem-seg due:2026-10-19"])

    def test_depois_de_concluir_conta_da_conclusao(self):
        self.assertEqual(self.concluir("2026-09-20 Regar rep:+10d due:2026-10-05"), ["2026-10-12 Regar rep:+10d due:2026-10-22"])
        self.assertEqual(self.concluir("2026-09-20 Regar rep:+2sem due:2026-10-20"), ["2026-10-12 Regar rep:+2sem due:2026-10-26"])

    def test_dia_que_nao_existe_vai_para_baixo(self):
        r = s.rep_regra("mes-31")
        self.assertEqual(s.rep_passo(r, date(2026, 10, 31)), date(2026, 11, 30))
        self.assertEqual(s.rep_passo(r, date(2026, 11, 30)), date(2026, 12, 31))
        self.assertEqual(s.rep_passo(s.rep_regra("ano-02-29"), date(2026, 3, 1)), date(2027, 2, 28))
        self.assertEqual(s.rep_proxima(s.rep_regra("+1mes"), None, date(2027, 1, 31)), date(2027, 2, 28))

    def test_desfazer_e_reabrir_tiram_a_proxima(self):
        linha = "2026-09-20 Aluguel rep:mes-1 due:2026-10-01"
        self.concluir(linha)
        s.api_undo({})
        self.assertEqual(self.todo(), [linha])
        self.concluir(linha)
        s.api_act({"raw": "x 2026-10-12 2026-09-20 Aluguel rep:mes-1 due:2026-10-01", "action": "reopen"})
        self.assertEqual(self.todo(), [linha])
        s.api_undo({})
        self.assertEqual(sorted(self.todo()), sorted(["x 2026-10-12 2026-09-20 Aluguel rep:mes-1 due:2026-10-01",
                                                      "2026-10-12 Aluguel rep:mes-1 due:2026-11-01"]))

    def test_reabrir_do_done_tira_a_proxima(self):
        raw = "x 2026-10-05 2026-09-20 Regar rep:+10d due:2026-10-04"
        s.gravar_txt("done.txt", raw + "\n")
        s.gravar(["2026-10-05 Regar rep:+10d due:2026-10-15", ""])
        s.api_reabre({"raw": raw})
        self.assertEqual(self.todo(), ["2026-09-20 Regar rep:+10d due:2026-10-04"])
        s.api_undo({})
        self.assertEqual(self.todo(), ["2026-10-05 Regar rep:+10d due:2026-10-15"])

    def test_pular_vira_a_proxima(self):
        linha = "2026-09-20 Aluguel rep:mes-1 due:2026-10-01"
        s.gravar([linha, ""])
        s.api_act({"raw": linha, "action": "pular"})
        self.assertEqual(self.todo(), ["2026-10-12 Aluguel rep:mes-1 due:2026-11-01"])
        s.gravar(["2026-09-20 Tarefa solta", ""])
        with self.assertRaises(s.Erro):
            s.api_act({"raw": "2026-09-20 Tarefa solta", "action": "pular"})


class Temporada(Base):
    def test_inicio_pela_linha(self):
        self.assertEqual(s.inicio_temporada(), date(2026, 10, 1))

    def test_inicio_sem_a_linha(self):
        s.gravar_txt("avaliacoes.txt", "")
        self.assertEqual(s.inicio_temporada(), HOJE - timedelta(days=183))


class Codeforces(Base):
    def setUp(self):
        super().setUp()
        self.cf = {"handle": "tourist", "meta": 2}
        self.jogador({"cf": self.cf})
        s.arruma_dia()

    def envio(self, dia, prob, ok=True):
        t = time.mktime(date.fromisoformat(dia).timetuple()) + 12 * 3600
        return {"creationTimeSeconds": int(t), "verdict": "OK" if ok else "WRONG_ANSWER", "problem": {"contestId": 1, "index": prob}}

    def test_conta_problemas_distintos_e_conclui_a_meta(self):
        envios = [self.envio("2026-10-12", "A"), self.envio("2026-10-12", "B"), self.envio("2026-10-12", "B"),
                  self.envio("2026-10-11", "C", ok=False)]
        with mock.patch.object(s, "cf_envios", return_value=(envios, True)):
            s.cf_atualiza(self.cf)
        self.assertEqual(s.ler_json("cf.json", {})["por_dia"], {"2026-10-12": 2})
        self.assertTrue(any(l.startswith("x 2026-10-12") and "rec:cf:2026-10-12" in l for l in self.todo()))

    def test_bonus_atrasado_so_desde_que_ligou(self):
        s.gravar_json("cf.json", {"handle": "tourist", "desde": "2026-10-10", "creditados": []})
        envios = [self.envio("2026-10-09", "A"), self.envio("2026-10-09", "B"), self.envio("2026-10-10", "C"), self.envio("2026-10-10", "D")]
        with mock.patch.object(s, "cf_envios", return_value=(envios, True)):
            s.cf_atualiza(self.cf)
        cf = [l for l in self.done() if "rec:cf:" in l]
        self.assertEqual(cf, ["x 2026-10-10 2026-10-10 Codeforces 2 questões +rotina rec:cf:2026-10-10"])


class Duolingo(Base):
    def setUp(self):
        super().setUp()
        self.duo = {"usuario": "luis"}
        self.jogador({"duo": self.duo})
        s.arruma_dia()

    def ler(self, ini, fim, n):
        with mock.patch.object(s, "duo_perfil", return_value={"ini": ini, "fim": fim, "n": n}):
            s.duo_atualiza(self.duo)

    def dias(self):
        return sorted(l.split()[1] for l in self.done() + self.todo() if l.startswith("x ") and "rec:duo:" in l)

    def test_dias_novos(self):
        f = s.duo_dias_novos
        um = {"ini": "2026-10-01", "fim": "2026-10-11", "n": 11}
        self.assertEqual(f(um, {"ini": "2026-10-01", "fim": "2026-10-12", "n": 12}), ["2026-10-12"])
        self.assertEqual(f(um, {"ini": "2026-10-01", "fim": "2026-10-12", "n": 11}), [])   # bloqueio de ofensiva
        self.assertEqual(f(None, {"ini": "2026-10-08", "fim": "2026-10-12", "n": 4}), ["2026-10-12", "2026-10-11", "2026-10-10", "2026-10-09"])
        self.assertEqual(f(um, None), [])

    def test_credita_so_desde_o_inicio_da_temporada(self):
        """A ofensiva começou em setembro; os dias antes de 01/10 (início da temporada) não entram."""
        self.ler("2026-09-20", "2026-10-12", 23)
        dias = self.dias()
        self.assertEqual(dias[0], "2026-10-01")
        self.assertEqual(dias[-1], "2026-10-12")
        self.assertEqual(len(dias), 12)
        self.assertTrue(any(l.startswith("x 2026-10-12") and "rec:duo:2026-10-12" in l for l in self.todo()))

    def test_guarda_desde_quando_esta_ligado(self):
        """O dia em que o usuário foi ligado fica no duo.json (os dias antes dele não dão XP no motor) e não muda depois."""
        self.ler("2026-10-08", "2026-10-12", 5)
        self.assertEqual(s.ler_json("duo.json", {}).get("desde"), "2026-10-12")
        self.ler("2026-10-08", "2026-10-12", 5)
        self.assertEqual(s.duo_leitura(s.jogador())["desde"], "2026-10-12")

    def test_bloqueio_nao_conta_e_nao_repete(self):
        self.ler("2026-10-10", "2026-10-11", 2)
        self.ler("2026-10-10", "2026-10-12", 2)   # o dia 12 foi salvo pelo bloqueio: a ofensiva não cresceu
        self.ler("2026-10-10", "2026-10-12", 2)
        self.assertEqual(self.dias(), ["2026-10-10", "2026-10-11"])


class Contribuicoes(Base):
    def test_dia_e_o_primeiro_em_que_foi_vista(self):
        iss = {"7": {"tipo": "bug", "titulo": "Concluir não some"}}
        with mock.patch.object(s, "contrib_issues", return_value=iss):
            s.contrib_atualiza("amigo")
        with mock.patch.object(s, "hoje", lambda: HOJE + timedelta(days=3)), \
                mock.patch.object(s, "contrib_issues", return_value={**iss, "9": {"tipo": "ideia", "titulo": "Tema"}}):
            s.contrib_atualiza("amigo")
        c = s.ler_json("contrib.json", {})["issues"]
        self.assertEqual(c["7"]["dia"], "2026-10-12")
        self.assertEqual(c["9"]["dia"], "2026-10-15")

    def test_so_com_usuario_valido(self):
        self.assertIsNone(s.contrib_leitura({}))
        self.assertIsNone(s.contrib_leitura({"github": {"usuario": "nome com espaço"}}))
        self.assertEqual(s.contrib_leitura({"github": {"usuario": "amigo"}}), {"usuario": "amigo", "issues": []})
        self.assertEqual(s.contrib_leitura({"github": {"usuario": s.DONO}}), {"usuario": s.DONO, "issues": []})   # tarefas de dev (#97)


def issue(n, autor="amigo", resp=(), labels=(), estado="open", motivo=None, titulo="Título"):
    return {"number": n, "title": titulo, "state": estado, "state_reason": motivo, "user": {"login": autor},
            "assignees": [{"login": r} for r in resp], "labels": [{"name": l} for l in labels]}


class ContribRegras(Base):
    """#96: a recompensa sai quando a issue entra no beta, e quem fez a própria issue não ganha por ela."""

    def achadas(self, itens, usuario="amigo"):
        with mock.patch.object(s, "gh_busca", return_value=(itens, True)):
            return s.contrib_issues(usuario)

    def test_paga_no_beta_ou_resolvida(self):
        r = self.achadas([issue(100, labels=["bug", "no beta"]), issue(101, labels=["enhancement"], estado="closed", motivo="completed"),
                          issue(102, labels=["bug"]), issue(103, labels=["bug", "no beta"], estado="closed", motivo="not_planned"),
                          issue(104, labels=["bug", "no beta", "sem recompensa"]), issue(105, labels=["question", "no beta"])])
        self.assertEqual(r, {"100": {"tipo": "bug", "titulo": "Título", "beta": True}, "101": {"tipo": "ideia", "titulo": "Título"}})

    def test_quem_fez_a_propria_issue_nao_ganha_fora_do_legado(self):
        r = self.achadas([issue(100, resp=["amigo"], labels=["bug", "no beta"]), issue(101, resp=["CaioParanaiba"], labels=["bug", "no beta"]),
                          issue(58, resp=["amigo"], labels=["bug", "no beta"])])
        self.assertEqual(sorted(r), ["101", "58"])

    def test_dono_nao_ganha_por_relatar(self):
        self.assertEqual(self.achadas([issue(100, autor=s.DONO, labels=["bug", "no beta"])], s.DONO), {})


class TarefasDev(Base):
    """#97: issue com o jogador como responsável vira tarefa gh:N, concluída sozinha quando entra no beta."""

    def rodar(self, itens, completa=True, dia=HOJE):
        with mock.patch.object(s, "hoje", lambda: dia), mock.patch.object(s, "gh_busca", return_value=(itens, completa)):
            self.assertEqual(s.contrib_atualiza("amigo"), "")

    def dev(self):
        return [l for l in s.ler() + s.ler("done.txt") if "gh:" in l]

    def test_cria_acompanha_o_esforco_e_conclui(self):
        self.rodar([issue(100, resp=["amigo"], titulo="Botão +novo em @lista due:amanhã")])
        self.assertEqual(self.dev(), ["Issue #100: Botão novo em lista due: amanhã +ganbatte gh:100"])
        self.rodar([issue(100, resp=["amigo"], labels=["esforço: demorado"], titulo="Outro título")])
        self.assertEqual(self.dev(), ["Issue #100: Botão novo em lista due: amanhã +ganbatte gh:100 esf:demorado"])
        self.rodar([issue(100, resp=["amigo"], labels=["no beta"])], dia=HOJE + timedelta(days=2))   # o label de esforço sai no beta
        self.assertEqual(self.dev(), ["x 2026-10-14 Issue #100: Botão novo em lista due: amanhã +ganbatte gh:100 esf:demorado"])
        self.rodar([issue(100, resp=["amigo"], estado="closed", motivo="completed")], dia=HOJE + timedelta(days=9))
        self.assertEqual(len(self.dev()), 1)   # ir para a main não paga de novo

    def test_entrou_antes_de_o_jogo_ver_ja_entra_concluida(self):
        self.rodar([issue(100, resp=["amigo"], labels=["esforço: rápido", "no beta"])])
        self.assertEqual(self.dev(), ["x 2026-10-12 Issue #100: Título +ganbatte gh:100 esf:rapido"])

    def test_apagada_nao_volta_e_recusada_ou_trocada_sai(self):
        self.rodar([issue(100, resp=["amigo"]), issue(101, resp=["amigo"]), issue(102, resp=["amigo"])])
        s.gravar([l for l in s.ler() if "gh:100" not in l])   # o jogador apagou
        self.rodar([issue(100, resp=["amigo"]), issue(101, resp=["amigo"], estado="closed", motivo="not_planned"), issue(102, resp=["amigo"])], completa=False)
        self.assertEqual(self.dev(), ["Issue #102: Título +ganbatte gh:102"])   # busca incompleta: a 102 fica mesmo sem vir
        self.rodar([issue(100, resp=["amigo"], labels=["no beta"])])
        self.assertEqual(self.dev(), [])   # a 102 saiu do jogador; a 100 apagada não volta concluída

    def test_entra_na_expedicao_ganbatte_aberta(self):
        s.gravar_json("estado.json", {"expedicoes": {"velha": {"n": "Ganbatte", "fim": "2026-10-01"}, "todo-engine": {"n": "Ganbatte", "fim": None}}})
        self.rodar([issue(100, resp=["amigo"])])
        self.assertEqual(self.dev(), ["Issue #100: Título +exp.todo-engine gh:100"])
        s.gravar_json("estado.json", {"expedicoes": {"tcc": {"n": "TCC"}}})
        self.rodar([issue(101, resp=["amigo"])])
        self.assertIn("Issue #101: Título +ganbatte gh:101", self.dev())

    def test_legado_nao_vira_tarefa(self):
        self.rodar([issue(58, resp=["amigo"]), issue(41, resp=["amigo"], labels=["no beta"])])
        self.assertEqual(self.dev(), [])

    def test_botao_espera_um_minuto(self):
        self.jogador({"github": {"usuario": "amigo"}})
        self.assertTrue(s.api_contrib({}).get("cedo"))   # o setUp marca uma conferida agora
        s.contrib_vivo["t"] = 0
        with mock.patch.object(s, "gh_busca", side_effect=OSError("sem rede")), self.assertRaises(s.Erro):
            s.api_contrib({})
        s.contrib_vivo["t"] = 0
        with mock.patch.object(s, "gh_busca", return_value=([], True)):
            self.assertEqual(s.api_contrib({}), {"ok": True})


class CancelarIA(Base):
    """#115: cancelar encerra o agente (e o que ele abriu) e libera a vaga para o próximo pedido."""

    def roda(self, codigo, com_filho=False):
        pid = Path(self.tmp.name) / "filho.pid"
        filho = ("f = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(60)'], stdout=subprocess.DEVNULL,"
                 f" stderr=subprocess.DEVNULL); open({str(pid)!r}, 'w').write(str(f.pid)); ") if com_filho else ""
        cmd = [sys.executable, "-c", "import subprocess, sys, time; " + filho + codigo]
        for alvo, valor in (("ia_conf", lambda: {"agente": "claude"}), ("acha_agente", lambda ag: sys.executable),
                            ("comando_agente", lambda *a, **k: cmd)):
            p = mock.patch.object(s, alvo, valor)
            p.start()
            self.addCleanup(p.stop)
        tid = s.api_ia_rodar({"pedido": "oi"})["id"]
        self.addCleanup(lambda: (s.api_ia_cancela({"id": tid}), self.espera(tid, ("pronto", "cancelado", "erro"))))
        return tid, pid

    def espera(self, tid, estado):
        for _ in range(100):
            if s.api_ia_tarefa(tid)["estado"] in ((estado,) if isinstance(estado, str) else estado):
                return
            time.sleep(0.1)
        self.fail(f"o pedido não chegou a {estado}")

    @unittest.skipIf(os.name == "nt", "o processo de teste usa sinais do Linux/Mac")
    def test_cancelar_para_o_agente_e_o_filho(self):
        tid, pid = self.roda("time.sleep(60)", com_filho=True)
        for _ in range(50):
            if pid.exists() and pid.read_text():
                break
            time.sleep(0.1)
        self.assertEqual(s.api_ia_cancela({"id": tid}), {"ok": True})
        self.espera(tid, "cancelado")
        self.assertFalse(s.ia_lock.locked())
        filho = int(pid.read_text())
        for _ in range(30):
            try:
                os.kill(filho, 0)
            except ProcessLookupError:
                break
            time.sleep(0.1)
        else:
            self.fail("o processo aberto pelo agente continuou rodando")

    def test_cancelar_depois_de_pronto_nao_muda(self):
        tid, _ = self.roda("print('resposta')")
        self.espera(tid, "pronto")
        s.api_ia_cancela({"id": tid})
        self.assertEqual(s.api_ia_tarefa(tid)["texto"], "resposta")
        with self.assertRaises(s.Erro):
            s.api_ia_cancela({"id": "nao-existe"})


class ConquistasIA(Base):
    def item(self, rk, n=10):
        return {"regra": "contagem", "n": n, "tipo": "est", "nome": f"Estudo {n}", "texto": "", "rk": rk}

    def test_vagas_por_rank(self):
        """10 vagas: 4 de rank D, 3 de C, 2 de B e 1 de A. A resgatada libera a vaga."""
        r = s.api_conquistas({"acao": "criar", "itens": [self.item("D", 10 + i) for i in range(4)] + [self.item("A")]})
        self.assertEqual(len(r["nos"]), 5)
        with self.assertRaises(s.Erro):
            s.api_conquistas({"acao": "criar", "itens": [self.item("D", 30)]})
        with self.assertRaises(s.Erro):
            s.api_conquistas({"acao": "criar", "itens": [self.item("A", 30)]})
        s.api_conquistas({"acao": "resgatar", "no": r["nos"][0], "como": "jenny", "j": 800})
        self.assertTrue(s.api_conquistas({"acao": "criar", "itens": [self.item("D", 30), self.item("C"), self.item("C", 11)]})["ok"])

    def test_metas_novas_sao_preservadas_e_nao_reutilizam_hoje(self):
        item = {**self.item("D", 14), "versao": 2, "diasMin": 7, "inicio": "2000-01-01"}
        r = s.api_conquistas({"acao": "criar", "itens": [item]})
        c = s.ler_json("conquistas.json", [])[0]
        self.assertEqual(c["no"], r["nos"][0])
        self.assertEqual((c["versao"], c["diasMin"], c["inicio"]), (2, 7, "2026-10-13"))
        with self.assertRaises(s.Erro):
            s.api_conquistas({"acao": "criar", "itens": [{**item, "n": 20}]})

    def test_xp_guarda_semanas_e_recusa_meta_menor_que_o_rank(self):
        item = {"regra": "semana", "xp": 600, "semanas": 8, "versao": 2, "rk": "A", "nome": "Oito semanas"}
        s.api_conquistas({"acao": "criar", "itens": [item]})
        self.assertEqual(s.ler_json("conquistas.json", [])[0]["semanas"], 8)
        for semanas in (1, 7, True, 21):
            with self.assertRaises(s.Erro):
                s.conq_item({**item, "semanas": semanas})

    def test_tipo_projeto_entra_e_faculdade_sai(self):
        """#121: o tipo projeto existe; faculdade saiu e não se cria mais conquista com ele."""
        self.assertEqual(s.conq_item({**self.item("D"), "tipo": "pro"})["tipo"], "pro")
        with self.assertRaises(s.Erro):
            s.conq_item({**self.item("D"), "tipo": "fac"})

    def test_nao_grava_lote_com_alvos_repetidos_ou_dias_insuficientes(self):
        item = {**self.item("D", 14), "versao": 2, "diasMin": 7}
        with self.assertRaises(s.Erro):
            s.api_conquistas({"acao": "criar", "itens": [item, {**item, "n": 20}]})
        self.assertEqual(s.ler_json("conquistas.json", []), [])
        for dias in (0, 1, True, 60):
            with self.assertRaises(s.Erro):
                s.conq_item({**item, "diasMin": dias})


class Leitura(Base):
    def test_api_jogo(self):
        r = s.api_jogo_get()
        self.assertTrue(r["ok"])
        self.assertEqual(r["hoje"], "2026-10-12")
        self.assertIsNone(r["cf"])
        self.assertIsNone(r["duo"])
        self.assertIsNone(r["contrib"])
        self.assertEqual(r["servidor"]["versao"], s.VERSAO)

    def test_config_invalida(self):
        with self.assertRaises(s.Erro):
            s.api_config({"jogador": "não é objeto"})


class Temporadas(Base):
    """Cápsula da temporada (#7): a página manda o resumo congelado; o servidor grava temporadas/NOME/ com uma cópia dos arquivos."""

    def test_guarda_resumo_e_copias(self):
        s.gravar_txt("done.txt", "x 2026-10-10 2026-10-10 Tarefa\n")
        r = s.api_temporada({"resumo": {"nome": "2026-2", "ate": "2026-10-12", "xp": 10}})
        self.assertTrue(r["guardada"])
        pasta = s.DADOS / "temporadas" / "2026-2"
        self.assertEqual(json.loads((pasta / "resumo.json").read_text(encoding="utf-8"))["xp"], 10)
        self.assertEqual((pasta / "done.txt").read_text(encoding="utf-8"), "x 2026-10-10 2026-10-10 Tarefa\n")
        self.assertEqual((pasta / "avaliacoes.txt").read_text(encoding="utf-8"), TEMPORADA)
        self.assertEqual(s.api_jogo_get()["temporadas"], [{"nome": "2026-2", "ate": "2026-10-12", "guardada": ""}])

    def test_foto_parcial_nao_troca_a_completa(self):
        s.api_temporada({"resumo": {"nome": "2026-2", "ate": "2027-02-19", "xp": 900}})
        self.assertFalse(s.api_temporada({"resumo": {"nome": "2026-2", "ate": "2026-10-12", "xp": 10}})["guardada"])
        self.assertTrue(s.api_temporada({"resumo": {"nome": "2026-2", "ate": "2027-02-19", "xp": 901}})["guardada"])
        self.assertEqual(s.ler_json("temporadas/2026-2/resumo.json", {})["xp"], 901)

    def test_nome_invalido(self):
        for nome in ("../fora", "", "a/b", ".oculta"):
            with self.assertRaises(s.Erro):
                s.api_temporada({"resumo": {"nome": nome, "ate": "2026-10-12"}})
        self.assertFalse((s.DADOS / "temporadas").exists())


class Canal(Base):
    """Canal de atualização (#36, #46): a cópia git segue a própria branch se ela for um dos CANAIS; o resto cai na main."""

    def branch(self, nome):
        r = mock.Mock(stdout=nome + "\n")
        return mock.patch.multiple(s, metodo_atualizar=lambda: "git", subprocess=mock.Mock(run=lambda *a, **k: r, SubprocessError=Exception))

    def test_segue_a_branch(self):
        for b in ("main", "beta"):
            with self.branch(b):
                self.assertEqual(s.canal(), b)

    def test_grupo_segue_a_beta(self):
        """0.9.0-beta2: a grupo entrou na beta; a cópia que ainda está nela confere e atualiza pela beta."""
        with self.branch("grupo"):
            self.assertEqual(s.canal(), "beta")
        with self.assertRaises(s.Erro):
            s.api_canal({"canal": "grupo"})

    def test_atualizar_na_grupo_troca_para_a_beta(self):
        with mock.patch.multiple(s, branch_atual=lambda: "grupo", troca_branch=mock.Mock(), metodo_atualizar=lambda: "git"), \
             mock.patch.object(s.threading, "Timer"):
            s.api_atualizar({})
            s.troca_branch.assert_called_once_with("beta")

    def test_outra_branch_ou_zip_e_main(self):
        with self.branch("minha-feature"):
            self.assertEqual(s.canal(), "main")
        with mock.patch.object(s, "metodo_atualizar", lambda: "zip"):
            self.assertEqual(s.canal(), "main")

    def test_troca_so_para_canal_conhecido(self):
        with self.assertRaises(s.Erro):
            s.api_canal({"canal": "minha-feature"})


if __name__ == "__main__":
    unittest.main()


class Estado(Base):
    def test_grava_o_acerto_da_064(self):
        """A 0.6.4 recusava o estado com migra e tenRec (gravados pelo acerto do rebalanceamento): nada da loja ficava salvo."""
        s.api_jogo_estado({"estado": {"own": ["fr-hunter"], "migra": {"0.6.4": {"xp": 1, "j": 10, "ten": 3, "em": "2026-10-13"}},
                                      "tenRec": 3, "acertos": {"0.6.4": 500}}})
        e = s.ler_json("estado.json", {})
        self.assertEqual((e["own"], e["tenRec"], e["acertos"]["0.6.4"]), (["fr-hunter"], 3, 500))


class Colecao(Base):
    """Coleção permanente (#33): o comprado fica em colecao/, com a imagem copiada, e nada sai de lá."""

    def test_guarda_com_imagem_e_so_acrescenta(self):
        r = s.api_colecao({"itens": [{"id": "ch-uvogin", "cat": "chefe", "n": "Uvogin", "p": 1500, "img": "chefoes/uvogin.png",
                                      "quando": "2026-10-10", "lixo": "x"}]})
        it = r["colecao"]["itens"]["ch-uvogin"]
        self.assertEqual((it["origem"], it["quando"], it["arquivo"]), ("masadora", "2026-10-10", "chefoes-uvogin.png"))
        self.assertNotIn("lixo", it)
        self.assertTrue((s.DADOS / "colecao" / "arquivos" / "chefoes-uvogin.png").is_file())
        s.api_colecao({"itens": [{"id": "ch-uvogin", "cat": "chefe", "n": "Outro nome"}, {"id": "pal-gon", "cat": "pal", "n": "Gon"}]})
        c = s.colecao()["itens"]
        self.assertEqual(c["ch-uvogin"]["n"], "Uvogin")   # quem já está não é trocado
        self.assertEqual(c["pal-gon"]["quando"], HOJE.isoformat())
        self.assertIn("colecao", s.api_jogo_get())
        self.assertEqual(len(c["ch-uvogin"]["uid"]), 12)   # rastreio: uid e o começo do histórico
        self.assertEqual(c["ch-uvogin"]["hist"], [{"quando": "2026-10-10", "como": "compra", "origem": "masadora", "p": 1500}])

    def test_foto_liberada_por_chefao(self):
        r = s.api_colecao({"itens": [{"id": "av-ch-uvogin", "cat": "avatar", "n": "Uvogin", "p": 0, "img": "chefoes/uvogin.png",
                                      "chefao": "ch-uvogin", "como": "chefao", "temporada": "2026-2"}]})
        h = r["colecao"]["itens"]["av-ch-uvogin"]["hist"][0]
        self.assertEqual((h["como"], h["temporada"]), ("chefao", "2026-2"))
        with self.assertRaises(s.Erro):
            s.api_colecao({"itens": [{"id": "x", "cat": "pal", "n": "X", "como": "roubado"}]})

    def test_recusa_item_estranho(self):
        for x in ({"id": "../x", "cat": "pal", "n": "a"}, {"id": "a", "cat": "feitico", "n": "a"}, {"id": "a", "cat": "pal", "n": ""},
                  {"id": "a", "cat": "pal", "n": "a", "origem": "outra"}):
            with self.assertRaises(s.Erro):
                s.api_colecao({"itens": [x]})
        r = s.api_colecao({"itens": [{"id": "av-x", "cat": "avatar", "n": "X", "img": "../servidor.png"}]})
        self.assertNotIn("arquivo", r["colecao"]["itens"]["av-x"])


class Travas(Base):
    def test_trava_de_chefao_vale_a_primeira(self):
        """Chefão derrotado (#33): a imagem travada não muda, nem por outra aba nem se ele voltar à vida."""
        s.api_jogo_estado({"estado": {"travas": {"2026-2:CALC2": "ch-uvogin"}}})
        s.api_jogo_estado({"estado": {"travas": {"2026-2:CALC2": "ch-meruem", "2026-2:BD": ""}}})
        s.api_jogo_estado({"estado": {}})
        self.assertEqual(s.ler_json("estado.json", {})["travas"], {"2026-2:CALC2": "ch-uvogin", "2026-2:BD": ""})
        with self.assertRaises(s.Erro):
            s.api_jogo_estado({"estado": {"travas": {"2026-2:ED1": 3}}})


class Devolucao(Base):
    """#51: o que voltou para a loja na devolução não volta pela gravação de uma aba antiga; comprado de novo depois, fica."""
    DV = {"v": "2026-10-13", "em": "2026-10-13", "h": "12:00:00", "own": ["th-killua", "pal-killua"], "feiticos": ["ko"], "semana": "2026-W42", "j": 0}

    def grava(self, est):
        s.api_jogo_estado({"estado": est})
        return s.ler_json("estado.json", {})

    def test_aba_antiga_nao_devolve(self):
        self.grava({"own": ["fr-hunter"], "bought": {"2026-W42": []}, "devolve": self.DV})
        e = self.grava({"own": ["fr-hunter", "th-killua", "pal-killua"], "bought": {"2026-W42": ["ko"]}})
        self.assertEqual(e["own"], ["fr-hunter"])
        self.assertEqual(e["bought"]["2026-W42"], [])
        self.assertEqual(e["devolve"]["h"], "12:00:00")

    def test_comprado_de_novo_fica(self):
        self.grava({"own": [], "devolve": self.DV})
        e = self.grava({"own": ["th-killua"], "bought": {"2026-W42": ["ko"]}, "devolve": {**self.DV, "h": "23:00:00"},
                        "compras": [{"d": "2026-10-13", "h": "15:00:00", "tipo": "cos", "id": "th-killua", "j": 6000},
                                    {"d": "2026-10-14", "h": "09:00:00", "tipo": "feitico", "id": "ko", "j": 800}]})
        self.assertEqual(e["own"], ["th-killua"])
        self.assertEqual(e["bought"]["2026-W42"], ["ko"])
        self.assertEqual(e["devolve"]["h"], "12:00:00")   # vale a primeira


class Religa(Base):
    """Salvar Configurações até a 0.6.5-beta1 refazia o id pelo nome: o hábito volta ao id antigo, com o histórico."""

    def prepara(self, habitos, done):
        self.jogador({"habitos": habitos})
        s.gravar_txt("done.txt", "\n".join(done) + "\n")
        s.arruma_dia()
        return [h["id"] for h in s.jogador()["habitos"]]

    def test_volta_ao_id_antigo(self):
        ids = self.prepara([{"id": "h-treino-de-digitacao", "n": "Treino de digitacao"}],
                           ["x 2026-10-10 2026-10-10 Treino de digitacao +rotina rec:digi:2026-10-10",
                            "x 2026-10-11 2026-10-11 Treino de digitacao +rotina rec:digi:2026-10-11"])
        self.assertEqual(ids, ["digi"])
        self.assertEqual(self.todo(), ["2026-10-12 Treino de digitacao +rotina rec:digi:2026-10-12"])

    def test_dias_depois_da_troca_vao_junto(self):
        self.prepara([{"id": "h-leitura", "n": "Leitura"}],
                     ["x 2026-10-09 2026-10-09 Leitura +rotina rec:leit:2026-10-09",
                      "x 2026-10-11 2026-10-11 Leitura +rotina rec:h-leitura:2026-10-11"])
        self.assertIn("x 2026-10-11 2026-10-11 Leitura +rotina rec:leit:2026-10-11", self.done())

    def test_nome_diferente_ou_dois_candidatos_nao_mexe(self):
        self.assertEqual(self.prepara([{"id": "h-leitura", "n": "Leitura"}],
                                      ["x 2026-10-10 2026-10-10 AtCoder +rotina rec:atc:2026-10-10"]), ["h-leitura"])
        self.assertEqual(self.prepara([{"id": "h-leitura", "n": "Leitura"}],
                                      ["x 2026-10-08 2026-10-08 Leitura +rotina rec:a:2026-10-08",
                                       "x 2026-10-10 2026-10-10 Leitura +rotina rec:b:2026-10-10"]), ["h-leitura"])

    def test_historico_misturado_nao_mexe(self):
        """O id antigo com dias depois do primeiro do id novo não é o mesmo hábito renomeado."""
        self.assertEqual(self.prepara([{"id": "h-leitura", "n": "Leitura"}],
                                      ["x 2026-10-08 2026-10-08 Leitura +rotina rec:h-leitura:2026-10-08",
                                       "x 2026-10-10 2026-10-10 Leitura +rotina rec:leit:2026-10-10"]), ["h-leitura"])


class Agentes(Base):
    """#60: o Gemini CLI roda na pasta temporária sem perguntar; o agy recebe o pedido num arquivo e roda só lendo."""

    def roda(self, ag, saida="ok", erro="", rc=0):
        visto = {}

        def falso(cmd, cwd=None, env=None, **kw):   # Popen do agente (#115: cancelável)
            arquivos = {f.name: f.read_text(encoding="utf-8") for f in Path(cwd).iterdir()}

            def communicate(input=None, timeout=None):
                visto.update(cmd=cmd, input=input, env=env, arquivos=arquivos)
                return saida, erro
            return mock.Mock(returncode=rc, communicate=communicate, poll=lambda: rc)
        s.ia_tarefas["t"] = {"estado": "rodando", "texto": "", "erro": "", "ini": time.time(), "seg": 0}
        s.ia_lock.acquire()
        with mock.patch.object(s.subprocess, "Popen", falso), mock.patch.object(s, "path_agentes", lambda: ""):
            s.ia_executa("t", ag, "/bin/" + ag, "PEDIDO", [], False)
        return visto, s.ia_tarefas["t"]

    def test_gemini_confia_na_pasta(self):
        visto, t = self.roda("gemini")
        self.assertEqual(visto["env"]["GEMINI_CLI_TRUST_WORKSPACE"], "true")
        self.assertEqual((visto["input"], t["estado"], t["texto"]), ("PEDIDO", "pronto", "ok"))

    def test_agy_le_o_pedido_do_arquivo_e_so_le(self):
        visto, t = self.roda("agy")
        self.assertEqual(visto["arquivos"][s.PEDIDO_ARQ], "PEDIDO")
        self.assertEqual(visto["input"], "")
        self.assertEqual(visto["cmd"][1:3], ["--mode", "plan"])
        self.assertEqual(t["estado"], "pronto")

    def test_agy_sem_resposta_vira_erro(self):
        _, t = self.roda("agy", saida="", erro='jetski: no output produced — a tool required the "command" permission that headless mode cannot prompt for')
        self.assertEqual(t["estado"], "erro")
        self.assertIn("sem permissão", t["erro"])

    def test_gemini_sem_conta_gratuita_sugere_o_agy(self):
        _, t = self.roda("gemini", saida="", rc=1, erro="Error authenticating: IneligibleTierError: This client is no longer supported "
                         "for Gemini Code Assist for individuals. To continue using Gemini, please migrate to the Antigravity suite"
                         + " at chunk.js:311997:11" * 40)   # o rastro empurra o motivo para antes dos últimos 400 caracteres
        self.assertIn("Antigravity CLI (agy)", t["erro"])


class Renomear(unittest.TestCase):
    """#15: a pasta ~/.hunter-todo vira ~/.ganbatte (com atalho no lugar), e outra pasta fica onde está."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.casa = Path(self.tmp.name)
        p = mock.patch.object(Path, "home", lambda: self.casa)
        p.start()
        self.addCleanup(p.stop)
        self.velha, self.nova = self.casa / ".hunter-todo", self.casa / ".ganbatte"

    def test_move_a_pasta_antiga(self):
        self.velha.mkdir()
        (self.velha / "todo.txt").write_text("tarefa\n")
        for p in (self.velha, self.nova):   # o --dados antigo do início automático, ou o padrão novo
            self.assertEqual(s.migra_pasta(p), self.nova)
        self.assertEqual((self.nova / "todo.txt").read_text(), "tarefa\n")
        self.assertTrue(self.velha.is_symlink())

    def test_outra_pasta_fica(self):
        outra = self.casa / "meus-dados"
        outra.mkdir()
        self.velha.mkdir()
        self.assertEqual(s.migra_pasta(outra), outra)
        self.assertTrue(self.velha.is_dir() and not self.velha.is_symlink())

    def test_nao_junta_duas_pastas(self):
        """As duas já existem: não mexe em nada, cada --dados abre a sua."""
        self.velha.mkdir()
        self.nova.mkdir()
        self.assertEqual(s.migra_pasta(self.velha), self.velha)
        self.assertEqual(s.migra_pasta(self.nova), self.nova)

    def test_ping_reconhece_o_nome_antigo(self):
        for app in ("ganbatte", "hunter-todo", "outro"):
            r = mock.MagicMock()
            r.__enter__.return_value = r
            with mock.patch.object(s.urllib.request, "urlopen", return_value=r), mock.patch.object(s.json, "load", return_value={"app": app}):
                self.assertEqual(s.ping(1) is not None, app != "outro")


class ArteNova(Base):
    """A arte nova das lojas em teste (#134): web/arte.js e os arquivos de web/arte/, só .js e .png com nome simples."""

    def test_serve_a_arte_e_mais_nada(self):
        import threading
        import urllib.error
        import urllib.request
        srv = s.ThreadingHTTPServer(("127.0.0.1", 0), s.H)
        s.H.porta = srv.server_address[1]
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        self.addCleanup(srv.server_close)
        self.addCleanup(srv.shutdown)
        base = f"http://127.0.0.1:{s.H.porta}"

        def get(c):
            try:
                with urllib.request.urlopen(base + c, timeout=5) as r:
                    return r.status, r.headers["Content-Type"]
            except urllib.error.HTTPError as e:
                return e.code, None
        self.assertEqual(get("/arte.js"), (200, "text/javascript; charset=utf-8"))
        self.assertEqual(get("/arte/carta.js"), (200, "text/javascript; charset=utf-8"))
        self.assertEqual(get("/arte/lic-exame.png"), (200, "image/png"))
        for c in ("/arte/nada.js", "/arte/..%2Fservidor.py", "/arte/carta.css", "/arte/Carta.js"):
            self.assertEqual(get(c)[0], 404, c)
