"""Analysis of the design document, NOT a production game engine.
Run: python3 analysis/quant_v1/analyze.py --n 2000 --out results
Only Python standard library required. All outputs stay beside this script.
"""
from pathlib import Path
import argparse
import collections
import hashlib
import json
import math
import random
import re
import statistics
import sys

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parents[1] / 'El_costo_del_equilibrio_Alcance.docx.md'
INITIAL = {
 'MA': {'Argentina': (50,45,50,50), 'Estados Unidos': (60,45,50,45),
        'Brasil': (55,50,45,50), 'Rusia': (50,55,45,45), 'España': (50,50,55,50)},
 'MI': {'Panadería': (50,55,50,50), 'Heladería': (50,55,50,55),
        'Agencia de traducción': (55,45,55,55), 'Taller de cerámica': (50,45,55,60),
        'Taller de reparación': (55,50,50,50)}}
LABELS = {'MA':['Actividad','Tesoro','Bienestar','Confianza'],
          'MI':['Caja','Demanda','Equipo','Calidad']}
CONDITIONS = {'MA18','MA19','MA20','MI01','MI09','MI11','MI16','MI18','MI21'}
POLICIES = ['random','always_A','always_B','signs','myopic','conservative','commitments','planner']

def extract():
    text = SOURCE.read_text()
    clean = text.replace('\\','').replace('−','-')
    cards = {}
    pattern = r'^## \*\*((?:MA|MI)\d{2}) ([^\n]+)\*\*\n(.*?)(?=^## \*\*(?:MA|MI)\d{2}|^# \*\*(?:12|13) |\Z)'
    for match in re.finditer(pattern, clean, re.M | re.S):
        cid, title, body = match.groups()
        letters = 'ATBC' if cid.startswith('MA') else 'KDEQ'
        def vector(fragment):
            pairs = re.findall(r'\b(['+letters+r'])\s+([+-]?\d+)', fragment)
            assert [p[0] for p in pairs] == list(letters), (cid,fragment,pairs)
            return tuple(int(v) for _,v in pairs)
        options = []
        for letter in 'AB':
            line = re.search(r'^Botón '+letter+r': (.+)$',body,re.M).group(1)
            immediate = vector(line.split('Efecto inmediato: ')[1].split('. ')[0])
            future = re.search(r'Dentro de (\d+) turnos: (.+?)\. Etiqueta:', line)
            options.append({'label':line.split('. Efecto inmediato:')[0], 'immediate':immediate,
                            'delay':int(future[1]) if future else 0,
                            'future':vector(future[2]) if future else (0,0,0,0)})
        condition = re.search(r'^Condición visible: (.+)$',body,re.M)
        cards[cid] = {'id':cid,'title':title,'options':options,
                      'condition':condition[1] if condition else None,
                      'source_line':text[:text.index('## **'+cid+' ')].count('\n')+1}
    assert len(cards)==50
    assert set(cards)=={f'{mode}{i:02}' for mode in INITIAL for i in range(1,26)}
    assert {c for c in cards if cards[c]['condition']}==CONDITIONS
    for mode,scenarios in INITIAL.items():
        for scenario,values in scenarios.items():
            row=re.search(r'^\| '+re.escape(scenario)+r' \|((?: \d+ \|){4})',clean,re.M)
            assert row and tuple(map(int,re.findall(r'\d+',row[1])))==values,scenario
    return cards

def resolve(card, option, state):
    o = card['options'][option]
    v, f, delay = o['immediate'], o['future'], o['delay']
    cid = card['id']
    if cid=='MA18' and option==0 and state[3]<55: f=(f[0],-17,f[2],f[3])
    if cid=='MA19' and option==0 and state[0]>=45: v=(3,-9,0,-2)
    if cid=='MA20' and option==1 and state[2]<35: v=add(v,(0,0,-5,-5))
    if cid=='MI01' and option==0 and state[1]<55: v=(2,-10,0,0)
    if cid=='MI09' and option==0 and state[1]<50: f=(-4,0,0,-3)
    if cid=='MI11' and option==0 and state[3]<45: f=(0,2,0,0)
    if cid=='MI16' and option==1 and state[2]<40: v=add(v,(0,0,-4,-5))
    if cid=='MI18' and option==1 and state[3]<55: f=(1,-4,0,0)
    if cid=='MI21' and option==1 and state[3]<40: v=add(v,(-7,-8,0,0))
    return v,f,delay

