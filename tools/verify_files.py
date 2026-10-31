from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
import json
from catalog_io import read_catalog

ROOT=Path(__file__).resolve().parents[1]
errors=[]
class CheckHTML(HTMLParser):
    def __init__(self,path): super().__init__(); self.path=path;self.ids=[];self.refs=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        for key in ['src','href']:
            value=a.get(key,'')
            if value and not value.startswith(('#','http:','https:','mailto:','tel:')):
                target=(self.path.parent/unquote(urlsplit(value).path)).resolve()
                if not target.exists():errors.append(f'{self.path.name}: {value} no existe')
for page in ROOT.glob('*.html'):
    check=CheckHTML(page);check.feed(page.read_text('utf-8'))
    if len(set(check.ids))!=len(check.ids):errors.append(f'IDs duplicados en {page.name}')
def check_image(photo):
    try:
        with Image.open(photo) as image:
            image.verify()
        return None
    except Exception as error:return f'Portada inválida: {photo.name}: {error}'
photos=list((ROOT/'assets/products').glob('*.webp'))
with ThreadPoolExecutor(max_workers=12) as pool:
    image_errors=[error for error in pool.map(check_image,photos) if error]
errors.extend(image_errors)
count=len(photos)-len(image_errors)
catalog=read_catalog(ROOT/'data/catalog.js')
remote=[p['id'] for p in catalog['products'] if not p['image'].startswith('./assets/')]
if remote:errors.append(f'Portadas todavía externas: {len(remote)}')
print(json.dumps({'validImages':count,'products':len(catalog['products']),'missingCovers':[p['id'] for p in catalog['products'] if p['image']=='./assets/image-unavailable.svg'],'errors':errors},ensure_ascii=False))
if errors:raise SystemExit(1)
