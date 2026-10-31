"""Invariantes de la limpieza, representación compacta y vínculo con la fuente guardada."""
from pathlib import Path
import hashlib,json,re,subprocess,sys
from catalog_io import read_catalog,write_catalog
from curate_catalog import INFORMATIONAL,curate,normalized_season

ROOT=Path(__file__).resolve().parents[1]
catalog=read_catalog(ROOT/'data/catalog.js')
raw=json.loads((ROOT/'tools/catalog-raw.json').read_text('utf-8'))
raw_by_id={p['id']:p for page in raw['pages'].values() for p in page}
products=catalog['products'];by_id={p['id']:p for p in products}
assert len(products)==len(by_id)==18984
assert set(raw_by_id)-set(by_id)==INFORMATIONAL
assert catalog['sourceTotal']==len(raw_by_id)==18988
assert catalog['excludedInformational']==4
references=json.loads((ROOT/'tools/internal/supplier-reference-albums.json').read_text('utf-8'))
assert {p['id'] for p in references}==INFORMATIONAL
for p in products:
    assert p['original']==raw_by_id[p['id']]['original'],'Se perdió título fuente: '+p['id']
    assert (ROOT/p['image']).is_file(),'Falta portada '+p['image']
    assert p['teamStatus'] in {'confirmed','unclassified'}
    assert (p['teamStatus']=='confirmed')==(p['team']!='Sin equipo')
    assert not re.search(r'#[A-Z]+\d',p['team'])
    assert p['season']!='1906/06'
assert normalized_season('1906-2006 Chivas Centennial Size S-XXL','Chivas')[:2]==('Sin temporada','unclassified')
assert normalized_season('River Plate 2006/27 Away soccer jersey','River Plate')[:2]==('Sin temporada','unclassified')
assert normalized_season('25-26 Como 1907 home','Como 1907')[0]=='2025/26'
assert normalized_season('25-26 Al-Ittihad Club special version 1927 Anniversary','Al-Ittihad')[0]=='2025/26'
# Verifica reconstrucción JavaScript real, además de la lectura de mantenimiento en Python.
program="const fs=require('fs'),vm=require('vm');const c={window:{}};vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),c);process.stdout.write(JSON.stringify(c.window.KALO_CATALOG));"
runtime=json.loads(subprocess.check_output(['node','-e',program,str(ROOT/'data/catalog.js')],encoding='utf-8'))
assert runtime==catalog,'Python y navegador reconstruyen datos diferentes.'
before=(ROOT/'data/catalog.js').read_bytes();prices=(ROOT/'data/prices.js').read_bytes()
curated,_,_=curate(catalog,raw)
candidate=ROOT/'tools/internal/catalog-verification.tmp.js'
try:
    write_catalog(candidate,curated)
    assert candidate.read_bytes()==before,'La curación debe ser idempotente.'
finally:
    if candidate.exists():candidate.unlink()
assert (ROOT/'data/prices.js').read_bytes()==prices
print(json.dumps({'products':len(products),'internalReferences':len(references),'sourceIDsConserved':True,'originalTitlesConserved':True,'localImageLinksValid':True,'browserAndPythonMatch':True,'idempotent':True,'pricesUnchanged':True,'catalogBytes':len(before),'reductionPercent':round(100*(1-len(before)/5940184),2),'catalogSHA256':hashlib.sha256(before).hexdigest()},ensure_ascii=False))
