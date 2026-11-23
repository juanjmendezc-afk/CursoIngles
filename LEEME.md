# Nivel Inglés: web de evaluación adaptativa (v1)

Web estática (HTML, CSS y JavaScript). No necesita servidor ni base de datos y se puede publicar gratis en GitHub Pages.

## Probarla en tu computador
Haz doble clic en `index.html` y se abrirá en el navegador. Funciona sin internet, aunque la voz de la sección de escucha depende de las voces que tenga instaladas el navegador (Chrome y Edge funcionan bien).

## Qué archivo tocar para cada cambio

| Quiero cambiar…                                      | Archivo                |
|------------------------------------------------------|------------------------|
| Preguntas (añadir, corregir, quitar)                 | `datos/preguntas.js`   |
| Nombre del sitio, textos, niveles, nº de preguntas    | `datos/config.js`      |
| Colores, tipografía, tamaños                          | `css/estilos.css` (variables al inicio) |
| Pantallas y comportamiento                            | `js/app.js`            |
| Motor adaptativo (normalmente no hace falta)          | `js/cat.js`            |

### Añadir una pregunta
Copia una pregunta existente en `datos/preguntas.js`, cambia el `id` por uno nuevo y edita el resto. Cada campo está explicado al inicio del archivo. Ten en cuenta:
- `correcta` es la posición de la respuesta correcta dentro de `opciones`, empezando por 0. Las opciones se muestran mezcladas, así que puedes poner siempre la correcta primero (`correcta: 0`).
- Cada pregunta termina con `},`. Si la web queda en blanco después de editar, casi siempre falta una coma o una comilla.
- Conviene tener al menos 3 preguntas por nivel en cada habilidad. Cuantas más haya, menos se repiten entre intentos.

## Cómo funciona la evaluación
- **Adaptativa (CAT):** cada habilidad usa un modelo de Teoría de Respuesta al Ítem. Después de cada respuesta se recalcula tu nivel estimado y se elige la pregunta que más información da en ese punto. Cada sección termina entre 5 y 8 preguntas, o antes si la estimación ya es suficientemente precisa (se ajusta en `config.js`).
- **Dimensiones:** gramática, vocabulario, lectura y comprensión auditiva. El nivel global es el promedio de las cuatro.
- **Resultados:** nivel MCER (A1–C2) global y por habilidad, con margen de error, descriptor de lo que puedes hacer, temas a reforzar y temas que dominas, y revisión de cada respuesta.
- **Historial:** se guarda en el navegador de cada persona (localStorage). Nadie más lo ve y no se envía a ningún servidor.

**Importante:** la dificultad de cada pregunta viene de su nivel MCER asignado a criterio, no de una calibración con datos reales. El resultado es orientativo. Para hacerlo más preciso en el futuro habría que recoger respuestas reales y recalibrar las dificultades (campo `ajuste` o `dificultad` en cada pregunta).

## Publicar en GitHub Pages (gratis)
1. Crea una cuenta en https://github.com si no la tienes.
2. Crea un repositorio nuevo y público, por ejemplo `nivel-ingles`.
3. En el repositorio pulsa **Add file → Upload files** y arrastra **todo el contenido** de esta carpeta (`index.html`, `.nojekyll` y las carpetas `css`, `js`, `datos`). Pulsa **Commit changes**.
4. Ve a **Settings → Pages**. En *Branch* elige `main` y la carpeta `/ (root)`, y pulsa **Save**.
5. En uno o dos minutos la web estará en `https://TU-USUARIO.github.io/nivel-ingles/`.

Para actualizarla, edita el archivo directamente en GitHub (icono del lápiz) o vuelve a subirlo con **Upload files**. Los cambios se publican solos en un par de minutos.
