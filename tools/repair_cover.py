from pathlib import Path
from PIL import Image
import hashlib, json, sys
from download_images import download

ROOT=Path(__file__).resolve().parents[1]
name=sys.argv[1]
raw=json.loads((ROOT/'tools/catalog-raw.json').read_text('utf-8'))
for items in raw['pages'].values():
    for item in items:
        url=item.get('image','')
        if hashlib.sha256(url.encode()).hexdigest()[:18]+'.webp'!=name:continue
        _,path,error=download(url,item['id'],force=True)
        if error:raise RuntimeError(error)
        with Image.open(ROOT/path) as image:image.verify()
        print('Portada reparada y verificada: '+name)
        raise SystemExit(0)
raise SystemExit('No se encontró la portada en el catálogo de origen.')
