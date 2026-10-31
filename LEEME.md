# Kalo Jerseys

Catálogo interactivo con pedidos exclusivamente por WhatsApp al **+507 6280 9447**. Se conservan el diseño rojo y crema, Barlow Condensed, DM Sans, las 18,984 referencias de venta, portadas, favoritos, filtros, tallas y enlaces compartibles. La administración de precios se realiza únicamente editando código.

## Abrir el catálogo

Descomprime la carpeta completa y abre `index.html`. Para publicar en el alojamiento estático configurado, conserva juntos `index.html`, los scripts, `styles.css`, `size-guide.css`, `data/` y `assets/`. No hace falta compilación ni base de datos.

Los enlaces `?producto=REFERENCIA` abren una ficha y conservan la subcarpeta del alojamiento. Las direcciones de una vista local solo funcionan en ese equipo; comparte la dirección del catálogo alojado.

## Modificar precios manualmente desde GitHub

1. En el repositorio, abre **data/prices.js** y pulsa editar.
2. Cambia únicamente los valores correspondientes, manteniendo las comillas, comas y llaves del archivo.
3. Confirma el cambio. La publicación depende de tu alojamiento conectado; no se escribe ni publica desde la página del catálogo.

Todos los importes se expresan en USD:

| Clave | Aplicación | Tarifa |
| --- | --- | ---: |
| `general.football_fan` | Fútbol Fan/Aficionado | 30 |
| `general.football_player` | Fútbol Jugador | 35 |
| `general.football_retro` | Fútbol Retro | 40 |
| `garments.long_sleeve_jersey` | Camiseta manga larga, incluidas variantes «long-sleeved» | 45 |
| `garments.jacket` | Windbreaker/Jacket normal | 60 |
| `garments.reversible_windbreaker` | Windbreaker reversible | 65 |
| `garments.cotton_hoodie` | Hoodie con algodón confirmado explícitamente | 55 |
| `garments.jacket_pants_set` | Conjunto de jacket y pantalón | 75 |
| `general.football_set` | Conjunto regular/entrenamiento exclusivamente de fútbol | 45 |
| `general.nba_jersey` | Camiseta NBA | 45 |
| `general.nba_shorts` | Short NBA, tarifa conservada | 35 |
| `general.nba_set` | Suéter + short NBA, tarifa conservada | 70 |
| `general.f1_base` | Prenda F1 sin tarifa específica superior por tipo | 45 |
| `general.nfl_base` | Prenda NFL sin tarifa específica superior por tipo | 50 |
| `patches.champions.price` | Parche Champions League opcional de fútbol, por unidad | 1.50 |
| `patches.league.price` | Parche de Liga opcional de fútbol, por unidad | 1.50 |

La prioridad es **excepción por referencia → tipo de prenda → deporte/versión → respaldo por categoría**. Así, una chaqueta de F1 usa 60 y un conjunto de jacket/pantalón usa 75. Un hoodie sin algodón confirmado queda «Consultar precio», incluso en F1. Las categorías no indicadas conservan su comportamiento anterior.

Para una excepción, añade dentro de `products` una clave con la referencia visible de la ficha y su precio. `null` mantiene esa referencia en consulta. No cambies una tarifa de `categories` si solo quieres afectar una referencia: ese respaldo puede alcanzar distintas secciones.

`productAttributes` permite registrar datos comprobados de una referencia sin modificar el catálogo compacto. Campos admitidos por la lógica: `material` (por ejemplo, algodón confirmado), `sport`, `garment` (una clave de `garments`), `personalizable` y `patches`. Contiene nueve conjuntos de chaqueta y pantalón comprobados en sus portadas: sus títulos genéricos «tracksuit» no bastan para distinguirlos de conjuntos de entrenamiento con cierre parcial, que mantienen la tarifa de 45. No se presupone el algodón: actualmente hay 171 fichas con hoodie —incluidos conjuntos— cuyo título no lo confirma. Consulta [PENDIENTES-EXTERNOS.md](PENDIENTES-EXTERNOS.md).

## Personalización y parches

En camisetas deportivas identificadas como aptas, la casilla **Personalizar nombre y dorsal (GRATIS)** aparece marcada. Nombre y dorsal son obligatorios mientras esté marcada. El nombre se normaliza a mayúsculas, conserva acentos y admite hasta 40 caracteres. El dorsal admite de uno a tres dígitos y conserva ceros iniciales. Al desmarcar, los campos dejan de ser obligatorios y no se envían.

Los dos parches son opcionales e independientes en camisetas de fútbol. Cada uno suma su precio por unidad. No se ofrecen en NBA, NFL, F1, chaquetas, pantalones o accesorios. La personalización no tiene costo.

El carrito distingue referencia, talla, nombre, dorsal y parches. Solo combina líneas con todas esas opciones iguales. Cambiar talla o cantidad y recargar conserva las opciones; los carritos anteriores sin opciones siguen siendo válidos. Los valores no válidos guardados localmente se rechazan antes de preparar un pedido.

WhatsApp incluye precio base, personalización o «Sin personalización», nombre/dorsal, cada parche, precio unitario, subtotal por línea, cantidades, tallas, referencias y enlaces. El subtotal general incluye los parches por cada unidad. No se envía ningún mensaje automáticamente.

El resumen y el mensaje conservan el texto de abono/envío y agregan el plazo **15–25 días desde recibir el abono, máximo estimado 25 días**. Ambos textos se definen una sola vez en `catalog-core.js`.

## Catálogo, tallas y mantenimiento

La fuente importada es [Europe jersey](https://nn88.x.yupoo.com/categories/), 159 páginas guardadas el 17 de octubre de 2026. Cuatro álbumes informativos se conservan en `tools/internal/supplier-reference-albums.json` y no se venden. Esta actualización no vuelve a importar productos ni altera `data/catalog.js` o las fotos.

Las guías de Hombre Fan, Hombre Jugador y Mujer mantienen las 19 filas originales, sus tolerancias y sus imágenes. Siguen pendientes las medidas específicas NBA, shorts, F1, infantil y Retro. Todas las tallas existentes siguen seleccionables.

La [guía de mantenimiento local](tools/internal/MANTENIMIENTO.md) describe `tools/update_catalog.py`, las cachés y las correcciones confirmadas. La rutina conserva `data/prices.js`; no hay tareas programadas ni interfaces públicas de administración.

Archivos compartidos del catálogo: `index.html`, `styles.css`, `store.js`, `catalog-core.js`, `size-guides.js`, `size-guide-ui.js`, `size-guide.css`, `data/` y `assets/`.

Pruebas: `node tools/verify.cjs`, `node tools/verify_update.cjs`, `node tools/verify_decisions.cjs` y `node tools/verify_orders.cjs`. La evidencia de navegador se detalla en `VALIDACION.md`.
