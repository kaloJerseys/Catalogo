// Catálogo independiente del proveedor. Un 404 de ficha significa retirada manual.
(() => {
  'use strict';
  const idPattern=/^manual-[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const allowedCategories=['Camisetas','Conjuntos','Sudaderas','Chaquetas','Polos','Pantalones y shorts','Accesorios'];
  async function readJSON(path,optional=false){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await fetch(path,{cache:'no-cache',redirect:'error',signal:controller.signal});
      if(optional&&response.status===404)return null;
      if(!response.ok)throw new Error('No se pudo leer '+path+': '+response.status);
      return await response.json();
    }finally{clearTimeout(timer);}
  }
  function validate(product,id){
    if(!idPattern.test(id)||product.id!==id||product.source!=='manual')throw new Error('Referencia manual no válida: '+id);
    for(const key of ['name','team','sport','category','audience','version','season','seasonStatus','teamStatus','detail','original','description']){
      if(typeof product[key]!=='string'||!product[key].trim()||product[key].length>2000)throw new Error('Campo manual no válido: '+key);
    }
    if(!allowedCategories.includes(product.category)||!['Adulto','Mujer','Infantil'].includes(product.audience)||!['Estándar','Jugador','Retro'].includes(product.version)||!['confirmed','unclassified'].includes(product.teamStatus)||!['confirmed','unclassified'].includes(product.seasonStatus))throw new Error('Clasificación manual no válida: '+id);
    if(product.manualPrice!==null&&(typeof product.manualPrice!=='number'||!Number.isFinite(product.manualPrice)||product.manualPrice<0||Math.abs(product.manualPrice*100-Math.round(product.manualPrice*100))>1e-7))throw new Error('Precio manual no válido: '+id);
    if(!Array.isArray(product.sizes)||!product.sizes.length||new Set(product.sizes).size!==product.sizes.length||product.sizes.some(s=>typeof s!=='string'||!s.trim()||s.length>30))throw new Error('Tallas manuales no válidas: '+id);
    if(typeof product.image!=='string'||!new RegExp('^\\./manual-products/'+id+'/[a-z0-9][a-z0-9-]*\\.(png|jpg|jpeg|webp)$').test(product.image))throw new Error('Foto manual no válida: '+id);
    return product;
  }
  window.KALO_MANUAL_READY=(async()=>{
    try{
      const index=await readJSON('./manual-products/index.json');
      if(index.formatVersion!==1||!Array.isArray(index.products)||index.products.length>500||new Set(index.products).size!==index.products.length||index.products.some(id=>typeof id!=='string'||!idPattern.test(id)))throw new Error('Índice manual no válido.');
      const products=(await Promise.all(index.products.map(async id=>{
        // Borrar la carpeta del producto lo retira también en Pages por rama.
        const product=await readJSON('./manual-products/'+id+'/product.json',true);
        return product===null?null:validate(product,id);
      }))).filter(Boolean);
      return {products,error:null};
    }catch(error){return {products:[],error:String(error.message||error)};}
  })();
})();
