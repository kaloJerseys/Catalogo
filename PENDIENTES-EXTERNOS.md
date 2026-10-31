# Información pendiente del proveedor

Actualización del 30 de octubre de 2026.

## Material de hoodies

Por indicación del usuario, la tarifa de 55 USD solo se aplica a hoodies que indiquen algodón explícitamente. Los 171 registros identificados como hoodie —incluidos conjuntos con hoodie— no confirman algodón en su título original y mantienen precio por confirmar. No se inventó su composición.

La tarifa está preparada en `data/prices.js`, clave `garments.cotton_hoodie`. Cuando se confirme el material de una referencia, puede registrarse en `productAttributes` con `material: "cotton"`, o establecer un precio individual confirmado en `products`. No se aplica automáticamente el precio base de F1 a un hoodie de material desconocido.

Otras prendas sin tarifa solicitada conservan sus precios anteriores o «Consultar precio»; no se les asignaron importes nuevos.

## Medidas específicas

Siguen pendientes las tablas de **NBA, shorts, F1, infantil y Retro**. Las tres guías recibidas —Hombre Fan/Aficionado, Hombre Jugador y Mujer— conservan sus valores y tolerancias. Las tallas continúan seleccionables.

## Datos originales dudosos

Los títulos, referencias, fotos y equipos del catálogo base permanecen conservados. Los registros de revisión están en `tools/internal/curation-review.json`. La lógica de precios evita confundir clubes de fútbol como Red Bull Salzburg o Kaizer Chiefs con F1/NFL cuando su título identifica fútbol; no modifica el archivo compacto ni los filtros existentes.

Las actualizaciones de precios se realizan manualmente en `data/prices.js`, desde el código o GitHub. La página no contiene herramientas públicas de administración.
