"""Valida fichas manuales e indexa sus carpetas sin tocar el catálogo del proveedor."""
from pathlib import Path
import argparse, json, math, re

ID = re.compile(r'manual-[a-z0-9]+(?:-[a-z0-9]+)*')
CATEGORIES = {'Camisetas','Conjuntos','Sudaderas','Chaquetas','Abrigos','Polos','Pantalones y shorts','Accesorios'}

def read_manual_products(project):
    root = Path(project).resolve()
    folder = root / 'manual-products'
    if not folder.exists():
        return []
    if folder.is_symlink():
        raise ValueError('No se admiten enlaces en prendas manuales.')
    products = []
    for directory in sorted(folder.iterdir()):
        if not directory.is_dir():
            continue
        id = directory.name
        if directory.is_symlink() or not ID.fullmatch(id):
            raise ValueError('Carpeta manual no válida: '+id)
        file = directory / 'product.json'
        if file.is_symlink():
            raise ValueError('Ficha manual enlazada: '+id)
        product = json.loads(file.read_text('utf-8'))
        if not isinstance(product,dict) or product.get('id') != id or product.get('source') != 'manual':
            raise ValueError('Referencia manual no válida: '+id)
        for key in ['name','team','sport','category','audience','version','season','seasonStatus','teamStatus','detail','original','description']:
            value = product.get(key)
            if not isinstance(value,str) or not value.strip() or len(value)>2000:
                raise ValueError('Campo manual no válido: '+key)
        for key,values in [('category',CATEGORIES),('audience',{'Adulto','Mujer','Infantil'}),('version',{'Estándar','Jugador','Retro'}),('teamStatus',{'confirmed','unclassified'}),('seasonStatus',{'confirmed','unclassified'})]:
            if product[key] not in values:
                raise ValueError('Clasificación manual no válida: '+key)
        if 'discipline' in product and (not isinstance(product['discipline'],str) or product['discipline'] not in {'F1','MotoGP','NASCAR','MotorSport'}):
            raise ValueError('Disciplina manual no válida: '+id)
        price = product.get('manualPrice','ausente')
        if price is not None and (type(price) not in (int,float) or not math.isfinite(price) or price<0 or abs(price*100-round(price*100))>1e-7):
            raise ValueError('Precio manual no válido: '+id)
        sizes = product.get('sizes')
        if not isinstance(sizes,list) or not sizes or any(not isinstance(s,str) or not s.strip() or len(s)>30 for s in sizes) or len(set(sizes))!=len(sizes):
            raise ValueError('Tallas manuales no válidas: '+id)
        image = product.get('image')
        if not isinstance(image,str) or not re.fullmatch(r'\./manual-products/'+id+r'/[a-z0-9][a-z0-9-]*\.(png|jpg|jpeg|webp)',image):
            raise ValueError('Ruta de imagen manual no válida: '+id)
        image_file = root / image[2:]
        if image_file.is_symlink() or not image_file.is_file():
            raise ValueError('Foto manual ausente o enlazada: '+id)
        with image_file.open('rb') as stream:
            header = stream.read(12)
        suffix = image_file.suffix
        if not ((suffix=='.png' and header.startswith(b'\x89PNG\r\n\x1a\n')) or (suffix in {'.jpg','.jpeg'} and header.startswith(b'\xff\xd8\xff')) or (suffix=='.webp' and header[:4]==b'RIFF' and header[8:12]==b'WEBP')):
            raise ValueError('El formato de la foto no coincide: '+id)
        products.append(product)
    if len(products)>500:
        raise ValueError('Máximo de 500 prendas manuales por índice.')
    return products

def write_manual_index(project):
    products = read_manual_products(project)
    folder = Path(project)/'manual-products'
    folder.mkdir(parents=True,exist_ok=True)
    target = folder/'index.json'
    if target.is_symlink():
        raise ValueError('No se admite índice enlazado.')
    target.write_text(json.dumps({'formatVersion':1,'products':[p['id'] for p in products]},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return products

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['verify','index'])
    parser.add_argument('--project',type=Path,default=Path(__file__).resolve().parents[1])
    args=parser.parse_args()
    products=write_manual_index(args.project) if args.action=='index' else read_manual_products(args.project)
    print(f'OK: {len(products)} prendas manuales; catálogo del proveedor intacto.')
