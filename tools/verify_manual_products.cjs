const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.env.KALO_BUILD_DIR||process.argv[2]||path.join(__dirname,'..'));
const core=require(path.join(root,'catalog-core.js')),sizes=require(path.join(root,'size-guides.js')),data={window:{}};
for(const file of ['data/catalog.js','data/prices.js','data/patch-rules.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),data);
const prices=data.window.KALO_PRICES,products=data.window.KALO_CATALOG.products;
const loader=fs.readFileSync(path.join(root,'manual-products.js'),'utf8');
async function load(overrides={}){
  const c={window:{},AbortController,setTimeout,clearTimeout,fetch:async url=>{
    if(Object.hasOwn(overrides,url))return overrides[url];
    const file=path.resolve(root,url);return {status:fs.existsSync(file)?200:404,ok:fs.existsSync(file),json:async()=>JSON.parse(fs.readFileSync(file,'utf8'))};
  }};
  vm.runInNewContext(loader,c);const result=await c.window.KALO_MANUAL_READY;return JSON.parse(JSON.stringify(result));
}
(async()=>{
  const actual=await load();assert.equal(actual.error,null);
  for(const product of actual.products){assert.equal(core.priceOf(product,prices),Object.hasOwn(prices.products||{},product.id)?prices.products[product.id]:product.manualPrice);assert(fs.existsSync(path.join(root,product.image)));}
  const fixture={id:'manual-prueba',name:'Chaqueta de prueba',team:'Red Bull Racing',sport:'F1',category:'Chaquetas',audience:'Adulto',version:'Retro',season:'Sin temporada',seasonStatus:'unclassified',teamStatus:'confirmed',detail:'Azul',original:'F1 jacket',description:'Prueba',manualPrice:60,sizes:['S','M','L','XL','2XL'],image:'./manual-products/manual-prueba/frente.png',source:'manual'};
  const fixtureIndex={'./manual-products/index.json':{status:200,ok:true,json:async()=>({formatVersion:1,products:[fixture.id]})}};
  const fixtureFiles={...fixtureIndex,['./manual-products/'+fixture.id+'/product.json']:{status:200,ok:true,json:async()=>fixture}};
  const loadFixture=(overrides={})=>load({...fixtureFiles,...overrides});
  const loaded=await loadFixture();assert.equal(loaded.error,null);const jacket=loaded.products[0];assert(jacket);
  assert.equal(core.priceOf(jacket,prices),60);assert.equal(core.priceOf(jacket,{...prices,products:{[jacket.id]:65}}),65);
  assert.equal(core.priceOf({...jacket,category:'Sudaderas',original:'polyester hoodie'},prices),60);
  assert.deepEqual(sizes.sizesFor({...jacket,category:'Polos',original:'polo',sizes:['2XL']}),['2XL']);
  assert.deepEqual(sizes.sizesFor(jacket),['S','M','L','XL','2XL']);assert.equal(core.classifyProduct(jacket,prices).personalizable,false);assert.deepEqual(core.patchOptions(jacket,prices),[]);
  const bag=[{id:jacket.id,size:'2XL',quantity:2,personalization:null,patches:[]}],map=new Map([[jacket.id,jacket]]);
  const message=core.orderMessage(bag,map,prices,n=>'$'+n.toFixed(2),null,'https://kalojerseys.github.io/Catalogo/');
  assert(message.includes('Cantidad: 2'));assert(message.includes('2XL'));assert(message.includes('$120.00'));assert(message.includes('?producto=manual-prueba'));assert(!message.includes('yupoo.com'));
  assert.equal(new Set([...products,...loaded.products].map(p=>p.id)).size,products.length+loaded.products.length);
  let polos=0;for(const p of products)if(core.classifyProduct(p,prices).polo){assert.equal(core.priceOf(p,prices),core.effectiveVersion(p)==='Retro'?40:35,p.id);polos++;}assert(polos>0);
  const polo={id:'test-polo',sport:'F1',category:'Polos',original:'F1 polo shirt',version:'Estándar'};
  for(const sport of ['Fútbol','NBA','F1','NFL'])for(const version of ['Estándar','Jugador','Retro'])assert.equal(core.priceOf({...polo,sport,version},prices),version==='Retro'?40:35);
  for(const season of ['1999','2019','2020','2021','2022','2022/23','2022/2023']){
    const product={...polo,season,version:'Estándar'};
    assert.equal(core.priceOf(product,prices),40,season);assert.equal(core.effectiveVersion(product),'Retro');assert.equal(core.versionLabel(product),'Retro');
    assert.equal(core.priceOf({...product,sport:'Fútbol',category:'Camisetas',original:'soccer jersey'},prices),40);
  }
  for(const season of ['2023','2023/24','2026','2029','Sin temporada'])assert.equal(core.priceOf({...polo,season},prices),35,season);
  for(const season of ['2024/25','2024/2025','2025','2025/26','2026/27']){
    const recent={...polo,season,version:'Retro',detail:'Retro · Azul'};
    assert.equal(core.priceOf(recent,prices),35,season);
    assert.equal(core.displayProduct(recent).detail,'Azul');
    const jersey={...recent,sport:'Fútbol',category:'Camisetas',original:'Soccer Retro Model Jersey'};
    assert.equal(core.priceOf(jersey,prices),30,season);
    const player={...jersey,original:'Soccer Retro Model Player Version Jersey'};
    assert.equal(core.effectiveVersion(player),'Jugador',season);
    assert.equal(core.priceOf(player,prices),35,season);
  }
  for(const season of ['2022/23','2023/24','2024','Sin temporada']){
    assert.equal(core.priceOf({...polo,season,version:'Retro'},prices),40,season);
  }
  const dated={...polo,season:'2022',id:'retro-2022'};const datedIndex=core.createIndex([dated]);
  const state={q:'',sport:'',category:'',team:'',audience:'',version:'Retro',season:'',favorites:false,sort:'new'};
  assert.equal(core.filterProducts([dated],state,prices,new Set(),datedIndex).length,1);
  assert.equal(core.filterProducts([dated],{...state,version:'Estándar'},prices,new Set(),datedIndex).length,0);
  for(const [key,value] of Object.entries(prices.general))assert(core.generalDefinitions.some(d=>d.key===key&&(d.section||'general')==='general'),key);
  for(const key of Object.keys(prices.garments))assert(core.generalDefinitions.some(d=>d.key===key&&d.section==='garments'),key);
  for(const raw of [...products,...actual.products]){
    const shown=core.displayProduct(raw);
    assert(!/\bchaquetas?\b/i.test([shown.name,shown.detail,shown.category,shown.description].join(' ')),raw.id);
    assert.equal(core.priceOf(shown,prices),core.priceOf(raw,prices),raw.id);
    if(raw.category==='Chaquetas'){assert.equal(shown.category,'Abrigos');assert.equal(sizes.isCoat(shown,prices),true);assert.deepEqual(sizes.sizesFor(shown,prices),sizes.sizesFor(raw,prices));}
  }
  assert(core.generalDefinitions.every(d=>!/chaqueta/i.test(d.label)));
  const manualShown=core.displayProduct(jacket);
  const renamedMessage=core.orderMessage(bag,new Map([[jacket.id,manualShown]]),prices,n=>'$'+n.toFixed(2));
  assert(!/chaqueta/i.test(renamedMessage));assert(renamedMessage.includes('Abrigo'));
  const displayed=products.map(core.displayProduct),displayIndex=core.createIndex(displayed);
  const coats=core.filterProducts(displayed,{...state,version:'',category:'Abrigos'},prices,new Set(),displayIndex);
  assert.equal(coats.length,products.filter(p=>p.category==='Chaquetas'||p.category==='Abrigos').length);
  assert(coats.length>0);assert(coats.every(p=>core.matchesSearch(displayIndex.get(p.id),'abrigo')));
  const target='./manual-products/'+jacket.id+'/product.json';
  const removed=await loadFixture({[target]:{status:404,ok:false}});assert.equal(removed.error,null);assert.equal(removed.products.length,loaded.products.length-1);
  for(const mutation of [{manualPrice:-1},{manualPrice:true},{image:'https://example.com/evil.svg'},{sizes:[]},{id:'123'}]){
    const bad=await loadFixture({[target]:{status:200,ok:true,json:async()=>({...jacket,...mutation})}});assert(bad.error);assert.deepEqual(bad.products,[]);
  }
  const unavailable=await loadFixture({[target]:{status:500,ok:false}});assert(unavailable.error);
  const malformed=await load({'./manual-products/index.json':{status:200,ok:true,json:async()=>({formatVersion:1,products:['../escape']})}});assert(malformed.error);
  console.log(`OK: ${polos} polos reales a $35/$40; abrigo $60; tallas y WhatsApp; altas/bajas manuales; rechazo de fichas inválidas; resumen de todas las tarifas.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