def add(a,b): return tuple(x+y for x,y in zip(a,b))

def transition(state, pending, turn, card, option):
    v,f,delay=resolve(card,option,state)
    immediate=add(state,v)
    raw=immediate
    phase='immediate' if min(immediate)<=0 else None
    due=[p for p in pending if p[0]==turn]
    remaining=list(pending)
    applied=[]
    if phase is None:
        applied=due
        remaining=[p for p in pending if p[0]!=turn]
        raw=add(immediate,tuple(sum(p[1][i] for p in due) for i in range(4)))
        if min(raw)<=0: phase='commitment'
    end=tuple(min(100,x) for x in raw)
    if delay: remaining.append((turn+delay,f,card['id']))
    return end,remaining,{'phase':phase,'causes':[i for i,x in enumerate(raw) if x<=0],
                         'immediate':immediate,'raw':raw,'applied':applied,'vector':v}

def deck(mode, seed):
    rng=random.Random(seed)
    # Sampling ordered without replacement is equivalent to sample then shuffle.
    return [f'{mode}{i:02}' for lo,hi,n in [(1,8,6),(9,17,7),(18,25,7)]
            for i in rng.sample(range(lo,hi+1),n)]

def utility(state, min_weight=.05):
    if min(state)<=0: return -10000+min(state)
    return sum(math.log(x) for x in state)+min_weight*min(state)

def forecast(state,pending,turn,horizon=3,min_weight=.05):
    """No-new-decisions stress path; not a simulated official continuation."""
    values=[state]
    for t in range(turn+1,min(20,turn+horizon)+1):
        state=tuple(min(100,x) for x in add(state,tuple(sum(p[1][i] for p in pending if p[0]==t) for i in range(4))))
        values.append(state)
    return min(utility(s,min_weight) for s in values)

def choose(policy,state,pending,turn,card,seen,cards,rng,seed,min_weight=.05):
    if policy=='random': return rng.randrange(2)
    if policy=='always_A': return 0
    if policy=='always_B': return 1
    if policy=='signs':
        # Uses only visible immediate directions and current values.
        scores=[sum((int(x>0)-int(x<0))/state[i] for i,x in enumerate(resolve(card,a,state)[0])) for a in (0,1)]
    elif policy=='myopic':
        scores=[utility(tuple(min(100,x) for x in add(state,resolve(card,a,state)[0])),min_weight) for a in (0,1)]
    elif policy=='conservative':
        ends=[transition(state,pending,turn,card,a)[0] for a in (0,1)]
        scores=[(min(s)>0,min(s),utility(s,min_weight)) for s in ends]
    elif policy=='commitments':
        scores=[forecast(*transition(state,pending,turn,card,a)[:2],turn,min_weight=min_weight) for a in (0,1)]
    elif policy=='planner':
        # Independent hypothetical draws; no actual deck or deck seed is available.
        prng=random.Random(900000000+seed*29+turn)
        paths=[]
        for _ in range(4):
            used=set(seen)|{card['id']}
            path=[]
            for t in range(turn+1,min(20,turn+3)+1):
                lo,hi=(1,8) if t<=6 else (9,17) if t<=13 else (18,25)
                pool=[f'{card["id"][:2]}{i:02}' for i in range(lo,hi+1) if f'{card["id"][:2]}{i:02}' not in used]
                nxt=prng.choice(pool); used.add(nxt); path.append(nxt)
            paths.append(path)
        scores=[]
        for a in (0,1):
            total=0
            for path in paths:
                s,p,info=transition(state,pending,turn,card,a)
                for offset,cid in enumerate(path,1):
                    if info['phase']: break
                    future_card=cards[cid]
                    choices=[transition(s,p,turn+offset,future_card,b) for b in (0,1)]
                    vals=[forecast(x[0],x[1],turn+offset,min_weight=min_weight) for x in choices]
                    b=int(vals[1]>vals[0])
                    s,p,info=choices[b]
                total+=utility(s,min_weight)
            scores.append(total/len(paths))
    else: raise ValueError(policy)
    return int(scores[1]>scores[0]) # all deterministic ties choose A

