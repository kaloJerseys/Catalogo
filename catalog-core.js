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
  function matchesSearch(text,query){return normalize(query).split(/\s+/).filter(Boolean).every(word=>text.includes(word));}
  function garmentAliases(p){
    if(p.category==='Camisetas')return 'camiseta camisetas jersey jerseys sueter sueteres shirt shirts';
    if(p.category==='Conjuntos')return 'conjunto conjuntos kit kits set traje';
    if(p.category==='Sudaderas')return 'sudadera sudaderas hoodie sweatshirt';
    if(p.category==='Chaquetas')return 'chaqueta chaquetas jacket windbreaker cortaviento';
    if(p.category==='Pantalones y shorts')return /\bshorts?\b/.test(normalize(p.original))?'short shorts pantalon corto pantalones cortos':'pantalon pantalones pants trousers';
    return '';
  }
  const generalDefinitions=[
    {key:'football_fan',sport:'Fútbol',label:'Versión Fan / Aficionado'},
    {key:'football_player',sport:'Fútbol',label:'Versión Jugador'},
    {key:'football_retro',sport:'Fútbol',label:'Versión Retro'},
    {key:'nba_jersey',sport:'NBA',label:'Suéter (jersey)'},
    {key:'nba_shorts',sport:'NBA',label:'Short'},
    {key:'nba_set',sport:'NBA',label:'Conjunto (suéter + short)'}
  ];
  function versionLabel(p){return p.version==='Estándar'&&p.sport==='Fútbol'?'Fan / Aficionado':p.version;}
  function generalKey(p){
    if(p.sport==='Fútbol'&&p.category==='Camisetas')return p.version==='Retro'?'football_retro':p.version==='Jugador'?'football_player':'football_fan';
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
    const jacket=!accessory&&(/\b(?:jackets?|jakcet|windbreakers?|winbreaker|werindbreaker|coats?)\b|\breversible breaker\b/.test(text)||p.category==='Chaquetas');
    const hoodie=!jacket&&!accessory&&/\bhoodies?\b|\bhooded sweatshirt\b|sudadera con capucha|连帽卫衣/.test(text);
    const cotton=/\bcotton\b|\balgodon\b|纯棉|棉质/.test(text+' '+material)&&!/\b(?:not|non|sin) (?:cotton|algodon)\b/.test(text+' '+material);
    const jacketSet=!accessory&&jacket&&(set||pants);
    const shirt=!accessory&&!pants&&!polo&&!jacket&&!hoodie&&!set&&(p.category==='Camisetas'||/\bjerseys?\b|\b(?:soccer|football|basketball) shirts?\b/.test(text));
    const longSleeve=shirt&&/\blong sleeve(?:s|d)?\b|\blongsleeve(?:s|d)?\b|mangas? largas?/.test(text+' '+normalize(p.detail));
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
    return {sport,accessory,pants,polo,set,jacket,hoodie,cotton,jacketSet,shirt,longSleeve,casual,trainingSet,jerseySet,personalizable,footballPatches,garment:verified.garment||''};
  }
  function priceRule(p,prices={}){
    const a=classifyProduct(p,prices);
    if(a.garment&&Object.hasOwn(prices.garments||{},a.garment))return {section:'garments',key:a.garment};
    if(a.jacketSet)return {section:'garments',key:'jacket_pants_set'};
    if(a.jacket&&/\breversible\b|\bdouble sided\b|\btwo sided\b/.test(normalize(p.original)))return {section:'garments',key:'reversible_windbreaker'};
    if(a.jacket)return {section:'garments',key:'jacket'};
    if(a.hoodie)return a.cotton?{section:'garments',key:'cotton_hoodie'}:{section:'pending',key:'hoodie_material'};
    if(a.longSleeve)return {section:'garments',key:'long_sleeve_jersey'};
    if(a.sport==='Fútbol'&&a.set&&!/\bcrawling\b|\bromper\b|\bonesie\b/.test(normalize(p.original)))return {section:'general',key:'football_set'};
    if(a.sport==='NBA'&&a.shirt)return {section:'general',key:'nba_jersey'};
    if(!a.accessory&&a.sport==='F1')return {section:'general',key:'f1_base'};
    if(!a.accessory&&a.sport==='NFL')return {section:'general',key:'nfl_base'};
    const key=generalKey({...p,sport:a.sport});
    return key?{section:'general',key}:null;
  }
  function priceOf(product,prices){
    const rule=priceRule(product,prices);
    if(!Object.hasOwn(prices.products||{},product.id)&&rule?.section==='pending')return null;
    const n=Object.hasOwn(prices.products||{},product.id)?prices.products[product.id]:rule&&Object.hasOwn(prices[rule.section]||{},rule.key)?prices[rule.section][rule.key]:prices.categories?.[product.category];
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
  function createIndex(products){return new Map(products.map(p=>{let text=normalize([p.name,p.original,p.detail,p.sport,p.category,p.audience,p.version,versionLabel(p),p.season,p.collection,p.code,p.id,teamSearchText(p.team),garmentAliases(p)].join(' '));if(/\b(?:camisetas?|jerseys?|sueter(?:es)?|shirts?)\b/.test(text))text+=' camiseta camisetas jersey jerseys sueter sueteres shirt shirts';return [p.id,text];}));}
  function filterProducts(products,state,prices,favorites,index){const words=normalize(state.q).split(/\s+/).filter(Boolean);const list=products.filter(p=>(!state.sport||p.sport===state.sport)&&(!state.category||p.category===state.category)&&(!state.team||p.team===state.team)&&(!state.audience||p.audience===state.audience)&&(!state.version||p.version===state.version)&&(!state.season||p.season===state.season)&&(!state.favorites||favorites.has(p.id))&&words.every(w=>index.get(p.id).includes(w)));if(state.sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'es',{numeric:true}));if(state.sort==='price-low'||state.sort==='price-high')list.sort((a,b)=>{const x=priceOf(a,prices),y=priceOf(b,prices);if(x===null)return y===null?0:1;if(y===null)return -1;return state.sort==='price-low'?x-y:y-x;});return list;}
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
  function orderMessage(bag,products,prices,money=n=>new Intl.NumberFormat('es-PA',{style:'currency',currency:'USD'}).format(n),quote=null){
    const lines=['¡Hola, Kalo! Me interesan estos productos:'];
    bag.forEach((line,i)=>{const p=products.get(line.id);if(!p)return;const options=validateOptions(p,line,prices),adjusted=quote?.lines[i],cost=adjusted?.cost||linePrice(p,line,prices);
      lines.push('',`${i+1}. ${p.name}`,p.detail,`Talla: ${line.size} · Cantidad: ${line.quantity}`,`Ref. ${p.id}`,cost.base===null?'Precio base: por confirmar':`Precio base: ${money(cost.base)} c/u`);
      if(options.personalization)lines.push('Personalización: Sí (GRATIS)',`Nombre: ${options.personalization.name}`,`Dorsal: ${options.personalization.number}`);else lines.push('Sin personalización');
      for(const patch of cost.patches)lines.push(`${patch.label}: ${money(patch.price)} por unidad`);
      lines.push(cost.unit===null?'Precio unitario: base por confirmar'+(cost.surcharge?` + ${money(cost.surcharge)} de parches`:''):`Precio unitario: ${money(cost.unit)}`+(cost.patches.length?` (base ${money(cost.base)} + parches ${money(cost.surcharge)})`:''));
      if(cost.unit!==null)lines.push(`Subtotal (${line.quantity} ${line.quantity===1?'unidad':'unidades'}): ${money(Math.round(cost.unit*100)*line.quantity/100)}`);
      if(quote?.codes.length){
        for(const discount of adjusted?.discounts||[])lines.push(discount.pending?`Descuento ${discount.code}: -${discount.percent} % sobre la camiseta, por confirmar al conocer su precio`:`Descuento ${discount.code}: -${discount.percent} % sobre la camiseta (${money(discount.perUnitCents/100)} c/u; ${money(discount.totalCents/100)} en esta línea)`);
        if(adjusted?.unitAfterCents!==null&&adjusted?.unitAfterCents!==undefined)lines.push(`${adjusted.discountCents?'Precio con descuento':'Precio final por unidad'}: ${money(adjusted.unitAfterCents/100)} c/u${cost.patches.length?' (parches sin descuento por producto)':''}`,`Subtotal actualizado de esta línea: ${money(adjusted.totalAfterCents/100)}`);
      }
      lines.push('Link del producto: https://nn88.x.yupoo.com/albums/'+encodeURIComponent(p.id)+'?uid=1');
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
    lines.push('',deliveryPayment,deliveryEstimate,'','¿Me confirman el precio final y los detalles del pedido?');
    return lines.join('\n');
  }
  return {normalize,priceOf,createIndex,filterProducts,orderSummary,generalDefinitions,generalKey,versionLabel,teamSearchText,matchesSearch,changeLineSize,productUrl,classifyProduct,priceRule,patchSeason,patchOptions,validateOptions,restoreOptions,lineKey,addLine,linePrice,orderMessage,deliveryPayment,deliveryEstimate};
});
