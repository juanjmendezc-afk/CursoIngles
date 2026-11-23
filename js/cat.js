/* =========================================================================
   MOTOR DE EVALUACIÓN ADAPTATIVA (CAT)
   Modelo de Teoría de Respuesta al Ítem (TRI) de 3 parámetros simplificado:
     P(acierto | θ) = c + (1 - c) / (1 + e^(-a(θ - b)))
     θ = habilidad de la persona, b = dificultad, a = discriminación, c = azar.
   La habilidad se estima con EAP (media a posteriori) sobre una rejilla, y la
   siguiente pregunta es la que más información aporta en la θ actual.
   No necesitas editar este archivo para cambiar preguntas o textos.
   ========================================================================= */
(function () {
  "use strict";

  var REJILLA = [];
  for (var x = -4; x <= 4.0001; x += 0.05) REJILLA.push(Math.round(x * 100) / 100);

  function normal(x, media, de) {
    var z = (x - media) / de;
    return Math.exp(-0.5 * z * z);
  }

  function probabilidad(theta, item, c) {
    var a = item.a, b = item.b;
    return c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
  }

  function informacion(theta, item, c) {
    var p = probabilidad(theta, item, c);
    var a = item.a;
    return (a * a) * Math.pow(p - c, 2) / Math.pow(1 - c, 2) * (1 - p) / p;
  }

  /* Convierte el nivel MCER de la pregunta en dificultad numérica (b). */
  function prepararItem(pregunta, niveles) {
    var nivel = niveles.find(function (n) { return n.id === pregunta.nivel; });
    var b = typeof pregunta.dificultad === "number" ? pregunta.dificultad
          : (nivel ? nivel.dificultad : 0) + (pregunta.ajuste || 0);
    return { pregunta: pregunta, a: pregunta.discriminacion || 1.2, b: b };
  }

  function nivelDeTheta(theta, niveles) {
    var elegido = niveles[0];
    niveles.forEach(function (n) { if (theta >= n.desde) elegido = n; });
    return elegido;
  }

  /* Crea una sesión CAT para UNA habilidad. */
  function crearSesion(preguntas, opciones) {
    var cfg = opciones.cat;
    var niveles = opciones.niveles;
    var items = preguntas.map(function (p) { return prepararItem(p, niveles); });
    var mediaPrior = typeof opciones.inicio === "number" ? opciones.inicio : 0;
    var dePrior = 2.0;
    var respondidas = [];   // { item, correcta }
    var usadas = {};
    var estado = estimar();

    function estimar() {
      var post = REJILLA.map(function (t) {
        var v = normal(t, mediaPrior, dePrior);
        respondidas.forEach(function (r) {
          var p = probabilidad(t, r.item, cfg.azar);
          v *= r.correcta ? p : (1 - p);
        });
        return v;
      });
      var suma = post.reduce(function (s, v) { return s + v; }, 0) || 1e-300;
      var media = 0;
      REJILLA.forEach(function (t, i) { media += t * post[i] / suma; });
      var varianza = 0;
      REJILLA.forEach(function (t, i) { varianza += Math.pow(t - media, 2) * post[i] / suma; });
      return { theta: media, error: Math.sqrt(varianza) };
    }

    function terminado() {
      var n = respondidas.length;
      if (n >= cfg.maxPreguntas) return true;
      if (n >= cfg.minPreguntas && estado.error <= cfg.errorObjetivo) return true;
      return items.every(function (it) { return usadas[it.pregunta.id]; });
    }

    function siguiente() {
      if (terminado()) return null;
      var candidatos = items
        .filter(function (it) { return !usadas[it.pregunta.id]; })
        .map(function (it) { return { it: it, info: informacion(estado.theta, it, cfg.azar) }; })
        .sort(function (x, y) { return y.info - x.info; });
      var top = candidatos.slice(0, Math.max(1, cfg.aleatoriedad));
      var elegido = top[Math.floor(Math.random() * top.length)].it;
      usadas[elegido.pregunta.id] = true;
      return elegido.pregunta;
    }

    function responder(idPregunta, correcta) {
      var item = items.find(function (it) { return it.pregunta.id === idPregunta; });
      if (!item) return;
      respondidas.push({ item: item, correcta: !!correcta });
      estado = estimar();
    }

    function resultado() {
      return {
        theta: estado.theta,
        error: estado.error,
        nivel: nivelDeTheta(estado.theta, niveles),
        respuestas: respondidas.map(function (r) {
          return { pregunta: r.item.pregunta, correcta: r.correcta };
        })
      };
    }

    return {
      siguiente: siguiente,
      responder: responder,
      resultado: resultado,
      progreso: function () { return { respondidas: respondidas.length, max: cfg.maxPreguntas }; }
    };
  }

  window.CAT = { crearSesion: crearSesion, nivelDeTheta: nivelDeTheta };
})();
