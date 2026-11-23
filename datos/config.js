/* =========================================================================
   CONFIGURACIÓN GENERAL DEL SITIO
   Aquí cambias textos, niveles, habilidades y cómo se comporta el test,
   sin tocar el motor (js/cat.js) ni la interfaz (js/app.js).
   ========================================================================= */
window.CONFIG = {
  sitio: {
    nombre: "Nivel Inglés",
    lema: "Mide tu nivel de inglés cuando quieras. Gratis y adaptativo.",
    pie: "Resultado orientativo basado en el Marco Común Europeo (MCER). No es una certificación oficial."
  },

  /* Parámetros del test adaptativo (CAT) para CADA habilidad */
  cat: {
    minPreguntas: 5,        // nunca termina una habilidad antes de esto
    maxPreguntas: 8,        // nunca hace más de esto por habilidad
    errorObjetivo: 0.55,    // termina antes si la precisión ya es suficiente (error estándar)
    azar: 0.20,             // probabilidad de acertar adivinando (con 4 opciones ~0.25)
    aleatoriedad: 3,        // elige al azar entre las N mejores preguntas (evita repetir siempre las mismas)
    reproduccionesAudio: 2  // veces que se puede escuchar cada audio de "Escucha"
  },

  /* Habilidades evaluadas, en el orden en que aparecen.
     "id" debe coincidir con el campo "habilidad" de cada pregunta. */
  habilidades: [
    { id: "gramatica",    nombre: "Gramática",          icono: "✎", peso: 1, descripcion: "Estructuras y tiempos verbales." },
    { id: "vocabulario",  nombre: "Vocabulario",        icono: "◆", peso: 1, descripcion: "Palabras, expresiones y colocaciones." },
    { id: "lectura",      nombre: "Lectura",            icono: "▤", peso: 1, descripcion: "Comprensión de textos escritos." },
    { id: "escucha",      nombre: "Comprensión auditiva", icono: "♪", peso: 1, descripcion: "Comprensión de audio (necesitas sonido)." }
  ],

  /* Niveles MCER. "desde" es el punto de corte en la escala interna (logits).
     Las preguntas usan "nivel" y el motor convierte el nivel en dificultad. */
  niveles: [
    { id: "A1", nombre: "Principiante",      desde: -Infinity, dificultad: -2.9,
      puedes: "Entiendes y usas expresiones cotidianas muy básicas: presentarte, pedir cosas sencillas, hablar de ti con frases cortas." },
    { id: "A2", nombre: "Elemental",         desde: -2.0, dificultad: -1.9,
      puedes: "Te comunicas en tareas simples y rutinarias: compras, trabajo, familia, pasado reciente, con frases sencillas." },
    { id: "B1", nombre: "Intermedio",        desde: -1.0, dificultad: -0.9,
      puedes: "Te defiendes en viajes, entiendes las ideas principales de temas conocidos y puedes dar opiniones y planes breves." },
    { id: "B2", nombre: "Intermedio alto",   desde: 0.0,  dificultad: 0.1,
      puedes: "Entiendes textos complejos de temas concretos y abstractos e interactúas con hablantes nativos con fluidez razonable." },
    { id: "C1", nombre: "Avanzado",          desde: 1.0,  dificultad: 1.1,
      puedes: "Comprendes textos largos y exigentes, captas significados implícitos y usas el idioma con flexibilidad en lo social, académico y profesional." },
    { id: "C2", nombre: "Maestría",          desde: 2.0,  dificultad: 2.1,
      puedes: "Entiendes prácticamente todo lo que lees u oyes y te expresas con gran precisión, distinguiendo matices finos de significado." }
  ]
};
