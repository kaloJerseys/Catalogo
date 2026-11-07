(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KaloSizes=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const guides={
    fan:{id:'fan',label:'Hombre · Aficionado',title:'Hombre · Versión Aficionado (Fan)',sizes:['S','M','L','XL','XXL'],columns:['Talla','Largo (cm)','Ancho (cm)','Altura (cm)','Peso (kg)'],rows:[['S','69-71','53-55','162-170','50-62'],['M','71-73','55-57','170-176','62-78'],['L','73-75','57-58','176-182','78-83'],['XL','75-78','58-60','182-190','83-90'],['XXL','78-81','60-62','190-195','90-97']],note:'Margen de error de 1-3 cm aceptable por la elasticidad.'},
    player:{id:'player',label:'Hombre · Jugador',title:'Hombre · Versión Jugador',sizes:['S','M','L','XL','XXL'],columns:['Talla','Largo (cm)','Ancho (cm)','Altura (cm)','Peso (kg)'],rows:[['S','67-69','49-51','162-170','50-62'],['M','69-71','51-53','170-176','62-78'],['L','71-73','53-55','176-182','78-83'],['XL','73-75','55-57','182-190','83-90'],['XXL','75-77','57-59','190-195','90-97']],note:'Margen de error de 1-3 cm aceptable por la elasticidad.'},
    women:{id:'women',label:'Mujer',title:'Mujer · Mercado femenino',sizes:['S','M','L','XL','2XL'],columns:['Medida (cm)','S','M','L','XL','2XL'],rows:[['Largo de la camiseta','64','65.5','67','68.5','70'],['Pecho (1/2 contorno)','44','46','48','50','52'],['Largo de manga (hombro a puño)','27.5','29','30.5','32','33.5'],['Abertura de manga','14.5','15.25','16','16.75','17.5'],['Cintura','40','42','44','46','48'],['Bajo de la camiseta','46','48','50','52','54'],['Ancho del cuello','19.5','19.5','19.5','19.5','19.5'],['Cuello redondo','—','—','12','—','—'],['Cuello en V','—','—','14.5','—','—']],note:'Las medidas pueden variar ±1-2 cm. Se recomienda comparar con una prenda ya usada.'},
    kids:{"label": "Niños · Jersey", "title": "Jersey para Niños", "sizes": ["16", "18", "20", "22", "24", "26", "28"], "columns": ["Medida", "XXS", "XS", "S", "M", "L", "XL", "2XL"], "rows": [["Número", "16", "18", "20", "22", "24", "26", "28"], ["Edad", "2-3", "4-5", "5-6", "7-8", "8-9", "10-11", "12-13"], ["Altura (cm)", "95-105", "105-115", "115-125", "125-135", "135-145", "145-155", "155-165"], ["Largo de la ropa (cm)", "44", "47", "50", "53", "56", "59", "62"], ["1/2 Pecho (cm)", "35", "37", "39", "41", "43", "45", "47"], ["Largo del short (cm)", "32", "34", "36", "38", "39", "40", "43"], ["1/2 Cintura (cm)", "20-37", "21-39", "22-41", "23-42", "24-44", "25-47", "26-50"]], "id": "kids", "matrix": true, "note": "Un margen de error de 1-2 cm es aceptable debido al elástico.", "source": "./assets/guides/kids-proveedor.png"},
    kidsCoat:{"label": "Niños · Abrigos", "title": "Abrigos para Niños", "sizes": ["10", "12", "14", "16", "18"], "columns": ["Medida", "10", "12", "14", "16", "18"], "rows": [["Largo de la ropa (cm)", "55", "57.5", "60", "62.5", "65"], ["Pecho (cm)", "40", "42", "44", "46", "48"], ["Largo de manga (cm)", "59.5", "61", "63.5", "66", "68.5"], ["Largo del pantalón (cm)", "78", "80", "83", "86", "89"], ["Largo de cintura (cm)", "82", "86", "90", "94", "98"], ["Altura (cm)", "115-125", "125-135", "135-145", "145-155", "155-165"]], "id": "kidsCoat", "matrix": true, "note": "Un margen de error de 1-2 cm es aceptable debido al elástico.", "source": "./assets/guides/kidsCoat-proveedor.png"},
    coat:{"label": "Adultos · Abrigos", "title": "Abrigos para Adultos", "sizes": ["S", "M", "L", "XL", "2XL"], "columns": ["Medida", "S", "M", "L", "XL", "2XL", "3XL", "4XL"], "rows": [["Largo (cm)", "69", "71", "73", "75", "77", "/", "/"], ["Pecho (cm)", "100", "104", "108", "112", "116", "/", "/"], ["Hombro (cm)", "75", "77", "79", "81", "83", "/", "/"], ["Largo del pantalón (cm)", "98.5", "101", "103.5", "106", "108.5", "/", "/"], ["Cadera del pantalón (cm)", "96", "100", "104", "108", "110", "/", "/"], ["Altura (cm)", "155-170", "165-175", "170-185", "180-195", "185-210", "/", "/"], ["Peso (kg)", "55-65", "60-75", "70-85", "80-100", "95-115", "/", "/"]], "id": "coat", "matrix": true, "note": "Un margen de error de 1-2 cm es aceptable debido al elástico.", "source": "./assets/guides/coat-proveedor.png"},
    basketballJersey:{
      id:"basketballJersey",
      label:"Basketball · Jersey",
      title:"Jersey de Basketball · Adulto",
      sizes:["S", "M", "L", "XL", "2XL"],
      columns:["Medida", "S (44)", "M (48)", "L (50)", "XL (52)", "2XL (54)", "3XL", "4XL"],
      rows:[
        ["Altura (cm)", "165-173", "170-177", "175-182", "180-187", "185-198", "/", "/"],
        ["Peso (kg)", "50-67", "65-77", "75-87", "85-97", "95-110", "/", "/"],
        ["Largo frontal (cm)", "75", "78", "80", "83", "85", "/", "/"],
        ["Largo trasero (cm)", "80", "83", "85", "87", "89", "/", "/"],
        ["Pecho (cm)", "110", "116", "120", "124", "128", "/", "/"]
      ],
      matrix:true,
      note:"Altura y peso son referencias corporales. El proveedor no facilitó medidas para 3XL y 4XL.",
      source:"./assets/guides/basketball-proveedor.png"
    },
    basketballShorts:{
      id:"basketballShorts",
      label:"Basketball · Short",
      title:"Short de Basketball",
      sizes:["S", "M", "L", "XL", "2XL"],
      columns:["Medida", "S", "M", "L", "XL", "2XL"],
      rows:[
        ["Largo del pantalón (cm)", "51", "54", "57", "60", "63"],
        ["Cintura (cm)", "33", "35", "37", "39", "41"],
        ["Altura (cm)", "165-172", "172-180", "178-185", "183-190", "186-200"]
      ],
      matrix:true,
      note:"La altura es una referencia corporal. Confirma el ajuste del short antes de pedir.",
      source:"./assets/guides/basketball-proveedor.png"
    }
  };
  function isCoat(p,prices={}){return prices.productAttributes?.[p.id]?.garment==='jacket_pants_set'|| ['Chaquetas','Abrigos','Sudaderas'].includes(p.category)||/\b(?:jackets?|coats?|hoodies?)\b/i.test(p.original||'');}
  function defaultGuideId(p,prices){if(isCoat(p,prices))return p.audience==='Infantil'?'kidsCoat':'coat';if(p.audience==='Infantil')return 'kids';if(p.audience==='Mujer')return 'women';return p.version==='Jugador'?'player':'fan';}
  function guideId(p,prices){
    if(p.sport==='NBA'&&p.audience==='Adulto'&&!isCoat(p,prices)){
      if(p.category==='Pantalones y shorts')return 'basketballShorts';
      if(['Camisetas','Conjuntos'].includes(p.category))return 'basketballJersey';
    }
    return defaultGuideId(p,prices);
  }
  function sizesFor(p,prices){
    if(p.source==='manual')return [...(p.sizes||[])];
    if(p.category==='Accesorios')return p.sizes?.length?[...p.sizes]:['Consultar talla'];
    const guide=guides[defaultGuideId(p,prices)];
    if(['kids','kidsCoat','coat'].includes(guide.id))return p.sizes?.length?[...p.sizes]:[...guide.sizes];
    const normalize=s=>s==='XXL'||s==='2XL'?(guide.id==='women'?'2XL':'XXL'):s;
    return [...new Set([...guide.sizes,...(p.sizes||[]).map(normalize)])];
  }
  function contextNote(p,prices){
    if(!p)return '';
    const guide=guideId(p,prices);
    if(guide==='basketballShorts')return 'Tabla de referencia para shorts de Basketball del proveedor. Consulta la talla y el ajuste del modelo.';
    if(guide==='basketballJersey')return p.category==='Conjuntos'
      ? 'Para comparar ambas prendas del conjunto, consulta también la pestaña Basketball · Short.'
      : 'Tabla de referencia para jerseys de Basketball de adulto del proveedor. Consulta la talla y el ajuste del modelo.';
    if(p.source==='manual')return 'Tallas confirmadas para este modelo. No se proporcionó una tabla específica: las medidas generales son solo una referencia; confirma el ajuste por WhatsApp.';
    if(isCoat(p,prices))return 'Tabla de abrigos del proveedor. Confirma las medidas del modelo antes de pedir.';
    if(p.audience==='Infantil')return 'Los números 16–28 corresponden a las tallas XXS–2XL de jersey infantil; no son tallas de abrigo.';
    if(p.sport!=='Fútbol'||p.category!=='Camisetas')return 'Estas son las tablas de camisetas facilitadas por el proveedor. No se proporcionó una tabla específica para este deporte o tipo de prenda; consulta su ajuste por WhatsApp.';
    if(p.version==='Retro'&&p.audience!=='Mujer')return 'No se proporcionó una tabla específica de Retro. La tabla de Aficionado se muestra como referencia; consulta las medidas del modelo.';
    return '';
  }
  return {guides,isCoat,guideId,sizesFor,contextNote};
});
