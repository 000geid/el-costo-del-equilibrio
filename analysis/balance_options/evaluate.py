"""Experimentos hipotéticos de balance; no cambia el motor ni el catálogo.

Reutiliza el modelo validado de quant_v1 y comparte mazos entre variantes.
Los drenajes son reglas abstractas de presión, no modelos de contabilidad.
"""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import math
import platform

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
spec = importlib.util.spec_from_file_location("quant", HERE.parent / "quant_v1/analyze.py")
q = importlib.util.module_from_spec(spec)
spec.loader.exec_module(q)
BASE_RESOLVE, BASE_TRANSITION, BASE_FORECAST, BASE_CHOOSE = q.resolve, q.transition, q.forecast, q.choose
POLICIES = ["random", "always_A", "always_B", "signs", "conservative", "planner"]
VARIANTS = {
    "baseline": {"label": "Actual"},
    "initial_minus10": {"label": "Iniciales −10", "initial_shift": -10},
    "initial_minus20": {"label": "Iniciales −20", "initial_shift": -20},
    "negative_x1_5": {"label": "Impactos negativos ×1,5", "negative_factor": 1.5},
    "other_negative_x2": {"label": "Daños en otras tres barras ×2", "other_negative_factor": 2},
    "cash_minus2": {"label": "Caja/Tesoro −2 por decisión", "cash_drain": 2},
    "other_minus1": {"label": "Otras tres barras −1 por decisión", "other_drain": 1},
    "other_minus2": {"label": "Otras tres barras −2 por decisión", "other_drain": 2},
    "all_minus1": {"label": "Todas las barras −1 por decisión", "cash_drain": 1, "other_drain": 1},
}


def configure(config):
    def pressure(mode):
        cash_index = 1 if mode == "MA" else 0
        return tuple(-config.get("cash_drain", 0) if i == cash_index else -config.get("other_drain", 0) for i in range(4))

    def resolve(card, option, state):
        v, f, delay = BASE_RESOLVE(card, option, state)
        cash_index = 1 if card["id"].startswith("MA") else 0
        def scale(xs):
            return tuple(-math.ceil(-x * config.get("negative_factor", 1) *
                         (config.get("other_negative_factor", 1) if i != cash_index else 1))
                         if x < 0 else x for i, x in enumerate(xs))
        return scale(v), scale(f), delay

    def transition(state, pending, turn, card, option):
        end, remaining, info = BASE_TRANSITION(state, pending, turn, card, option)
        if info["phase"] is None:
            raw = q.add(info["raw"], pressure(card["id"][:2]))
            end = tuple(min(100, x) for x in raw)
            info = {**info, "raw": raw, "phase": "pressure" if min(raw) <= 0 else None,
                    "causes": [i for i, x in enumerate(raw) if x <= 0]}
        return end, remaining, info

    # The planner knows the recurrent rule. Its no-new-decisions forecast
    # includes each future drain, then maturities, with no rescue after death.
    def forecast(state, pending, turn, horizon=3, min_weight=.05):
        values = [state]
        mode = current_mode[0]
        for t in range(turn + 1, min(20, turn + horizon) + 1):
            if min(state) <= 0:
                break
            maturities = tuple(sum(p[1][i] for p in pending if p[0] == t) for i in range(4))
            state = tuple(min(100, x) for x in q.add(q.add(state, maturities), pressure(mode)))
            values.append(state)
        return min(q.utility(s, min_weight) for s in values)

    q.resolve, q.transition = resolve, transition
    q.forecast = BASE_FORECAST if not (config.get("cash_drain") or config.get("other_drain")) else forecast
    return pressure


current_mode = ["MA"]


