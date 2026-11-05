# Prendas manuales

Estas prendas son independientes de `data/catalog.js`, `assets/products/` y `catalog-update-ready/`. El CMD del proveedor no las procesa.

Cada prenda tiene una carpeta `manual-<referencia>/` con `product.json` y sus fotos. La ficha define nombre, equipo, deporte, categoría, público, versión, temporada y su estado, tallas exactas, descripción, precio en USD y ruta local de imagen. Usa `manualPrice: null` si el precio está pendiente. No uses referencias numéricas del proveedor para prendas manuales ni guardes datos privados aquí: esta carpeta es pública.

Para agregar una prenda, copia el formato de una ficha existente, cambia su ID y rutas, y añádelo a la lista `products` de `index.json`. También puedes regenerar la lista desde la raíz con `python tools/manual_catalog.py index`. GitHub Actions la reconstruye al preparar el sitio. Mantener el índice en el repositorio permite publicar también desde una rama.

Para retirar una prenda cuando el proveedor ya la tenga, **borra únicamente su carpeta `manual-<referencia>/` completa y publica la eliminación**. No borres toda esta carpeta ni `index.json`. Un ID antiguo en el índice se ignora si su ficha devuelve 404; la siguiente construcción limpia ese ID. No se unen referencias ni se trasladan pedidos automáticamente al nuevo producto del proveedor. Los productos retirados dejan de estar disponibles, también si estaban en un pedido guardado.

La foto, precio y tallas se validan antes de preparar Pages. Una ficha corrupta o un fallo de red muestra un aviso; no se presenta como una retirada voluntaria. Para previsualizar localmente utiliza un servidor HTTP, por ejemplo `python -m http.server 8000`; abrir index.html como archivo local no permite cargar JSON.

Las tablas generales de tallas son una referencia: confirma las medidas de un modelo manual si no tiene tabla específica. No inventes temporada ni código del proveedor. Las referencias que empiezan por `manual-` son códigos internos de Kalo.