def game(cards,mode,initial,seed,policy,min_weight=.05,trace=False):
    ids=deck(mode,seed)
    rng=random.Random(700000000+seed)
    state=initial; pending=[]; seen=set(); history=[]
    minima=list(initial); phase_minima=list(initial); alert=[0]*4; timeline=[initial]
    for turn,cid in enumerate(ids,1):
        c=cards[cid]
        a=choose(policy,state,pending,turn,c,seen,cards,rng,seed,min_weight)
        before=state
        state,pending,info=transition(state,pending,turn,c,a)
        seen.add(cid); timeline.append(state)
        minima=[min(x,y) for x,y in zip(minima,state)]
        phase_minima=[min(phase_minima[i],info['immediate'][i],info['raw'][i]) for i in range(4)]
        alert=[x+int(1<=y<=20) for x,y in zip(alert,state)]
        if trace: history.append({'turn':turn,'card':cid,'option':'AB'[a],'before':before,'after':state,**info,'pending':list(pending)})
        if info['phase']: break
    win=info['phase'] is None and turn==20
    # Post-20 stress: settle commitments only; no new choices, no rescue after death.
    stress=state; stress_fail=False
    if win:
        for t in sorted({p[0] for p in pending}):
            stress=tuple(min(100,x) for x in add(stress,tuple(sum(p[1][i] for p in pending if p[0]==t) for i in range(4))))
            if min(stress)<=0: stress_fail=True; break
    return {'win':win,'turns':turn,'end':state,'minimum':minima,'phase_minimum':phase_minima,
            'alert':alert,'phase':info['phase'],'causes':info['causes'],'pending':pending,
            'stress_fail':stress_fail,'stress_end':stress,'timeline':timeline,
            **({'history':history,'deck':ids} if trace else {})}

def percentile(xs,p):
    xs=sorted(xs); j=(len(xs)-1)*p; lo=int(j); hi=math.ceil(j)
    return xs[lo]+(xs[hi]-xs[lo])*(j-lo)

def distribution(xs):
    return {'mean':statistics.mean(xs),'p05':percentile(xs,.05),'median':statistics.median(xs),
            'p95':percentile(xs,.95),'min':min(xs),'max':max(xs)} if xs else None

def wilson(k,n):
    z=1.959963984540054; p=k/n; d=1+z*z/n
    c=(p+z*z/(2*n))/d; h=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d
    return [max(0,c-h),min(1,c+h)]

def summary(games):
    n=len(games); winners=[g for g in games if g['win']]; k=len(winners)
    def vectors(group,key): return [distribution([g[key][i] for g in group]) for i in range(4)]
    causes=collections.Counter(str(i) for g in games for i in g['causes'])
    phases=collections.Counter(g['phase'] for g in games if not g['win'])
    pending=collections.defaultdict(lambda:{'benefits':[0]*4,'costs':[0]*4,'effects':0})
    for g in winners:
        for due,vec,cid in g['pending']:
            item=pending[str(due)]; item['effects']+=1
            for i,x in enumerate(vec): item['benefits'][i]+=max(0,x); item['costs'][i]+=min(0,x)
    for item in pending.values():
        for key in ['benefits','costs']: item[key]=[x/k for x in item[key]]
        item['effects']/=k
    hazard=[]
    for t in range(1,21):
        at_risk=sum(g['turns']>=t for g in games)
        deaths=sum(g['turns']==t and not g['win'] for g in games)
        hazard.append({'turn':t,'active':at_risk,'deaths':deaths,'risk':deaths/at_risk if at_risk else None})
    return {'n':n,'wins':k,'win_rate':k/n,'wilson95':wilson(k,n),'turns':distribution([g['turns'] for g in games]),
            'end_all':vectors(games,'end'),'end_winners':vectors(winners,'end') if k else None,
            'minimum':vectors(games,'minimum'),'phase_minimum':vectors(games,'phase_minimum'),
            'weakest_minimum':distribution([min(g['minimum']) for g in games]),
            'alert_turns':vectors(games,'alert'),'causes':dict(causes),'phases':dict(phases),
            'hazard':hazard,'pending_winners_per_game':dict(pending),
            'stress_fail_winners':sum(g['stress_fail'] for g in winners),
            'stress_fail_rate_winners':sum(g['stress_fail'] for g in winners)/k if k else None,
            'any_cost_pending_winners':sum(any(min(p[1])<0 for p in g['pending']) for g in winners)}

def paired(a,b):
    ds=[int(x['win'])-int(y['win']) for x,y in zip(a,b)]
    avg=statistics.mean(ds); se=statistics.stdev(ds)/math.sqrt(len(ds)) if len(ds)>1 else 0
    return {'difference':avg,'normal95':[avg-1.96*se,avg+1.96*se],
            'a_only':ds.count(1),'b_only':ds.count(-1),'n':len(ds)}

