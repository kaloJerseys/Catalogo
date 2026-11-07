"""Valida un paquete de catálogo y construye Pages sin modificar el checkout."""
from pathlib import Path, PurePosixPath
from datetime import datetime
import argparse, hashlib, json, re, shutil, tempfile
from catalog_io import read_catalog, write_catalog
from manual_catalog import read_manual_products, write_manual_index

REQUIRED={'id','team','sport','category','audience','version','season','detail','sizes','image','original','name','teamStatus','seasonStatus'}
CATEGORIES={'Camisetas','Conjuntos','Sudaderas','Chaquetas','Polos','Pantalones y shorts','Accesorios'}
PRIVATE={'_no-subir-a-github','README-ENTREGA.txt','.git','.github','.catalog-updater','catalog-update-ready','tools','sources','.task-tools','__pycache__','actualizar-catalogo.cmd','requirements-updater.txt','ACTUALIZAR-CATALOGO.md','CUPONES-PATRIAS.md','VALIDACION.md'}

def digest(path):
    with Path(path).open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()

def catalog_digest(catalog):
    return hashlib.sha256(json.dumps(catalog,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()

def check_catalog(catalog):
    products=catalog.get('products',[])
    if not products:raise ValueError('El catálogo está vacío; se bloquea la actualización.')
    ids=set()
    for p in products:
        if not REQUIRED<=p.keys():raise ValueError('Campos obligatorios ausentes: '+str(p.get('id')))
        if not isinstance(p['id'],str) or not re.fullmatch(r'[1-9][0-9]*',p['id']) or p['id'] in ids:raise ValueError('ID no válido o duplicado: '+str(p['id']))
        ids.add(p['id'])
        if p['category'] not in CATEGORIES or p['teamStatus'] not in {'confirmed','unclassified'} or not isinstance(p['sizes'],list):raise ValueError('Clasificación no compatible: '+p['id'])
        if not all(isinstance(p[k],str) and p[k] for k in REQUIRED-{'sizes'}):raise ValueError('Datos incompletos: '+p['id'])
        if not re.fullmatch(r'\./assets/(?:products/[a-f0-9]{18,64}\.webp|image-unavailable\.svg)',p['image']):raise ValueError('Referencia de imagen no permitida: '+p['id'])
    if catalog.get('total')!=len(products):raise ValueError('El total del catálogo no coincide con sus productos.')
    return ids

def safe_relative(value):
    if not isinstance(value,str) or '\\' in value or ':' in value:raise ValueError('Ruta no permitida')
    p=PurePosixPath(value)
    if p.is_absolute() or str(p)!=value or '..' in p.parts:raise ValueError('Ruta fuera de payload: '+value)
    if value!='data/catalog.js' and not re.fullmatch(r'assets/products/[a-f0-9]{18,64}\.webp',value):raise ValueError('El paquete intenta cambiar un archivo ajeno al catálogo: '+value)
    return value

def check_package_layout(folder):
    folder=Path(folder)
    allowed={'manifest.json','report.md','payload'}
    extra=sorted(p.name for p in folder.iterdir() if p.name not in allowed)
    if extra:raise ValueError('Archivos ajenos al paquete en catalog-update-ready: '+', '.join(extra)+'. Conserva aqui solo manifest.json, report.md y payload/.')
    if not (folder/'payload').is_dir() or (folder/'payload').is_symlink():raise ValueError('Falta un directorio payload valido.')

def validate_package(folder,project):
    folder=Path(folder).resolve();project=Path(project).resolve()
    if folder.is_symlink() or (folder/'manifest.json').is_symlink():raise ValueError('No se admiten enlaces simbólicos.')
    check_package_layout(folder)
    manifest=json.loads((folder/'manifest.json').read_text('utf8'))
    if manifest.get('formatVersion')!=1 or not manifest.get('publishable') or not manifest.get('source',{}).get('complete'):raise ValueError('El manifiesto no autoriza una extracción completa.')
    if not isinstance(manifest.get('generatedAt'),str) or datetime.fromisoformat(manifest['generatedAt']).tzinfo is None:raise ValueError('Falta una fecha de generación con zona horaria.')
    source=manifest['source']
    if source.get('url')!='https://nn88.x.yupoo.com/categories/' or source.get('failedPages') or source.get('pages',0)<1 or source.get('pages')!=source.get('expectedPages') or source.get('categories',0)<1:raise ValueError('No se acredita cobertura completa del proveedor.')
    if source.get('products',0)<1:raise ValueError('Proveedor sin productos.')
    fingerprints=manifest.get('sourceFingerprints',{})
    if len(fingerprints)!=source['products'] or any(not re.fullmatch(r'[1-9][0-9]*',str(id)) or not isinstance(value,str) or not re.fullmatch(r'[a-f0-9]{64}',value) for id,value in fingerprints.items()):raise ValueError('Registro de huellas del proveedor no válido.')
    payload=folder/'payload'
    entries=manifest.get('files',[]);seen=set()
    if not isinstance(entries,list):raise ValueError('Lista de archivos no válida')
    for entry in entries:
        name=safe_relative(entry['path'])
        if name.casefold() in seen:raise ValueError('Ruta duplicada: '+name)
        seen.add(name.casefold());file=payload/name
        if file.is_symlink() or any(parent.is_symlink() for parent in file.parents if parent!=folder.parent):raise ValueError('No se admiten enlaces simbólicos.')
        if not file.is_file() or file.stat().st_size!=entry['bytes'] or digest(file)!=entry['sha256']:raise ValueError('Integridad incorrecta: '+name)
    actual={p.relative_to(payload).as_posix().casefold() for p in payload.rglob('*') if p.is_file()}
    if seen!=actual or 'data/catalog.js' not in seen:raise ValueError('Archivos obligatorios ausentes o archivos sin manifestar.')
    candidate=read_catalog(payload/'data/catalog.js');ids=check_catalog(candidate)
    # La parte ejecutable debe ser exactamente la plantilla del generador, sin JavaScript añadido.
    with tempfile.TemporaryDirectory(prefix='kalo-verify-') as temporary:
        canonical=Path(temporary)/'catalog.js';write_catalog(canonical,candidate)
        if canonical.read_bytes()!=(payload/'data/catalog.js').read_bytes():raise ValueError('catalog.js no corresponde a la plantilla segura del generador.')
    current=read_catalog(project/'data/catalog.js');old_ids=check_catalog(current)
    if catalog_digest(current)!=manifest.get('rootCatalogDigest') and catalog_digest(current)!=catalog_digest(candidate):raise ValueError('El paquete pertenece a otra base de catálogo. Ejecuta el actualizador desde este repositorio.')
    if source['products']<current.get('sourceTotal',len(old_ids))*.9:raise ValueError('Disminución anormal de álbumes del proveedor.')
    removed=old_ids-ids
    if removed and (not manifest.get('explicitRemoval') or removed-set(manifest.get('missingIds',[]))):raise ValueError('El paquete eliminaría productos sin autorización explícita.')
    if len(ids)<len(old_ids)*.9:raise ValueError('Disminución anormal del catálogo final.')
    if len(ids)!=manifest.get('productCount'):raise ValueError('Cantidad final incorrecta.')
    for p in candidate['products']:
        image=p['image'][2:]
        if not (payload/image).is_file() and not (project/image).is_file():raise ValueError('Portada ausente: '+p['id'])
    read_manual_products(project)
    return manifest,candidate

def build_site(project,folder,output):
    project=Path(project).resolve();output=Path(output).resolve()
    validate_package(folder,project)
    if output==project or project in output.parents or output.exists():raise ValueError('La salida debe ser una carpeta nueva fuera del proyecto.')
    def ignore(directory,names):
        return [n for n in names if n in PRIVATE or n.endswith(('.zip','.pyc','.bak')) or n.startswith('.env')]
    shutil.copytree(project,output,ignore=ignore)
    shutil.copytree(Path(folder)/'payload',output,dirs_exist_ok=True)
    if not (output/'index.html').is_file():raise ValueError('Falta index.html en la raíz del sitio.')
    write_manual_index(output)
    (output/'.nojekyll').touch()
    return output

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('action',choices=['verify','build']);parser.add_argument('--project',type=Path,default=Path(__file__).resolve().parents[1]);parser.add_argument('--package',type=Path);parser.add_argument('--output',type=Path)
    args=parser.parse_args();folder=args.package or args.project/'catalog-update-ready'
    if args.action=='build':
        if not args.output:parser.error('--output es obligatorio para build')
        result=build_site(args.project,folder,args.output);print('Sitio completo preparado en '+str(result))
    else:
        manifest,_=validate_package(folder,args.project);print('Paquete válido: '+str(manifest['productCount'])+' productos, hashes verificados.')

if __name__=='__main__':main()
