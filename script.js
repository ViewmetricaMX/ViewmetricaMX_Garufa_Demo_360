/* ==========================================================================
   ViewMetricaMX — Garufa Parrilla Argentina · Demo 360°
   Visor panorámico con áreas + puntos de recorrido
   ========================================================================== */

/* --------------------------------------------------------------------------
   CONFIGURACIÓN
-------------------------------------------------------------------------- */

const WHATSAPP_NUMBER = "528714005421";

const WHATSAPP_MESSAGE =
  "Hola, vi la demo 360° de Garufa Parrilla Argentina hecha por ViewMetricaMX y me gustaría conocer cómo podría aplicarse a mi negocio.";

/* --------------------------------------------------------------------------
   ÁREAS DEL RECORRIDO
   Cada área puede tener uno o varios puntos (vistas). Cuando tiene más de
   uno, el visor muestra un indicador de puntos (●) dentro de la misma
   etiqueta de posición, sin saturar la barra de navegación inferior.
-------------------------------------------------------------------------- */

const AREAS = [
  {
    key: "entrada",
    label: "ENTRADA",
    points: [
      { file: "assets/garufa-parrilla-argentina-torreon-entrada_360.jpg", lon: 0, lat: 0, fov: 84 }
    ]
  },
  {
    key: "cava",
    label: "CAVA",
    points: [
      { file: "assets/garufa-parrilla-argentina-torreon-interior_cava_360.jpg", lon: 0, lat: 0, fov: 84 },
      { file: "assets/garufa-parrilla-argentina-torreon-interior_cava01_360.jpg", lon: 0, lat: 0, fov: 84 }
    ]
  },
  {
    key: "principal",
    label: "SALÓN PRINCIPAL",
    points: [
      { file: "assets/garufa-parrilla-argentina-torreon-interior_principal_360.jpg", lon: 0, lat: 0, fov: 84 },
      { file: "assets/garufa-parrilla-argentina-torreon-interior_principal_01_360.jpg", lon: 0, lat: 0, fov: 84 }
    ]
  },
  {
    key: "interior",
    label: "INTERIOR",
    points: [
      { file: "assets/garufa-parrilla-argentina-torreon-interior01_360.jpg", lon: 0, lat: 0, fov: 84 },
      { file: "assets/garufa-parrilla-argentina-torreon-interior02_360.jpg", lon: 0, lat: 0, fov: 84 }
    ]
  },
  {
    key: "toilets",
    label: "TOILETS",
    points: [
      { file: "assets/garufa-parrilla-argentina-torreon-toilets_360.jpg", lon: 0, lat: 0, fov: 84 }
    ]
  }
];

/* --------------------------------------------------------------------------
   CONTROLES
-------------------------------------------------------------------------- */

const FOV_MIN = 32;
const FOV_MAX = 92;

const AUTOROTATE_SPEED = 0.006;
const AUTOROTATE_RESUME_DELAY = 5200;

/* ==========================================================================
   INICIO
========================================================================== */

