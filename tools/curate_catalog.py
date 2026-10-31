"""Separa información, equipos, colecciones/códigos y temporadas sin inventar datos."""
from pathlib import Path
from collections import Counter
from datetime import date
import hashlib,json,re
from prepare_catalog import GROUPS,SPANISH_COUNTRIES,norm
from catalog_io import read_catalog,write_catalog,display_name

ROOT=Path(__file__).resolve().parents[1]
INTERNAL=ROOT/'tools/internal'
INFORMATIONAL={'211013826','158427129','158427121','158427120'}
# Variantes respaldadas por los nombres del proveedor y los diccionarios existentes.
CANONICAL={'Miami':'Inter Miami','Monaco':'AS Monaco','Zaragoza':'Real Zaragoza','West ham':'West Ham United','Wolverhampton':'Wolverhampton Wanderers','Hamburg':'Hamburger SV','St Pauli':'FC St. Pauli','BSC Young Boys':'Young Boys','Brest':'Stade Brestois','Recife':'Sport Recife','Soviet Union':'Rusia','New York Red Bull':'New York Red Bulls','Saudi Al-Nassr':'Al-Nassr','Al-Hilal Saudi':'Al-Hilal','Palestino Deportivo':'Palestino','SV Werder Bremen':'Werder Bremen'}
EXTRA={
 'FC Barcelona':['barça'], 'Atlético de Madrid':['at mad'], 'AS Monaco':['monaco'],
 'Real Zaragoza':['zaragoza'], 'West Ham United':['west ham','whu'], 'Wolverhampton Wanderers':['wolves','wolve','wolverhampton'],
 'Hamburger SV':['hamburger sv','hamburger','hamburg'], 'FC St. Pauli':['st. pauli','fc st. pauli','st pauli'],
 'Deportivo de La Coruña':['deportivo la coruna','la coruna'], 'Países Bajos':['netherland'], 'Sevilla':['seville'],
 'PSV':['eindhoven'], 'Corinthians':['corinthian'], 'Inter Miami':['miami international'],
 'Celtic':['celtic'], 'New York Red Bulls':['new york red bull','new york red bulls'],
 'RB Leipzig':['leipzig red bull'], 'FC Red Bull Salzburg':['fc red bull salzburg','red bull salzburg'],
 'Red Bull Bragantino':['red bull bragantino'], 'All Blacks':['all blacks']
}

def team_aliases(raw):
    grouped={sport:{} for sport in GROUPS}
    for sport,teams in GROUPS.items():
        for name,aliases in teams.items():
            canonical=CANONICAL.get(name,SPANISH_COUNTRIES.get(name,name))
            grouped[sport].setdefault(canonical,set()).update([name,canonical,*aliases])
    # Solo entradas hijas del menú de categorías: los encabezados de prenda/liga no son equipos.
    for category in raw.get('categories',[]):
        line=next((line for line in category['label'].splitlines() if line.strip()),'')
        if len(line)-len(line.lstrip())<25:continue
        label=re.sub(r'[^\w\s.À-ÿ-]','',re.split(r'[\u3400-\u9fff]',line)[0]).strip()
        if not label or norm(label) in {'sports socks'}:continue
        existing=next((team for team,names in grouped['Fútbol'].items() if norm(label) in {norm(n) for n in names}),None)
        canonical=existing or CANONICAL.get(label,label)
        grouped['Fútbol'].setdefault(canonical,set()).add(label)
    for name,aliases in EXTRA.items():
        sport='Otros deportes' if name=='All Blacks' else 'Fútbol'
        grouped.setdefault(sport,{})
        grouped[sport].setdefault(name,set()).update([name,*aliases])
    compiled={}
    for sport,teams in grouped.items():
        entries=[]
        for team,names in teams.items():
            for alias in names:
                a=norm(alias)
                entries.append((len(a),re.compile(r'(?<![a-z0-9])'+re.escape(a)+r'(?![a-z0-9])'),team))
        compiled[sport]=sorted(entries,key=lambda e:e[0],reverse=True)
    return grouped,compiled

