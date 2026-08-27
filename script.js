/* ============================================================
   VIEWMETRICA
   GARUFA PARRILLA ARGENTINA
   EXPERIENCIA 360°

   Arquitectura:

   ÁREA
      └── 1 o N PANORAMAS

   Garufa:
      5 áreas
      8 panoramas
============================================================ */

(() => {

  "use strict";


  /* ==========================================================
     CONFIGURACIÓN DE GARUFA
  ========================================================== */

  const AREAS = {

    entrada: {

      label: "ENTRADA",

      panoramas: [

        "assets/garufa-parrilla-argentina-torreon-entrada_360.jpg"

      ]

    },


    interior: {

      label: "INTERIOR",

      panoramas: [

        "assets/garufa-parrilla-argentina-torreon-interior01_360.jpg",

        "assets/garufa-parrilla-argentina-torreon-interior02_360.jpg"

      ]

    },


    cava: {

      label: "INTERIOR CAVA PRINCIPAL",

      panoramas: [

        "assets/garufa-parrilla-argentina-torreon-interior_cava_360.jpg",

        "assets/garufa-parrilla-argentina-torreon-interior_cava01_360.jpg"

      ]

    },


    principal: {

      label: "INTERIOR PRINCIPAL",

      panoramas: [

        "assets/garufa-parrilla-argentina-torreon-interior_principal_360.jpg",

        "assets/garufa-parrilla-argentina-torreon-interior_principal_01_360.jpg"

      ]

    },


    toilets: {

      label: "TOILETS",

      panoramas: [

        "assets/garufa-parrilla-argentina-torreon-toilets_360.jpg"

      ]

    }

  };


  /* ==========================================================
     ESTADO
  ========================================================== */

  let currentArea = "entrada";

  let currentPanorama = 0;

  let scene;

  let camera;

  let renderer;

  let sphere;

  let texture = null;

  let targetRotation = 0;

  let currentRotation = 0;

  let velocity = 0;

  let isDragging = false;

  let lastPointerX = 0;

  let fieldOfView = 75;


  /* ==========================================================
     ELEMENTOS
  ========================================================== */

  const stage =
    document.getElementById("viewer-stage");

  const canvas =
    document.getElementById("pano-canvas");

  const loading =
    document.getElementById("viewer-loading");

  const areaLabel =
    document.getElementById("viewer-area");

  const counter =
    document.getElementById("panorama-counter");

  const hint =
    document.getElementById("viewer-hint");

  const panoramaNavigation =
    document.getElementById(
      "panorama-navigation"
    );

  const areaButtons =
    document.querySelectorAll(
      ".area-btn"
    );


  /* ==========================================================
     VALIDACIÓN
  ========================================================== */

  if (!stage || !canvas) {

    console.error(
      "Viewmetrica: no se encontró el visor."
    );

    return;

  }


  if (typeof THREE === "undefined") {

    showError(
      "No se pudo cargar el motor del visor."
    );

    return;

  }


  /* ==========================================================
     INICIALIZACIÓN
  ========================================================== */

  function init() {

    scene =
      new THREE.Scene();


    camera =
      new THREE.PerspectiveCamera(

        fieldOfView,

        stage.clientWidth /
        stage.clientHeight,

        0.1,

        1100

      );


    camera.position.set(
      0,
      0,
      0.01
    );


    renderer =
      new THREE.WebGLRenderer({

        canvas: canvas,

        antialias: true,

        alpha: false

      });


    renderer.setPixelRatio(

      Math.min(
        window.devicePixelRatio || 1,
        2
      )

    );


    renderer.setSize(

      stage.clientWidth,

      stage.clientHeight,

      false

    );


    /*
      Three.js r128
      utiliza sRGBEncoding.
    */

    renderer.outputEncoding =
      THREE.sRGBEncoding;


    /* ========================================================
       ESFERA
    ======================================================== */

    const geometry =
      new THREE.SphereGeometry(

        100,

        64,

        40

      );


    /*
      Invertimos la esfera para
      visualizar la textura desde dentro.
    */

    geometry.scale(
      1,
      1,
      -1
    );


    const material =
      new THREE.MeshBasicMaterial({

        color: 0xffffff

      });


    sphere =
      new THREE.Mesh(

        geometry,

        material

      );


    scene.add(
      sphere
    );


    /* ========================================================
       EVENTOS
    ======================================================== */

    setupEvents();


    /* ========================================================
       CARGA INICIAL
    ======================================================== */

    loadPanorama(
      "entrada",
      0
    );


    animate();

  }


  /* ==========================================================
     CARGAR PANORAMA
  ========================================================== */

  function loadPanorama(
    areaId,
    panoramaIndex
  ) {

    const area =
      AREAS[areaId];


    if (!area) {

      showError(
        "El área solicitada no existe."
      );

      return;

    }


    const imagePath =
      area.panoramas[panoramaIndex];


    if (!imagePath) {

      showError(
        "El panorama solicitado no existe."
      );

      return;

    }


    currentArea =
      areaId;


    currentPanorama =
      panoramaIndex;


    areaLabel.textContent =
      area.label;


    showLoading();


    /* ========================================================
       LIBERAR TEXTURA ANTERIOR
    ======================================================== */

    if (texture) {

      texture.dispose();

      texture = null;

    }


    const loader =
      new THREE.TextureLoader();


    loader.load(

      imagePath,


      /* ======================================================
         SUCCESS
      ==================================================== */

      (loadedTexture) => {

        texture =
          loadedTexture;


        /*
          Three.js r128.
        */

        texture.encoding =
          THREE.sRGBEncoding;


        texture.minFilter =
          THREE.LinearFilter;


        texture.magFilter =
          THREE.LinearFilter;


        texture.generateMipmaps =
          false;


        sphere.material.map =
          texture;


        sphere.material.needsUpdate =
          true;


        /*
          Reiniciamos la posición
          al cambiar de panorama.
        */

        targetRotation =
          0;


        currentRotation =
          0;


        velocity =
          0;


        hideLoading();


        updateAreaUI();


        showHint();

      },


      /* ======================================================
         PROGRESO
      ==================================================== */

      (progress) => {

        const text =
          loading.querySelector(
            ".loading-text"
          );


        if (
          text &&
          progress.total
        ) {

          const percent =
            Math.round(

              (
                progress.loaded /
                progress.total

              ) * 100

            );


          text.textContent =
            `Preparando panorama… ${percent}%`;

        }

      },


      /* ======================================================
         ERROR
      ==================================================== */

      () => {

        console.error(
          "Viewmetrica: no se pudo cargar:",
          imagePath
        );


        showError(

          `No se pudo cargar el panorama de ${area.label}.`

        );

      }

    );

  }


  /* ==========================================================
     ACTUALIZAR INTERFAZ
  ========================================================== */

  function updateAreaUI() {

    const area =
      AREAS[currentArea];


    if (!area) {
      return;
    }


    areaLabel.textContent =
      area.label;


    /* ========================================================
       CONTADOR
    ======================================================== */

    if (
      area.panoramas.length > 1
    ) {

      counter.textContent =

        `${String(
          currentPanorama + 1
        ).padStart(2, "0")} / ${String(
          area.panoramas.length
        ).padStart(2, "0")}`;

      counter.classList.add(
        "visible"
      );

    } else {

      counter.textContent =
        "";

      counter.classList.remove(
        "visible"
      );

    }


    /* ========================================================
       BOTONES DE ÁREA
    ======================================================== */

    areaButtons.forEach(
      button => {

        button.classList.toggle(

          "active",

          button.dataset.area ===
          currentArea

        );

      }
    );


    updatePanoramaNavigation();

  }


  /* ==========================================================
     NAVEGACIÓN ENTRE PANORAMAS
  ========================================================== */

  function updatePanoramaNavigation() {

    const area =
      AREAS[currentArea];


    if (
      !area ||
      area.panoramas.length <= 1
    ) {

      panoramaNavigation.innerHTML =
        "";

      panoramaNavigation.classList.remove(
        "visible"
      );

      return;

    }


    panoramaNavigation.innerHTML = `

      <button
        type="button"
        class="pano-arrow"
        data-direction="previous"
        aria-label="Panorama anterior"
      >
        ‹
      </button>

      <span class="pano-count">
        ${String(
          currentPanorama + 1
        ).padStart(2, "0")}
        /
        ${String(
          area.panoramas.length
        ).padStart(2, "0")}
      </span>

      <button
        type="button"
        class="pano-arrow"
        data-direction="next"
        aria-label="Siguiente panorama"
      >
        ›
      </button>

    `;


    panoramaNavigation.classList.add(
      "visible"
    );


    panoramaNavigation
      .querySelector(
        '[data-direction="previous"]'
      )
      .addEventListener(
        "click",
        previousPanorama
      );


    panoramaNavigation
      .querySelector(
        '[data-direction="next"]'
      )
      .addEventListener(
        "click",
        nextPanorama
      );

  }


  /* ==========================================================
     SIGUIENTE
  ========================================================== */

  function nextPanorama() {

    const area =
      AREAS[currentArea];


    if (!area) {
      return;
    }


    if (
      currentPanorama <
      area.panoramas.length - 1
    ) {

      loadPanorama(

        currentArea,

        currentPanorama + 1

      );

    }

  }


  /* ==========================================================
     ANTERIOR
  ========================================================== */

  function previousPanorama() {

    if (
      currentPanorama > 0
    ) {

      loadPanorama(

        currentArea,

        currentPanorama - 1

      );

    }

  }


  /* ==========================================================
     LOADING
  ========================================================== */

  function showLoading() {

    loading.classList.remove(
      "hidden"
    );


    loading.innerHTML = `

      <div class="loading-ring"></div>

      <span class="loading-text">
        Preparando panorama…
      </span>

    `;

  }


  function hideLoading() {

    loading.classList.add(
      "hidden"
    );

  }


  function showError(
    message
  ) {

    loading.classList.remove(
      "hidden"
    );


    loading.innerHTML = `

      <div class="loading-error">

        <strong>
          No pudimos cargar esta vista
        </strong>

        <span>
          ${message}
        </span>

        <button
          type="button"
          id="retry-panorama"
        >
          Intentar nuevamente
        </button>

      </div>

    `;


    const retry =
      document.getElementById(
        "retry-panorama"
      );


    retry?.addEventListener(
      "click",
      () => {

        loadPanorama(
          currentArea,
          currentPanorama
        );

      }
    );

  }


  /* ==========================================================
     AYUDA
  ========================================================== */

  function showHint() {

    if (!hint) {
      return;
    }


    hint.classList.remove(
      "hidden"
    );


    clearTimeout(
      showHint.timeout
    );


    showHint.timeout =
      setTimeout(
        () => {

          hint.classList.add(
            "hidden"
          );

        },

        4000

      );

  }


  /* ==========================================================
     DRAG
  ========================================================== */

  function pointerDown(
    event
  ) {

    isDragging =
      true;


    lastPointerX =
      event.clientX;


    velocity =
      0;


    stage.classList.add(
      "dragging"
    );


    hint?.classList.add(
      "hidden"
    );


    try {

      stage.setPointerCapture(
        event.pointerId
      );

    } catch (error) {}

  }


  function pointerMove(
    event
  ) {

    if (!isDragging) {
      return;
    }


    const currentX =
      event.clientX;


    const delta =
      currentX -
      lastPointerX;


    lastPointerX =
      currentX;


    targetRotation +=
      delta * 0.004;


    velocity =
      delta * 0.0008;

  }


  function pointerUp() {

    isDragging =
      false;


    stage.classList.remove(
      "dragging"
    );

  }


  /* ==========================================================
     ZOOM
  ========================================================== */

  function changeZoom(
    amount
  ) {

    fieldOfView +=
      amount;


    fieldOfView =
      Math.max(

        45,

        Math.min(
          90,
          fieldOfView
        )

      );


    camera.fov =
      fieldOfView;


    camera.updateProjectionMatrix();

  }


  /* ==========================================================
     CENTRAR
  ========================================================== */

  function centerView() {

    targetRotation =
      0;


    velocity =
      0;

  }


  /* ==========================================================
     EVENTOS
  ========================================================== */

  function setupEvents() {

    /* --------------------------------------------------------
       POINTER
    -------------------------------------------------------- */

    stage.addEventListener(
      "pointerdown",
      pointerDown
    );


    stage.addEventListener(
      "pointermove",
      pointerMove
    );


    stage.addEventListener(
      "pointerup",
      pointerUp
    );


    stage.addEventListener(
      "pointercancel",
      pointerUp
    );


    stage.addEventListener(
      "pointerleave",
      pointerUp
    );


    /* --------------------------------------------------------
       ZOOM
    -------------------------------------------------------- */

    document
      .getElementById("zoom-in")
      ?.addEventListener(
        "click",
        () => {

          changeZoom(-5);

        }
      );


    document
      .getElementById("zoom-out")
      ?.addEventListener(
        "click",
        () => {

          changeZoom(5);

        }
      );


    /* --------------------------------------------------------
       CENTRAR
    -------------------------------------------------------- */

    document
      .getElementById("recenter")
      ?.addEventListener(
        "click",
        centerView
      );


    /* --------------------------------------------------------
       FULLSCREEN
    -------------------------------------------------------- */

    document
      .getElementById("fullscreen-btn")
      ?.addEventListener(
        "click",
        toggleFullscreen
      );


    /* --------------------------------------------------------
       ÁREAS
    -------------------------------------------------------- */

    areaButtons.forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const areaId =
              button.dataset.area;


            if (
              !AREAS[areaId]
            ) {

              return;

            }


            loadPanorama(
              areaId,
              0
            );

          }
        );

      }
    );


    /* --------------------------------------------------------
       RESIZE
    -------------------------------------------------------- */

    window.addEventListener(
      "resize",
      resize
    );

  }


  /* ==========================================================
     FULLSCREEN
  ========================================================== */

  function toggleFullscreen() {

    if (
      !document.fullscreenElement
    ) {

      stage.requestFullscreen?.();

    } else {

      document.exitFullscreen?.();

    }

  }


  /* ==========================================================
     RESIZE
  ========================================================== */

  function resize() {

    const width =
      stage.clientWidth;


    const height =
      stage.clientHeight;


    if (
      width <= 0 ||
      height <= 0
    ) {

      return;

    }


    camera.aspect =
      width / height;


    camera.updateProjectionMatrix();


    renderer.setSize(

      width,

      height,

      false

    );

  }


  /* ==========================================================
     ANIMACIÓN
  ========================================================== */

  function animate() {

    requestAnimationFrame(
      animate
    );


    if (!isDragging) {

      targetRotation +=
        velocity;


      velocity *=
        0.94;

    }


    currentRotation +=

      (
        targetRotation -
        currentRotation

      ) * 0.08;


    if (sphere) {

      sphere.rotation.y =
        currentRotation;

    }


    renderer.render(
      scene,
      camera
    );

  }


  /* ==========================================================
     ARRANCAR
  ========================================================== */

  init();


})();
