(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KaloSizes=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const guides={
    fan:{id:'fan',label:'Hombre · Aficionado',title:'Hombre · Versión Aficionado (Fan)',sizes:['S','M','L','XL','XXL'],columns:['Talla','Largo (cm)','Ancho (cm)','Altura (cm)','Peso (kg)'],rows:[['S','69-71','53-55','162-170','50-62'],['M','71-73','55-57','170-176','62-78'],['L','73-75','57-58','176-182','78-83'],['XL','75-78','58-60','182-190','83-90'],['XXL','78-81','60-62','190-195','90-97']],note:'Margen de error de 1-3 cm aceptable por la elasticidad.'},
    player:{id:'player',label:'Hombre · Jugador',title:'Hombre · Versión Jugador',sizes:['S','M','L','XL','XXL'],columns:['Talla','Largo (cm)','Ancho (cm)','Altura (cm)','Peso (kg)'],rows:[['S','67-69','49-51','162-170','50-62'],['M','69-71','51-53','170-176','62-78'],['L','71-73','53-55','176-182','78-83'],['XL','73-75','55-57','182-190','83-90'],['XXL','75-77','57-59','190-195','90-97']],note:'Margen de error de 1-3 cm aceptable por la elasticidad.'},
    women:{id:'women',label:'Mujer',title:'Mujer · Mercado femenino',sizes:['S','M','L','XL','2XL'],columns:['Medida (cm)','S','M','L','XL','2XL'],rows:[['Largo de la camiseta','64','65.5','67','68.5','70'],['Pecho (1/2 contorno)','44','46','48','50','52'],['Largo de manga (hombro a puño)','27.5','29','30.5','32','33.5'],['Abertura de manga','14.5','15.25','16','16.75','17.5'],['Cintura','40','42','44','46','48'],['Bajo de la camiseta','46','48','50','52','54'],['Ancho del cuello','19.5','19.5','19.5','19.5','19.5'],['Cuello redondo','—','—','12','—','—'],['Cuello en V','—','—','14.5','—','—']],note:'Las medidas pueden variar ±1-2 cm. Se recomienda comparar con una prenda ya usada.'}
  };
  function guideId(p){if(p.audience==='Mujer')return 'women';return p.version==='Jugador'?'player':'fan';}
  function sizesFor(p){
    if(p.audience==='Infantil'||p.category==='Accesorios')return p.sizes?.length?[...p.sizes]:['Consultar talla'];
    const guide=guides[guideId(p)],normalize=s=>s==='XXL'||s==='2XL'?(guide.id==='women'?'2XL':'XXL'):s;
    return [...new Set([...guide.sizes,...(p.sizes||[]).map(normalize)])];
  }
  function contextNote(p){
    if(!p)return '';
    if(p.audience==='Infantil')return 'Las tablas facilitadas son de adulto y mujer. No se proporcionó una tabla infantil; consulta sus medidas por WhatsApp.';
    if(p.sport!=='Fútbol'||p.category!=='Camisetas')return 'Estas son las tablas de camisetas facilitadas por el proveedor. No se proporcionó una tabla específica para este deporte o tipo de prenda; consulta su ajuste por WhatsApp.';
    if(p.version==='Retro'&&p.audience!=='Mujer')return 'No se proporcionó una tabla específica de Retro. La tabla de Aficionado se muestra como referencia; consulta las medidas del modelo.';
    return '';
  }
  return {guides,guideId,sizesFor,contextNote};
});
