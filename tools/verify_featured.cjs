const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||process.env.KALO_BUILD_DIR||path.join(__dirname,'..'));
const core=require(path.join(root,'catalog-core.js')),data={window:{}};
for(const file of ['data/catalog.js','data/prices.js','data/featured.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),data);
assert(Array.isArray(data.window.KALO_FEATURED?.productIds),'La selección debe ser una lista de referencias');
const products=JSON.parse(JSON.stringify(data.window.KALO_CATALOG.products)),prices=data.window.KALO_PRICES,ids=[...data.window.KALO_FEATURED.productIds];
assert(ids.every(id=>typeof id==='string'&&/^(?:[1-9][0-9]*|manual-[a-z0-9]+(?:-[a-z0-9]+)*)$/.test(id)));
assert.equal(ids.length,new Set(ids).size,'Destacados duplicados');
const byId=new Map(products.map(p=>[p.id,p])),index=core.createIndex(products),favorites=new Set();
const state={q:'',sport:'',category:'',team:'',audience:'',version:'',season:'',favorites:false,sort:'new'};
const run=(overrides={},selection=ids,favs=favorites)=>core.filterProducts(products,{...state,...overrides},prices,favs,index,selection);
const before=products.map(p=>p.id),base=run({},[]),ranked=run(),available=ids.filter(id=>byId.has(id)),selected=new Set(ids);
assert.deepEqual(ranked.slice(0,available.length).map(p=>p.id),available);
assert.equal(new Set(ranked.map(p=>p.id)).size,products.length,'No duplicar fichas');
assert.deepEqual(ranked.filter(p=>!selected.has(p.id)).map(p=>p.id),base.filter(p=>!selected.has(p.id)).map(p=>p.id),'Conservar el orden del resto');
assert.deepEqual(run({},[]).map(p=>p.id),before,'Sin selección se conserva el catálogo original');
assert.deepEqual(run({},['999999999999',...ids]).map(p=>p.id),ranked.map(p=>p.id),'Una referencia ausente no crea productos');
for(const sort of ['name','price-low','price-high'])assert.deepEqual(run({sort}).map(p=>p.id),run({sort},[]).map(p=>p.id),'Respetar orden '+sort);
for(const filter of [{team:'Arsenal'},{sport:'NBA'},{q:'Panamá'},{audience:'Infantil'},{category:'Polos'}]){
  const filtered=run(filter),expected=run(filter,[]);
  assert.deepEqual([...filtered.map(p=>p.id)].sort(),[...expected.map(p=>p.id)].sort(),'Respetar filtros '+JSON.stringify(filter));
}
assert.equal(run({favorites:true}).length,0);
if(available.length){const favs=new Set([available[0]]);assert.deepEqual(run({favorites:true},ids,favs).map(p=>p.id),[available[0]]);}
const removed=products.filter(p=>!selected.has(p.id)),removedIndex=core.createIndex(removed);
assert.equal(core.filterProducts(removed,state,prices,favorites,removedIndex,ids).length,removed.length,'Una retirada no bloquea el catálogo');
assert.deepEqual(products.map(p=>p.id),before,'No mutar los datos del proveedor');
for(const [id,team,equipment] of [['240112972','Real Madrid','Tercera equipación'],['237840245','FC Barcelona','Local']]){
  const product=byId.get(id);if(!product)continue;
  assert.equal(product.team,team);assert.equal(product.season,'2026/27');assert.equal(product.audience,'Adulto');assert.equal(product.version,'Estándar');assert.equal(product.detail,equipment);assert.equal(product.category,'Camisetas');
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),store=fs.readFileSync(path.join(root,'store.js'),'utf8');
assert(html.includes('featured.css'));assert(html.indexOf('data/featured.js')<html.indexOf('./store.js'));
assert(store.includes('most-requested-tag'));assert(store.includes('most-requested-inline'));assert(store.includes('Más Vendidos'));
console.log(`OK: ${available.length} destacados presentes; primero en orden predeterminado; sin duplicados; filtros, favoritos, orden por precio/nombre, bajas y datos originales conservados.`);
