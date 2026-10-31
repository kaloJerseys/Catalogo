"""Importa las fichas públicas de Yupoo, sin cuentas ni credenciales."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from pathlib import Path
import json, re, time, urllib.request

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://nn88.x.yupoo.com'

class Gallery(HTMLParser):
    def __init__(self):
        super().__init__(); self.items=[]; self.current=None; self.pages=1; self.categories=[]; self.cat=None
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='a' and 'album__main' in a.get('class',''):
            self.current={'id':re.search(r'/albums/(\d+)',a['href'])[1], 'original':a.get('title',''), 'source':BASE+a['href']}
        elif tag=='a' and '/categories/' in a.get('href',''):
            self.cat={'url':BASE+a['href'] if a['href'].startswith('/') else a['href'], 'label':''}
        if tag=='img' and self.current and 'image' not in self.current:
            src=a.get('data-src') or a.get('src','')
            if src.startswith('//'): src='https:'+src
            self.current['image']=src
    def handle_endtag(self, tag):
        if tag=='a' and self.current:
            self.items.append(self.current); self.current=None
        if tag=='a' and self.cat:
            self.categories.append(self.cat); self.cat=None
    def handle_data(self, data):
        if self.cat: self.cat['label']+=data

def fetch(page):
    url=f'{BASE}/albums?tab=gallery&page={page}'
    for attempt in range(3):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
            with urllib.request.urlopen(req,timeout=45) as response: html=response.read().decode('utf-8')
            parsed=Gallery(); parsed.feed(html)
            if not parsed.items: raise ValueError(f'No se encontraron productos en la página {page}')
            time.sleep(.45)
            return page, parsed.items, html, parsed.categories
        except Exception:
            if attempt==2: raise
            time.sleep(2+attempt*3)

def main():
    target=ROOT/'tools'/'catalog-raw.json'
    first=fetch(1)
    html=first[2]
    matches=re.findall(r'(?:total|count|pageCount|totalPages)[^\d]{0,30}(\d{2,4})',html,re.I)
    pages_match=re.search(r'(?:共|total)[^\d<>]{0,30}(\d+)\s*(?:页|pages)',html,re.I)
    if not pages_match:
        pages_match=re.search(r'data-total\s*=\s*[\"\'](\d+)',html)
    # Total de páginas observado en la interfaz pública del catálogo.
    pages=int(pages_match[1]) if pages_match else 159
    checkpoint=json.loads(target.read_text('utf-8')) if target.exists() else {'pages':{},'categories':first[3]}
    checkpoint['pages']['1']=first[1]
    print(f'Catálogo: {pages} páginas; {len(checkpoint["pages"])} guardadas.',flush=True)
    failed=[]
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures={pool.submit(fetch,p):p for p in range(2,pages+1) if str(p) not in checkpoint['pages']}
        for task in as_completed(futures):
            page=futures[task]
            try:
                _, items, _, _=task.result(); checkpoint['pages'][str(page)]=items
            except Exception as error:
                failed.append(page); print(f'Página {page}: {error}',flush=True)
            if len(checkpoint['pages'])%10==0:
                target.write_text(json.dumps(checkpoint,ensure_ascii=False),encoding='utf-8')
                print(f'{len(checkpoint["pages"])}/{pages} páginas descargadas.',flush=True)
    checkpoint['expectedPages']=pages
    checkpoint['failedPages']=failed
    target.write_text(json.dumps(checkpoint,ensure_ascii=False),encoding='utf-8')
    print(f'Final: {len(checkpoint["pages"])}/{pages} páginas. Productos: {sum(len(x) for x in checkpoint["pages"].values())}. Fallos: {failed}',flush=True)
    if failed: raise SystemExit(1)

if __name__=='__main__': main()