(function init() {

  const stageEl = document.getElementById("viewer-stage");
  const canvas = document.getElementById("pano-canvas");

  const loadingEl = document.getElementById("viewer-loading");
  const loadingLabel = loadingEl.querySelector(".loading-label");

  const fallbackEl = document.getElementById("viewer-fallback");
  const fallbackImg = document.getElementById("fallback-img");

  const dragHint = document.getElementById("drag-hint");
  const posTagLabel = document.getElementById("pos-tag-label");
  const pointDotsEl = document.getElementById("point-dots");

  const areaButtons = Array.from(document.querySelectorAll(".pos-btn"));

  /* ------------------------------------------------------------------------
     VERIFICAR WEBGL
  ------------------------------------------------------------------------ */

  function hasWebGL() {
    try {
      const testCanvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  }

  if (typeof THREE === "undefined" || !hasWebGL()) {

    console.error(
      "[ViewMetricaMX] Visor 360° no disponible.",
      "Three.js:", typeof THREE !== "undefined",
      "WebGL:", hasWebGL()
    );

    canvas.hidden = true;
    loadingEl.hidden = true;
    fallbackEl.hidden = false;
    fallbackImg.src = AREAS[0].points[0].file;

    const diagP = fallbackEl.querySelector("p");
    if (diagP) {
      diagP.textContent = "Tu navegador no soporta la vista 360° interactiva.";
    }

    setupAreaNavFallbackMode();
    setupCTA();
    setupReveal();
    return;
  }

  /* ==========================================================================
     THREE.JS — ESTADO
  ========================================================================== */

  let renderer, scene, camera, sphere;

  let currentAreaIndex = 0;
  let currentPointIndex = 0;

  let lon = AREAS[0].points[0].lon;
  let lat = AREAS[0].points[0].lat;
  let targetFov = AREAS[0].points[0].fov;

  /* Estado de interacción (declarado explícitamente — omitirlo rompe el
     render loop con un ReferenceError silencioso en cada frame). */
  let userHasInteracted = false;
  let lastInteraction = performance.now();

  /* Interacción / arrastre */
  let isPointerDown = false;
  let onPointerDownX = 0, onPointerDownY = 0;
  let onPointerDownLon = 0, onPointerDownLat = 0;

  /* Inercia del movimiento */
  let velocityLon = 0;
  let velocityLat = 0;
  const INERTIA_FRICTION = 0.94;
  const MAX_INERTIA = 2.5;

  /* Texturas */
  const textureCache = {};
  const loader = new THREE.TextureLoader();

  function cacheKey(areaIdx, pointIdx) {
    return areaIdx + ":" + pointIdx;
  }

  /* ==========================================================================
     CONSTRUIR ESCENA
  ========================================================================== */

  function buildScene() {

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(targetFov, 16 / 9, 1, 1100);

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(1, 1, -1);

    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    resizeRenderer();
    animate();

    console.log("[ViewMetricaMX] Three.js:", THREE.REVISION);
    console.log("[ViewMetricaMX] Visor 360° inicializado correctamente.");
  }

  /* ==========================================================================
     RESIZE
  ========================================================================== */

  function resizeRenderer() {
    const w = stageEl.clientWidth;
    const h = stageEl.clientHeight;
    if (!w || !h) return;

    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* ==========================================================================
     RENDERIZAR ETIQUETA DE ÁREA + PUNTOS
  ========================================================================== */

  function renderPosTag() {
    const area = AREAS[currentAreaIndex];
    posTagLabel.textContent = area.label;

    if (area.points.length <= 1) {
      pointDotsEl.hidden = true;
      pointDotsEl.innerHTML = "";
      return;
    }

    pointDotsEl.hidden = false;
    pointDotsEl.innerHTML = "";
    area.points.forEach(function (pt, idx) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "point-dot" + (idx === currentPointIndex ? " is-active" : "");
      dot.setAttribute("aria-label", area.label + " — vista " + (idx + 1));
      dot.addEventListener("click", function (e) {
        e.stopPropagation();
        markInteraction();
        loadPoint(currentAreaIndex, idx);
      });
      pointDotsEl.appendChild(dot);
    });
  }

  /* ==========================================================================
     CARGAR UN PUNTO (foto) DENTRO DE UN ÁREA
  ========================================================================== */

  function loadPoint(areaIdx, pointIdx, opts) {
    opts = opts || {};
    const area = AREAS[areaIdx];
    const point = area.points[pointIdx];
    if (!point) return;

    currentAreaIndex = areaIdx;
    currentPointIndex = pointIdx;

    lon = point.lon;
    lat = point.lat;
    targetFov = point.fov;

    camera.fov = point.fov;
    camera.updateProjectionMatrix();

    renderPosTag();

    areaButtons.forEach(function (btn) {
      const active = btn.dataset.area === area.key;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    const key = cacheKey(areaIdx, pointIdx);

    if (textureCache[key]) {
      applyTexture(textureCache[key]);
      return;
    }

    if (!opts.silent) {
      loadingLabel.textContent = "Cargando " + area.label.toLowerCase() + "…";
      loadingEl.hidden = false;
    }

    loader.load(
      point.file,
      function (texture) {
        const img = texture.image;
        console.log(
          "[ViewMetricaMX] Panorama cargado:", point.file,
          img ? img.width + "x" + img.height : "dimensiones desconocidas"
        );

        if ("colorSpace" in texture) {
          texture.colorSpace = THREE.SRGBColorSpace;
        }
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        textureCache[key] = texture;
        applyTexture(texture);
        loadingEl.hidden = true;
      },
      undefined,
      function (error) {
        console.error("[ViewMetricaMX] Error cargando panorama:", point.file, error);
        loadingLabel.textContent = "No se pudo cargar el panorama.";
      }
    );
  }

  /* Compatibilidad: cargar la primera vista de un área por su key */
  function loadArea(areaKey, opts) {
    const idx = AREAS.findIndex(function (a) { return a.key === areaKey; });
    if (idx === -1) return;
    loadPoint(idx, 0, opts);
  }

  /* ==========================================================================
     APLICAR TEXTURA
  ========================================================================== */
  function applyTexture(texture) {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.x = 1;
    texture.offset.x = 0;

    if ("colorSpace" in texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }

    sphere.material.map = texture;
    sphere.material.color.set(0xffffff);
    sphere.material.needsUpdate = true;
  }

  /* ==========================================================================
     RENDER LOOP
  ========================================================================== */

  function animate() {
    requestAnimationFrame(animate);

    if (!isPointerDown) {
      if (Math.abs(velocityLon) > 0.001 || Math.abs(velocityLat) > 0.001) {
        lon += velocityLon;
        lat += velocityLat;
        velocityLon *= INERTIA_FRICTION;
        velocityLat *= INERTIA_FRICTION;
      } else if (userHasInteracted && performance.now() - lastInteraction > AUTOROTATE_RESUME_DELAY) {
        lon += AUTOROTATE_SPEED;
      }
    }

    lat = Math.max(-85, Math.min(85, lat));

    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon);

    const target = new THREE.Vector3(
      500 * Math.sin(phi) * Math.cos(theta),
      500 * Math.cos(phi),
      500 * Math.sin(phi) * Math.sin(theta)
    );

    camera.position.set(0, 0, 0);
    camera.lookAt(target);

    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov += (targetFov - camera.fov) * 0.15;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
  }

  /* ==========================================================================
     INTERACCIÓN
  ========================================================================== */

  function markInteraction() {
    userHasInteracted = true;
    lastInteraction = performance.now();
    if (!dragHint.classList.contains("is-hidden")) {
      dragHint.classList.add("is-hidden");
    }
  }

  function onPointerDown(clientX, clientY) {
    isPointerDown = true;
    stageEl.classList.add("is-dragging");
    onPointerDownX = clientX;
    onPointerDownY = clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
  }

  function onPointerMove(clientX, clientY) {
    if (!isPointerDown) return;

    const newLon = (onPointerDownX - clientX) * 0.16 + onPointerDownLon;
    const newLat = (clientY - onPointerDownY) * 0.16 + onPointerDownLat;

    velocityLon = clamp(newLon - lon, -MAX_INERTIA, MAX_INERTIA);
    velocityLat = clamp(newLat - lat, -MAX_INERTIA, MAX_INERTIA);

    lon = newLon;
    lat = newLat;

    markInteraction();
  }

  function onPointerUp() {
    isPointerDown = false;
    stageEl.classList.remove("is-dragging");
  }

  /* Mouse */
  stageEl.addEventListener("mousedown", function (e) {
    onPointerDown(e.clientX, e.clientY);
    markInteraction();
  });
  window.addEventListener("mousemove", function (e) { onPointerMove(e.clientX, e.clientY); });
  window.addEventListener("mouseup", onPointerUp);

  /* Touch */
  let pinchStartDist = null;
  let pinchStartFov = null;

  stageEl.addEventListener("touchstart", function (e) {
    markInteraction();
    if (e.touches.length === 1) {
      onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      isPointerDown = false;
      pinchStartDist = touchDistance(e.touches);
      pinchStartFov = targetFov;
    }
  }, { passive: true });

  stageEl.addEventListener("touchmove", function (e) {
    if (e.touches.length === 1 && isPointerDown) {
      onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2 && pinchStartDist) {
      const dist = touchDistance(e.touches);
      const scale = pinchStartDist / dist;
      targetFov = clamp(pinchStartFov * scale, FOV_MIN, FOV_MAX);
      markInteraction();
    }
  }, { passive: true });

  stageEl.addEventListener("touchend", function (e) {
    if (e.touches.length === 0) {
      onPointerUp();
      pinchStartDist = null;
    }
  });

  function touchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /* Rueda del mouse */
  stageEl.addEventListener("wheel", function (e) {
    e.preventDefault();
    markInteraction();
    targetFov = clamp(targetFov + e.deltaY * 0.04, FOV_MIN, FOV_MAX);
  }, { passive: false });

  /* Zoom in/out */
  document.getElementById("zoom-in").addEventListener("click", function () {
    markInteraction();
    targetFov = clamp(targetFov - 10, FOV_MIN, FOV_MAX);
  });
  document.getElementById("zoom-out").addEventListener("click", function () {
    markInteraction();
    targetFov = clamp(targetFov + 10, FOV_MIN, FOV_MAX);
  });

  /* Recenter */
  document.getElementById("recenter").addEventListener("click", function () {
    markInteraction();
    const point = AREAS[currentAreaIndex].points[currentPointIndex];
    lon = point.lon;
    lat = point.lat;
    targetFov = point.fov;
  });

  /* Fullscreen */
  document.getElementById("fullscreen-btn").addEventListener("click", function () {
    markInteraction();
    if (!document.fullscreenElement) {
      const req = stageEl.requestFullscreen || stageEl.webkitRequestFullscreen;
      if (req) req.call(stageEl);
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) exit.call(document);
    }
  });

  window.addEventListener("resize", resizeRenderer);
  document.addEventListener("fullscreenchange", resizeRenderer);

  /* Navegación entre áreas */
  areaButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      markInteraction();
      loadArea(btn.dataset.area);
    });
  });

  /* Hero CTA */
  document.getElementById("hero-cta").addEventListener("click", function () {
    setTimeout(function () {
      if (stageEl.focus) stageEl.focus();
    }, 500);
  });

  /* ==========================================================================
     INICIO
  ========================================================================== */

  buildScene();

  loadPoint(0, 0, { silent: true });

  loadingEl.hidden = false;
  loadingLabel.textContent = "Preparando panorama…";

  const checkFirstLoad = setInterval(function () {
    if (textureCache[cacheKey(0, 0)]) {
      loadingEl.hidden = true;
      clearInterval(checkFirstLoad);
    }
  }, 100);

  setTimeout(function () {
    dragHint.classList.add("is-hidden");
  }, 6000);

  setupCTA();
  setupReveal();

})();

