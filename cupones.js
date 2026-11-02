(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./catalog-core.js'):root.KaloCore);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.KaloCoupons=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(core){
  'use strict';
  const registry=new Map(),config={allowStacking:false};
  const cents=value=>Math.round(value*100);
  const normalize=code=>typeof code==='string'?code.trim().toUpperCase():'';
  function register(coupon){
    const code=normalize(coupon.code);
    if(!/^[A-Z0-9_-]{1,24}$/.test(code)||!['line-percent','order-fixed'].includes(coupon.kind)||!Number.isFinite(coupon.value)||coupon.value<=0||(coupon.kind==='line-percent'&&(coupon.value>100||typeof coupon.eligible!=='function')))throw new Error('Configuración de cupón no válida.');
    registry.set(code,Object.freeze({...coupon,code,enabled:coupon.enabled!==false}));
  }
  function configure(options){if(typeof options.allowStacking!=='boolean')throw new Error('Configuración de acumulación no válida.');config.allowStacking=options.allowStacking;}
  function enabled(code){const coupon=registry.get(code);return coupon?.enabled?coupon:null;}
  function restore(codes){
    const valid=Array.isArray(codes)?[...new Set(codes.map(normalize))].filter(code=>enabled(code)):[];
    return config.allowStacking?valid:valid.slice(0,1);
  }
  function validate(code,bag,products,prices,active=[]){
    const normalized=normalize(code),coupon=enabled(normalized),current=restore(active);
    if(!/^[A-Z0-9_-]{1,24}$/.test(normalized)||!coupon)return {ok:false,message:'El código no es válido o ya no está habilitado.'};
    if(!bag.length)return {ok:false,message:'Agrega un producto antes de aplicar un código.'};
    if(!config.allowStacking&&current.length&&!current.includes(normalized))return {ok:false,message:'Retira el cupón actual antes de aplicar otro.'};
    if(coupon.kind==='line-percent'&&!bag.some(line=>{const p=products.get(line.id);return p&&coupon.eligible(p,prices);}))return {ok:false,message:'Este código no aplica a los productos de tu pedido.'};
    return {ok:true,codes:[...new Set([...current,normalized])],message:'Código aplicado.'};
  }
  function calculate(bag,products,prices,codes=[]){
    const active=restore(codes),original=core.orderSummary(bag,products,prices),lines=[];
    let lineDiscountCents=0;
    bag.forEach((line,index)=>{
      const p=products.get(line.id);if(!p)return;
      const cost=core.linePrice(p,line,prices),discounts=[];let remaining=cost.base===null?null:cents(cost.base);
      for(const code of active){const coupon=enabled(code);
        if(coupon.kind!=='line-percent'||!coupon.eligible(p,prices))continue;
        const perUnit=remaining===null?null:Math.min(remaining,Math.round(remaining*coupon.value/100));
        discounts.push({code,percent:coupon.value,perUnitCents:perUnit,totalCents:perUnit===null?null:perUnit*line.quantity,pending:perUnit===null});
        if(perUnit!==null)remaining-=perUnit;
      }
      const discountCents=discounts.reduce((sum,d)=>sum+(d.totalCents||0),0),unitDiscount=discounts.reduce((sum,d)=>sum+(d.perUnitCents||0),0);
      const unitAfterCents=cost.unit===null?null:Math.max(0,cents(cost.unit)-unitDiscount);
      lines[index]={cost,discounts,discountCents,unitAfterCents,totalAfterCents:unitAfterCents===null?null:unitAfterCents*line.quantity};lineDiscountCents+=discountCents;
    });
    const originalSubtotalCents=cents(original.subtotal),orderDiscounts=[];
    let remaining=Math.max(0,originalSubtotalCents-lineDiscountCents),orderDiscountCents=0;
    for(const code of active){const coupon=enabled(code);if(coupon.kind!=='order-fixed')continue;
      // Un importe desconocido no se convierte en cero para calcular un descuento global.
      const amount=original.unknown?null:Math.min(remaining,cents(coupon.value));
      orderDiscounts.push({code,configuredCents:cents(coupon.value),amountCents:amount,pending:amount===null});
      if(amount!==null){remaining-=amount;orderDiscountCents+=amount;}
    }
    return {codes:active,original,lines,originalSubtotalCents,lineDiscountCents,orderDiscounts,orderDiscountCents,discountCents:lineDiscountCents+orderDiscountCents,totalCents:remaining,unknown:original.unknown,count:original.count,hasPendingDiscount:orderDiscounts.some(d=>d.pending)||lines.some(l=>l?.discounts.some(d=>d.pending))};
  }
  register({code:'5DOFF',kind:'order-fixed',value:5});
  return Object.freeze({register,unregister:code=>registry.delete(normalize(code)),configure,normalize,restore,validate,calculate});
});

(function(root){
  'use strict';
  // Regla permanente, independiente del tema visual de Fiestas Patrias.
  const nationalNames=new Set(['panama','seleccion de panama','seleccion nacional de panama','panama national team','panama national football team']);
  root.KaloCoupons?.register({code:'PTYOFF',kind:'line-percent',value:15,eligible(product,prices){
    if(root.KaloCore.normalize(product.sport)!=='futbol'||!['Camisetas','Conjuntos'].includes(product.category)||!nationalNames.has(root.KaloCore.normalize(product.team)))return false;
    const type=root.KaloCore.classifyProduct(product,prices);
    return type.shirt||type.jerseySet;
  }});
})(typeof globalThis!=='undefined'?globalThis:this);
