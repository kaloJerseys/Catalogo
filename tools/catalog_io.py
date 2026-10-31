"""Lectura/escritura del catálogo estático compacto; no requiere dependencias."""
from pathlib import Path
import json, re

FIELDS = ['id','team','sport','category','audience','version','season','detail','sizes','image','original','collection','code','teamStatus','seasonStatus']
POOLED = {'team','sport','category','audience','version','season','detail','sizes','collection','code','teamStatus','seasonStatus'}
BEGIN = '/* KALO_DATA_BEGIN */'
END = '/* KALO_DATA_END */'

def display_name(p):
    base = p['team'] if p['team'] != 'Sin equipo' else p.get('collection') or p['category']
    return base + (' '+p['season'] if p['season'] != 'Sin temporada' else '')

def read_catalog(path):
    source=Path(path).read_text('utf-8')
    if BEGIN not in source:
        return json.loads(source.split(' = ',1)[1].rstrip(';\n'))
    payload=json.loads(source.split(BEGIN,1)[1].split(END,1)[0])
    products=[]
    for row in payload['rows']:
        p={key:payload['values'][key][value] if key in payload['values'] else value for key,value in zip(payload['fields'],row)}
        p['id']=str(p['id'])
        if re.fullmatch('[a-f0-9]{18}',p['image']):p['image']='./assets/products/'+p['image']+'.webp'
        p['name']=display_name(p)
        products.append(p)
    return dict(payload['meta'],products=products)

def write_catalog(path,catalog):
    values={key:[] for key in FIELDS if key in POOLED}; lookups={key:{} for key in values}
    rows=[]
    for product in catalog['products']:
        row=[]
        for key in FIELDS:
            value=product.get(key,[] if key=='sizes' else '')
            if key in values:
                token=json.dumps(value,ensure_ascii=False,separators=(',',':'))
                if token not in lookups[key]:
                    lookups[key][token]=len(values[key]);values[key].append(value)
                value=lookups[key][token]
            elif key=='id':value=int(value)
            elif key=='image' and re.fullmatch(r'\./assets/products/[a-f0-9]{18}\.webp',value):value=value.rsplit('/',1)[1][:-5]
            row.append(value)
        rows.append(row)
    payload={'meta':{key:value for key,value in catalog.items() if key!='products'},'fields':FIELDS,'values':values,'rows':rows}
    encoded=json.dumps(payload,ensure_ascii=False,separators=(',',':'))
    source="""// Generado por tools/curate_catalog.py. No requiere fetch ni un servidor de aplicación.
(function(){'use strict';const data=
"""+BEGIN+'\n'+encoded+'\n'+END+""";
const products=data.rows.map(row=>{const p={};data.fields.forEach((key,i)=>p[key]=data.values[key]?data.values[key][row[i]]:row[i]);p.id=String(p.id);if(/^[a-f0-9]{18}$/.test(p.image))p.image='./assets/products/'+p.image+'.webp';const base=p.team!=='Sin equipo'?p.team:p.collection||p.category;p.name=base+(p.season!=='Sin temporada'?' '+p.season:'');return p;});window.KALO_CATALOG=Object.assign(data.meta,{products});})();
"""
    Path(path).write_text(source,encoding='utf-8')