def normalized_season(original,team):
    text=norm(original)
    # Estos años forman parte del nombre de un club, no de la temporada.
    text=re.sub(r'como\s+1907','como',text)
    text=re.sub(r'\b1927\s+anniversary\b','anniversary',text)
    spans=[];invalid=[]
    for match in re.finditer(r'(?<!\d)((?:19|20)\d{2})\s*[/\*-]\s*((?:19|20)\d{2}|\d{2})(?!\d)',text):
        a=int(match[1]);b=int(match[2]);b=b if b>=100 else (a//100)*100+b+(100 if b<a%100 else 0)
        spans.append(match.span())
        if 1930<=a<=date.today().year+2 and 1<=b-a<=4:
            return f'{a}/{b%100:02d}','confirmed',None
        invalid.append(match[0])
    # Rango abreviado explícito: 25-26, 98/99, etc. Nunca se reinterpreta una parte de uno inválido.
    for match in re.finditer(r'(?<![\dA-Za-z])([0-9]{2})\s*[/\*-]\s*([0-9]{2})(?![\dA-Za-z])',text):
        if any(start<=match.start()<end for start,end in spans):continue
        a,b=int(match[1]),int(match[2]);full=(1900 if a>40 else 2000)+a
        if 1<=(b-a)%100<=4 and 1930<=full<=date.today().year+2:return f'{full}/{b:02d}','confirmed',None
    for match in re.finditer(r'(?<!\d)(?:19|20)\d{2}(?!\d)',text):
        if any(start<=match.start()<end for start,end in spans):continue
        if 1930<=int(match[0])<=date.today().year+2:return match[0],'confirmed',None
    return 'Sin temporada','unclassified','Rango o año ambiguo: '+', '.join(invalid) if invalid else None

def curate(catalog,raw):
    INTERNAL.mkdir(exist_ok=True)
    _,compiled=team_aliases(raw)
    overrides_path=INTERNAL/'curation-overrides.json'
    overrides=json.loads(overrides_path.read_text('utf-8')) if overrides_path.exists() else {}
    if not overrides_path.exists():overrides_path.write_text('{}\n',encoding='utf-8')
    refs_path=INTERNAL/'supplier-reference-albums.json'
    references={p['id']:p for p in json.loads(refs_path.read_text('utf-8'))} if refs_path.exists() else {}
    issues=[];changed=[];products=[]
    for before in catalog['products']:
        if before['id'] in INFORMATIONAL or re.match(r'^(?:all product size information|about shipping|about linda soccer jerseys)\b',before['original'],re.I):
            references[before['id']]=before;continue
        p=dict(before);original=norm(p['original']);team=None
        for _,pattern,candidate in compiled.get(p['sport'],[]):
            if pattern.search(original):team=candidate;break
        # Un alias Red Bull de fútbol no respalda la clasificación de un equipo F1.
        mismatch=p['sport']=='F1' and re.search(r'bragantino|salzburg|leipzig',original)
        if mismatch:
            team=None;issues.append({'id':p['id'],'field':'sport','current':p['sport'],'original':p['original'],'reason':'Título de fútbol clasificado como F1 por alias Red Bull; requiere confirmar sección antes de cambiar tarifas.'})
        p['team']=team or 'Sin equipo';p['teamStatus']='confirmed' if team else 'unclassified'
        codes=re.findall(r'(?<![A-Za-z0-9])#?\s*[A-Z]{1,6}[.-]?\d{2,6}[A-Z]?(?:[.-]\d{1,3})?(?![A-Za-z0-9])',p['original'])
        p['code']=' · '.join(dict.fromkeys(code.strip().replace(' ','') for code in codes))
        old=before.get('collection') or before['team']
        p['collection']=old if not team and not old.startswith('Colección ') and old!='Sin equipo' and not re.fullmatch(r'[\W\d_A-Z.-]+',old) else ''
        if p['code'] and norm(p['collection']).replace('#','')==norm(p['code']).replace('#',''):p['collection']=''
        if not team:issues.append({'id':p['id'],'field':'team','previous':before['team'],'collection':p['collection'],'code':p['code'],'original':p['original'],'reason':'No coincide con equipo/selección del diccionario verificado; se conserva fuente, sin inventar equipo.'})
        p['season'],p['seasonStatus'],problem=normalized_season(p['original'],p['team'])
        if problem:issues.append({'id':p['id'],'field':'season','previous':before['season'],'original':p['original'],'reason':problem})
        for key,value in overrides.get(p['id'],{}).items():
            if key not in {'team','season','collection','code','teamStatus','seasonStatus','name'}:raise ValueError('Campo de curación no permitido: '+key)
            p[key]=value
        p['name']=display_name(p)
        fields={key:{'before':before.get(key),'after':p.get(key)} for key in ['team','season','name'] if before.get(key)!=p.get(key)}
        if fields:changed.append({'id':p['id'],'fields':fields})
        products.append(p)
    source_ids={item['id'] for page in raw.get('pages',{}).values() for item in page}
    source_total=len(source_ids) if source_ids else len(products)+len(references)
    # Las referencias históricas se conservan aunque el proveedor retire un álbum.
    excluded=sum(reference in source_ids for reference in references) if source_ids else len(references)
    result=dict(catalog,source='https://nn88.x.yupoo.com/categories/',total=len(products),sourceTotal=source_total,excludedInformational=excluded,products=products)
    refs_path.write_text(json.dumps(list(references.values()),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (INTERNAL/'curation-review.json').write_text(json.dumps(issues,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    # Mantiene la evidencia inicial si se vuelve a ejecutar sin cambios.
    history=INTERNAL/'curation-changes.json'
    if changed:
        merged={entry['id']:entry for entry in json.loads(history.read_text('utf-8'))} if history.exists() else {}
        for entry in changed:
            existing=merged.setdefault(entry['id'],{'id':entry['id'],'fields':{}})
            for key,value in entry['fields'].items():
                if key in existing['fields']:existing['fields'][key]['after']=value['after']
                else:existing['fields'][key]=value
        history.write_text(json.dumps(list(merged.values()),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return result,issues,changed

def main():
    path=ROOT/'data/catalog.js';size=path.stat().st_size;catalog=read_catalog(path)
    original={p['id']:p for p in catalog['products']}
    price_hash=hashlib.sha256((ROOT/'data/prices.js').read_bytes()).hexdigest()
    raw=json.loads((ROOT/'tools/catalog-raw.json').read_text('utf-8'))
    result,issues,changes=curate(catalog,raw)
    assert set(original)-set(p['id'] for p in result['products']) <= INFORMATIONAL
    for p in result['products']:
        assert (p['image'],p['original'],p['category'],p['sport'],p['version'],p['audience'],p['sizes']) == tuple(original[p['id']][key] for key in ['image','original','category','sport','version','audience','sizes'])
    write_catalog(path,result)
    restored=read_catalog(path)
    assert restored==result,'La representación compacta no reconstruye exactamente los objetos.'
    assert hashlib.sha256((ROOT/'data/prices.js').read_bytes()).hexdigest()==price_hash
    stats={'products':len(result['products']),'informational':result['excludedInformational'],'sourceTotal':result['sourceTotal'],'previousBytes':size,'catalogBytes':path.stat().st_size,'reductionFrom5940184':round(100*(1-path.stat().st_size/5940184),2),'teamChoices':len({p['team'] for p in result['products'] if p['teamStatus']=='confirmed'}),'unclassifiedTeamProducts':sum(p['teamStatus']=='unclassified' for p in result['products']),'reviewFields':dict(Counter(issue['field'] for issue in issues)),'changedProducts':len(changes),'pricesSHA256':price_hash}
    (INTERNAL/'curation-metrics.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(stats,ensure_ascii=False))

if __name__=='__main__':main()
