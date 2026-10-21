"""Evaluación reproducible del prototipo de rebalanceo localizado para Macro (macro_v2).

Compara en semillas pareadas de desarrollo y en un conjunto reservado (holdout):
1. baseline (catálogo v1 actual)
2. other_negative_x2 (referencia global de sensibilidad: daños no monetarios x2)
3. macro_v2 (rebalanceo localizado de cartas con criterios económicos y cierre MA18 delay=1)
"""
from pathlib import Path
import copy
import json
import math
import statistics
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE.parent / "quant_v1"))
import analyze as q

BASE_CARDS = q.extract()
ORIG_RESOLVE = q.resolve

POLICIES = ["random", "always_A", "always_B", "signs", "myopic", "conservative", "commitments", "planner"]

# Catálogo Macro v2: ajustes localizados por familia económica
MACRO_V2_OVERRIDES = {
    # 1. Familia Austeridad / Postergación de infraestructura y servicios esenciales (Etapa Inicio)
    "MA01": {
        "B": {"immediate": (-9, 3, -5, -4), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA02": {
        "B": {"immediate": (-3, 5, -12, -7), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA03": {
        "A": {"immediate": (-10, 2, 3, 5), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (8, -3, -10, -8), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA04": {
        "B": {"immediate": (-4, 4, -12, -8), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA05": {
        "A": {"immediate": (-7, 9, 3, -6), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (5, -3, -5, 2), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA06": {
        "A": {"immediate": (-3, -7, -6, -2), "delay": 2, "future": (10, 0, 7, 3)},
        "B": {"immediate": (-3, -8, 7, 1), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA07": {
        "B": {"immediate": (-5, 5, -9, -6), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA08": {
        "B": {"immediate": (-5, 3, -3, -3), "delay": 0, "future": (0, 0, 0, 0)},
    },
    # 2. Familia Desarrollo: Recortes, cuellos de botella logísticos, controles de precios y auditorías
    "MA09": {
        "B": {"immediate": (-8, 5, -11, -6), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA10": {
        "B": {"immediate": (-3, 2, -4, -8), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA11": {
        "A": {"immediate": (0, -3, 5, 2), "delay": 2, "future": (-8, 0, -10, -6)},
        "B": {"immediate": (-4, -7, 5, 1), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA12": {
        "A": {"immediate": (5, -4, 5, -2), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (-4, 4, -7, -2), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA13": {
        "B": {"immediate": (-6, -6, 5, 2), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA14": {
        "A": {"immediate": (-4, -7, -2, 1), "delay": 2, "future": (10, 0, 6, 3)},
        "B": {"immediate": (4, -8, 5, 2), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA15": {
        "A": {"immediate": (2, -4, 5, -2), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (-6, -6, -6, 1), "delay": 2, "future": (9, 8, 2, 2)},
    },
    "MA16": {
        "A": {"immediate": (0, -6, 8, 3), "delay": 2, "future": (0, -5, 3, 0)},
        "B": {"immediate": (-2, -3, -5, -4), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA17": {
        "B": {"immediate": (4, 1, -5, -11), "delay": 0, "future": (0, 0, 0, 0)},
    },
    # 3. Familia Cierre: Deuda de corto plazo (MA18 delay=1), tensión social y energía
    "MA18": {
        "A": {"immediate": (2, 10, 4, -2), "delay": 1, "future": (0, -12, 0, 0)},
        "B": {"immediate": (-6, 2, -6, -4), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA19": {
        "B": {"immediate": (-7, 4, -4, -3), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA20": {
        "B": {"immediate": (-3, -2, -4, -2), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA21": {
        "B": {"immediate": (-3, -4, 3, -3), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA22": {
        "B": {"immediate": (-2, 4, -2, -7), "delay": 1, "future": (0, -13, 0, 0)},
    },
    "MA23": {
        "A": {"immediate": (3, -6, 3, -2), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (-5, -9, -4, 0), "delay": 2, "future": (10, 6, 5, 3)},
    },
    "MA24": {
        "A": {"immediate": (6, -2, -5, -3), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (-3, -5, 4, 3), "delay": 0, "future": (0, 0, 0, 0)},
    },
    "MA25": {
        "A": {"immediate": (-4, 5, -7, -4), "delay": 0, "future": (0, 0, 0, 0)},
        "B": {"immediate": (2, -6, 7, 4), "delay": 0, "future": (0, 0, 0, 0)},
    },
}


def build_macro_v2_cards():
    cards = copy.deepcopy(BASE_CARDS)
    for cid, chg in MACRO_V2_OVERRIDES.items():
        for idx, key in enumerate(["A", "B"]):
            if key in chg:
                for field, val in chg[key].items():
                    cards[cid]["options"][idx][field] = val
    return cards


def resolve_macro_v2(card, option, state):
    o = card["options"][option]
    v, f, delay = o["immediate"], o["future"], o["delay"]
    cid = card["id"]
    if cid == "MA18" and option == 0 and state[3] < 55:
        f = (f[0], -17, f[2], f[3])
    if cid == "MA19" and option == 0 and state[0] >= 45:
        v = (3, -9, 0, -2)
    if cid == "MA20" and option == 1 and state[2] < 40:
        v = q.add(v, (0, 0, -6, -6))
    return v, f, delay


def check_no_component_dominance(cards):
    dominated = []
    for i in range(1, 26):
        cid = f"MA{i:02}"
        oa, ob = cards[cid]["options"][0], cards[cid]["options"][1]
        ta = [oa["immediate"][k] + oa["future"][k] for k in range(4)]
        tb = [ob["immediate"][k] + ob["future"][k] for k in range(4)]
        dom_a = all(oa["immediate"][k] >= ob["immediate"][k] for k in range(4)) and all(ta[k] >= tb[k] for k in range(4))
        dom_b = all(ob["immediate"][k] >= oa["immediate"][k] for k in range(4)) and all(tb[k] >= ta[k] for k in range(4))
        if dom_a or dom_b:
            dominated.append((cid, dom_a, dom_b))
    assert not dominated, f"Cartas con dominancia por componente: {dominated}"


def run_evaluation(n=250, dev_seed=2026400000, holdout_seed=2026500000):
    cards_v2 = build_macro_v2_cards()
    check_no_component_dominance(cards_v2)

    datasets = [
        ("dev", list(range(dev_seed, dev_seed + n))),
        ("holdout", list(range(holdout_seed, holdout_seed + n))),
    ]
    summary_out = {}

    for ds_name, seeds in datasets:
        q.resolve = resolve_macro_v2
        summary_out[ds_name] = {}
        card_choices_planner = {f"MA{i:02}": [0, 0] for i in range(1, 26)}

        for policy in POLICIES:
            scen_metrics = {}
            causes_total = {0: 0, 1: 0, 2: 0, 3: 0}
            stress_fails = 0
            total_wins = 0
            weakest_mins = []

            for scen, init in q.INITIAL["MA"].items():
                need_trace = (policy == "planner")
                games = [q.game(cards_v2, "MA", init, s, policy, trace=need_trace) for s in seeds]
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
    out_path = HERE / "macro_v2_results.json"
    out_path.write_text(json.dumps(summary_out, indent=2, ensure_ascii=False))
    return summary_out


if __name__ == "__main__":
    res = run_evaluation(n=100)
    for ds in ("dev", "holdout"):
        print(f"\n==================== DATASET: {ds.upper()} (n=200 por escenario) ====================")
        for p in POLICIES:
            r = res[ds][p]
            sc_str = ", ".join(f"{k[:3]}:{v['win_rate']:.1f}%" for k, v in r["by_scenario"].items())
            c = r["causes"]
            print(f"{p:13s} | Rango: {r['min_rate']:5.1f}-{r['max_rate']:5.1f}% (Media: {r['avg_rate']:5.1f}%) | [{sc_str}] | Causas A:{c[0]} T:{c[1]} B:{c[2]} C:{c[3]} | Stress: {r['stress_fails_among_winners']}")
    print("\nFrecuencia de elección de A (%) en Planner (Holdout):")
    shares = res["holdout"]["planner_choice_share_A"]
    for i in range(1, 26, 5):
        row = "  ".join(f"MA{j:02}:{shares[f'MA{j:02}']:5.1f}%" for j in range(i, min(i+5, 26)))
        print(" ", row)
