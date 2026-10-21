"""Independent-seed robustness check; no balance or policy tuning."""
import hashlib
import json
from pathlib import Path
from analyze import HERE, INITIAL, extract, game, paired, summary, validate

cards=extract()
validate(cards)
seeds=list(range(2026200000,2026200500))
results={'seeds':seeds,'n_per_cell':len(seeds),'source_sha256':hashlib.sha256((HERE.parents[1]/'El_costo_del_equilibrio_Alcance.docx.md').read_bytes()).hexdigest(),
         'script_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'cells':[],'paired':[]}
for scenario,initial in INITIAL['MA'].items():
    baseline=[game(cards,'MA',initial,s,'conservative') for s in seeds]
    results['cells'].append({'mode':'MA','scenario':scenario,'policy':'conservative','weight':.05,**summary(baseline)})
    for weight in (0,.05,.15):
        gs={}
        for policy in ['myopic','planner']:
            gs[policy]=[game(cards,'MA',initial,s,policy,min_weight=weight) for s in seeds]
            row={'mode':'MA','scenario':scenario,'policy':policy,'weight':weight,**summary(gs[policy])}
            results['cells'].append(row)
            print(scenario,policy,weight,row['win_rate'],flush=True)
        results['paired'].append({'mode':'MA','scenario':scenario,'weight':weight,'a':'planner','b':'myopic',**paired(gs['planner'],gs['myopic'])})
        if weight==.05:
            results['paired'].append({'mode':'MA','scenario':scenario,'weight':weight,'a':'planner','b':'conservative',**paired(gs['planner'],baseline)})
(HERE/'results'/'robustness.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
