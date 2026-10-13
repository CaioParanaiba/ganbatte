"""Testes do servidor.py (#12). Rodam com um comando, na pasta do jogo:  python3 -m unittest discover tests

Cada teste usa uma pasta de dados temporária (nunca a ~/.hunter-todo) e um "hoje" fixo; o que iria para a internet
(Codeforces, Duolingo, GitHub) é trocado por respostas prontas. Só a biblioteca padrão, como o servidor.
"""
import json
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

    def test_registro_de_compras_so_cresce(self):
        """Uma aba antiga, sem a compra que a outra gravou, não apaga essa compra do registro."""
        a = {"d": "2026-10-10", "h": "10:00:00", "tipo": "cos", "id": "pal-gon", "j": 800}
        b = {"d": "2026-10-11", "h": "09:00:00", "tipo": "premio", "id": "premio", "j": 250}
        s.api_jogo_estado({"estado": {"spent": 1050, "compras": [a, b]}})
        s.api_jogo_estado({"estado": {"spent": 800, "compras": [a]}})
        self.assertEqual(s.ler_json("estado.json", {})["compras"], [a, b])
        with self.assertRaises(s.Erro):
            s.api_jogo_estado({"estado": {"compras": [{"d": "ontem", "tipo": "cos", "id": "x", "j": 1}]}})


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

    def test_so_com_usuario_valido_e_que_nao_e_o_dono(self):
        self.assertIsNone(s.contrib_leitura({}))
        self.assertIsNone(s.contrib_leitura({"github": {"usuario": s.DONO}}))
        self.assertEqual(s.contrib_leitura({"github": {"usuario": "amigo"}}), {"usuario": "amigo", "issues": []})


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


if __name__ == "__main__":
    unittest.main()
