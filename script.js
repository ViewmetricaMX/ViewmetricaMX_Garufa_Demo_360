/* ============================================================
   VIEWMETRICAMX · GARUFA PARRILLA ARGENTINA
   Experiencia 360°
   Sistema: Áreas → múltiples panoramas
============================================================ */

(() => {

  "use strict";


  /* ============================================================
     PANORAMAS REALES DE GARUFA
  ============================================================ */

  const AREAS = {

    entrada: {
      label: "ENTRADA",
      panoramas: [
        "assets/garufa-parrilla-argentina-torreon-entrada_360.jpg"
      ]
    },

    cava: {
      label: "CAVA",
      panoramas: [
        "assets/garufa-parrilla-argentina-torreon-interior_cava_360.jpg",
        "assets/garufa-parrilla-argentina-torreon-interior_cava01_360.jpg"
      ]
    },

    salon: {
      label: "SALÓN PRINCIPAL",
      panoramas: [
        "assets/garufa-parrilla-argentina-torreon-interior_principal_360.jpg",
        "assets/garufa-parrilla-argentina-torreon-interior_principal_01_360.jpg"
      ]
    },

    interior: {
      label: "INTERIOR",
      panoramas: [
        "assets/garufa-parrilla-argentina-torreon-interior01_360.jpg",
        "assets/garufa-parrilla-argentina-torreon-interior02_360.jpg"
      ]
    },

    toilets: {
      label: "TOILETS",
      panoramas: [
        "assets/garufa-parrilla-argentina-torreon-toilets_360.jpg"
      ]
    }

  };


  /* ============================================================
     ESTADO
  ============================================================ */

  let currentArea = "entrada";
  let currentPanorama = 0;

  let scene;
  let camera;
  let renderer;
  let sphere;
  let texture;

  let currentRotation = 0;
  let targetRotation = 0;

  let velocity = 0;

  let isDragging = false;
  let lastX = 0;

  let fov = 75;


  /* ============================================================
     DOM
  ============================================================ */

  const stage =
    document.getElementById("viewer-stage");

  const canvas =
    document.getElementById("pano-canvas");

  const loading =
    document.getElementById("viewer-loading");

  const hint =
    document.getElementById("viewer-hint");

  const areaLabel =
    document.getElementById("viewer-area");

  const buttons =
    document.querySelectorAll(".area-btn");

  const zoomIn =
    document.getElementById("zoom-in");

  const zoomOut =
    document.getElementById("zoom-out");

  const recenter =
    document.getElementById("recenter");

  const fullscreen =
    document.getElementById("fullscreen-btn");


  /* ============================================================
     VERIFICACIÓN
  ============================================================ */

  if (!stage || !canvas) {

    console.error(
      "Viewmetrica: no se encontró el contenedor del visor."
    );

    return;

  }


  if (typeof THREE === "undefined") {

    showError(
      "No fue posible cargar el motor 360°."
    );

    return;

  }


  /* ============================================================
     INICIALIZAR THREE.JS
  ============================================================ */

  function init() {

    scene =
      new THREE.Scene();


    camera =
      new THREE.PerspectiveCamera(
        fov,
        stage.clientWidth / stage.clientHeight,
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
      IMPORTANTE:
      Three.js r128 utiliza outputEncoding,
      no outputColorSpace.
    */

    renderer.outputEncoding =
      THREE.sRGBEncoding;


    /* ========================================================
       ESFERA 360°
    ======================================================== */

    const geometry =
      new THREE.SphereGeometry(
        100,
        64,
        40
      );


    /*
      Invertimos la esfera para
      visualizarla desde dentro.
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
       PRIMER PANORAMA
    ======================================================== */

    loadPanorama(
      currentArea,
      0
    );


    animate();

  }


  /* ============================================================
     CARGAR PANORAMA
  ============================================================ */

  function loadPanorama(
    areaId,
    panoramaIndex
  ) {

    const area =
      AREAS[areaId];


    if (!area) {

      showError(
        "Área no encontrada."
      );

      return;

    }


    const imagePath =
      area.panoramas[panoramaIndex];


    if (!imagePath) {

      showError(
        "Panorama no encontrado."
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


    /*
      Liberar textura anterior.
    */

    if (texture) {

      texture.dispose();

      texture = null;

    }


    const loader =
      new THREE.TextureLoader();


    /*
      La carga se hace directamente
      desde assets/.
    */

    loader.load(

      imagePath,

      (loadedTexture) => {

        texture =
          loadedTexture;


        /*
          Three.js r128
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
          Reiniciar posición
          cuando cambia de panorama.
        */

        targetRotation =
          0;

        currentRotation =
          0;

        velocity =
          0;


        hideLoading();


        updatePanoramaCounter();


        /*
          Ocultar ayuda después
          de unos segundos.
        */

        if (hint) {

          hint.classList.remove(
            "hidden"
          );


          setTimeout(() => {

            hint.classList.add(
              "hidden"
            );

          }, 3500);

        }

      },

      /*
        Progreso
      */

      (progress) => {

        if (
          progress.total > 0
        ) {

          const percent =
            Math.round(
              (
                progress.loaded /
                progress.total
              ) * 100
            );


          const text =
            loading.querySelector("span");


          if (text) {

            text.textContent =
              `Cargando panorama… ${percent}%`;

          }

        }

      },

      /*
        ERROR
      */

      (error) => {

        console.error(
          "Viewmetrica: error cargando panorama:",
          imagePath,
          error
        );


        showError(
          "No se pudo cargar este panorama."
        );

      }

    );

  }


  /* ============================================================
     INDICADOR 01 / 02
  ============================================================ */

  function updatePanoramaCounter() {

    const area =
      AREAS[currentArea];


    if (!areaLabel || !area) {
      return;
    }


    let counter =
      document.getElementById(
        "panorama-counter"
      );


    if (!counter) {

      counter =
        document.createElement(
          "span"
        );

      counter.id =
        "panorama-counter";

      counter.className =
        "panorama-counter";


      areaLabel.parentNode.appendChild(
        counter
      );

    }


    if (
      area.panoramas.length > 1
    ) {

      counter.textContent =
        `${String(currentPanorama + 1).padStart(2, "0")} / ${String(area.panoramas.length).padStart(2, "0")}`;

      counter.style.display =
        "inline-block";

    } else {

      counter.style.display =
        "none";

    }


    updateAreaNavigation();

  }


  /* ============================================================
     NAVEGACIÓN INTERNA DEL ÁREA
  ============================================================ */

  function updateAreaNavigation() {

    let navigation =
      document.getElementById(
        "panorama-navigation"
      );


    /*
      Crear controles únicamente
      cuando un área tiene más
      de un panorama.
    */

    if (!navigation) {

      navigation =
        document.createElement(
          "div"
        );

      navigation.id =
        "panorama-navigation";

      navigation.className =
        "panorama-navigation";


      stage.appendChild(
        navigation
      );

    }


    const area =
      AREAS[currentArea];


    if (
      !area ||
      area.panoramas.length <= 1
    ) {

      navigation.innerHTML =
        "";

      navigation.classList.remove(
        "visible"
      );

      return;

    }


    navigation.innerHTML = `

      <button
        type="button"
        class="pano-arrow pano-prev"
        aria-label="Panorama anterior"
      >
        ‹
      </button>

      <span>
        ${String(currentPanorama + 1).padStart(2, "0")}
        /
        ${String(area.panoramas.length).padStart(2, "0")}
      </span>

      <button
        type="button"
        class="pano-arrow pano-next"
        aria-label="Siguiente panorama"
      >
        ›
      </button>

    `;


    navigation.classList.add(
      "visible"
    );


    navigation
      .querySelector(".pano-prev")
      .addEventListener(
        "click",
        previousPanorama
      );


    navigation
      .querySelector(".pano-next")
      .addEventListener(
        "click",
        nextPanorama
      );

  }


  /* ============================================================
     SIGUIENTE PANORAMA
  ============================================================ */

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


  /* ============================================================
     PANORAMA ANTERIOR
  ============================================================ */

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


  /* ============================================================
     LOADING
  ============================================================ */

  function showLoading() {

    loading.classList.remove(
      "hidden"
    );


    const text =
      loading.querySelector("span");


    if (text) {

      text.textContent =
        "Preparando panorama…";

    }

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
          Algo salió mal
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


    if (retry) {

      retry.addEventListener(
        "click",
        () => {

          loadPanorama(
            currentArea,
            currentPanorama
          );

        }
      );

    }

  }


  /* ============================================================
     DRAG
  ============================================================ */

  function getPointerX(
    event
  ) {

    return event.clientX;

  }


  function pointerDown(
    event
  ) {

    isDragging =
      true;

    lastX =
      getPointerX(event);

    velocity =
      0;


    stage.setPointerCapture?.(
      event.pointerId
    );


    if (hint) {

      hint.classList.add(
        "hidden"
      );

    }

  }


  function pointerMove(
    event
  ) {

    if (!isDragging) {
      return;
    }


    const x =
      getPointerX(event);


    const delta =
      x - lastX;


    lastX =
      x;


    targetRotation +=
      delta * 0.004;


    velocity =
      delta * 0.0008;

  }


  function pointerUp() {

    isDragging =
      false;

  }


  /* ============================================================
     ZOOM
  ============================================================ */

  function changeZoom(
    amount
  ) {

    fov +=
      amount;


    fov =
      Math.max(
        45,
        Math.min(
          90,
          fov
        )
      );


    camera.fov =
      fov;


    camera.updateProjectionMatrix();

  }


  /* ============================================================
     EVENTOS
  ============================================================ */

  function setupEvents() {

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


    zoomIn?.addEventListener(
      "click",
      () => {

        changeZoom(-5);

      }
    );


    zoomOut?.addEventListener(
      "click",
      () => {

        changeZoom(5);

      }
    );


    recenter?.addEventListener(
      "click",
      () => {

        targetRotation =
          0;

        velocity =
          0;

      }
    );


    fullscreen?.addEventListener(
      "click",
      () => {

        if (
          !document.fullscreenElement
        ) {

          stage.requestFullscreen?.();

        } else {

          document.exitFullscreen?.();

        }

      }
    );


    buttons.forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const areaId =
              button.dataset.area;


            if (!AREAS[areaId]) {
              return;
            }


            buttons.forEach(
              item => {

                item.classList.remove(
                  "active"
                );

              }
            );


            button.classList.add(
              "active"
            );


            loadPanorama(
              areaId,
              0
            );

          }
        );

      }
    );


    window.addEventListener(
      "resize",
      resize
    );

  }


  /* ============================================================
     RESIZE
  ============================================================ */

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


  /* ============================================================
     ANIMACIÓN
  ============================================================ */

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


  /* ============================================================
     INICIAR
  ============================================================ */

  init();


})();
