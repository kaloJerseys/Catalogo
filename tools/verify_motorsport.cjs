const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||process.env.KALO_BUILD_DIR||path.join(__dirname,'..'));
const core=require(path.join(root,'catalog-core.js')),sizes=require(path.join(root,'size-guides.js')),data={window:{}};
for(const file of ['data/catalog.js','data/prices.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),data);
const supplier=JSON.parse(JSON.stringify(data.window.KALO_CATALOG.products)),prices=data.window.KALO_PRICES;
const manualIndex=JSON.parse(fs.readFileSync(path.join(root,'manual-products/index.json'),'utf8'));
const manual=manualIndex.products.flatMap(id=>{const file=path.join(root,'manual-products',id,'product.json');return fs.existsSync(file)?[JSON.parse(fs.readFileSync(file,'utf8'))]:[];});
const raw=[...manual,...supplier],products=raw.map(core.displayProduct),index=core.createIndex(products);
const state={q:'',sport:'',category:'',team:'',audience:'',version:'',season:'',favorites:false,sort:'new'};
const find=(q,overrides={})=>core.filterProducts(products,{...state,q,...overrides},prices,new Set(),index);
const fixtures=[
 {id:'fixture-f1',sport:'F1',team:'Ferrari',category:'Camisetas',season:'2026/27',version:'Estándar',original:'Ferrari F1 jersey',name:'Ferrari'},
 {id:'fixture-moto',sport:'MotorSport',discipline:'MotoGP',team:'Kawasaki',category:'Chaquetas',original:'Kawasaki jacket',name:'Kawasaki'},
 {id:'fixture-nascar',sport:'MotorSport',discipline:'NASCAR',team:'Budweiser Dodge',category:'Chaquetas',original:'Dodge jacket',name:'Dodge'},
 {id:'fixture-generic',sport:'MotorSport',discipline:'MotorSport',team:'Mercedes',category:'Chaquetas',original:'Mercedes jacket',name:'Mercedes'},
 {id:'fixture-football',sport:'Fútbol',team:'FC Barcelona',category:'Camisetas',original:'Soccer jersey F1 sponsor MotorSport',name:'Barcelona'},
 {id:'fixture-misclassified',sport:'F1',team:'Sin equipo',category:'Camisetas',original:'Kaizer Chiefs Soccer Jersey',name:'Kaizer Chiefs'}
].map(p=>core.displayProduct({...p,audience:'Adulto',teamStatus:'confirmed',detail:'Prueba',sizes:['S','M']}));
const fixtureIndex=core.createIndex(fixtures),fixtureFind=(q,overrides={})=>core.filterProducts(fixtures,{...state,q,...overrides},prices,new Set(),fixtureIndex).map(p=>p.id);
for(const query of ['F1','F 1','Fórmula 1','Formula1','formula uno','formula one'])assert.deepEqual(fixtureFind(query),['fixture-f1'],query);
for(const query of ['MotoGP','moto GP','MOTOGP'])assert.deepEqual(fixtureFind(query),['fixture-moto'],query);
for(const query of ['NASCAR','mascar'])assert.deepEqual(fixtureFind(query),['fixture-nascar'],query);
for(const query of ['MotorSport','motor sport','motosport'])assert.deepEqual(fixtureFind(query),['fixture-f1','fixture-moto','fixture-nascar','fixture-generic'],query);
assert.deepEqual(fixtureFind('',{sport:'MotorSport'}),['fixture-f1','fixture-moto','fixture-nascar','fixture-generic']);
assert.deepEqual(fixtureFind('MotoGP',{sport:'MotorSport'}),['fixture-moto']);
assert.deepEqual(fixtureFind('',{sport:'F1'}),['fixture-f1']);
assert.equal(fixtures.find(p=>p.id==='fixture-misclassified').sport,'Fútbol');
assert.equal(core.priceOf(fixtures[0],prices),prices.general.f1_base,'Conservar tarifa F1');
assert.equal(core.priceOf({...fixtures[3],category:'Camisetas',original:'Lexus shirt'},prices),(prices.categories?.Camisetas??null),'No asignar tarifa F1 a cualquier MotorSport');
for(const original of [{...fixtures[0],sport:'Otros deportes',discipline:undefined,original:'Formula One Racing jersey'},{...fixtures[0],sport:'F1',discipline:'MotoGP',original:'MotoGP racing jersey'}])assert.equal(core.priceOf(original,prices),core.priceOf(core.displayProduct(original),prices),'Tarifa coherente al reagrupar futuras importaciones');
for(const [i,original] of raw.entries()){
 const shown=products[i];assert.equal(core.priceOf(shown,prices),core.priceOf(original,prices),original.id);
 if(shown.sport==='MotorSport'){assert(core.motorsportDiscipline(shown));assert.equal(core.patchOptions(shown,prices).length,0);}
}
for(const query of ['F1','MotoGP','NASCAR'])assert(find(query).every(p=>core.motorsportDiscipline(p)===query));
const initialIds=['manual-kawasaki-monster-verde','manual-ferrari-tricolor','manual-ferrari-rojo','manual-ferrari-negro','manual-budweiser-dodge-negro','manual-budweiser-dodge-rojo','manual-mercedes-santander-gris','manual-mercedes-santander-rojo','manual-lexus-negro','manual-porsche-negro','manual-subaru-azul','manual-lamborghini-negro','manual-harley-davidson-negro','manual-bmw-petronas-azul','manual-audi-negro'];
let addedPresent=0;
for(const id of initialIds){
 const product=products.find(p=>p.id===id);if(!product)continue;addedPresent++;
 const original=manual.find(p=>p.id===id),discipline=core.motorsportDiscipline(product);
 assert.equal(product.sport,'MotorSport');assert.equal(discipline,original.discipline);
 assert.deepEqual(sizes.sizesFor(product),original.sizes);assert(fs.existsSync(path.join(root,product.image)));
 if(discipline!=='MotorSport')assert(find(discipline).some(p=>p.id===id),id+' debe encontrarse por disciplina');
 else for(const query of ['F1','MotoGP','NASCAR'])assert(!find(query).some(p=>p.id===id),id+' sin disciplina confirmada');
 const size=product.sizes[0],line={id,size,quantity:2,personalization:null,patches:[]};
 const cost=core.linePrice(product,line,prices);
 const message=core.orderMessage([line],new Map([[id,product]]),prices,n=>'$'+n.toFixed(2),null,'https://kalojerseys.github.io/Catalogo/');
 if(cost.unit!==null)assert(message.includes('$'+(cost.unit*2).toFixed(2)));else assert(message.includes('por confirmar'));
 assert(message.includes('Talla: '+size));assert(!message.includes('yupoo.com'));
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),store=fs.readFileSync(path.join(root,'store.js'),'utf8');
assert(html.includes('data-sport="MotorSport"'));assert(!html.includes('data-sport="F1"'));
assert(store.includes("params.set('sport','MotorSport')"),'Compatibilidad con enlaces anteriores');
console.log(`OK: ${addedPresent} abrigos nuevos presentes; ${manual.length} prendas manuales; MotorSport y búsquedas F1/MotoGP/NASCAR sin mezclar disciplinas; precios, tallas, pedido y datos del proveedor conservados.`);
