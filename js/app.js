/* =========================================================================
   APLICACIÓN (pantallas e interacción)
   Usa: window.CONFIG (datos/config.js), window.BANCO_PREGUNTAS
   (datos/preguntas.js) y window.CAT (js/cat.js).
   ========================================================================= */
(function () {
  "use strict";

  var CONFIG = window.CONFIG;
  var BANCO = window.BANCO_PREGUNTAS || [];
  var CLAVE_HISTORIAL = "nivelIngles.historial.v1";
  var VELOCIDAD_AUDIO = { A1: 0.8, A2: 0.85, B1: 0.92, B2: 0.98, C1: 1.02, C2: 1.06 };
  var app = document.getElementById("app");

  var estado = { pantalla: "inicio" };

  /* ----------------------------- Utilidades ----------------------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function mezclar(lista) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function nivelPorId(id) { return CONFIG.niveles.find(function (n) { return n.id === id; }); }
  function indiceNivel(id) { return CONFIG.niveles.findIndex(function (n) { return n.id === id; }); }
  function posicion(theta) { return Math.max(0, Math.min(100, (theta + 3) / 6 * 100)); }
  function colorNivel(id) { return "var(--" + id + ")"; }
  function mostrar(html) {
    app.innerHTML = html;
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  function leerHistorial() {
    try { return JSON.parse(localStorage.getItem(CLAVE_HISTORIAL)) || []; } catch (e) { return []; }
  }
  function guardarHistorial(lista) {
    try { localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(lista)); return true; } catch (e) { return false; }
  }
  function fecha(ms) {
    return new Date(ms).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
  }
  function hayVoz() { return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window; }

  /* ------------------------------ Voz (TTS) ------------------------------ */
  function vozIngles() {
    var voces = window.speechSynthesis.getVoices() || [];
    var pref = ["en-GB", "en-US", "en-AU", "en-CA", "en-IE"];
    for (var i = 0; i < pref.length; i++) {
      var v = voces.find(function (x) { return x.lang && x.lang.replace("_", "-").indexOf(pref[i]) === 0; });
      if (v) return v;
    }
    return voces.find(function (x) { return x.lang && x.lang.indexOf("en") === 0; }) || null;
  }
  function hablar(texto, nivel, alTerminar) {
    if (!hayVoz()) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(texto);
    var v = vozIngles();
    if (v) u.voice = v;
    u.lang = v ? v.lang : "en-GB";
    u.rate = VELOCIDAD_AUDIO[nivel] || 1;
    if (alTerminar) { u.onend = alTerminar; u.onerror = alTerminar; }
    window.speechSynthesis.speak(u);
  }
  if (hayVoz()) { window.speechSynthesis.getVoices(); }

  /* ------------------------------- Inicio ------------------------------- */
  function pantallaInicio() {
    estado = { pantalla: "inicio" };
    if (hayVoz()) window.speechSynthesis.cancel();
    var hist = leerHistorial();
    var ultimo = hist[hist.length - 1];
    var cfg = CONFIG.cat;
    var minTot = cfg.minPreguntas * CONFIG.habilidades.length;
    var maxTot = cfg.maxPreguntas * CONFIG.habilidades.length;

    var habs = CONFIG.habilidades.map(function (h) {
      return '<div class="habilidad"><span class="icono" aria-hidden="true">' + esc(h.icono) + '</span>' +
        '<strong>' + esc(h.nombre) + '</strong><span class="suave pequeno">' + esc(h.descripcion) + '</span></div>';
    }).join("");

    var opcionesNivel = '<option value="">No lo sé</option>' + CONFIG.niveles.map(function (n) {
      return '<option value="' + n.id + '">' + n.id + " · " + esc(n.nombre) + "</option>";
    }).join("");

    mostrar(
      '<section class="hero">' +
        '<h1>¿Cuál es tu nivel de inglés hoy?</h1>' +
        '<p class="lema">' + esc(CONFIG.sitio.lema) + '</p>' +
      '</section>' +
      (ultimo ? '<div class="tarjeta"><strong>Tu último resultado:</strong> ' + esc(ultimo.global.nivel) +
        ' <span class="suave">(' + fecha(ultimo.fecha) + ')</span>. Repite la prueba cada pocas semanas para ver tu progreso.</div>' : '') +
      '<div class="rejilla">' + habs + '</div>' +
      '<div class="tarjeta">' +
        '<h2>Cómo funciona</h2>' +
        '<ol class="pasos">' +
          '<li>La prueba se adapta a ti: si aciertas, la siguiente pregunta es más difícil; si fallas, más fácil.</li>' +
          '<li>Son entre ' + minTot + ' y ' + maxTot + ' preguntas en total (unos 15–20 minutos).</li>' +
          '<li>Al final verás tu nivel MCER (A1–C2) en cada habilidad y qué temas reforzar.</li>' +
          '<li>Para la sección de escucha necesitas sonido o audífonos.</li>' +
        '</ol>' +
        '<label class="campo" for="nombre">Tu nombre (opcional)</label>' +
        '<input type="text" id="nombre" maxlength="40" autocomplete="given-name" placeholder="Para distinguir resultados si varias personas usan este equipo" value="' + esc(ultimo && ultimo.nombre || "") + '">' +
        '<label class="campo" for="autonivel">¿Qué nivel crees que tienes?</label>' +
        '<select id="autonivel">' + opcionesNivel + '</select>' +
        '<p class="suave pequeno" style="margin-top:6px">Solo sirve para elegir la primera pregunta. No afecta al resultado final.</p>' +
        '<div class="acciones"><button class="boton" id="empezar">Empezar la prueba</button></div>' +
      '</div>'
    );
    document.getElementById("empezar").onclick = empezar;
  }

  function empezar() {
    var auto = document.getElementById("autonivel").value;
    var nombre = document.getElementById("nombre").value.trim();
    var n = nivelPorId(auto);
    estado = {
      pantalla: "intro",
      nombre: nombre,
      inicioMs: Date.now(),
      thetaInicial: n ? n.dificultad : -0.5,
      indiceHab: 0,
      resultados: {},
      omitidas: []
    };
    introHabilidad();
  }

  /* ------------------------- Intro de cada sección ------------------------- */
  function barraSecciones() {
    return '<div class="secciones" aria-hidden="true">' + CONFIG.habilidades.map(function (h, i) {
      var ancho = i < estado.indiceHab ? 100 : 0;
      if (i === estado.indiceHab && estado.sesion) {
        var p = estado.sesion.progreso();
        ancho = Math.min(100, p.respondidas / p.max * 100);
      }
      return '<span><i style="width:' + ancho + '%"></i></span>';
    }).join("") + '</div>';
  }

  function introHabilidad() {
    estado.pantalla = "intro";
    estado.sesion = null;
    var h = CONFIG.habilidades[estado.indiceHab];
    var esEscucha = h.id === "escucha";
    var sinVoz = esEscucha && !hayVoz();
    mostrar(
      barraSecciones() +
      '<div class="tarjeta">' +
        '<span class="chip">Sección ' + (estado.indiceHab + 1) + ' de ' + CONFIG.habilidades.length + '</span>' +
        '<h1 style="margin-top:12px">' + esc(h.icono) + ' ' + esc(h.nombre) + '</h1>' +
        '<p class="suave">' + esc(h.descripcion) + ' Entre ' + CONFIG.cat.minPreguntas + ' y ' + CONFIG.cat.maxPreguntas + ' preguntas.</p>' +
        (esEscucha && !sinVoz ? '<p>Escucharás frases en inglés. Puedes reproducir cada audio hasta ' + CONFIG.cat.reproduccionesAudio + ' veces. Sube el volumen y prueba el sonido:</p>' +
          '<button class="boton secundario" id="probar">▶ Probar sonido</button>' : '') +
        (sinVoz ? '<div class="aviso">Tu navegador no puede reproducir audio de voz. Prueba con Chrome, Edge o Safari actualizados, o salta esta sección.</div>' : '') +
        '<div class="acciones">' +
          (sinVoz ? '' : '<button class="boton" id="comenzar">Comenzar sección</button>') +
          (esEscucha ? '<button class="boton texto" id="omitir">Omitir esta sección</button>' : '') +
        '</div>' +
      '</div>'
    );
    var b = document.getElementById("comenzar");
    if (b) b.onclick = iniciarHabilidad;
    var p = document.getElementById("probar");
    if (p) p.onclick = function () { hablar("Hello! If you can hear this clearly, you're ready to start.", "B1"); };
    var o = document.getElementById("omitir");
    if (o) o.onclick = function () { estado.omitidas.push(h.id); siguienteSeccion(); };
  }

  function thetaInicioSeccion() {
    var vals = Object.keys(estado.resultados).map(function (k) { return estado.resultados[k].theta; });
    if (!vals.length) return estado.thetaInicial;
    return vals.reduce(function (s, v) { return s + v; }, 0) / vals.length;
  }

  function iniciarHabilidad() {
    var h = CONFIG.habilidades[estado.indiceHab];
    var preguntas = BANCO.filter(function (p) { return p.habilidad === h.id; });
    estado.sesion = window.CAT.crearSesion(preguntas, {
      cat: CONFIG.cat, niveles: CONFIG.niveles, inicio: thetaInicioSeccion()
    });
    siguientePregunta();
  }

  function siguienteSeccion() {
    estado.indiceHab++;
    if (estado.indiceHab < CONFIG.habilidades.length) introHabilidad();
    else pantallaResultados();
  }

  /* ------------------------------- Pregunta ------------------------------- */
  function siguientePregunta() {
    var q = estado.sesion.siguiente();
    if (!q) {
      var h = CONFIG.habilidades[estado.indiceHab];
      estado.resultados[h.id] = estado.sesion.resultado();
      siguienteSeccion();
      return;
    }
    mostrarPregunta(q);
  }

  function mostrarPregunta(q) {
    estado.pantalla = "pregunta";
    estado.pregunta = q;
    estado.seleccion = null;
    estado.reproducciones = 0;
    estado.orden = mezclar(q.opciones.map(function (_, i) { return i; }));
    var h = CONFIG.habilidades[estado.indiceHab];
    var p = estado.sesion.progreso();
    var letras = ["A", "B", "C", "D", "E", "F"];

    var opciones = estado.orden.map(function (orig, i) {
      return '<button class="opcion" role="radio" aria-checked="false" data-i="' + i + '">' +
        '<span class="tecla">' + letras[i] + '</span><span>' + esc(q.opciones[orig]) + '</span></button>';
    }).join("");

    mostrar(
      barraSecciones() +
      '<div class="cabecera-test">' +
        '<span class="chip">' + esc(h.icono) + ' ' + esc(h.nombre) + '</span>' +
        '<span class="suave pequeno">Pregunta ' + (p.respondidas + 1) + ' · máx. ' + p.max + '</span>' +
      '</div>' +
      '<div class="tarjeta">' +
        (q.audio ? '<div class="audio"><button class="boton secundario" id="escuchar">▶ Escuchar</button>' +
          '<span class="suave pequeno" id="quedan">Puedes escucharlo ' + CONFIG.cat.reproduccionesAudio + ' veces</span></div>' : '') +
        (q.texto ? '<div class="pasaje" lang="en">' + esc(q.texto) + '</div>' : '') +
        '<div class="enunciado" lang="en">' + esc(q.enunciado) + '</div>' +
        '<div class="opciones" role="radiogroup" aria-label="Opciones" lang="en">' + opciones + '</div>' +
        '<div class="acciones">' +
          '<button class="boton" id="confirmar" disabled>Confirmar</button>' +
          '<button class="boton texto" id="nose">No lo sé</button>' +
          '<button class="boton texto" id="salir" style="margin-left:auto">Salir</button>' +
        '</div>' +
        '<p class="suave pequeno" style="margin:8px 0 0">Atajos: teclas A–D o 1–4 para elegir, Enter para confirmar.</p>' +
      '</div>'
    );

    Array.prototype.forEach.call(app.querySelectorAll(".opcion"), function (b) {
      b.onclick = function () { seleccionar(Number(b.getAttribute("data-i"))); };
      b.ondblclick = function () { seleccionar(Number(b.getAttribute("data-i"))); confirmar(); };
    });
    document.getElementById("confirmar").onclick = confirmar;
    document.getElementById("nose").onclick = function () { responder(false); };
    document.getElementById("salir").onclick = function () {
      if (window.confirm("¿Salir de la prueba? Se perderá el progreso de este intento.")) pantallaInicio();
    };
    var e = document.getElementById("escuchar");
    if (e) {
      e.onclick = function () {
        if (estado.reproducciones >= CONFIG.cat.reproduccionesAudio) return;
        estado.reproducciones++;
        var quedan = CONFIG.cat.reproduccionesAudio - estado.reproducciones;
        e.disabled = true;
        e.textContent = "🔊 Reproduciendo…";
        hablar(q.audio, q.nivel, function () {
          if (estado.pregunta !== q) return;
          e.disabled = quedan <= 0;
          e.textContent = quedan > 0 ? "▶ Escuchar otra vez" : "Sin reproducciones";
        });
        document.getElementById("quedan").textContent = quedan > 0
          ? "Te queda " + quedan + (quedan === 1 ? " reproducción" : " reproducciones")
          : "Ya no quedan reproducciones";
      };
    }
  }

  function seleccionar(i) {
    if (estado.pantalla !== "pregunta" || i < 0 || i >= estado.orden.length) return;
    estado.seleccion = i;
    Array.prototype.forEach.call(app.querySelectorAll(".opcion"), function (b) {
      b.setAttribute("aria-checked", Number(b.getAttribute("data-i")) === i ? "true" : "false");
    });
    document.getElementById("confirmar").disabled = false;
  }

  function confirmar() {
    if (estado.pantalla !== "pregunta" || estado.seleccion == null) return;
    responder(estado.orden[estado.seleccion] === estado.pregunta.correcta);
  }

  function responder(correcta) {
    if (hayVoz()) window.speechSynthesis.cancel();
    estado.pantalla = "procesando";
    estado.sesion.responder(estado.pregunta.id, correcta);
    siguientePregunta();
  }

  document.addEventListener("keydown", function (ev) {
    if (estado.pantalla !== "pregunta" || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.target && /INPUT|SELECT|TEXTAREA/.test(ev.target.tagName)) return;
    var k = ev.key.toUpperCase();
    var idx = "ABCDEF".indexOf(k);
    if (idx < 0 && /^[1-6]$/.test(k)) idx = Number(k) - 1;
    if (idx >= 0 && k.length === 1) { ev.preventDefault(); seleccionar(idx); }
    else if (ev.key === "Enter" && estado.seleccion != null) { ev.preventDefault(); confirmar(); }
  });

  /* ------------------------------ Resultados ------------------------------ */
  function precision(error) {
    if (error <= 0.5) return "alta";
    if (error <= 0.75) return "media";
    return "orientativa";
  }

  function calcularGlobal(resultados) {
    var sumaP = 0, sumaT = 0, sumaE = 0;
    CONFIG.habilidades.forEach(function (h) {
      var r = resultados[h.id];
      if (!r) return;
      sumaP += h.peso; sumaT += h.peso * r.theta; sumaE += Math.pow(h.peso * r.error, 2);
    });
    if (!sumaP) return null;
    var theta = sumaT / sumaP;
    return { theta: theta, error: Math.sqrt(sumaE) / sumaP, nivel: window.CAT.nivelDeTheta(theta, CONFIG.niveles) };
  }

  function pista(theta, error) {
    var celdas = CONFIG.niveles.map(function (n) { return "<div>" + n.id + "</div>"; }).join("");
    var izq = posicion(theta - error), der = posicion(theta + error);
    return '<div class="pista">' + celdas +
      '<span class="banda" style="left:' + izq + '%;width:' + (der - izq) + '%"></span>' +
      '<span class="marca-pos" style="left:' + posicion(theta) + '%"></span></div>';
  }

  function diagnostico(resultados, global) {
    var nivelIdx = indiceNivel(global.nivel.id);
    var refuerzo = {}, siguiente = {}, dominados = {};
    Object.keys(resultados).forEach(function (hid) {
      resultados[hid].respuestas.forEach(function (r) {
        var idx = indiceNivel(r.pregunta.nivel);
        var clave = r.pregunta.tema + "|" + r.pregunta.nivel;
        if (r.correcta) { if (idx >= nivelIdx - 1) dominados[clave] = true; }
        else if (idx <= nivelIdx) refuerzo[clave] = true;
        else if (idx === nivelIdx + 1) siguiente[clave] = true;
      });
    });
    function lista(obj) {
      return Object.keys(obj).map(function (k) {
        var p = k.split("|"); return { tema: p[0], nivel: p[1] };
      }).sort(function (a, b) { return indiceNivel(a.nivel) - indiceNivel(b.nivel); });
    }
    var aReforzar = lista(refuerzo);
    var temasFallados = aReforzar.map(function (t) { return t.tema; });
    var dom = lista(dominados).filter(function (t) { return temasFallados.indexOf(t.tema) < 0; })
      .reverse().slice(0, 8).reverse();
    return { refuerzo: aReforzar, siguiente: lista(siguiente), dominados: dom };
  }

  function pantallaResultados() {
    estado.pantalla = "resultados";
    var res = estado.resultados;
    var global = calcularGlobal(res);
    if (!global) { pantallaInicio(); return; }
    var nivel = global.nivel;
    var idx = indiceNivel(nivel.id);
    var proximo = CONFIG.niveles[idx + 1];
    var diag = diagnostico(res, global);
    var minutos = Math.max(1, Math.round((Date.now() - estado.inicioMs) / 60000));

    // Guardar en historial
    var registro = {
      fecha: Date.now(), nombre: estado.nombre || "", minutos: minutos,
      global: { theta: +global.theta.toFixed(2), nivel: nivel.id },
      habilidades: {}
    };
    Object.keys(res).forEach(function (k) {
      registro.habilidades[k] = { theta: +res[k].theta.toFixed(2), nivel: res[k].nivel.id };
    });
    var hist = leerHistorial(); hist.push(registro);
    var guardado = guardarHistorial(hist.slice(-100));

    var ordenadas = CONFIG.habilidades.filter(function (h) { return res[h.id]; })
      .sort(function (a, b) { return res[b.id].theta - res[a.id].theta; });
    var fuerte = ordenadas[0], debil = ordenadas[ordenadas.length - 1];

    var filas = CONFIG.habilidades.map(function (h) {
      var r = res[h.id];
      if (!r) return '<div class="fila-hab"><div class="top"><span>' + esc(h.nombre) + '</span><span class="suave">No evaluada</span></div></div>';
      return '<div class="fila-hab"><div class="top"><span>' + esc(h.icono) + ' ' + esc(h.nombre) + '</span>' +
        '<span>' + r.nivel.id + ' <span class="suave pequeno">· precisión ' + precision(r.error) + '</span></span></div>' +
        pista(r.theta, r.error) + '</div>';
    }).join("");

    function items(lista) {
      return lista.map(function (t) { return "<li>" + esc(t.tema) + ' <span class="suave pequeno">(' + t.nivel + ")</span></li>"; }).join("");
    }

    var revision = [];
    CONFIG.habilidades.forEach(function (h) {
      if (!res[h.id]) return;
      res[h.id].respuestas.forEach(function (r) {
        var q = r.pregunta;
        revision.push('<li><span class="' + (r.correcta ? "ok" : "ko") + '">' + (r.correcta ? "✓" : "✗") + '</span> ' +
          '<span class="suave pequeno">' + esc(h.nombre) + " · " + q.nivel + '</span><br>' +
          '<span lang="en">' + esc(q.enunciado) + '</span><br>' +
          '<span class="pequeno">Respuesta correcta: <strong lang="en">' + esc(q.opciones[q.correcta]) + '</strong>' +
          (q.explicacion ? " — " + esc(q.explicacion) : "") + '</span></li>');
      });
    });

    mostrar(
      '<div class="tarjeta">' +
        '<p class="suave" style="margin-bottom:12px">' + (estado.nombre ? esc(estado.nombre) + ", tu" : "Tu") + ' resultado · ' + fecha(Date.now()) + ' · ' + minutos + ' min</p>' +
        '<div class="nivel-grande">' +
          '<div class="insignia" style="background:' + colorNivel(nivel.id) + '">' + nivel.id + '</div>' +
          '<div><h1 style="margin:0">' + esc(nivel.nombre) + '</h1>' +
          '<p class="suave" style="margin:4px 0 0">Nivel global MCER · precisión ' + precision(global.error) + '</p></div>' +
        '</div>' +
        '<div class="escala" style="margin-top:20px">' + pista(global.theta, global.error) + '</div>' +
        '<p style="margin-top:16px"><strong>Lo que puedes hacer:</strong> ' + esc(nivel.puedes) + '</p>' +
      '</div>' +

      '<div class="tarjeta"><h2>Por habilidad</h2>' +
        '<p class="suave pequeno">La marca es tu estimación; la franja sombreada, el margen de error.</p>' + filas +
        (ordenadas.length > 1 && fuerte.id !== debil.id && res[fuerte.id].nivel.id !== res[debil.id].nivel.id
          ? '<p>Tu punto más fuerte es <strong>' + esc(fuerte.nombre) + '</strong> y el que más conviene reforzar es <strong>' + esc(debil.nombre) + '</strong>.</p>' : '') +
        (estado.omitidas.length ? '<p class="suave pequeno">Secciones omitidas: no cuentan en el nivel global.</p>' : '') +
      '</div>' +

      '<div class="tarjeta"><h2>Diagnóstico</h2><div class="dos-col">' +
        '<div class="caja mal"><strong>Temas a reforzar</strong>' +
          (diag.refuerzo.length ? '<ul class="lista-diag">' + items(diag.refuerzo) + '</ul>' : '<p class="pequeno" style="margin:6px 0 0">No fallaste temas de tu nivel o inferiores. ¡Bien!</p>') +
        '</div>' +
        '<div class="caja bien"><strong>Temas que dominas</strong>' +
          (diag.dominados.length ? '<ul class="lista-diag">' + items(diag.dominados) + '</ul>' : '<p class="pequeno" style="margin:6px 0 0">Aún no hay suficientes aciertos de tu nivel.</p>') +
        '</div>' +
      '</div>' +
      (proximo ? '<p style="margin-top:16px"><strong>Para llegar a ' + proximo.id + ':</strong> ' +
        (diag.siguiente.length ? 'empieza por ' + diag.siguiente.map(function (t) { return esc(t.tema); }).join(", ") + '.' : 'practica textos y audios de nivel ' + proximo.id + '.') + '</p>' : '') +
      '</div>' +

      '<div class="tarjeta"><details><summary>Revisar mis respuestas (' + revision.length + ')</summary><ul class="revision">' + revision.join("") + '</ul></details></div>' +

      '<div class="acciones">' +
        '<button class="boton" id="repetir">Hacer otra prueba</button>' +
        '<button class="boton secundario" id="ver-hist">Ver mi progreso</button>' +
        '<button class="boton texto" id="imprimir">Imprimir / guardar PDF</button>' +
      '</div>' +
      (guardado ? '' : '<p class="suave pequeno">No se pudo guardar en el historial de este navegador (modo privado o almacenamiento bloqueado).</p>')
    );
    document.getElementById("repetir").onclick = pantallaInicio;
    document.getElementById("ver-hist").onclick = pantallaHistorial;
    document.getElementById("imprimir").onclick = function () { window.print(); };
  }

  /* ------------------------------ Historial ------------------------------ */
  function grafica(hist) {
    var W = 640, H = 220, mI = 34, mD = 12, mS = 12, mInf = 26;
    var ancho = W - mI - mD, alto = H - mS - mInf;
    function y(theta) { return mS + (1 - posicion(theta) / 100) * alto; }
    function x(i) { return mI + (hist.length === 1 ? ancho / 2 : i / (hist.length - 1) * ancho); }
    var lineas = CONFIG.niveles.map(function (n, i) {
      var centro = -2.5 + i;
      return '<line x1="' + mI + '" x2="' + (W - mD) + '" y1="' + y(centro - 0.5) + '" y2="' + y(centro - 0.5) + '" stroke="var(--borde)"/>' +
        '<text x="4" y="' + (y(centro) + 4) + '">' + n.id + '</text>';
    }).join("");
    var puntos = hist.map(function (r, i) { return x(i) + "," + y(r.global.theta); }).join(" ");
    var circulos = hist.map(function (r, i) {
      return '<circle cx="' + x(i) + '" cy="' + y(r.global.theta) + '" r="4.5" fill="var(--primario)"><title>' +
        esc(fecha(r.fecha)) + ": " + r.global.nivel + '</title></circle>';
    }).join("");
    var fechas = hist.length > 1
      ? '<text x="' + mI + '" y="' + (H - 6) + '">' + esc(fecha(hist[0].fecha)) + '</text>' +
        '<text x="' + (W - mD) + '" y="' + (H - 6) + '" text-anchor="end">' + esc(fecha(hist[hist.length - 1].fecha)) + '</text>'
      : "";
    return '<svg class="grafica" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Evolución del nivel global">' +
      lineas + '<polyline points="' + puntos + '" fill="none" stroke="var(--primario)" stroke-width="2.5"/>' + circulos + fechas + '</svg>';
  }

  function pantallaHistorial() {
    estado = { pantalla: "historial" };
    var todo = leerHistorial();
    var nombres = [];
    todo.forEach(function (r) { if (nombres.indexOf(r.nombre) < 0) nombres.push(r.nombre); });
    var filtro = pantallaHistorial.filtro;
    if (filtro == null || nombres.indexOf(filtro) < 0) filtro = todo.length ? todo[todo.length - 1].nombre : "";
    var hist = todo.filter(function (r) { return r.nombre === filtro; });

    if (!todo.length) {
      mostrar('<div class="tarjeta"><h1>Mi historial</h1><p class="suave">Aún no hay resultados guardados en este navegador. Haz tu primera prueba para empezar a medir tu progreso.</p>' +
        '<div class="acciones"><button class="boton" id="ir">Empezar la prueba</button></div></div>');
      document.getElementById("ir").onclick = pantallaInicio;
      return;
    }

    var cab = CONFIG.habilidades.map(function (h) { return "<th>" + esc(h.nombre) + "</th>"; }).join("");
    var filas = hist.slice().reverse().map(function (r) {
      return "<tr><td>" + esc(fecha(r.fecha)) + "</td><td><strong>" + r.global.nivel + "</strong></td>" +
        CONFIG.habilidades.map(function (h) { return "<td>" + (r.habilidades[h.id] ? r.habilidades[h.id].nivel : "—") + "</td>"; }).join("") + "</tr>";
    }).join("");
    var selector = nombres.length > 1
      ? '<label class="campo" for="persona">Persona</label><select id="persona">' + nombres.map(function (n) {
          return '<option value="' + esc(n) + '"' + (n === filtro ? " selected" : "") + ">" + esc(n || "(sin nombre)") + "</option>";
        }).join("") + "</select>"
      : "";

    mostrar(
      '<div class="tarjeta"><h1>Mi historial</h1>' +
        '<p class="suave">Los resultados se guardan solo en este navegador y dispositivo.</p>' + selector +
        '<div style="margin-top:16px">' + grafica(hist) + '</div>' +
      '</div>' +
      '<div class="tarjeta tabla-scroll"><table><thead><tr><th>Fecha</th><th>Global</th>' + cab + '</tr></thead><tbody>' + filas + '</tbody></table></div>' +
      '<div class="acciones"><button class="boton" id="ir">Hacer una prueba</button>' +
        '<button class="boton texto" id="borrar">Borrar historial de este navegador</button></div>'
    );
    document.getElementById("ir").onclick = pantallaInicio;
    var sel = document.getElementById("persona");
    if (sel) sel.onchange = function () { pantallaHistorial.filtro = sel.value; pantallaHistorial(); };
    document.getElementById("borrar").onclick = function () {
      if (window.confirm("¿Borrar todos los resultados guardados en este navegador?")) {
        try { localStorage.removeItem(CLAVE_HISTORIAL); } catch (e) {}
        pantallaHistorial();
      }
    };
  }

  /* ------------------------------ Arranque ------------------------------ */
  document.getElementById("nombre-sitio").textContent = CONFIG.sitio.nombre;
  document.getElementById("pie-texto").textContent = CONFIG.sitio.pie;
  document.title = CONFIG.sitio.nombre;
  Array.prototype.forEach.call(document.querySelectorAll("[data-accion]"), function (el) {
    el.addEventListener("click", function (ev) {
      ev.preventDefault();
      if (estado.pantalla === "pregunta" && !window.confirm("¿Salir de la prueba? Se perderá el progreso de este intento.")) return;
      if (el.getAttribute("data-accion") === "historial") pantallaHistorial(); else pantallaInicio();
    });
  });
  pantallaInicio();
})();
