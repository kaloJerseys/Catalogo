// Archivo principal para editar los precios manualmente desde GitHub (USD).
// Prioridad: products > precio de ficha manual > tipo de prenda > deporte/versión > categories.
// products permite excepciones por referencia; null mantiene «Consultar precio».
// productAttributes solo debe contener atributos comprobados en el catálogo o con el proveedor.
// null significa «Consultar precio». Los valores se expresan en dólares (USD).
window.KALO_PRICES = {
  "general": {
    "football_fan": 30,
    "football_player": 35,
    "football_retro": 40,
    "nba_jersey": 45,
    "nba_shorts": 35,
    "nba_set": 70,
    "football_set": 45,
    "football_long_sleeve_set": 50,
    "f1_base": 45,
    "nfl_base": 50
  },
  "garments": {
    "polo_regular": 35,
    "polo_retro": 40,
    "long_sleeve_jersey": 45,
    "jacket": 60,
    "reversible_windbreaker": 65,
    "cotton_hoodie": 55,
    "jacket_pants_set": 75
  },
  "patches": {
    "champions": { "label": "Parche Champions League", "price": 1.5 },
    "league": { "label": "Parche de Liga", "price": 1.5 }
  },
  "categories": {
    "Camisetas": null,
    "Conjuntos": null,
    "Sudaderas": null,
    "Chaquetas": null,
    "Polos": null,
    "Pantalones y shorts": null,
    "Accesorios": null
  },
  "products": {
    "258572793": 50,
    "254827191": 50,
    "249698344": 50,
    "240549678": 50
  },
  // Abrigos y mangas largas confirmados por la portada o por Kalo.
  // El título genérico «tracksuit» también aparece en conjuntos de entrenamiento de $45.
  "productAttributes": {
    "259436651": { "garment": "jacket_pants_set" },
    "259436558": { "garment": "jacket_pants_set" },
    "158426549": { "garment": "jacket_pants_set" },
    "158423972": { "garment": "jacket_pants_set" },
    "158423373": { "garment": "jacket_pants_set" },
    "158417923": { "garment": "jacket_pants_set" },
    "220636530": { "garment": "jacket_pants_set" },
    "261155230": { "longSleeve": true },
    "259436478": { "longSleeve": true },
    "259436358": { "longSleeve": true },
    "257755217": { "longSleeve": true },
    "246509074": { "longSleeve": true },
    "246508763": { "longSleeve": true },
    "246508602": { "longSleeve": true },
    "246507806": { "longSleeve": true },
    "246504087": { "longSleeve": true },
    "237019808": { "longSleeve": true },
    "237019688": { "longSleeve": true },
    "221444681": { "longSleeve": true },
    "221444650": { "longSleeve": true },
    "221444555": { "longSleeve": true },
    "221444484": { "longSleeve": true },
    "220201382": { "longSleeve": true },
    "215111791": { "longSleeve": true },
    "200153432": { "longSleeve": true },
    "184566541": { "longSleeve": true },
    "184564218": { "longSleeve": true },
    "184532402": { "longSleeve": true },
    "184532299": { "longSleeve": true },
    "182899828": { "longSleeve": true },
    "182899807": { "longSleeve": true },
    "182899789": { "longSleeve": true },
    "182899761": { "longSleeve": true },
    "182899622": { "longSleeve": true },
    "158428435": { "longSleeve": true },
    "158428263": { "longSleeve": true },
    "158427582": { "longSleeve": true },
    "158426074": { "longSleeve": true },
    "158425709": { "longSleeve": true },
    "158418800": { "longSleeve": true },
    "158417929": { "longSleeve": true },
    "200153186": { "longSleeve": true },
    "158423969": { "longSleeve": true },
    "158417268": { "longSleeve": true },
    "223198378": { "garment": "jacket_pants_set" },
    "222744779": { "garment": "jacket_pants_set" },
    "222744711": { "garment": "jacket_pants_set" },
    "221551622": { "garment": "jacket_pants_set" },
    "201432135": { "garment": "jacket_pants_set" },
    "187343681": { "garment": "jacket_pants_set" },
    "187343528": { "garment": "jacket_pants_set" },
    "187343442": { "garment": "jacket_pants_set" },
    "176806472": { "garment": "jacket_pants_set" }
  }
};
