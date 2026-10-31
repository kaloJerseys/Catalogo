"""Descarga portadas públicas con el contexto real de su álbum y las optimiza."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from PIL import Image, ImageOps
from io import BytesIO
import hashlib, json, time, urllib.request

ROOT=Path(__file__).resolve().parents[1]

def download(url, album, force=False):
    name=hashlib.sha256(url.encode()).hexdigest()[:18]+'.webp'
    target=ROOT/'assets'/'products'/name
    if target.exists() and not force: return url,'./assets/products/'+name,None
    for attempt in range(3):
        try:
            request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Referer':f'https://nn88.x.yupoo.com/albums/{album}?uid=1'})
            with urllib.request.urlopen(request,timeout=25) as response:
                if not response.headers.get('Content-Type','').startswith('image/'): raise ValueError('La respuesta no es una imagen')
                data=response.read()
            image=ImageOps.exif_transpose(Image.open(BytesIO(data))).convert('RGB')
            image.thumbnail((380,440))
            image.save(target,'WEBP',quality=70,method=4)
            time.sleep(.1)
            return url,'./assets/products/'+name,None
        except Exception as error:
            if attempt==2: return url,None,str(error)
            time.sleep(1.5*(attempt+1))

def main():
    raw=json.loads((ROOT/'tools/catalog-raw.json').read_text('utf-8'))
    unique={p['image']:p['id'] for items in raw['pages'].values() for p in items if p.get('image','').startswith(('https://photo.yupoo.com/','https://uvd.yupoo.com/'))}
    output=ROOT/'assets/products'; output.mkdir(parents=True,exist_ok=True)
    mapping={}; errors={}
    print(f'Portadas: {len(unique)} únicas.',flush=True)
    with ThreadPoolExecutor(max_workers=24) as pool:
        tasks={pool.submit(download,url,album):url for url,album in unique.items()}
        for task in as_completed(tasks):
            url,path,error=task.result()
            if path: mapping[url]=path
            else: errors[url]=error
            done=len(mapping)+len(errors)
            if done%250==0:
                (ROOT/'tools/image-map.json').write_text(json.dumps(mapping),encoding='utf-8')
                print(f'{done}/{len(unique)} portadas; {len(errors)} sin descargar.',flush=True)
    (ROOT/'tools/image-map.json').write_text(json.dumps(mapping),encoding='utf-8')
    (ROOT/'tools/image-errors.json').write_text(json.dumps(errors,ensure_ascii=False,indent=2),encoding='utf-8')
    size=sum(p.stat().st_size for p in output.glob('*.webp'))
    print(f'Final: {len(mapping)} descargadas, {len(errors)} fallos. Tamaño: {size/1_000_000:.1f} MB.',flush=True)

if __name__=='__main__': main()
