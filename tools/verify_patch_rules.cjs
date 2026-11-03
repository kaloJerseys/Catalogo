const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]||process.env.KALO_BUILD_DIR||path.join(__dirname,'..'));
const core=require(path.join(root,'catalog-core.js')),data={window:{}};
for(const f of ['data/prices.js','data/patch-rules.js','data/catalog.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),data);
const prices=data.window.KALO_PRICES,products=data.window.KALO_CATALOG.products;
let checks=0;
function ids(p,config=prices){checks++;return core.patchOptions(p,config).map(x=>x.id);}
const shirt={id:'test',team:'Real Madrid',teamStatus:'confirmed',season:'2026/27',seasonStatus:'confirmed',sport:'Fútbol',category:'Camisetas',audience:'Adulto',version:'Estándar',original:'Real Madrid Home Soccer Jersey',detail:'Local'};
assert.deepEqual(ids(shirt),['champions','league']);
assert.deepEqual(ids({...shirt,team:'Arsenal'}),['champions']);
assert.deepEqual(ids({...shirt,team:'Arsenal',season:'2021/22'}),[]);
assert.deepEqual(ids({...shirt,team:'Chelsea',season:'2023/24'}),[]);
assert.deepEqual(ids({...shirt,team:'Chelsea',season:'2020/21'}),['champions']);
assert.deepEqual(ids({...shirt,team:'Girona',season:'2024/25'}),['champions','league']);
assert.deepEqual(ids({...shirt,team:'Girona',season:'2023/24'}),['league']);
assert.deepEqual(ids({...shirt,team:'Girona',season:'2026/27'}),[]);
assert.deepEqual(ids({...shirt,team:'Valladolid',season:'2024/25'}),['league']);
assert.deepEqual(ids({...shirt,team:'Valladolid',season:'2025/26'}),[]);
assert.deepEqual(ids({...shirt,team:'Santander'}),['league']);
assert.deepEqual(ids({...shirt,team:'Racing',original:'Racing Club de Avellaneda jersey'}),[]);
for(const team of ['Panamá','Argentina','España','Brasil','Francia','Inglaterra','México','Alemania','Inter Miami','Flamengo','Boca Juniors','Al-Nassr','Sin equipo','Club desconocido'])
 for(const season of Object.keys(prices.patchEligibility.champions))assert.deepEqual(ids({...shirt,team,season}),[]);
for(const season of ['2026','Sin temporada','1998/01','1992/95','2024/26','2027/28','2026/2028'])assert.deepEqual(ids({...shirt,season}),[]);
assert.deepEqual(ids({...shirt,season:'2026/2027'}),['champions','league']);
assert.deepEqual(ids({...shirt,seasonStatus:'unclassified'}),[]);
assert.deepEqual(ids({...shirt,teamStatus:'unclassified'}),[]);
assert.deepEqual(ids({...shirt,sport:'NBA'}),[]);
for(const original of ['Real Madrid Training Jersey','Real Madrid Pre-Match Jersey','Real Madrid Warm Up Jersey'])assert.deepEqual(ids({...shirt,original}),[]);
for(const category of ['Accesorios','Polos','Chaquetas','Pantalones y shorts'])assert.deepEqual(ids({...shirt,category}),[]);
assert.deepEqual(ids(shirt,{...prices,patchEligibility:undefined}),[]);
assert.deepEqual(ids(shirt,{...prices,productAttributes:{test:{patches:false}}}),[]);
assert.deepEqual(ids(shirt,{...prices,productAttributes:{test:{patches:['league']}}}),['league']);
const panama={...shirt,id:'panama',team:'Panamá',original:'Panama Home Jersey'};
assert.throws(()=>core.validateOptions(panama,{patches:['champions']},prices));
assert.throws(()=>core.validateOptions({...shirt,team:'Arsenal'},{patches:['league']},prices));
const saved={personalization:{name:'PRUEBA',number:'10'},patches:['champions','league']};
const restored=core.restoreOptions(panama,saved,prices);
assert.equal(restored.removedPatches,2);assert.deepEqual(restored.options,{personalization:{name:'PRUEBA',number:'10'},patches:[]});
assert.deepEqual(core.restoreOptions({...shirt,team:'Arsenal'},saved,prices).options.patches,['champions']);
assert.throws(()=>core.restoreOptions(shirt,{patches:'champions'},prices));
assert.throws(()=>core.restoreOptions(shirt,{patches:['inventado']},prices));
assert.equal(core.linePrice(shirt,{patches:['champions']},prices).surcharge,1.5);
assert.equal(core.linePrice(panama,restored.options,prices).surcharge,0);
let actualWithPatches=0;
for(const p of products){
 const options=core.patchOptions(p,prices),season=core.patchSeason(p);
 if(options.length)actualWithPatches++;
 for(const option of options){assert(season);assert.equal(p.teamStatus,'confirmed');assert(prices.patchEligibility[option.id][season].includes(core.normalize(p.team)));}
}
for(const [id,seasons] of Object.entries(prices.patchEligibility))for(const [season,teams] of Object.entries(seasons)){
 assert(/^\d{4}\/\d{2}$/.test(season));assert.equal(new Set(teams).size,teams.length);
 assert(prices.patchEligibilitySources[id][season].startsWith('https://'));
}
console.log(`OK: ${checks} casos de elegibilidad; selección por temporada exacta; rechazo de parches inválidos; recuperación del pedido; ${products.length} productos revisados, ${actualWithPatches} con opciones.`);