/* ==========================================================================
   FALLBACK (sin WebGL) — navegación por área, primera vista de cada una
========================================================================== */

function setupAreaNavFallbackMode() {
  const fallbackImg = document.getElementById("fallback-img");
  const posTagLabel = document.getElementById("pos-tag-label");

  document.querySelectorAll(".pos-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const key = btn.dataset.area;
      const area = AREAS.find(function (a) { return a.key === key; });
      if (!area) return;

      fallbackImg.src = area.points[0].file;
      posTagLabel.textContent = area.label;

      document.querySelectorAll(".pos-btn").forEach(function (b) {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });
    });
  });
}

/* ==========================================================================
   WHATSAPP
========================================================================== */

function setupCTA() {
  const cta = document.getElementById("whatsapp-cta");
  if (!cta) return;

  const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(WHATSAPP_MESSAGE);
  cta.href = url;
  cta.target = "_blank";
  cta.rel = "noopener noreferrer";

  cta.addEventListener("click", function (e) {
    e.preventDefault();
    window.open(url, "_blank", "noopener,noreferrer");
  });
}

/* ==========================================================================
   REVEAL
========================================================================== */

function setupReveal() {
  const targets = document.querySelectorAll(
    ".section-head, .benefit, .app-item, .commercial-note, .cta-inner"
  );

  targets.forEach(function (el) { el.classList.add("reveal"); });

  if (!("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach(function (el) { io.observe(el); });
}
