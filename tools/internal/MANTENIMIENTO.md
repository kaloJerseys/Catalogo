# Curación y actualización manual del catálogo

Este directorio es referencia interna de mantenimiento. Sus registros no se muestran como productos ni se pueden agregar al carrito. No contiene políticas de Kalo ni condiciones nuevas para clientes.

## Qué se conserva y qué se excluye

Los cuatro álbumes informativos del proveedor se guardan completos en `supplier-reference-albums.json`: 211013826, 158427129, 158427121 y 158427120. El catálogo comercial conserva 18,984 de las 18,988 referencias de origen. No se borró ninguna foto.

Los equipos reconocidos se normalizan con los diccionarios existentes y las entradas hijas del menú de categorías guardado. Los nombres sin evidencia suficiente quedan como `Sin equipo`; su colección, código y título original se conservan y figuran en `curation-review.json`. No se convierte una marca, código o colección en un equipo supuesto. Las temporadas inválidas quedan `Sin temporada`; no se corrige silenciosamente 2006/27 a 2026/27. 1906–2006 es un centenario, no una temporada 1906/06.

`curation-changes.json` conserva los cambios de nombre/equipo/temporada; `curation-metrics.json` registra tamaños y cantidades. `curation-overrides.json` permite guardar futuras correcciones confirmadas por referencia. Acepta únicamente team, season, collection, code, teamStatus, seasonStatus y name; no modifica IDs, fotos ni precios. Ejemplo de estructura, sin añadir una corrección ficticia al archivo real:

```json
{"REFERENCIA_CONFIRMADA":{"team":"NOMBRE_CONFIRMADO","teamStatus":"confirmed"}}
```

El nombre visible se vuelve a construir con equipo/colección y temporada, de modo que el campo `name` se deriva de esos valores. Usa `team` y `season` para corregirlo.

## Formato de carga

`data/catalog.js` contiene filas compactas y tablas de valores repetidos. Reconstruye `window.KALO_CATALOG.products` con los objetos habituales, sin fetch ni dependencias. Funciona como archivos estáticos y mantiene los títulos originales para búsqueda y clasificación de prendas. Se agregan `collection`, `code`, `teamStatus` y `seasonStatus`. Los programas Python leen/escriben ambos formatos mediante `catalog_io.py`.

## Ejecutar solo con la copia local

Desde la carpeta del proyecto:

```powershell
python -X utf8 tools/update_catalog.py --from-cache
```

Esta orden no consulta internet ni descarga fotos. Repite la preparación y curación a partir de los archivos ya guardados. Con la misma fuente y correcciones, el resultado es idéntico.

## Actualizar desde Yupoo cuando se decida hacerlo

```powershell
python -X utf8 tools/update_catalog.py --refresh
```

Lee de nuevo todas las páginas públicas con dos conexiones como máximo y reintentos limitados. Si no puede confirmar el número de páginas, se detiene sin cambiar el catálogo; consulta ese total en Yupoo y repite añadiendo `--pages N`. Nunca se da por supuesto que seguirán siendo 159 páginas. Si falla una página se conserva el catálogo anterior.

Para incorporar también las portadas de productos nuevos, añade `--download-new-covers`. Esta opción requiere Pillow. Las portadas existentes se reutilizan por hash; no se borran fotos ni se vuelve a descargar una imagen existente. Sin esa opción, las nuevas referencias sin portada local usan la imagen de reemplazo existente.

Antes de reemplazar la fuente de una actualización completa, se guarda una copia anterior en `update-backups/`. `last-update-report.json` enumera referencias agregadas/retiradas y confirma que `data/prices.js` no cambió. Las correcciones puntuales de `refine_catalog.py` y `curation-overrides.json` se aplican de nuevo. El archivo de precios conserva todas sus tarifas, atributos confirmados, parches y excepciones individuales.

No hay actualizaciones programadas. La nueva versión debe revisarse localmente y publicarse manualmente como el resto del catálogo.

## Información pendiente del proveedor

- Precios no informados: consultar al proveedor y asignarlos manualmente en `data/prices.js` cuando se confirmen. No se inventan importes ni materiales; los hoodies sin algodón confirmado siguen por consultar.
- Medidas de NBA, shorts, F1, infantil y Retro: pendientes de información externa. No se crean tablas supuestas; las tallas siguen seleccionables.
- Los títulos de fútbol etiquetados F1 por el alias Red Bull quedan señalados en la revisión de los datos originales. La clasificación de precios actual distingue esos títulos de fútbol para que no reciban una base F1 incorrecta. El catálogo compacto permanece sin cambios.

Las carpetas de caché, respaldos y registros internos no son necesarias para que el catálogo público funcione. No enlazar estos archivos desde las tarjetas de producto.
