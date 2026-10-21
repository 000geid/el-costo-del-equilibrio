"""Evaluación reproducible del prototipo de rebalanceo localizado para Micro (micro_v2).

Compara en semillas de desarrollo y en un conjunto reservado (holdout):
1. baseline (catálogo Micro v1 actual)
2. micro_v2 (rebalanceo localizado de cartas con criterios económicos y corrección de MI24)
"""
from pathlib import Path
import copy
import json
import statistics
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE.parent / "quant_v1"))
import analyze as q

BASE_CARDS = q.extract()
ORIG_RESOLVE = q.resolve

POLICIES = ["random", "always_A", "always_B", "signs", "myopic", "conservative", "commitments", "planner"]

# Orden Micro: [Caja (0), Demanda (1), Equipo (2), Calidad (3)]
MICRO_V2_OVERRIDES = {
    # --- ETAPA 1: INICIO (MI01-MI08) ---
    "MI01": { # El insumo se encarece: subir precio (A) cuida margen (+6 K) pero golpea Demanda (-9) y Calidad (-3); absorber (B) cuesta Caja (-8)
        "A": {"immediate": (6, -9, 0, -3), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (-8, 5, 0, 3), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI02": { # La herramienta dejó de funcionar: reparar (A) cuesta Caja (-8) y desgaste (-4 D, -5 E, 2 Q); financiar nueva (B) alivia hoy (+2 K) pero exige cuota fuerte (-16 K)
        "A": {"immediate": (-8, -4, -5, 2), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (2, -2, 3, 5), "delay": 3, "future": (-16, 3, 3, 2)},
    },
    "MI03": { # El gran pedido a crédito: aceptar (A) hunde Caja hoy (-9) y exige al Equipo (-6); pedir anticipo (B) suma (+4 K) y pierde clientes (-9 D, -3 Q)
        "A": {"immediate": (-9, 4, -6, -2), "delay": 3, "future": (13, 3, 0, 1)},
        "B": {"immediate": (4, -9, 1, -3), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI04": { # Turnos que agotan al equipo: contratar apoyo (A) cuesta Caja (-8); horas extra (B) ahorra (+5 K) y agota Equipo (-11) y Calidad (-6)
        "A": {"immediate": (-8, 3, 8, 3), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (5, -2, -11, -6), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI05": { # Una compra que reduce costos: insumo barato (A) ahorra (+6 K) pero hunde Calidad (-11) y Demanda (-6); mantener (B) cuesta Caja (-8)
        "A": {"immediate": (6, -6, -2, -11), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (-8, 4, 1, 6), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI06": { # La promoción de apertura: descuento (A) reduce margen (-6 K) y satura Equipo (-6) para ganar Demanda (+9); mantener precio (B) da (+4 K) y enfría Demanda (-8)
        "A": {"immediate": (-6, 9, -6, -2), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (4, -8, 1, -3), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI07": { # Aprender una técnica nueva: capacitar (A) cuesta Caja (-8) y Demanda (-4) hoy, rinde en 2 turnos; no capacitar (B) da (+4 K) y deteriora Equipo (-8) y Calidad (-7)
        "A": {"immediate": (-8, -4, 3, 1), "delay": 2, "future": (3, 4, 6, 7)},
        "B": {"immediate": (4, -3, -8, -7), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI08": { # El alquiler aumenta: renegociar (A) cuesta Caja (-8); mudarse (B) cuesta mudanza (-7 K) y pierde clientela (-10 D, -5 E, -3 Q) antes de ahorrar
        "A": {"immediate": (-8, 2, 2, 1), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (-7, -10, -5, -3), "delay": 2, "future": (11, 0, 1, 0)},
    },
    # --- ETAPA 2: DESARROLLO (MI09-MI17) ---
    "MI09": { # Producir antes de vender: ampliar (A) inmoviliza Caja (-8) y Equipo (-5); prudencia (B) da (+3 K) y pierde ventas (-7 D, -3 E, -3 Q)
        "A": {"immediate": (-8, 4, -5, 0), "delay": 2, "future": (11, 3, 0, 1)},
        "B": {"immediate": (3, -7, -3, -3), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI10": { # Queja frente a otros clientes: rehacer (A) cuesta Caja (-8) y Equipo (-2); devolver parte (B) cuesta (-2 K) y hunde Demanda (-8) y Calidad (-10)
        "A": {"immediate": (-8, 5, -2, 7), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (-2, -8, -3, -10), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI11": { # Publicidad o ahorro: campaña (A) invierte Caja (-8) para ganar Demanda futura; guardar dinero (B) da (+4 K) y pierde mercado (-8 D, -3 E, -4 Q)
        "A": {"immediate": (-8, 1, -2, 0), "delay": 2, "future": (4, 10, 0, 2)},
        "B": {"immediate": (4, -8, -3, -4), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI12": { # Crédito rápido con intereses: crédito (A) da +12 K hoy pero devuelve -18 K; ajustar gastos (B) da (+2 K) y contrae Demanda (-6), Equipo (-8) y Calidad (-5)
        "A": {"immediate": (12, 2, 3, 1), "delay": 2, "future": (-18, 0, -3, -2)},
        "B": {"immediate": (2, -6, -8, -5), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI13": { # El punto de equilibrio: reducir costos fijos (A) da (+5 K) y daña Demanda (-5), Equipo (-7) y Calidad (-5); buscar pedidos (B) cuesta Caja (-8) hoy
        "A": {"immediate": (5, -5, -7, -5), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (-8, 6, -4, 1), "delay": 2, "future": (9, 3, 2, 1)},
    },
    "MI14": { # El negocio vecino baja precios: igualar (A) sacrifica Caja (-6) y Calidad (-5); mejorar servicio (B) cuesta Caja (-8) pero defiende Calidad (+6) y Equipo (+3)
        "A": {"immediate": (-6, 6, -3, -5), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (-8, 3, 3, 6), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI15": { # El impuesto del trimestre: pagar ahora (A) cuesta Caja (-9); plan de cuotas (B) alivia hoy (+5 K, +2 E) pero vence -17 K en 2 turnos
        "A": {"immediate": (-9, 0, 1, 1), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (5, 1, 2, 0), "delay": 2, "future": (-17, 0, -2, -2)},
    },
    "MI16": { # Un descanso necesario: reorganizar (A) cuesta Caja (-7) y Demanda (-3); mantener ritmo (B) da (+4 K) y desgasta Equipo (-10) y Calidad (-6)
        "A": {"immediate": (-7, -3, 9, 4), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (4, -1, -10, -6), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI17": { # Automatizar una tarea: invertir (A) cuesta Caja (-9); mantener proceso manual (B) da (+4 K) y desgasta Equipo (-9), Demanda (-5) y Calidad (-4)
        "A": {"immediate": (-9, -2, -2, 1), "delay": 2, "future": (4, 4, 8, 5)},
        "B": {"immediate": (4, -5, -9, -4), "delay": 0, "future": (0, 0, 0, 0)},
    },
    # --- ETAPA 3: CIERRE (MI18-MI25) ---
    "MI18": { # Dos servicios posibles: estándar (A) da (+4 K, +4 D) y desgasta Equipo (-6) y Calidad (-5); personalizada (B) invierte Caja (-7) hoy
        "A": {"immediate": (4, 4, -6, -5), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (-7, 3, -2, 5), "delay": 1, "future": (10, 4, 2, 0)},
    },
    "MI19": { # Socio con condiciones: aceptar socio (A) aporta Caja (+10) pero resta autonomía/Equipo (-8) y Calidad (-5); recursos propios (B) cuesta Caja (-7)
        "A": {"immediate": (10, 2, -8, -5), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (-7, 3, 5, 4), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI20": { # Pago retrasado: anticipo con quita (A) da (+4 K) y pierde Demanda (-7), Equipo (-2) y Calidad (-3); dar plazo (B) drena Caja hoy (-8) y cobra en 1 turno
        "A": {"immediate": (4, -7, -2, -3), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (-8, 4, -2, 2), "delay": 1, "future": (10, 2, 0, 0)},
    },
    "MI21": { # Un control de calidad final: revisar todo (A) cuesta Caja (-7) y Equipo (-3); control habitual (B) da (+4 K) y daña Calidad (-8) y Demanda (-4)
        "A": {"immediate": (-7, 3, -3, 7), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (4, -4, -3, -8), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI22": { # El contrato de suministro: asegurar (A) cuesta Caja (-8); comprar de a poco (B) da (+4 K) y sufre faltantes (-6 D, -5 E, -6 Q)
        "A": {"immediate": (-8, 4, 2, 5), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (4, -6, -5, -6), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI23": { # Abrir un canal nuevo: abrir (A) invierte Caja (-7) y Equipo (-4); concentrarse en local (B) da (+4 K) y pierde Demanda (-7), Equipo (-3) y Calidad (-3)
        "A": {"immediate": (-7, 3, -4, -1), "delay": 1, "future": (4, 7, 3, 3)},
        "B": {"immediate": (4, -7, -3, -3), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI24": { # Premiar al equipo o retirar fondos (CORRECCIÓN DE DOMINANCIA):
        "A": {"immediate": (-8, 2, 9, 4), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (4, -4, -9, -5), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MI25": { # Reservar o repartir resultados: conservar reserva (A) cuida Caja (+5) pero resiente Demanda (-5), Equipo (-5) y Calidad (-5); mejorar servicio (B) cuesta Caja (-8)
        "A": {"immediate": (5, -5, -5, -5), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (-8, 6, 4, 6), "delay": 0, "future": (0, 0, 0, 0)},
    },
}


def build_micro_v2_cards():
    cards = copy.deepcopy(BASE_CARDS)
    for cid, chg in MICRO_V2_OVERRIDES.items():
        for idx, key in enumerate(["A", "B"]):
            if key in chg:
                for field, val in chg[key].items():
                    cards[cid]["options"][idx][field] = val
    return cards


def resolve_micro_v2(card, option, state):
    o = card["options"][option]
    v, f, delay = o["immediate"], o["future"], o["delay"]
    cid = card["id"]
    if cid == "MI01" and option == 0 and state[1] < 55:
        v = (2, -12, 0, -3)
    if cid == "MI09" and option == 0 and state[1] < 55:
        f = (-8, -3, 0, -4)
    if cid == "MI11" and option == 0 and state[3] < 45:
        f = (-3, 2, 0, -3)
    if cid == "MI16" and option == 1 and state[2] < 45:
        v = q.add(v, (-4, 0, -5, -6))
    if cid == "MI18" and option == 1 and state[3] < 55:
        f = (-8, -6, 0, -4)
    if cid == "MI21" and option == 1 and state[3] < 45:
        v = q.add(v, (-8, -8, 0, 0))
    return v, f, delay


def check_no_component_dominance(cards):
    dominated = []
    for i in range(1, 26):
        cid = f"MI{i:02}"
        oa, ob = cards[cid]["options"][0], cards[cid]["options"][1]
        ta = [oa["immediate"][k] + oa["future"][k] for k in range(4)]
        tb = [ob["immediate"][k] + ob["future"][k] for k in range(4)]
        dom_a = all(oa["immediate"][k] >= ob["immediate"][k] for k in range(4)) and all(ta[k] >= tb[k] for k in range(4))
        dom_b = all(ob["immediate"][k] >= oa["immediate"][k] for k in range(4)) and all(tb[k] >= ta[k] for k in range(4))
        if dom_a or dom_b:
            dominated.append((cid, dom_a, dom_b))
    assert not dominated, f"Cartas Micro con dominancia por componente: {dominated}"


def run_evaluation(n=100, dev_seed=2026400000, holdout_seed=2026500000):
    cards_v2 = build_micro_v2_cards()
    check_no_component_dominance(cards_v2)

    datasets = [
        ("dev", list(range(dev_seed, dev_seed + n))),
        ("holdout", list(range(holdout_seed, holdout_seed + n))),
    ]
    summary_out = {}

    for ds_name, seeds in datasets:
        q.resolve = resolve_micro_v2
        summary_out[ds_name] = {}
        card_choices_planner = {f"MI{i:02}": [0, 0] for i in range(1, 26)}

        for policy in POLICIES:
            scen_metrics = {}
            causes_total = {0: 0, 1: 0, 2: 0, 3: 0}
            stress_fails = 0
            total_wins = 0
            weakest_mins = []

            for scen, init in q.INITIAL["MI"].items():
                need_trace = (policy == "planner")
                games = [q.game(cards_v2, "MI", init, s, policy, trace=need_trace) for s in seeds]
                wins = sum(1 for g in games if g["win"])
                total_wins += wins
                stress_fails += sum(1 for g in games if g["win"] and g["stress_fail"])
                ci_lo, ci_hi = q.wilson(wins, n)
                scen_metrics[scen] = {
                    "win_rate": round(wins / n * 100, 2),
                    "wilson95": [round(ci_lo * 100, 2), round(ci_hi * 100, 2)],
                    "mean_turns": round(statistics.mean(g["turns"] for g in games), 2),
                }
                for g in games:
                    weakest_mins.append(min(g["minimum"]))
                    for c in g["causes"]:
                        causes_total[c] += 1
                    if need_trace:
                        for h in g["history"]:
                            idx = 0 if h["option"] == "A" else 1
                            card_choices_planner[h["card"]][idx] += 1

            rates = [m["win_rate"] for m in scen_metrics.values()]
            summary_out[ds_name][policy] = {
                "min_rate": min(rates),
                "max_rate": max(rates),
                "avg_rate": round(sum(rates) / len(rates), 2),
                "by_scenario": scen_metrics,
                "causes": causes_total,
                "stress_fails_among_winners": f"{stress_fails}/{total_wins}",
                "median_weakest_bar": statistics.median(weakest_mins),
            }

        summary_out[ds_name]["planner_choice_share_A"] = {
            cid: round(cnt[0] / sum(cnt) * 100, 1) if sum(cnt) > 0 else 0.0
            for cid, cnt in card_choices_planner.items()
        }

    q.resolve = ORIG_RESOLVE
    out_path = HERE / "micro_v2_results.json"
    out_path.write_text(json.dumps(summary_out, indent=2, ensure_ascii=False))
    return summary_out


if __name__ == "__main__":
    res = run_evaluation(n=100)
    for ds in ("dev", "holdout"):
        print(f"\n==================== MICRO V2 - DATASET: {ds.upper()} (n=100 por escenario) ====================")
        for p in POLICIES:
            r = res[ds][p]
            sc_str = ", ".join(f"{k[:3]}:{v['win_rate']:.1f}%" for k, v in r["by_scenario"].items())
            c = r["causes"]
            print(f"{p:13s} | Rango: {r['min_rate']:5.1f}-{r['max_rate']:5.1f}% (Media: {r['avg_rate']:5.1f}%) | [{sc_str}] | Causas K:{c[0]} D:{c[1]} E:{c[2]} Q:{c[3]} | Stress: {r['stress_fails_among_winners']}")
    print("\nFrecuencia de elección de A (%) en Planner (Holdout):")
    shares = res["holdout"]["planner_choice_share_A"]
    for i in range(1, 26, 5):
        row = "  ".join(f"MI{j:02}:{shares[f'MI{j:02}']:5.1f}%" for j in range(i, min(i+5, 26)))
        print(" ", row)