def validate(cards):
    configure({})
    q.validate(cards)
    for mode, scenarios in q.INITIAL.items():
        current_mode[0] = mode
        for initial in scenarios.values():
            for policy in POLICIES:
                for seed in (17, 42, 2026101600):
                    q.resolve, q.transition, q.forecast = BASE_RESOLVE, BASE_TRANSITION, BASE_FORECAST
                    original = q.game(cards, mode, initial, seed, policy, trace=True)
                    configure({})
                    candidate = q.game(cards, mode, initial, seed, policy, trace=True)
                    assert candidate == original, (mode, initial, policy, seed)
    configure({"cash_drain": 2})
    card = {"id": "MA00", "options": [{"immediate": (0, 0, 0, 0), "future": (0, 0, 0, 0), "delay": 0}]}
    s, _, info = q.transition((50, 2, 50, 50), [], 1, card, 0)
    assert s == (50, 0, 50, 50) and info["phase"] == "pressure"
    s, _, info = q.transition((50, 99, 50, 50), [(1, (0, 10, 0, 0), "old")], 1, card, 0)
    assert s[1] == 100 and info["raw"][1] == 107
    card["options"][0]["immediate"] = (0, -2, 0, 0)
    _, _, info = q.transition((50, 2, 50, 50), [(1, (0, 10, 0, 0), "old")], 1, card, 0)
    assert info["phase"] == "immediate"
    configure({})
    return {"inherited_checks": 24, "baseline_identical_games": 180, "additional_pressure_checks": 3}


def run():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=100)
    ap.add_argument("--start-seed", type=int, default=2026300000)
    ap.add_argument("--variants", nargs="+", choices=VARIANTS, default=list(VARIANTS))
    ap.add_argument("--output", default="pilot.json")
    args = ap.parse_args()
    assert args.n > 1
    cards = q.extract()
    checks = validate(cards)
    seeds = list(range(args.start_seed, args.start_seed + args.n))
    outputs = {"cells": [], "paired_vs_baseline": [], "planning_vs_conservative": []}
    variants = list(dict.fromkeys(["baseline", *args.variants]))
    baseline = {}
    for variant in variants:
        config = VARIANTS[variant]
        configure(config)
        for mode, scenarios in q.INITIAL.items():
            current_mode[0] = mode
            rates = {p: [] for p in POLICIES}
            for scenario, initial in scenarios.items():
                games_by_policy = {}
                shifted = tuple(x + config.get("initial_shift", 0) for x in initial)
                for policy in POLICIES:
                    games = [q.game(cards, mode, shifted, seed, policy) for seed in seeds]
                    games_by_policy[policy] = games
                    cell = {"variant": variant, "mode": mode, "scenario": scenario, "policy": policy, **q.summary(games)}
                    outputs["cells"].append(cell)
                    rates[policy].append(cell["win_rate"])
                    key = (mode, scenario, policy)
                    if variant == "baseline":
                        baseline[key] = games
                    else:
                        outputs["paired_vs_baseline"].append({"variant": variant, "mode": mode, "scenario": scenario,
                            "policy": policy, **q.paired(games, baseline[key])})
                outputs["planning_vs_conservative"].append({"variant": variant, "mode": mode, "scenario": scenario,
                    **q.paired(games_by_policy["planner"], games_by_policy["conservative"])})
            print(variant, mode, " | ".join(f"{p}: {min(xs):.1%}–{max(xs):.1%}" for p, xs in rates.items()), flush=True)
    files = [Path(__file__), HERE.parent / "quant_v1/analyze.py", ROOT / "El_costo_del_equilibrio_Alcance.docx.md",
             ROOT / "src/engine/engine.ts", ROOT / "src/data/cardsMacro.ts", ROOT / "src/data/cardsMicro.ts", ROOT / "src/data/scenarios.ts"]
    outputs["metadata"] = {"n_per_cell": args.n, "seeds": seeds, "python": platform.python_version(),
        "variants": {v: VARIANTS[v] for v in variants}, "policies": POLICIES, "checks": checks,
        "files_sha256": {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in files},
        "recurrent_order": "conditions, immediate defeat, maturities defeat, recurrent pressure defeat, cap, schedule; no pressure after turn 20",
        "aggregation": "scenario ranges only; 1/5 weights if aggregated; shared seeds across scenarios are dependent",
        "information": "conservative/planner know exact catalog; signs uses immediate directions; planner never sees future deck",
        "negative_scaling": "all negative components, including active conditional replacements and deferred vectors, rounded away from zero",
        "close_stress": "stress_fail_winners settles pending without further pressure or choices, existing policies unchanged; diagnostic, not calibrated closing rule"}
    (HERE / args.output).write_text(json.dumps(outputs, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    run()
