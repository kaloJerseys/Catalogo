(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KaloCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['’]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const teamNames=[
    ['FC Barcelona','Barcelona','Barça','Barca','FCB','Culés','Blaugrana'],
    ['Real Madrid','R Madrid','R MAD','RM','Merengues','Los blancos'],
    ['Atlético de Madrid','Atletico Madrid','At Madrid','A MAD','Atleti','Colchoneros'],
    ['Manchester United','Man United','Man Utd','MNU','Manu','Red Devils'],
    ['Manchester City','Man City','MCI','Citizens'],
    ['Liverpool','LLL','LFC'],['Chelsea','CHE','CFC'],['Arsenal','ASN','Gunners'],
    ['Tottenham','Tottenham Hotspur','TOT','Spurs'],
    ['Paris Saint-Germain','París Saint-Germain','PSG','Paris SG'],
    ['Juventus','Juve','JUV','Vecchia Signora'],
    ['Bayern Munich','Bayern Múnich','Bayern München','Bayern de Múnich','Bayern'],
    ['Inter de Milán','Inter Milan','Internazionale'],['AC Milan','ACM','A C Milan'],
    ['Borussia Dortmund','Dortmund','BVB'],['Boca Juniors','Boca Junior','Boca','Xeneizes'],
    ['River Plate','River','Millonarios'],['Inter Miami','Miami International'],
    ['Sporting CP','Sporting de Lisboa'],['Athletic Club','Athletic Bilbao','Bilbao'],
    ['Real Betis','Betis','BTS'],['Los Angeles Lakers','LA Lakers','Lakers'],
    ['Boston Celtics','Celtics'],['Chicago Bulls','Bulls'],
    ['Golden State Warriors','GSW','Warriors'],['New York Knicks','NY Knicks','Knicks'],
    ['Dallas Mavericks','Mavericks','Mavs'],['San Antonio Spurs','SA Spurs'],
    ['Argentina','Argentine','Argentinian','Albiceleste'],['Brasil','Brazil','Canarinha'],
    ['Alemania','Germany','Deutschland'],['España','Spain'],['México','Mexico'],
    ['Francia','France'],['Inglaterra','England'],['Italia','Italy'],
    ['Países Bajos','Netherlands','Holanda'],['Estados Unidos','USA','United States'],
    ['Corea del Sur','South Korea','Korea'],['Japón','Japan'],['Noruega','Norway']
  ];
  const teamAliases=new Map();
  for(const names of teamNames){const text=normalize(names.join(' '));for(const name of names)teamAliases.set(normalize(name),text);}
  function teamSearchText(team){return teamAliases.get(normalize(team))||normalize(team);}
  function matchesSearch(text,query){return searchQuery(query).split(/\s+/).filter(Boolean).every(word=>text.includes(word));}
  function searchQuery(query){return normalize(query).replace(/\bmoto\s*gp\b/g,'motogp').replace(/\bf\s+1\b|\bformula\s*(?:1|uno|one)\b/g,'f1').replace(/\bmascar\b/g,'nascar').replace(/\bmotor\s+sport(s)?\b|\bmotosport\b/g,'motorsport');}
  function motorsportDiscipline(p){
    const sport=normalize(p.sport);
    if(['futbol','nba','nfl'].includes(sport))return null;
    if(sport==='f1'&&classifyProduct(p).sport==='Fútbol')return null;
    const explicit=normalize(p.discipline);
    if(['f1','motogp','nascar','motorsport'].includes(explicit))return {f1:'F1',motogp:'MotoGP',nascar:'NASCAR',motorsport:'MotorSport'}[explicit];
    const text=normalize([p.original,p.detail,p.name,p.team].join(' '));
    if(sport==='motogp'||/\bmoto\s*gp\b/.test(text))return 'MotoGP';
    if(sport==='nascar'||/\bnascar\b/.test(text))return 'NASCAR';
    if(sport==='f1'||/\bf1\b|\bformula\s*(?:1|one|uno)\b/.test(text))return 'F1';
    return ['motorsport','motor sport','motosport'].includes(sport)?'MotorSport':null;
  }
  function sportSearchText(p){
    if(p.sport==='NBA')return 'basketball basquetbol baloncesto';
    const discipline=motorsportDiscipline(p);if(!discipline)return '';
    return 'motorsport motor sport motorsports motosport deportes de motor '+({F1:'f1 f 1 formula 1 formula1 formula uno formula one',MotoGP:'motogp moto gp motociclismo',NASCAR:'nascar mascar stock car',MotorSport:''}[discipline]);
  }
  function matchesSport(p,selected){
    if(!selected)return true;
    if(selected==='MotorSport')return motorsportDiscipline(p)!==null;
    if(['F1','MotoGP','NASCAR'].includes(selected))return motorsportDiscipline(p)===selected;
    return p.sport===selected;
  }
  function garmentText(value){
    return String(value??'').replace(/\bchaqueta(s)?\b/gi,(word,plural)=>{const label=plural?'abrigos':'abrigo';return word===word.toUpperCase()?label.toUpperCase():/^[A-Z]/.test(word)?label[0].toUpperCase()+label.slice(1):label;});
  }
  // La fuente conserva sus categorías originales; la tienda usa el nombre comercial.
  function displayProduct(p, prices = {}) {
    const discipline = motorsportDiscipline(p);
    const sport = discipline ? 'MotorSport'
      : p.sport === 'F1' && classifyProduct(p).sport === 'Fútbol' ? 'Fútbol' : p.sport;
    let category = p.category === 'Chaquetas' ? 'Abrigos' : p.category;
    let detail = garmentText(p.detail);
    if(isCurrentSeason(p.season)&&/\bretro\b/i.test(detail)){
      detail=detail.split('·').map(value=>value.trim()).filter(value=>normalize(value)!=='retro').join(' · ')||category;
    }
    if (p.category === 'Conjuntos' || /mangas? largas?/i.test(detail)) {
      const garment = classifyProduct(p, prices);
      if (garment.jacket) {
        const label = garment.jacketSet ? 'Abrigo + pantalón' : 'Abrigo';
        const facets = detail.split('·').map(value => value.trim()).filter(value =>
          value && !['manga larga','mangas largas','conjuntos',normalize(label)].includes(normalize(value)));
        detail = [label, ...facets].join(' · ');
        if (!garment.jacketSet) category = 'Abrigos';
      } else if (garment.longSleeveSet && !/mangas? largas?/i.test(detail)) {
        detail = [detail, 'Manga larga'].filter(Boolean).join(' · ');
      }
    }
    return {...p, sport, ...(discipline ? {discipline} : {}), category,
      name:garmentText(p.name), detail, description:garmentText(p.description), version:effectiveVersion(p)};
  }
  function garmentAliases(p){
    if(p.category==='Camisetas')return 'camiseta camisetas jersey jerseys sueter sueteres shirt shirts';
    if(p.category==='Conjuntos')return 'conjunto conjuntos kit kits set traje';
    if(p.category==='Sudaderas')return 'sudadera sudaderas hoodie sweatshirt';
    if(['Chaquetas','Abrigos'].includes(p.category))return 'abrigo abrigos chaqueta chaquetas jacket windbreaker cortaviento';
    if(p.category==='Pantalones y shorts')return /\bshorts?\b/.test(normalize(p.original))?'short shorts pantalon corto pantalones cortos':'pantalon pantalones pants trousers';
    return '';
  }
  const generalDefinitions=[
    {key:'football_fan',sport:'Fútbol',label:'Versión Fan / Aficionado'},
    {key:'football_player',sport:'Fútbol',label:'Versión Jugador'},
    {key:'football_retro',sport:'Fútbol',label:'Versión Retro'},
    {key:'football_set',sport:'Fútbol',label:'Conjunto normal / entrenamiento'},
    {key:'football_long_sleeve_set',sport:'Fútbol',label:'Conjunto de manga larga + short'},
    {key:'football_long_sleeve_pants_set',sport:'Fútbol',label:'Conjunto de manga larga + pantalón largo'},
    {key:'nba_jersey',sport:'NBA',label:'Suéter (jersey)'},
    {key:'nba_shorts',sport:'NBA',label:'Short'},
    {key:'nba_set',sport:'NBA',label:'Conjunto (suéter + short)'},
    {key:'f1_base',sport:'MotorSport y NFL',label:'F1 · prendas base'},
    {key:'nfl_base',sport:'MotorSport y NFL',label:'NFL · prendas base'},
    {key:'polo_regular',section:'garments',sport:'Polos',label:'Polo regular · 2023 en adelante'},
    {key:'polo_retro',section:'garments',sport:'Polos',label:'Polo Retro · hasta 2022 / edición Retro'},
    {key:'mlb_button_jersey',section:'garments',sport:'Otras prendas',label:'Camiseta estilo MLB con botones'},
    {key:'long_sleeve_jersey',section:'garments',sport:'Otras prendas',label:'Camiseta de manga larga'},
    {key:'jacket',section:'garments',sport:'Otras prendas',label:'Abrigo'},
    {key:'reversible_windbreaker',section:'garments',sport:'Otras prendas',label:'Rompevientos reversible'},
    {key:'cotton_hoodie',section:'garments',sport:'Otras prendas',label:'Sudadera de algodón con capucha'},
    {key:'jacket_pants_set',section:'garments',sport:'Otras prendas',label:'Conjunto de abrigo + pantalón'},
    {key:'hoodie_material',section:'pending',sport:'Por confirmar',label:'Sudadera sin tarifa confirmada'},
    {key:'Accesorios',section:'categories',sport:'Por confirmar',label:'Accesorios'},
    {key:'Pantalones y shorts',section:'categories',sport:'Por confirmar',label:'Otros pantalones y shorts'},
    {key:'Camisetas',section:'categories',sport:'Por confirmar',label:'Otras camisetas sin tarifa asignada'}
  ];
  // Corte comercial fijo: se usa la temporada de la prenda, no el año actual ni el título.
  function isCurrentSeason(season){
    const match=String(season??'').trim().match(/^(20\d{2})(?:[/-](\d{2}|20\d{2}))?$/);
    if(!match)return false;
    const start=Number(match[1]);
    const end=match[2]?.length===2?2000+Number(match[2]):Number(match[2]);
    return start>=2025||start===2024&&end>=2025;
  }
  function effectiveVersion(p){
    if(p.version==='Retro'&&isCurrentSeason(p.season)){
      return /\b(?:player (?:version|edition)|authentic)\b/.test(normalize(p.original))?'Jugador':'Estándar';
    }
    const year=String(p.season||'').trim().match(/^((?:19|20)\d{2})(?:$|[/-]\d{2,4}$)/);
    return p.version==='Retro'||year&&Number(year[1])<=2022?'Retro':p.version;
  }
  function versionLabel(p){const version=effectiveVersion(p);return version==='Estándar'&&p.sport==='Fútbol'?'Fan / Aficionado':version;}
  function generalKey(p){
    if(p.sport==='Fútbol'&&p.category==='Camisetas'){
      const version=effectiveVersion(p);
      return version==='Retro'?'football_retro':version==='Jugador'?'football_player':'football_fan';
    }
    if(p.sport==='NBA'){
      if(p.category==='Camisetas')return 'nba_jersey';
      if(p.category==='Pantalones y shorts'&&/\bshorts?\b/.test(normalize(p.original||p.detail)))return 'nba_shorts';
      if(p.category==='Conjuntos'&&!/crawling|jacket|hoodie/.test(normalize(p.original)))return 'nba_set';
    }
    return null;
  }
  const deliveryPayment='Envío no incluido. El abono para el envío se coordina por WhatsApp; el resto se paga contra entrega.';
  const deliveryEstimate='Una vez recibido el abono, el pedido puede tardar entre 15 y 25 días en llegar (plazo máximo estimado: 25 días)';
  const validPrice=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
  function classifyProduct(p,prices={}){
    const verified=prices.productAttributes?.[p.id]||{};
    const text=normalize(p.original||p.detail||''),material=normalize(verified.material||p.material||'');
    let sport=verified.sport||p.sport;
    // No confundir clubes de fútbol con escuderías o equipos NFL por sus apodos.
    if(!verified.sport&&['F1','NFL'].includes(sport)&&!/\bnfl\b|\bf1\b|formula 1/.test(text)&&/\bsoccer\b|kaizer chiefs|bragantino|salzburg|leipzig/.test(text))sport='Fútbol';
    const accessory=p.category==='Accesorios'||/\b(?:socks?|backpacks?|scarves|scarf|gloves?|keychains?|accessories|hats?)\b|\bbaseball caps?\b/.test(text);
    const pants=p.category==='Pantalones y shorts'||/\b(?:shorts|pants?|trousers?)\b/.test(text);
    const polo=p.category==='Polos'||/\bpolo\b/.test(text);
    const set=p.category==='Conjuntos'||/\b(?:suits?|sets?|tracksuits?)\b|\btrack suit\b|\bkids? kits?\b/.test(text);
    const jacket=!accessory&&(verified.garment==='jacket_pants_set'||/\b(?:jackets?|jakcet|windbreakers?|winbreaker|werindbreaker|coats?)\b|\breversible breaker\b/.test(text)||['Chaquetas','Abrigos'].includes(p.category));
    const hoodie=!jacket&&!accessory&&/\bhoodies?\b|\bhooded sweatshirt\b|sudadera con capucha|连帽卫衣/.test(text);
    const cotton=/\bcotton\b|\balgodon\b|纯棉|棉质/.test(text+' '+material)&&!/\b(?:not|non|sin) (?:cotton|algodon)\b/.test(text+' '+material);
    const jacketSet=jacket&&(set||pants||verified.garment==='jacket_pants_set');
    const shirt=!accessory&&!pants&&!polo&&!jacket&&!hoodie&&!set&&(p.category==='Camisetas'||/\bjerseys?\b|\b(?:soccer|football|basketball) shirts?\b/.test(text));
    const hasLongSleeves=verified.longSleeve===true||/\blong sleeve(?:s|d)?\b|\blongsleeve(?:s|d)?\b|mangas? largas?/.test(text+' '+normalize(p.detail));
    const longSleeve=shirt&&hasLongSleeves;
    const longSleeveSet=set&&!accessory&&!jacket&&!hoodie&&hasLongSleeves;
    const casual=/\bt shirts?\b|\btees?\b|\bcasual\b|\bcrawling\b|\bromper\b|\bonesie\b/.test(text)||(/\bcotton\b/.test(text)&&!/\bjerseys?\b/.test(text));
    const jerseyEvidence=/\bjerseys?\b|\bsoccer\b|\bfootball\b|\bbasketball\b|\bplayer edition\b/.test(text)||p.teamStatus==='confirmed';
    // Facetas completas del catálogo; el título original resuelve los seis casos «Prepartido».
    const trainingFacet=String(p.detail||'').split('·').some(value=>['entrenamiento','training'].includes(normalize(value)));
    const trainingTitle=/\b(?:training|entrenamiento) (?:(?:soccer|football) )?(?:suits?|sets?|tracksuits?|(?:kids? )?kits?)\b/.test(text)&&!/\b(?:not|non|no|sin) (?:training|entrenamiento)\b/.test(text);
    const trainingSet=set&&(trainingFacet||trainingTitle);
    // «Tracksuit» no acredita una camiseta: se conservan excluidos los tipos sin confirmar.
    const jerseySet=set&&!trainingSet&&!accessory&&!polo&&!jacket&&!hoodie&&!casual&&verified.garment!=='jacket_pants_set'&&!/\btracksuits?\b|\btrack suits?\b/.test(text);
    const personalizable=(shirt||jerseySet)&&(verified.personalizable===true||(verified.personalizable!==false&&!casual&&jerseyEvidence&&['Fútbol','NBA','NFL'].includes(sport)));
    const trainingShirt=trainingFacet||/\btraining\b|\bpre match\b|\bprematch\b|\bwarm up\b|\bprepartido\b|\bentrenamiento\b/.test(text);
    const footballPatches=(shirt||jerseySet)&&sport==='Fútbol'&&!casual&&!trainingShirt&&verified.patches!==false;
    return {sport,accessory,pants,polo,set,jacket,hoodie,cotton,jacketSet,shirt,longSleeve,longSleeveSet,casual,trainingSet,jerseySet,personalizable,footballPatches,garment:verified.garment||''};
  }
  function priceRule(p,prices={}){
    const a=classifyProduct(p,prices);
    if(a.garment&&Object.hasOwn(prices.garments||{},a.garment))return {section:'garments',key:a.garment};
    if(a.polo)return {section:'garments',key:effectiveVersion(p)==='Retro'?'polo_retro':'polo_regular'};
    if(a.jacketSet)return {section:'garments',key:'jacket_pants_set'};
    if(a.jacket&&/\breversible\b|\bdouble sided\b|\btwo sided\b/.test(normalize(p.original)))return {section:'garments',key:'reversible_windbreaker'};
    if(a.jacket)return {section:'garments',key:'jacket'};
    if(a.hoodie)return a.cotton?{section:'garments',key:'cotton_hoodie'}:{section:'pending',key:'hoodie_material'};
    const title=normalize(p.original);
    if(['Camisetas','Accesorios'].includes(p.category)&&!a.set&&!a.pants&&
      /\bjerseys?\b/.test(title)&&/\b(?:mlb|baseball|button fastening|full button)\b/.test(title)){
      return {section:'garments',key:'mlb_button_jersey'};
    }
    if(a.longSleeve)return {section:'garments',key:'long_sleeve_jersey'};
    if(a.sport==='Fútbol'&&a.set&&!/\bcrawling\b|\bromper\b|\bonesie\b/.test(normalize(p.original))){
      if(a.longSleeveSet){
        const longPants=prices.productAttributes?.[p.id]?.longPants===true||
          /\b(?:long pants|long trousers|full length pants|full length trousers|pantalones? largos?)\b/.test(title);
        return {section:'general',key:longPants?'football_long_sleeve_pants_set':'football_long_sleeve_set'};
      }
      return {section:'general',key:'football_set'};
    }
    if(a.sport==='NBA'&&a.shirt)return {section:'general',key:'nba_jersey'};
    if(!a.accessory&&motorsportDiscipline({...p,sport:a.sport})==='F1')return {section:'general',key:'f1_base'};
    if(!a.accessory&&a.sport==='NFL')return {section:'general',key:'nfl_base'};
    const key=generalKey({...p,sport:a.sport});
    return key?{section:'general',key}:null;
  }
  function priceOf(product,prices){
    const rule=priceRule(product,prices);
    if(product.source!=='manual'&&!Object.hasOwn(prices.products||{},product.id)&&rule?.section==='pending')return null;
    const n=Object.hasOwn(prices.products||{},product.id)?prices.products[product.id]:product.source==='manual'?product.manualPrice:rule&&Object.hasOwn(prices[rule.section]||{},rule.key)?prices[rule.section][rule.key]:prices.categories?.[Object.hasOwn(prices.categories||{},product.category)?product.category:product.category==='Abrigos'?'Chaquetas':product.category];
    return validPrice(n)?n:null;
  }
  function patchSeason(product){
    if(product.seasonStatus!=='confirmed')return null;
    const m=String(product.season||'').trim().match(/^(\d{4})[/-](\d{2}|\d{4})$/);
    if(!m)return null;
    const start=Number(m[1]),end=Number(m[2]);
    if(m[2].length===4?end!==start+1:end!==(start+1)%100)return null;
    return `${start}/${String(start+1).slice(-2)}`;
  }
  function patchOptions(product,prices){
    if(!classifyProduct(product,prices).footballPatches||product.teamStatus!=='confirmed')return [];
    const season=patchSeason(product);if(!season)return [];
    const club=normalize(product.team),perProduct=prices.productAttributes?.[product.id]?.patches;
    return ['champions','league'].filter(id=>Array.isArray(prices.patchEligibility?.[id]?.[season])&&prices.patchEligibility[id][season].includes(club)&&(!Array.isArray(perProduct)||perProduct.includes(id))&&validPrice(prices.patches?.[id]?.price)).map(id=>({id,label:prices.patches[id].label||({'champions':'Parche Champions League','league':'Parche de Liga'}[id]),price:prices.patches[id].price}));
  }
  function validateOptions(product,options={},prices={}){
    let personalization=null;
    if(options.personalization!==null&&options.personalization!==undefined&&options.personalization!==false){
      if(!classifyProduct(product,prices).personalizable)throw new Error('Esta prenda no admite personalización de nombre y dorsal.');
      const raw=options.personalization;
      const name=typeof raw.name==='string'?raw.name.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleUpperCase('es'):'';
      const number=typeof raw.number==='string'?raw.number.trim():'';
      if(!name||name.length>40||!/^[\p{L}\p{M}\p{N} .’'\-]+$/u.test(name))throw new Error('Escribe un nombre válido de hasta 40 caracteres (letras, números, espacios, puntos, guiones o apóstrofos).');
      if(!/^[0-9]{1,3}$/.test(number))throw new Error('El dorsal debe contener de 1 a 3 dígitos, sin signos ni decimales.');
      personalization={name,number};
    }
    const allowed=patchOptions(product,prices).map(p=>p.id),requested=options.patches??[];
    if(!Array.isArray(requested)||requested.length>2||requested.some(id=>typeof id!=='string'||!allowed.includes(id)))throw new Error('Revisa los parches seleccionados para esta prenda.');
    const patches=[...new Set(requested)].sort();
    return {personalization,patches};
  }
  function restoreOptions(product,options={},prices={}){
    const requested=options.patches??[];
    if(!Array.isArray(requested)||requested.length>2||requested.some(id=>!['champions','league'].includes(id)))throw new Error('Parches guardados no válidos.');
    const allowed=patchOptions(product,prices).map(p=>p.id),patches=requested.filter(id=>allowed.includes(id));
    return {options:validateOptions(product,{...options,patches},prices),removedPatches:requested.length-patches.length};
  }
  function lineKey(line){return JSON.stringify([String(line.id),line.size,line.personalization?{name:line.personalization.name,number:line.personalization.number}:null,[...new Set(line.patches||[])].sort()]);}
  function addLine(bag,line){
    const next=bag.map(item=>({...item})),key=lineKey(line),existing=next.find(item=>lineKey(item)===key);
    if(existing){if(existing.quantity+line.quantity>99)throw new Error('La cantidad máxima por combinación es 99.');existing.quantity+=line.quantity;}else next.push({...line});
    return next;
  }
  function linePrice(product,line,prices){
    const options=validateOptions(product,line,prices),base=priceOf(product,prices),available=patchOptions(product,prices);
    const patches=options.patches.map(id=>available.find(p=>p.id===id));
    const surcharge=patches.reduce((sum,patch)=>sum+Math.round(patch.price*100),0)/100;
    const unit=base===null?null:(Math.round(base*100)+Math.round(surcharge*100))/100;
    return {base,patches,surcharge,unit};
  }
  function createIndex(products){return new Map(products.map(p=>{let text=normalize([p.name,p.original,p.detail,p.sport,p.category,p.audience,p.version,versionLabel(p),p.season,p.collection,p.code,p.id,teamSearchText(p.team),garmentAliases(p),sportSearchText(p)].join(' '));if(/\b(?:camisetas?|jerseys?|sueter(?:es)?|shirts?)\b/.test(text))text+=' camiseta camisetas jersey jerseys sueter sueteres shirt shirts';return [p.id,text];}));}
  function filterProducts(products,state,prices,favorites,index,featuredIds=[]){const words=searchQuery(state.q).split(/\s+/).filter(Boolean),racingWords=words.filter(w=>['f1','motogp','nascar','motorsport'].includes(w));const list=products.filter(p=>matchesSport(p,state.sport)&&(!state.category||p.category===state.category)&&(!state.team||p.team===state.team)&&(!state.audience||p.audience===state.audience)&&(!state.version||effectiveVersion(p)===state.version)&&(!state.season||p.season===state.season)&&(!state.favorites||favorites.has(p.id))&&racingWords.every(w=>w==='motorsport'?motorsportDiscipline(p)!==null:normalize(motorsportDiscipline(p))===w)&&words.every(w=>index.get(p.id).includes(w)));if(state.sort==='new'&&Array.isArray(featuredIds)&&featuredIds.length){const ranks=new Map(featuredIds.map((id,i)=>[String(id),i]));list.sort((a,b)=>(ranks.get(a.id)??featuredIds.length)-(ranks.get(b.id)??featuredIds.length));}if(state.sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'es',{numeric:true}));if(state.sort==='price-low'||state.sort==='price-high')list.sort((a,b)=>{const x=priceOf(a,prices),y=priceOf(b,prices);if(x===null)return y===null?0:1;if(y===null)return -1;return state.sort==='price-low'?x-y:y-x;});return list;}
  function changeLineSize(bag,index,size,allowed){
    if(!Number.isInteger(index)||!bag[index]||!allowed.includes(size))throw new Error('Elige una talla de la lista.');
    const next=bag.map(line=>({...line})),line=next[index];
    const updated={...line,size};
    const other=next.findIndex((item,i)=>i!==index&&lineKey(item)===lineKey(updated));
    if(other!==-1){if(next[other].quantity+line.quantity>99)throw new Error('La cantidad combinada supera 99. Ajusta la cantidad antes de unir las tallas.');next[other].quantity+=line.quantity;next.splice(index,1);}else line.size=size;
    return next;
  }
  function productUrl(base,id){const url=new URL(base);url.search='';url.hash='';url.searchParams.set('producto',String(id));return url.href;}
  function orderSummary(bag,products,prices){let subtotal=0,unknown=0,count=0;for(const line of bag){const p=products.get(line.id);if(!p)continue;const n=linePrice(p,line,prices).unit;count+=line.quantity;if(n===null)unknown+=line.quantity;else subtotal+=Math.round(n*100)*line.quantity;}return {subtotal:subtotal/100,unknown,count};}
  function orderMessage(bag,products,prices,money=n=>new Intl.NumberFormat('es-PA',{style:'currency',currency:'USD'}).format(n),quote=null,catalogBase=null){
    const lines=['¡Hola, Kalo! Me interesan estos productos:'];
    bag.forEach((line,i)=>{const raw=products.get(line.id);if(!raw)return;const p=displayProduct(raw,prices);const options=validateOptions(p,line,prices),adjusted=quote?.lines[i],cost=adjusted?.cost||linePrice(p,line,prices);
      lines.push('',`${i+1}. ${p.name}`,p.detail,`Talla: ${line.size} · Cantidad: ${line.quantity}`,`Ref. ${p.id}`,cost.base===null?'Precio base: por confirmar':`Precio base: ${money(cost.base)} c/u`);
      if(options.personalization)lines.push('Personalización: Sí',`Nombre: ${options.personalization.name}`,`Dorsal: ${options.personalization.number}`);else lines.push('Sin personalización');
      for(const patch of cost.patches)lines.push(`${patch.label}: ${money(patch.price)} por unidad`);
      lines.push(cost.unit===null?'Precio unitario: base por confirmar'+(cost.surcharge?` + ${money(cost.surcharge)} de parches`:''):`Precio unitario: ${money(cost.unit)}`+(cost.patches.length?` (base ${money(cost.base)} + parches ${money(cost.surcharge)})`:''));
      if(cost.unit!==null)lines.push(`Subtotal (${line.quantity} ${line.quantity===1?'unidad':'unidades'}): ${money(Math.round(cost.unit*100)*line.quantity/100)}`);
      if(quote?.codes.length){
        for(const discount of adjusted?.discounts||[])lines.push(discount.pending?`Descuento ${discount.code}: -${discount.percent} % sobre la camiseta, por confirmar al conocer su precio`:`Descuento ${discount.code}: -${discount.percent} % sobre la camiseta (${money(discount.perUnitCents/100)} c/u; ${money(discount.totalCents/100)} en esta línea)`);
        if(adjusted?.unitAfterCents!==null&&adjusted?.unitAfterCents!==undefined)lines.push(`${adjusted.discountCents?'Precio con descuento':'Precio final por unidad'}: ${money(adjusted.unitAfterCents/100)} c/u${cost.patches.length?' (parches sin descuento por producto)':''}`,`Subtotal actualizado de esta línea: ${money(adjusted.totalAfterCents/100)}`);
      }
      if(p.source==='manual'){lines.push('Producto de colección manual · sin álbum del proveedor.');if(catalogBase)lines.push('Link del producto: '+productUrl(catalogBase,p.id));}
      else lines.push('Link del producto: https://nn88.x.yupoo.com/albums/'+encodeURIComponent(p.id)+'?uid=1');
    });
    const summary=quote?.original||orderSummary(bag,products,prices);
    lines.push('',`${quote?.codes.length?(summary.unknown?'Subtotal original conocido':'Subtotal original'):(summary.unknown?'Subtotal conocido':'Subtotal de productos')}: ${money(summary.subtotal)}`);
    if(quote?.codes.length){
      lines.push(`Código${quote.codes.length>1?'s':''} aplicado${quote.codes.length>1?'s':''}: ${quote.codes.join(', ')}`);
      if(quote.lineDiscountCents)lines.push(`Descuentos sobre camisetas: -${money(quote.lineDiscountCents/100)}`);
      for(const discount of quote.orderDiscounts)lines.push(discount.pending?`Descuento ${discount.code}: ${money(discount.configuredCents/100)} por pedido, pendiente de confirmar los precios`:`Descuento ${discount.code} por pedido: -${money(discount.amountCents/100)}`);
      lines.push(`${quote.unknown?'Subtotal conocido después de descuentos':'Total después de descuentos (sin envío)'}: ${money(quote.totalCents/100)}`);
      if(quote.unknown)lines.push('Total del pedido: por confirmar.');
    }
    if(summary.unknown)lines.push('Hay prendas con precio por confirmar.');
    lines.push('','¿Me confirman el precio final y los detalles del pedido?');
    return lines.join('\n');
  }
  return {normalize,searchQuery,motorsportDiscipline,sportSearchText,matchesSport,garmentText,displayProduct,priceOf,createIndex,filterProducts,orderSummary,generalDefinitions,generalKey,effectiveVersion,versionLabel,teamSearchText,matchesSearch,changeLineSize,productUrl,classifyProduct,priceRule,patchSeason,patchOptions,validateOptions,restoreOptions,lineKey,addLine,linePrice,orderMessage,deliveryPayment,deliveryEstimate};
});
