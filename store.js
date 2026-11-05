(async () => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const core=window.KaloCore;
  const coupons=window.KaloCoupons;
  let activeCoupons=coupons?coupons.restore(readCoupons()):[],couponDraft='',couponFeedback='',couponError=false;
  function readCoupons(){try{return JSON.parse(localStorage.getItem('kalo-coupons-v1'))||[];}catch{return [];}}
  const settings = window.KALO_SETTINGS || {whatsapp:'50762809447',currency:'USD',locale:'es-PA'};
  const prices = window.KALO_PRICES || {categories:{},products:{}};
  const catalog = window.KALO_CATALOG;
  const manualResult=window.KALO_MANUAL_READY?await window.KALO_MANUAL_READY:{products:[],error:'No se cargó manual-products.js.'};
  const manualProducts=manualResult?.products||[];
  if(manualResult?.error){const warning=document.createElement('p');warning.className='option-error';warning.setAttribute('role','alert');warning.textContent='No se pudieron cargar las prendas manuales. Recarga la página o consulta por WhatsApp.';$('#products').before(warning);console.error('Catálogo manual:',manualResult.error);}
  const money = value => new Intl.NumberFormat(settings.locale,{style:'currency',currency:settings.currency}).format(value);
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key,JSON.stringify(value)); } catch {} };
  const storedFavorites=read('kalo-favorites-v1',[]);
  let favorites = new Set(Array.isArray(storedFavorites)?storedFavorites:[]);
  let bag = read('kalo-bag-v1',[]);
  if (!Array.isArray(bag)) bag=[];
  const unavailableManualLines=manualResult?.error?bag.filter(line=>line&&typeof line.id==='string'&&line.id.startsWith('manual-')&&Number.isInteger(line.quantity)&&line.quantity>0):[];
  const state = {sport:'',q:'',category:'',team:'',audience:'',version:'',season:'',favorites:false,sort:'new',limit:36};
  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
  let toastTimer;
  function toast(message) { $('#toast').textContent=message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2600); }
  if (!catalog?.products?.length) { $('#result-count').textContent='No se pudo cargar el catálogo.'; $('#products').innerHTML='<p>Escríbenos por WhatsApp para ayudarte a encontrar tu camiseta.</p>'; return; }
  const products = [...manualProducts,...catalog.products].map(p=>({...p,version:core.effectiveVersion(p)}));
  const byId = new Map(products.map(p=>[p.id,p]));
  const searchable = core.createIndex(products);
  bag = bag.filter(x=>byId.has(x.id) && Number.isInteger(x.quantity) && x.quantity>0 && typeof x.size==='string').map(x=>({...x,quantity:Math.min(x.quantity,99)}));
  bag=bag.map(line=>{const p=byId.get(line.id);return {...line,size:p.source==='manual'?line.size:p.audience==='Mujer'&&line.size==='XXL'?'2XL':p.audience==='Adulto'&&!window.KaloSizes.isCoat(p,prices)&&line.size==='2XL'?'XXL':line.size};});
  let rejectedLines=0,removedSavedPatches=0;
  bag=bag.flatMap(line=>{try{const p=byId.get(line.id),options=core.classifyProduct(p,prices).trainingSet?{...line,personalization:null,patches:[]}:line;const restored=core.restoreOptions(p,options,prices);removedSavedPatches+=restored.removedPatches;return [{id:line.id,size:line.size,quantity:line.quantity,...restored.options}];}catch{rejectedLines++;return [];}});
  function priceOf(p) { return core.priceOf(p,prices); }
  function priceHTML(p) { const v=priceOf(p); return `<span class="price${v===null?' consult':''}">${v===null?'Consultar precio':esc(money(v))}</span>`; }
  function sourceOf(p) { if(p.source==='manual')return wa('¡Hola, Kalo! Quiero más fotos de '+p.name+'. Ref. '+p.id);return `https://nn88.x.yupoo.com/albums/${p.id}?uid=1`; }
  function wa(message) { return `https://wa.me/${settings.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`; }
  $$('[data-contact]').forEach(a=>a.href=wa('¡Hola, Kalo! Quiero información sobre sus camisetas.'));
  $('#year').textContent=new Date().getFullYear();
  $('#general-price-cards').innerHTML=[...new Set(core.generalDefinitions.map(rule=>rule.sport))].map(sport=>`<div><h3>${sport}</h3><dl>${core.generalDefinitions.filter(rule=>rule.sport===sport).map(rule=>`<div><dt>${esc(rule.label)}</dt><dd>${typeof prices[rule.section||'general']?.[rule.key]==='number'?esc(money(prices[rule.section||'general'][rule.key])):'Consultar'}</dd></div>`).join('')}</dl></div>`).join('');
  $('#general-price-cards').insertAdjacentHTML('beforeend',`<div><h3>Personalización y parches</h3><dl><div><dt>Nombre y dorsal · prendas compatibles</dt><dd>Gratis</dd></div>${Object.values(prices.patches||{}).map(patch=>`<div><dt>${esc(patch.label)} · por unidad</dt><dd>${typeof patch.price==='number'?esc(money(patch.price)):'Consultar'}</dd></div>`).join('')}</dl></div>`);
  const nbaSet=$$('#general-price-cards dt').find(label=>label.textContent==='Conjunto (suéter + short)');
  if(nbaSet){const link=document.createElement('a');link.href=wa('¡Hola, Kalo! Quiero un conjunto NBA (suéter + short). ¿Me ayudan a elegir el equipo y las tallas?');link.target='_blank';link.rel='noopener noreferrer';link.textContent='Conjunto (suéter + short) ↗';nbaSet.replaceChildren(link);}
  function populate(select, values, placeholder,reverse=false) { select.innerHTML=`<option value="">${placeholder}</option>`+[...new Set(values.filter(Boolean))].sort((a,b)=>(reverse?-1:1)*a.localeCompare(b,'es',{numeric:true})).map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''); }
  populate($('#category'),products.map(p=>p.category),'Todas las prendas');
  populate($('#team'),products.map(p=>p.team),'Todos los equipos');
  populate($('#season'),products.map(p=>p.season).filter(s=>s!=='Sin temporada'),'Todos los años',true);
  function updateTeams() {
    const available=[...new Set(products.filter(p=>(!state.sport||p.sport===state.sport)&&p.teamStatus!=='unclassified').map(p=>p.team))];
    if(!available.includes(state.team))state.team='';
    const query=$('#team-search')?.value||'';
    const matches=available.filter(team=>core.matchesSearch(core.teamSearchText(team),query));
    populate($('#team'),[...matches,...(state.team?[state.team]:[])],'Todos los equipos');
    $('#team').value=state.team;
    if($('#team-match-count'))$('#team-match-count').textContent=query?`${matches.length} equipos coinciden. Elige uno en la lista.`:'';
  }
  $('#team-search')?.addEventListener('input',updateTeams);
  const allowed = {sport:[...new Set(products.map(p=>p.sport))],category:[...new Set(products.map(p=>p.category))],team:[...new Set(products.map(p=>p.team))],audience:['Adulto','Mujer','Infantil'],version:['Estándar','Jugador','Retro'],season:[...new Set(products.map(p=>p.season))],sort:['new','name','price-low','price-high']};
  const params=new URLSearchParams(location.search);
  for (const key of Object.keys(allowed)) { const v=params.get(key); if(allowed[key].includes(v)) state[key]=v; }
  state.q=(params.get('q')||'').slice(0,200); state.favorites=params.get('favorites')==='1';
  $('#search').value=state.q; $('#favorites-only').checked=state.favorites;
  for(const key of ['category','team','audience','version','season','sort']) $('#'+key).value=state[key];
  $$('[data-sport]').forEach(b=>{b.classList.toggle('active',b.dataset.sport===state.sport);b.setAttribute('aria-pressed',String(b.dataset.sport===state.sport));});
  updateTeams();
  let selectedProduct=null,selectedSize='';
  let filtered=[];
  function filteredProducts() {
    return core.filterProducts(products,state,prices,favorites,searchable);
  }
  function card(p) { return `<article class="product-card"><div class="product-picture"><button class="product-open" data-product="${p.id}" aria-label="Ver ${esc(p.name+' · '+p.detail)}"><img src="${esc(p.image)}" alt="${esc(p.name+' · '+p.detail)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" width="300" height="340"></button><button class="favorite-button" data-favorite="${p.id}" aria-label="${favorites.has(p.id)?'Quitar de':'Agregar a'} favoritos: ${esc(p.name)}" aria-pressed="${favorites.has(p.id)}">${heart}</button>${p.version==='Retro'||p.audience==='Infantil'||p.version==='Jugador'?`<span class="product-tag">${esc(p.version==='Retro'?'RETRO':p.audience==='Infantil'?'INFANTIL':'VERSIÓN JUGADOR')}</span>`:''}</div><div class="product-info"><p class="category">${esc(p.sport)} / ${esc(p.category)}</p><button class="product-name" data-product="${p.id}">${esc(p.name)}</button><p class="detail">${esc(p.detail)}</p><div class="product-bottom">${priceHTML(p)}<button class="quick-add" data-product="${p.id}" aria-label="Elegir talla de ${esc(p.name)}">Elegir talla</button></div></div></article>`; }
  function wireImageErrors(root) { $$('img',root).forEach(img=>img.addEventListener('error',()=>{img.src='./assets/image-unavailable.svg';},{once:true})); }
  function render(reset=true) {
    if(reset) {state.limit=36;filtered=filteredProducts();}
    $('#products').innerHTML=filtered.slice(0,state.limit).map(card).join('');wireImageErrors($('#products'));
    $('#result-count').innerHTML=`<strong>${filtered.length.toLocaleString('es-PA')}</strong> ${filtered.length===1?'producto':'productos'}`;
    $('#empty-state').hidden=filtered.length>0;$('#load-more').hidden=state.limit>=filtered.length;
    $('#shown-count').textContent=filtered.length?`Mostrando ${Math.min(state.limit,filtered.length)} de ${filtered.length.toLocaleString('es-PA')}`:'';
    const chips=[];
    for(const key of ['category','team','audience','version','season','q','favorites']) if(state[key]){const label=key==='favorites'?'Mis favoritos':key==='version'&&state[key]==='Estándar'?'Fan / Aficionado':state[key];chips.push(`<button type="button" data-clear="${key}" aria-label="Quitar filtro ${esc(label)}"><span>${esc(label)}</span><span aria-hidden="true">×</span></button>`);}
    $('#active-filters').innerHTML=chips.join('');$('#active-filter-summary').hidden=!chips.length;$('#clear-active-filters').hidden=!chips.length;$('#filter-count').textContent=chips.length?chips.length:'';
    const next=new URLSearchParams();for(const key of ['sport','category','team','audience','version','season','q'])if(state[key])next.set(key,state[key]);if(state.favorites)next.set('favorites','1');if(state.sort!=='new')next.set('sort',state.sort);if(selectedProduct&&$('#product-dialog').open)next.set('producto',selectedProduct.id);
    try {history.replaceState(null,'',location.pathname+(next.size?'?'+next:'')+location.hash);}catch{}
  }
  function clearAll() {for(const k of ['q','category','team','audience','version','season'])state[k]='';state.favorites=false;state.sort='new';$('#search').value='';$('#team-search').value='';$('#favorites-only').checked=false;for(const k of ['category','team','audience','version','season','sort'])$('#'+k).value=state[k];updateTeams();render();}
  let debounce;
  $('#search').addEventListener('input',e=>{clearTimeout(debounce);state.q=e.target.value;debounce=setTimeout(()=>render(),120);});
  for(const key of ['category','team','audience','version','season','sort'])$('#'+key).addEventListener('change',e=>{state[key]=e.target.value;render();});
  $('#favorites-only').addEventListener('change',e=>{state.favorites=e.target.checked;render();});
  $$('[data-sport]').forEach(b=>b.addEventListener('click',()=>{state.sport=b.dataset.sport;$$('[data-sport]').forEach(t=>{t.classList.toggle('active',t===b);t.setAttribute('aria-pressed',String(t===b));});updateTeams();render();}));
  $('#reset-filters').addEventListener('click',clearAll);$('#empty-reset').addEventListener('click',clearAll);
  $('#clear-active-filters').addEventListener('click',()=>{clearAll();$('#toggle-filters').focus({preventScroll:true});});
  $('#active-filters').addEventListener('click',e=>{const button=e.target.closest('[data-clear]');if(!button)return;const k=button.dataset.clear;if(k==='favorites'){$('#favorites-only').checked=false;state.favorites=false;}else{state[k]='';$('#'+(k==='q'?'search':k)).value='';if(k==='team'){$('#team-search').value='';updateTeams();}}const position=$$('[data-clear]',$('#active-filters')).indexOf(button);render();const remaining=$$('[data-clear]',$('#active-filters'));(remaining[Math.min(position,remaining.length-1)]||$('#toggle-filters')).focus({preventScroll:true});});
  $('#load-more').addEventListener('click',()=>{const oldCount=Math.min(state.limit,filtered.length);state.limit+=36;render(false);const next=$$('.product-open',$('#products'))[oldCount];if(next)next.focus({preventScroll:true});});
  function setFiltersOpen(open){const panel=$('#filter-panel'),toggle=$('#toggle-filters');if(!open&&panel.contains(document.activeElement))toggle.focus({preventScroll:true});$('.catalog-layout').classList.toggle('filters-open',open);toggle.setAttribute('aria-expanded',String(open));panel.setAttribute('aria-hidden',String(!open));panel.inert=!open;}
  $('#toggle-filters').addEventListener('click',()=>setFiltersOpen($('#toggle-filters').getAttribute('aria-expanded')!=='true'));
  $('#filter-panel').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();setFiltersOpen(false);}});
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&!e.target.isContentEditable&&!$('dialog[open]')){e.preventDefault();$('#search').focus();}});
  function showProduct(id) {
    const p=byId.get(id);if(!p)return;selectedProduct=p;selectedSize='';
    const sizes=window.KaloSizes.sizesFor(p,prices);
    const canPersonalize=core.classifyProduct(p,prices).personalizable,patches=core.patchOptions(p,prices);
    $('#product-detail').innerHTML=`<div class="modal-image"><img src="${esc(p.image)}" alt="${esc(p.name+' · '+p.detail)}" referrerpolicy="no-referrer"></div><div class="modal-info">
      <p class="eyebrow">${esc(p.sport)} · ${esc(p.category)}</p><h2 id="product-title">${esc(p.name)}</h2><p class="detail">${esc(p.detail)}</p><p class="detail">${esc(p.audience)} · Versión ${esc(core.versionLabel(p))}</p>${priceHTML(p)}${p.source==='manual'?`<p class="detail">${esc(p.description)}</p>`:''}
      <form id="product-options" novalidate>
        <div class="size-heading"><p class="size-label">Elige tu talla</p><button type="button" class="size-guide-link" data-size-guide data-product-id="${esc(p.id)}">Guía de tallas ↗</button></div>
        <div class="sizes" role="group" aria-label="Talla">${sizes.map(s=>`<button type="button" data-size="${esc(s)}" aria-pressed="false">${esc(s)}</button>`).join('')}</div>
        <p class="size-note">${p.audience!=='Infantil'&&p.category!=='Accesorios'?'Consulta la guía de medidas y confirma la disponibilidad de la talla antes de encargar.':'Elige una de las tallas indicadas para este producto.'}</p>
        ${canPersonalize?`<div class="customization-options"><label class="option-check"><input id="personalize" type="checkbox" checked>Personalizar nombre y dorsal (GRATIS)</label><div id="personalization-fields" class="personalization-fields"><label for="jersey-number">Número de dorsal<input id="jersey-number" name="number" type="text" inputmode="numeric" pattern="[0-9]{1,3}" maxlength="3" autocomplete="off" required></label><label for="jersey-name">Nombre para la camiseta<input id="jersey-name" name="name" type="text" maxlength="40" autocomplete="off" autocapitalize="characters" required></label></div></div>`:''}
        ${patches.length?`<fieldset class="patch-options"><legend>Parches opcionales · por unidad</legend>${patches.map(patch=>`<label class="option-check" for="patch-${patch.id}"><input type="checkbox" id="patch-${patch.id}" data-patch value="${patch.id}"><span>${esc(patch.label)}</span><strong>+${esc(money(patch.price))}</strong></label>`).join('')}</fieldset>`:''}
        <p id="configured-price" class="configured-price" role="status" aria-live="polite"></p><p id="product-option-error" class="option-error" role="alert" hidden></p>
        <button type="submit" id="add-to-bag" class="button button-dark" disabled>Selecciona una talla</button>
      </form>
      <div class="product-share"><button id="share-product" class="button button-outline">Compartir producto ↗</button><label id="share-fallback" hidden>Enlace del producto<input id="product-link" readonly value="${esc(core.productUrl(location.href,p.id))}"></label></div><a class="source-link" href="${sourceOf(p)}" target="_blank" rel="noopener noreferrer">Consultar más fotos ↗</a><p class="modal-note">Ref. ${p.id}. El pedido se coordina por WhatsApp. Se solicitará un abono para el envío y el resto se paga contra entrega.</p></div>`;
    const morePhotos=$('.source-link',$('#product-detail'));
    morePhotos.href=wa('¡Hola, Kalo! Quisiera más fotos de '+p.name+' · '+p.detail+'. Referencia: '+p.id);
    morePhotos.textContent='Consultar más fotos por WhatsApp ↗';
    wireImageErrors($('#product-detail'));updateConfiguredPrice();$('#product-dialog').showModal();
    const url=new URL(location.href);url.searchParams.set('producto',p.id);try{history.replaceState(null,'',url.href);}catch{}
  }
  $('#products').addEventListener('click',e=>{const favorite=e.target.closest('[data-favorite]');if(favorite){const id=favorite.dataset.favorite;if(favorites.has(id))favorites.delete(id);else favorites.add(id);save('kalo-favorites-v1',[...favorites]);favorite.setAttribute('aria-pressed',String(favorites.has(id)));favorite.setAttribute('aria-label',`${favorites.has(id)?'Quitar de':'Agregar a'} favoritos: ${byId.get(id).name}`);if(state.favorites)render();return;}const button=e.target.closest('[data-product]');if(button)showProduct(button.dataset.product);});
  function selectedOptions(){return {personalization:$('#personalize')?.checked?{name:$('#jersey-name').value,number:$('#jersey-number').value}:null,patches:$$('[data-patch]:checked',$('#product-detail')).map(input=>input.value)};}
  function updateConfiguredPrice(){if(!selectedProduct)return;const cost=core.linePrice(selectedProduct,{personalization:null,patches:selectedOptions().patches},prices);$('#configured-price').textContent=cost.unit===null?'Precio unitario: por confirmar':`Precio unitario: ${money(cost.unit)}`+(cost.surcharge?` · Incluye ${money(cost.surcharge)} en parches`:'');}
  $('#product-detail').addEventListener('click',e=>{const b=e.target.closest('[data-size]');if(b){selectedSize=b.dataset.size;$$('[data-size]',$('#product-detail')).forEach(t=>t.setAttribute('aria-pressed',String(t===b)));$('#add-to-bag').disabled=false;$('#add-to-bag').textContent='Agregar a mi pedido +';}});
  $('#product-detail').addEventListener('change',e=>{if(e.target.id==='personalize'){const enabled=e.target.checked;$('#personalization-fields').hidden=!enabled;$$('input',$('#personalization-fields')).forEach(input=>{input.required=enabled;input.disabled=!enabled;});}if(e.target.matches('#personalize,[data-patch]'))updateConfiguredPrice();});
  $('#product-detail').addEventListener('input',()=>{if($('#product-option-error'))$('#product-option-error').hidden=true;});
  $('#product-detail').addEventListener('submit',e=>{if(e.target.id!=='product-options')return;e.preventDefault();if(!selectedProduct||!selectedSize||!e.target.reportValidity())return;try{if(!window.KaloSizes.sizesFor(selectedProduct).includes(selectedSize))throw new Error('Elige una talla de la lista.');const options=core.validateOptions(selectedProduct,selectedOptions(),prices);bag=core.addLine(bag,{id:selectedProduct.id,size:selectedSize,quantity:1,...options});persistBag();$('#product-dialog').close();toast('Agregado a tu pedido. ¡Buen fichaje!');}catch(error){$('#product-option-error').textContent=error.message;$('#product-option-error').hidden=false;}});
  $('#product-detail').addEventListener('click',async e=>{if(!e.target.closest('#share-product')||!selectedProduct)return;const url=core.productUrl(location.href,selectedProduct.id);try{if(!navigator.clipboard?.writeText)throw new Error();await navigator.clipboard.writeText(url);toast('Enlace del producto copiado.');}catch{const fallback=$('#share-fallback');if(fallback){fallback.hidden=false;$('#product-link').focus();$('#product-link').select();toast('Copia el enlace del producto.');}}});
  $('#product-dialog').addEventListener('close',()=>{selectedProduct=null;const url=new URL(location.href);url.searchParams.delete('producto');try{history.replaceState(null,'',url.href);}catch{}});
  $$('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.close).close()));
  $$('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}}));
  function persistBag(){save('kalo-bag-v1',[...bag,...unavailableManualLines]);save('kalo-coupons-v1',activeCoupons);const count=[...bag,...unavailableManualLines].reduce((s,x)=>s+x.quantity,0);$('#bag-count').textContent=count;$('#floating-count').textContent=count;$('#floating-bag').hidden=!count;}
  function couponHTML(quote){
    if(!coupons)return '';
    const context=activeCoupons.length?(quote.hasPendingDiscount?'Hay precios pendientes; los descuentos y el total final se confirmarán por WhatsApp.':quote.discountCents===0?'El código sigue activo; ahora no hay artículos con descuento.':''):'';
    return `<section class="coupon-box" aria-labelledby="coupon-heading"><h3 id="coupon-heading">¿Tienes un código de descuento?</h3><form id="coupon-form"><label class="sr-only" for="coupon-code">Código de descuento</label><div class="coupon-entry"><input id="coupon-code" type="text" aria-describedby="coupon-feedback" aria-invalid="${couponError}" maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Introduce tu código" value="${esc(couponDraft)}"><button type="submit">Aplicar</button></div></form><p id="coupon-feedback" class="coupon-feedback${couponError?' error':' success'}" role="status" aria-live="polite">${esc(couponFeedback)}</p>${activeCoupons.map(code=>`<div class="coupon-applied"><span>Código aplicado: <strong>${esc(code)}</strong></span><button type="button" data-remove-coupon="${esc(code)}" aria-label="Retirar cupón ${esc(code)}">Retirar</button></div>`).join('')}${context?`<p class="coupon-note">${esc(context)}</p>`:''}</section>`;
  }
  function renderBag(){
    if(coupons)activeCoupons=coupons.restore(activeCoupons);
    const quote=coupons?coupons.calculate(bag,byId,prices,activeCoupons):null;
    $('#bag-items').innerHTML=bag.length?bag.map((x,i)=>{const p=byId.get(x.id),adjusted=quote?.lines[i],cost=adjusted?.cost||core.linePrice(p,x,prices),sizes=[...new Set([...window.KaloSizes.sizesFor(p,prices),x.size])];return `<div class="bag-line"><img src="${esc(p.image)}" alt="" referrerpolicy="no-referrer"><div><h3>${esc(p.name)}</h3><p>${esc(p.detail)}</p><label class="bag-size-label">Talla<select data-bag-size="${i}" aria-label="Talla de ${esc(p.name)}">${sizes.map(size=>`<option value="${esc(size)}"${size===x.size?' selected':''}>${esc(size)}</option>`).join('')}</select></label><div class="bag-options">${x.personalization?`<p>Personalización: Sí (GRATIS)</p><p>Nombre: <strong>${esc(x.personalization.name)}</strong> · Dorsal: <strong>${esc(x.personalization.number)}</strong></p>`:'<p>Sin personalización</p>'}${cost.patches.map(patch=>`<p>${esc(patch.label)}: +${esc(money(patch.price))} por unidad</p>`).join('')}</div><p>Precio base: ${cost.base===null?'Por confirmar':esc(money(cost.base))}</p><p class="bag-unit-price">Precio unitario: <strong>${cost.unit===null?'Por confirmar':esc(money(cost.unit))}</strong></p>${cost.unit===null?'':`<p>Subtotal: <strong>${esc(money(Math.round(cost.unit*100)*x.quantity/100))}</strong></p>`}${adjusted?.discountCents?`<p class="coupon-line-discount">${adjusted.discounts.filter(d=>!d.pending).map(d=>`${esc(d.code)}: −${d.percent}% sobre la camiseta · −${esc(money(d.totalCents/100))}`).join('<br>')}</p><p class="coupon-line-discount">Con descuento: <strong>${esc(money(adjusted.unitAfterCents/100))} c/u</strong> · ${esc(money(adjusted.totalAfterCents/100))} en esta línea</p>`:''}<button class="remove" data-remove="${i}">Quitar</button></div><div class="quantity"><button data-quantity="${i}" data-delta="-1" aria-label="Reducir cantidad de ${esc(p.name)}">−</button><span>${x.quantity}</span><button data-quantity="${i}" data-delta="1" aria-label="Aumentar cantidad de ${esc(p.name)}" ${x.quantity>=99?'disabled':''}>+</button></div></div>`;}).join(''):'<div class="bag-empty"><p>Tu próximo fichaje te está esperando.</p><button class="button button-outline" data-continue>Explorar catálogo ↗</button></div>';
    wireImageErrors($('#bag-items'));
    const summary=quote?.original||core.orderSummary(bag,byId,prices);const known=quote?quote.totalCents/100:summary.subtotal;const unknown=summary.unknown>0;
    const message=core.orderMessage(bag,byId,prices,money,quote,location.href);
    const allUnknown=bag.length&&bag.every(x=>priceOf(byId.get(x.id))===null);
    const couponTotals=quote?.codes.length?`<div class="coupon-totals"><div><span>${unknown?'Subtotal original conocido':'Subtotal original'}</span><strong>${esc(money(summary.subtotal))}</strong></div>${quote.lineDiscountCents?`<div class="coupon-discount"><span>Descuento en camisetas</span><strong>−${esc(money(quote.lineDiscountCents/100))}</strong></div>`:''}${quote.orderDiscounts.map(d=>`<div class="coupon-discount"><span>Descuento ${esc(d.code)} por pedido</span><strong>${d.pending?'Por confirmar':'−'+esc(money(d.amountCents/100))}</strong></div>`).join('')}</div>`:'';
    $('#bag-summary').innerHTML=bag.length?`${couponHTML(quote)}${couponTotals}<div class="bag-total"><strong>${allUnknown?'Total':unknown?'Subtotal conocido'+(activeCoupons.length?' tras descuentos':''):activeCoupons.length?'Total de productos':'Subtotal'}</strong><strong>${allUnknown?'Por confirmar':money(known)}</strong></div><p class="bag-disclaimer">${unknown?'Hay prendas con precio por confirmar. ':''}${esc(core.deliveryPayment)} ${esc(core.deliveryEstimate)}</p><a id="send-order" class="button button-dark" href="${wa(message)}" target="_blank" rel="noopener noreferrer">Enviar pedido por WhatsApp ↗</a><button class="text-button" data-continue style="display:block;margin:15px auto 0">Seguir explorando</button>`:couponHTML(quote);
    if(unavailableManualLines.length){const warning='<p class="option-error" role="alert">Algunas prendas de tu pedido no se pudieron cargar. Tu selección sigue guardada. Recarga la página antes de enviar el pedido.</p>';if(bag.length)$('#bag-items').insertAdjacentHTML('afterbegin',warning);else $('#bag-items').innerHTML=warning;$('#send-order')?.remove();}
  }
  $('#bag-dialog').addEventListener('input',e=>{if(e.target.id==='coupon-code'){couponDraft=e.target.value;couponFeedback='';couponError=false;$('#coupon-feedback').textContent='';}});
  $('#bag-dialog').addEventListener('submit',e=>{if(e.target.id!=='coupon-form'||!coupons)return;e.preventDefault();const result=coupons.validate(couponDraft,bag,byId,prices,activeCoupons);couponFeedback=result.message;couponError=!result.ok;if(result.ok){activeCoupons=result.codes;couponDraft='';persistBag();}renderBag();$('#coupon-code').focus({preventScroll:true});});
  $('#bag-dialog').addEventListener('click',e=>{const button=e.target.closest('[data-remove-coupon]');if(!button)return;activeCoupons=activeCoupons.filter(code=>code!==button.dataset.removeCoupon);couponFeedback='Código retirado.';couponError=false;persistBag();renderBag();$('#coupon-code').focus({preventScroll:true});});
  $('#open-bag').addEventListener('click',()=>{renderBag();$('#bag-dialog').showModal();});
  $('#floating-bag').addEventListener('click',()=>{renderBag();$('#bag-dialog').showModal();});
  $('#bag-dialog').addEventListener('click',e=>{const remove=e.target.closest('[data-remove]');const quantity=e.target.closest('[data-quantity]');if(remove){bag.splice(Number(remove.dataset.remove),1);persistBag();renderBag();}if(quantity){const i=Number(quantity.dataset.quantity);bag[i].quantity+=Number(quantity.dataset.delta);if(bag[i].quantity<=0)bag.splice(i,1);persistBag();renderBag();}if(e.target.closest('[data-continue]'))$('#bag-dialog').close();});
  $('#bag-dialog').addEventListener('change',e=>{const select=e.target.closest('[data-bag-size]');if(!select)return;const i=Number(select.dataset.bagSize),line=bag[i];if(!line)return;const sizes=[...new Set([...window.KaloSizes.sizesFor(byId.get(line.id)),line.size])];try{bag=core.changeLineSize(bag,i,select.value,sizes);persistBag();renderBag();toast('Talla actualizada en tu pedido.');}catch(error){select.value=line.size;toast(error.message);}});
  // Referencias reales para la composición de portada; se mantienen dentro del catálogo.
  const first=products.find(p=>p.team==='FC Barcelona'&&p.category==='Camisetas'&&p.audience==='Adulto'&&p.detail.includes('Local'))||products[0];
  const second=products.find(p=>p.team==='Brasil'&&p.version==='Retro'&&p.category==='Camisetas'&&p.audience==='Adulto')||products[1];
  $('#hero-one').src=first.image;$('#hero-one').alt=first.name+' · '+first.detail;$('#hero-one').referrerPolicy='no-referrer';
  $('#hero-two').src=second.image;$('#hero-two').alt=second.name+' · '+second.detail;$('#hero-two').referrerPolicy='no-referrer';
  wireImageErrors($('.hero-art'));persistBag();render();
  if(removedSavedPatches)toast('Quitamos parches que no corresponden al equipo. Tus productos siguen en el pedido; revisa el total.');
  if(rejectedLines)toast('Se retiraron del carrito opciones guardadas no válidas. Revisa tu selección.');
  const linkedProduct=params.get('producto');if(linkedProduct){if(byId.has(linkedProduct))showProduct(linkedProduct);else toast('Esta referencia no está disponible en el catálogo.');}
})();
