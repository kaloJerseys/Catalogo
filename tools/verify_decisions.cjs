const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
for(const file of ['data/catalog.js','data/prices.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const core=require('../catalog-core.js'),catalog=ctx.window.KALO_CATALOG,products=catalog.products,prices=ctx.window.KALO_PRICES;
assert.equal(products.length,18984);assert.equal(catalog.sourceTotal,18988);
const infoIds=['211013826','158427129','158427121','158427120'];
assert(products.every(p=>!infoIds.includes(p.id)));
const refs=JSON.parse(fs.readFileSync(path.join(root,'tools/internal/supplier-reference-albums.json'),'utf8'));
assert.deepEqual(refs.map(p=>p.id).sort(),infoIds.sort());
const teams=[...new Set(products.filter(p=>p.teamStatus==='confirmed').map(p=>p.team))];
assert(teams.length<=450);assert(teams.every(t=>!/[\u3400-\u9fff#]/.test(t)&&!/^About |^All Product|^\d|^Colección /.test(t)));
assert(products.every(p=>!['1906/06','2006/27','2026/17','2025/06'].includes(p.season)));
for(const p of products)assert(['confirmed','unclassified'].includes(p.teamStatus));
const index=core.createIndex(products),base={q:'',sport:'',category:'',team:'',audience:'',version:'',season:'',favorites:false,sort:'new'};
const search=q=>core.filterProducts(products,{...base,q},prices,new Set(),index);
for(const [team,queries] of [['FC Barcelona',['Barça','FCB','culés']],['Real Madrid',['merengues','R MAD']],['Manchester United',['Man Utd','MNU']]]){
  const ids=products.filter(p=>p.team===team).map(p=>p.id);assert(ids.length>0,team);
  for(const query of queries){const found=new Set(search(query).map(p=>p.id));assert(ids.every(id=>found.has(id)),query);assert(core.matchesSearch(core.teamSearchText(team),query),query+' selector');}
}
assert.deepEqual(search('camiseta barça').map(p=>p.id),search('jersey barça').map(p=>p.id));
assert.deepEqual(search('suéter barça').map(p=>p.id),search('jersey barça').map(p=>p.id));
assert(search('zzzzsincoincidencias987654').length===0);
const bag=[{id:'1',size:'S',quantity:2},{id:'1',size:'M',quantity:3},{id:'2',size:'XL',quantity:1}],snapshot=JSON.stringify(bag);
assert.deepEqual(core.changeLineSize(bag,0,'L',['S','M','L']),[{id:'1',size:'L',quantity:2},bag[1],bag[2]]);
assert.deepEqual(core.changeLineSize(bag,0,'M',['S','M','L']),[{id:'1',size:'M',quantity:5},bag[2]]);
assert.equal(JSON.stringify(bag),snapshot);
assert.throws(()=>core.changeLineSize(bag,0,'5XL',['S','M','L']));
assert.throws(()=>core.changeLineSize([{id:'1',size:'S',quantity:99},{id:'1',size:'M',quantity:1}],0,'M',['S','M']));
assert.equal(core.productUrl('https://example.github.io/kalo-jerseys/index.html?sport=NBA#catalogo','258578495'),'https://example.github.io/kalo-jerseys/index.html?producto=258578495');
assert.equal(core.productUrl('https://example.github.io/kalo-jerseys/?q=barca','258578495'),'https://example.github.io/kalo-jerseys/?producto=258578495');
assert.equal(prices.general.football_fan,30);assert.equal(prices.general.football_player,35);assert.equal(prices.general.football_retro,40);
assert.equal(prices.general.nba_shorts,35);assert.equal(prices.general.nba_set,70);
assert(fs.statSync(path.join(root,'data/catalog.js')).size<2500000);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const id of ['team-search','team','preguntas'])assert(html.includes('id="'+id+'"'));
assert(!/id="(?:price-min|price-max|size-filter|checkout|order-tracking)"/.test(html));
assert(!/href="[^\"]*(?:privacidad|devoluciones|terminos|checkout)\.html/.test(html));
console.log(`OK: ${products.length} productos, 4 álbumes internos, ${teams.length} equipos limpios, sinónimos, tarifas no afectadas conservadas, tallas y enlaces estáticos con subcarpeta.`);
