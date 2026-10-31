# Validación de Kalo Jerseys

## Actualización de filtros · 31 de octubre de 2026

Archivos de aplicación modificados: `index.html`, `store.js` y `styles.css`. Se reutiliza el mismo estado y la misma función de filtrado. No se modifican productos, portadas, precios, lógica de pedidos ni guías de tallas.

Pruebas ejecutadas en el navegador integrado, con vistas de 1280 px, 768 × 1024, 390 × 844 y 320 × 740:

- Panel cerrado inicialmente, altura cero; las etiquetas y «Limpiar todo» se ocultan cuando no hay filtros. Abrir/cerrar no borra selecciones; cuatro cambios consecutivos conservan los resultados.
- Fútbol + Camisetas + FC Barcelona + Adulto + Fan/Aficionado + 2024/25 + búsqueda «local»: cinco referencias. Coinciden exactamente con una consulta independiente de los datos. Al eliminar solo la temporada quedan 89; los demás controles y etiquetas mantienen sus valores.
- «Limpiar todo» devuelve los 17,366 productos de Fútbol y conserva esa categoría. «Limpiar» dentro del panel conserva NBA, sus 1,335 productos y el panel abierto.
- Categorías verificadas: Todo 18,984; Fútbol 17,366; NBA 1,335; NFL 40; F1 181; Otros deportes 62.
- Apodos «Barça» y «culés» encuentran FC Barcelona en el selector. Mis favoritos se combina con equipo, prenda, público, versión, temporada y búsqueda. Eliminar solo su etiqueta restablece los demás resultados. Se restauró el favorito de prueba a su estado inicial.
- Recargar una URL con siete filtros activos conserva los controles, las etiquetas y el resultado; el panel vuelve a estar cerrado.
- En móvil, las etiquetas ocupan varias líneas. Una búsqueda de 120 caracteres a 320 px no desborda el contenedor ni el documento. Los controles conservan el diseño y la distribución del panel; tableta y escritorio mantienen la columna lateral al abrirlo.
- Teclado: Enter y Espacio alternan el panel; Tab entra en los controles solo cuando está abierto; Escape lo cierra y devuelve el foco al encabezado. Los atributos ARIA se mantienen sincronizados. Se revisaron las reglas CSS de animación de 180 ms y la alternativa sin animación para movimiento reducido.
- `node --check store.js`, `node tools/verify_update.cjs`, `node tools/verify_decisions.cjs` y `node tools/verify_orders.cjs` completados correctamente. Comparación exacta con la entrega anterior: catálogo, precios, `catalog-core.js`, configuración y archivos de tallas sin cambios.

Las pruebas responsive se ejecutaron con tamaños de ventana simulados; no se probaron dispositivos físicos ni otros motores de navegador. No se publicó el sitio ni se enviaron pedidos.

## Validación de la entrega anterior · 30 de octubre de 2026

## Integridad del catálogo

- Se conservan 18,984 referencias vendibles, las portadas y las cuatro exclusiones informativas anteriores. `data/catalog.js` no cambia respecto al inicio de esta actualización.
- SHA-256 del catálogo: `73e9c3df96410bebd8ac61105d00570ce23f7f6cc4f292ad8f8e682356778ddd` (1,942,649 bytes).
- Se conservan diseño rojo/crema, tipografías, filtros, favoritos, búsqueda con alias, enlaces compartibles y guías de tallas.
- La administración de precios se limita a editar `data/prices.js`. Se retiraron la página, los scripts, los estilos y las herramientas exclusivas de la interfaz de administración.

## Pruebas automáticas

- `node tools/verify.cjs`: integridad de referencias y portadas, búsqueda con acentos, filtros combinados, favoritos, orden por precio y subtotales.
- `node tools/verify_update.cjs`: tarifas, dependencias locales, HTML/CSS, las 19 filas originales de las tres guías, tolerancias y tallas seleccionables.
- `node tools/verify_decisions.cjs`: exclusiones informativas, normalización de equipos, alias/sinónimos, precios no afectados, edición/fusión de tallas y enlaces estáticos con subcarpeta.
- `node tools/verify_orders.cjs`: reglas de precio sobre las 18,984 referencias; prioridad del tipo de prenda sobre F1/NFL; manga larga, chaquetas, reversibles, conjuntos y algodón explícito; excepciones manuales; elegibilidad y validación de personalización; parches exclusivamente de fútbol; 24 combinaciones de personalización/parches/cantidad; subtotales por unidad; separación de líneas; persistencia JSON; fusión al cambiar talla; mensaje de WhatsApp y condiciones de entrega.
- Se revisaron las 17 portadas con título genérico «tracksuit» sin mención de jacket: nueve muestran chaqueta con cierre completo y pantalón ($75); ocho son conjuntos de entrenamiento con cierre parcial ($45). Sus productos e imágenes no se modificaron.
- Los antiguos archivos públicos de administración no existen y sus rutas devuelven HTTP 404 en la vista local.

## Pruebas en navegador

Escritorio y móvil de 390 × 844 px:

- La personalización aparece marcada inicialmente en la camiseta de Noruega, con nombre y dorsal obligatorios. No permite agregar sin completar los campos ni con dorsal `1e2`.
- ANDRÉS/10 con ambos parches: base $35 + $3 por unidad = $38. Cantidad 2: $76.
- La misma referencia y talla con otro dorsal y solo Champions queda en otra línea; una tercera sin personalización tampoco se fusiona. Dos líneas de cantidad 2 más una de cantidad 1 suman $184. La recarga conserva nombres, dorsales, parches, tallas y cantidades.
- Al desmarcar personalización, los campos se ocultan y dejan de ser obligatorios.
- Una chaqueta F1 muestra $60 y no ofrece nombre/dorsal ni parches.
- En móvil, el formulario y el carrito no desbordan horizontalmente. Solo parche de Liga: $36.50 por unidad; cantidad 2 y talla XL: $73, conservando ANDRÉS/10.
- Se comprobó el texto generado del enlace de WhatsApp: referencia y enlace del producto, talla, cantidad, personalización o «Sin personalización», nombre, dorsal, parches elegidos, precio base, unitario, subtotal por línea y total. Conserva el texto original del abono y añade inmediatamente el plazo de 15–25 días desde recibirlo, máximo estimado 25 días.
- Sin errores de consola capturados. Los artículos de prueba se retiraron. No se envió ningún pedido ni se publicó el sitio.

## Datos externos pendientes

Los 171 hoodies cuyo material no indica algodón explícitamente permanecen por confirmar, según la decisión del usuario. La regla de $55 está preparada para algodón confirmado. Las medidas específicas NBA, shorts, F1, infantil y Retro siguen pendientes del proveedor; no se inventaron medidas ni se bloquearon tallas existentes. Otras familias sin tarifa solicitada conservan su estado anterior.
