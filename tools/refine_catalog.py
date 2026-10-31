"""Corrige etiquetas puntuales sin importar de nuevo ni modificar las fotos."""
from pathlib import Path
import json, re
from catalog_io import read_catalog,write_catalog

ROOT=Path(__file__).resolve().parents[1]

def refine(product):
    p=dict(product);text=p['original'].lower()
    if 'new york red bulls' in text and ('soccer' in text or 'kit' in text):
        p['sport']='Fútbol';p['team']='New York Red Bulls';p['name']=p['team']+(' '+p['season'] if p['season']!='Sin temporada' else '')
    elif p['sport']=='NBA' and 'soccer' in text and 'celtic' in text:
        p['sport']='Fútbol';p['team']='Celtic';p['name']=p['team']+(' '+p['season'] if p['season']!='Sin temporada' else '')
    if p['sport']=='NBA' and p['category']=='Accesorios' and 'jersey' in text:
        p['category']='Camisetas'
    if p['sport']=='Fútbol' and p['category']=='Camisetas' and re.search(r'\bretro\b',text):
        p['version']='Retro'
    return p

def main():
    path=ROOT/'data/catalog.js'
    catalog=read_catalog(path)
    original=catalog['products'];updated=[refine(p) for p in original]
    assert [(p['id'],p['image']) for p in original]==[(p['id'],p['image']) for p in updated]
    changed=sum(a!=b for a,b in zip(original,updated))
    catalog['products']=updated
    catalog['source']='https://nn88.x.yupoo.com/categories/'
    write_catalog(path,catalog)
    print(f'{len(updated)} productos conservados. {changed} etiquetas corregidas. Referencias y fotos sin cambios.')

if __name__=='__main__':main()