def validate(cards):
    tests=[]
    def check(name,condition):
        assert condition,name
        tests.append(name)
    def dummy(v=(0,0,0,0),f=(0,0,0,0),delay=0):
        return {'id':'TEST','options':[{'immediate':v,'future':f,'delay':delay}]*2}
    check('50 cards / 100 immediate vectors; source conditions enumerated; 10 initial scenarios match',len(cards)==50)
    check('immediate death cannot be rescued',transition((2,50,50,50),[(1,(10,0,0,0),'old')],1,dummy((-2,0,0,0)),0)[2]['phase']=='immediate')
    check('100 is safe / simultaneous immediate vector',transition((100,50,50,50),[],1,dummy((10,0,0,0)),0)[0]==(100,50,50,50))
    check('no cap between immediate and maturity',transition((95,50,50,50),[(1,(-10,0,0,0),'old')],1,dummy((10,0,0,0)),0)[0][0]==95)
    check('simultaneous maturities can net',transition((5,50,50,50),[(1,(-10,0,0,0),'x'),(1,(10,0,0,0),'y')],1,dummy(),0)[2]['phase'] is None)
    check('two simultaneous defeat causes',transition((1,1,50,50),[],1,dummy((-1,-1,0,0)),0)[2]['causes']==[0,1])
    check('turn 6 +2 is turn 8',transition((50,)*4,[],6,dummy(f=(1,0,0,0),delay=2),0)[1][0][0]==8)
    check('turn 20 immediate defeat',transition((1,50,50,50),[],20,dummy((-1,0,0,0)),0)[2]['phase']=='immediate')
    check('turn 20 maturity defeat',transition((1,50,50,50),[(20,(-1,0,0,0),'old')],20,dummy(),0)[2]['phase']=='commitment')
    check('turn 20 future remains pending',transition((50,)*4,[],20,dummy(f=(-10,0,0,0),delay=2),0)[1][0][0]==22)
    check('effects recorded even on defeat',len(transition((1,50,50,50),[],20,dummy((-1,0,0,0),(-10,0,0,0),2),0)[1])==1)
    s,p,info=transition((50,50,35,50),[],1,cards['MA20'],1)
    check('conditions use pre-choice state',s[2]==36)
    s,p,info=transition((50,)*4,[],6,dummy(f=(-10,0,0,0),delay=2),0)
    s,p,info=transition(s,p,7,dummy(),0)
    check('not due at turn 7',s[0]==50)
    s,p,info=transition(s,p,8,dummy(),0)
    check('applied after choice at turn 8',s[0]==40 and not p)
    cases=[('MA18',0,3,55,(-12,-17),'future',1),('MA19',0,0,45,(3,10),'immediate',0),
           ('MA20',1,2,35,(1,-4),'immediate',2),('MI01',0,1,55,(7,2),'immediate',0),
           ('MI09',0,1,50,(9,-4),'future',0),('MI11',0,3,45,(5,0),'future',0),
           ('MI16',1,2,40,(-6,-10),'immediate',2),('MI18',1,3,55,(9,1),'future',0),
           ('MI21',1,3,40,(4,-3),'immediate',0)]
    for cid,a,idx,threshold,expected,key,component in cases:
        vals=[]
        for x in [threshold,threshold-1]:
            s=[50]*4; s[idx]=x
            vals.append(resolve(cards[cid],a,s)[int(key=='future')][component])
        check(cid+' strict threshold / replacement or addition',tuple(vals)==expected)
    for seed in range(100):
        ids=deck('MA',seed)
        assert len(set(ids))==20 and all(1<=int(c[2:])<=8 for c in ids[:6]) and all(9<=int(c[2:])<=17 for c in ids[6:13]) and all(18<=int(c[2:])<=25 for c in ids[13:])
    check('100 deck seeds respect 6/7/7 and no duplicates',True)
    return tests

