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
  "products": {},
  // Conjuntos de chaqueta con cierre completo y pantalón comprobados en sus portadas.
  // El título genérico «tracksuit» también aparece en conjuntos de entrenamiento de $45.
  "productAttributes": {
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
