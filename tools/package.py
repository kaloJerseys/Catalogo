"""Empaqueta los archivos públicos y la documentación, sin cachés de importación."""
from pathlib import Path
import json, zipfile, sys

ROOT=Path(__file__).resolve().parents[1]
name=sys.argv[1] if len(sys.argv)>1 else 'kalo-jerseys.zip'
if Path(name).name!=name:raise SystemExit('Usa solo un nombre de archivo ZIP dentro del proyecto.')
target=ROOT.parent/name
update_only='--update' in sys.argv[2:]
excluded={'catalog-raw.json','image-map.json','image-errors.json'}
files=[]
for path in ROOT.rglob('*'):
    if not path.is_file() or path.name in excluded or '__pycache__' in path.parts or path.suffix=='.zip': continue
    if update_only and 'products' in path.relative_to(ROOT).parts and path.suffix=='.webp':continue
    files.append(path)
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as output:
    for path in sorted(files): output.write(path,Path('kalo-jerseys')/path.relative_to(ROOT))
print(json.dumps({'archive':str(target),'files':len(files),'sizeMB':round(target.stat().st_size/1_000_000,1)},ensure_ascii=False))