def structural(cards):
    result={}
    for mode in INITIAL:
        subset=[c for c in cards.values() if c['id'].startswith(mode)]
        dom=[]; totals={}
        for c in subset:
            a,b=[o['immediate'] for o in c['options']]
            if c['condition'] or any(o['delay'] for o in c['options']): continue
            for x,y,letter in [(a,b,'A'),(b,a,'B')]:
                if all(i>=j for i,j in zip(x,y)) and any(i>j for i,j in zip(x,y)):
                    dom.append({'id':c['id'],'option':letter,'A':a,'B':b})
        for option in (0,1):
            totals['AB'[option]]={key:[sum(c['options'][option][key][i] for c in subset) for i in range(4)] for key in ['immediate','future']}
        result[mode]={'dominance_unconditional':dom,'catalog_raw_totals':totals,
                      'future_option_count':sum(o['delay']>0 for c in subset for o in c['options'])}
    return result

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--n',type=int,default=2000)
    ap.add_argument('--start-seed',type=int,default=2026101500); ap.add_argument('--out',default='results')
    args=ap.parse_args(); cards=extract(); tests=validate(cards)
    out=HERE/args.out; out.mkdir(parents=True,exist_ok=True)
    (out/'catalog.json').write_text(json.dumps(cards,ensure_ascii=False,indent=2)+'\n')
    seeds=list(range(args.start_seed,args.start_seed+args.n))
    result={'source':SOURCE.name,'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
            'script_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            'python':sys.version,'n_per_cell':args.n,'seeds':seeds,'tests':tests,
            'structural':structural(cards),'cells':[],'paired':[],'sensitivity':[],
            'configuration':{'weights_scenarios':'1/5 within each mode; no cross-mode pooled conclusion',
              'utility':'sum(log(resource)) + 0.05*min(resource); death: -10000 + min(resource)',
              'tie_break':'A, except random 50/50',
              'planner':{'future_turns':3,'sampled_paths_per_choice':4,'continuation':'commitment forecast greedy',
                'information':'technical catalog and observed IDs; hypothetical draws independent of real order'},
              'commitments':'maximize worst utility in current state and no-new-decisions projection up to 3 future turns, truncated at 20',
              'myopic':'maximize utility after immediate vector, ignoring pending payments',
              'conservative':'maximize (survival this turn, weakest bar after immediate + due, utility)',
              'signs':'maximize sum(sign(immediate component)/current bar); no exact magnitude or future',
              'privileged_policies':['myopic','conservative','commitments','planner'],
              'terminal_states':'keep raw nonpositive component, cap others to 100; stop at defeat, do not extrapolate to turn 20',
              'seed_streams':'deck seed; random choices 700000000+seed; planning 900000000+29*seed+turn',
              'intervals':'Wilson 95% per cell; paired normal approximation for win differences; no multiplicity correction',
              'sensitivity':'same seeds; no modified catalog; hypothetical initial bars +-5 and myopic min weight 0 or .15'}}
    witnesses={}
    for mode,scenarios in INITIAL.items():
        for scenario,initial in scenarios.items():
            all_games={}
            for policy in POLICIES:
                games=[game(cards,mode,initial,seed,policy) for seed in seeds]
                all_games[policy]=games
                row={'mode':mode,'scenario':scenario,'policy':policy,**summary(games)}
                result['cells'].append(row)
                print(mode,scenario,policy,f'{row["win_rate"]:.3%}',flush=True)
                if policy in ['always_A','always_B','myopic','planner']:
                    for outcome in (True,False):
                        found=next((j for j,g in enumerate(games) if g['win']==outcome),None)
                        if found is not None:
                            key=f'{mode}/{scenario}/{policy}/{"win" if outcome else "loss"}'
                            witnesses[key]={'seed':seeds[found],**game(cards,mode,initial,seeds[found],policy,trace=True)}
            for a,b in [('planner','myopic'),('commitments','myopic'),('myopic','signs')]:
                result['paired'].append({'mode':mode,'scenario':scenario,'a':a,'b':b,**paired(all_games[a],all_games[b])})
            for weight in (0,.15):
                games=[game(cards,mode,initial,seed,'myopic',min_weight=weight) for seed in seeds]
                result['sensitivity'].append({'mode':mode,'scenario':scenario,'change':'myopic_min_weight',
                                              'value':weight,'summary':summary(games),
                                              'paired_vs_default':paired(games,all_games['myopic'])})
            for shift in (-5,5):
                games=[game(cards,mode,tuple(x+shift for x in initial),seed,'commitments') for seed in seeds]
                result['sensitivity'].append({'mode':mode,'scenario':scenario,'change':'all_initial_bars',
                                              'value':shift,'summary':summary(games),
                                              'paired_vs_default':paired(games,all_games['commitments'])})
    (out/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    (out/'witnesses.json').write_text(json.dumps(witnesses,ensure_ascii=False,indent=2)+'\n')
    print('Saved',out,flush=True)

if __name__=='__main__': main()
