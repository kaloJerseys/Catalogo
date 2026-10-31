"""Actualización manual explícita de Yupoo; conserva precios, correcciones y fotos locales."""
from concurrent.futures import ThreadPoolExecutor,as_completed
from datetime import datetime,timedelta,timezone
from pathlib import Path
import argparse,hashlib,json,re,shutil,subprocess,sys
from catalog_io import read_catalog

ROOT=Path(__file__).resolve().parents[1]
INTERNAL=ROOT/'tools/internal'

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    modes=parser.add_mutually_exclusive_group(required=True)
    modes.add_argument('--from-cache',action='store_true',help='Reprepara solo los datos locales guardados. No usa red.')
    modes.add_argument('--refresh',action='store_true',help='Vuelve a leer todas las páginas públicas de Yupoo explícitamente.')
    parser.add_argument('--pages',type=int,help='Cantidad actual de páginas observada en Yupoo si no puede detectarse.')
    parser.add_argument('--download-new-covers',action='store_true',help='Descarga únicamente portadas que no existen en assets/products.')
    args=parser.parse_args()
    if args.pages is not None and args.pages<1:parser.error('--pages debe ser positivo.')
    if args.from_cache and args.download_new_covers:parser.error('--download-new-covers solo se usa con --refresh.')
    INTERNAL.mkdir(exist_ok=True)
    price_path=ROOT/'data/prices.js';prices_before=price_path.read_bytes()
    old=read_catalog(ROOT/'data/catalog.js');old_by_id={p['id']:p for p in old['products']}
    before_digest=hashlib.sha256((ROOT/'data/catalog.js').read_bytes()).hexdigest()
    if args.refresh:
        from import_catalog import fetch,BASE
        first=fetch(1)
        matches=re.search(r'(?:共|total)[^\d<>]{0,30}(\d+)\s*(?:页|pages)',first[2],re.I)
        pages=args.pages or (int(matches[1]) if matches else None)
        if not pages:raise SystemExit('No se pudo confirmar el total de páginas. Consulta Yupoo y repite con --pages N; no se cambió el catálogo.')
        checkpoint={'pages':{'1':first[1]},'categories':first[3],'expectedPages':pages,'failedPages':[],'updated':datetime.now(timezone(timedelta(hours=-5))).date().isoformat(),'source':BASE+'/categories/'}
        errors=[]
        with ThreadPoolExecutor(max_workers=2) as pool:
            tasks={pool.submit(fetch,page):page for page in range(2,pages+1)}
            for task in as_completed(tasks):
                page=tasks[task]
                try:
                    _,items,_,_=task.result();checkpoint['pages'][str(page)]=items
                except Exception as error:errors.append({'page':page,'error':str(error)})
                if len(checkpoint['pages'])%10==0:print(f'Leídas {len(checkpoint["pages"])}/{pages} páginas.',flush=True)
        if errors:
            (INTERNAL/'last-update-errors.json').write_text(json.dumps(errors,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
            raise SystemExit('Faltan páginas. Se conserva el catálogo anterior; consulta tools/internal/last-update-errors.json y vuelve a ejecutar.')
        source=ROOT/'tools/catalog-raw.json'
        backup=INTERNAL/'update-backups';backup.mkdir(exist_ok=True)
        for path in [source,ROOT/'data/catalog.js',ROOT/'tools/image-map.json']:
            if path.exists():shutil.copy2(path,backup/path.name)
        candidate=source.with_suffix('.pending.json')
        candidate.write_text(json.dumps(checkpoint,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
        candidate.replace(source)
        if args.download_new_covers:
            # La función existente usa el hash del URL y reutiliza cualquier archivo ya descargado.
            from download_images import download
            mapping_path=ROOT/'tools/image-map.json'
            mapping=json.loads(mapping_path.read_text('utf-8')) if mapping_path.exists() else {}
            unique={p['image']:p['id'] for items in checkpoint['pages'].values() for p in items if p.get('image','').startswith(('https://photo.yupoo.com/','https://uvd.yupoo.com/'))}
            pending=[(url,album) for url,album in unique.items() if not mapping.get(url) or not (ROOT/mapping[url]).exists()]
            errors={}
            for url,album in pending:
                _,path,error=download(url,album)
                if path:mapping[url]=path
                else:errors[url]=error
            mapping_path.write_text(json.dumps(mapping,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
            (ROOT/'tools/image-errors.json').write_text(json.dumps(errors,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
            print(f'Portadas nuevas pendientes: {len(pending)}; fallos: {len(errors)}. Portadas anteriores conservadas.',flush=True)
    subprocess.run([sys.executable,'-X','utf8',str(ROOT/'tools/prepare_catalog.py')],check=True)
    assert price_path.read_bytes()==prices_before,'La actualización no debe modificar data/prices.js.'
    updated=read_catalog(ROOT/'data/catalog.js');new_by_id={p['id']:p for p in updated['products']}
    report={'mode':'refresh' if args.refresh else 'from-cache','previousProducts':len(old_by_id),'products':len(new_by_id),'addedIds':sorted(set(new_by_id)-set(old_by_id)),'removedIds':sorted(set(old_by_id)-set(new_by_id)),'catalogChanged':before_digest!=hashlib.sha256((ROOT/'data/catalog.js').read_bytes()).hexdigest(),'pricesUnchanged':True,'productPhotosDeleted':0,'curationReview':'tools/internal/curation-review.json','supplierReferences':'tools/internal/supplier-reference-albums.json','sizeGuidesPending':['NBA','shorts','F1','infantil','Retro']}
    (INTERNAL/'last-update-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False))

if __name__=='__main__':main()
