/* ============================================================
   GARUFA · VIEWMETRICAMX
   Interactive 360 viewer
============================================================ */

(() => {

  "use strict";


  /* ==========================================================
     CONFIGURACIÓN DE ÁREAS

     Aquí está la parte importante para el futuro.

     Un área puede tener UNA o VARIAS imágenes.

     Ejemplo:

     salon: [
       "imagen-1.jpg",
       "imagen-2.jpg",
       "imagen-3.jpg"
     ]

     Para un hospital posteriormente podríamos tener:

     recepcion: [...]
     urgencias: [...]
     quirofanos: [...]
     habitaciones: [...]
     cafeteria: [...]

  ========================================================== */


  const areas = {

    entrada: {

      label: "ENTRADA",

      images: [

        "assets/restaurant_garufa_parrilla_argentina_torreon_entrada.jpg"

      ]

    },


    salon: {

      label: "SALÓN",

      images: [

        "assets/restaurant_garufa_parrilla_argentina_torreon_salon.jpg"

      ]

    },


    barra: {

      label: "BARRA",

      images: [

        "assets/restaurant_garufa_parrilla_argentina_torreon_barra.jpg"

      ]

    },


    terraza: {

      label: "TERRAZA",

      images: [

        "assets/restaurant_garufa_parrilla_argentina_torreon_terraza.jpg"

      ]

    }

  };


  /* ==========================================================
     DOM
  ========================================================== */

  const canvas =
    document.getElementById("pano-canvas");

  const stage =
    document.getElementById("viewer-stage");

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


  /* ==========================================================
     THREE.JS
  ========================================================== */

  if (
    typeof THREE === "undefined"
  ) {

    loading.innerHTML =
      "<span>No fue posible cargar el visor 360°.</span>";

    return;

  }


  let scene;
  let camera;
  let renderer;
  let sphere;
  let texture;

  let currentArea =
    "entrada";

  let targetRotation =
    0;

  let currentRotation =
    0;

  let velocity =
    0;

  let isDragging =
    false;

  let startX =
    0;

  let lastX =
    0;

  let fov =
    72;


  /* ==========================================================
     INICIALIZACIÓN
  ========================================================== */

  function init() {

    scene =
      new THREE.Scene();


    camera =
      new THREE.PerspectiveCamera(
        fov,
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

        canvas,
        antialias: true,
        alpha: false

      });


    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2
      )
    );


    renderer.setSize(
      stage.clientWidth,
      stage.clientHeight,
      false
    );


    renderer.outputColorSpace =
      THREE.SRGBColorSpace;


    /* --------------------------------------------------------
       Esfera panorámica
    --------------------------------------------------------- */

    const geometry =
      new THREE.SphereGeometry(
        100,
        64,
        40
      );


    /*
      Invertimos la esfera para poder
      visualizarla desde dentro.
    */

    geometry.scale(
      1,
      1,
      -1
    );


    const material =
      new THREE.MeshBasicMaterial({

        color:
          0xffffff

      });


    sphere =
      new THREE.Mesh(
        geometry,
        material
      );


    scene.add(
      sphere
    );


    loadArea(
      currentArea
    );


    addEvents();

    animate();

  }


  /* ==========================================================
     CARGAR ÁREA
  ========================================================== */

  function loadArea(
    areaName
  ) {

    const area =
      areas[areaName];


    if (!area) {
      return;
    }


    currentArea =
      areaName;


    areaLabel.textContent =
      area.label;


    loading.classList.remove(
      "hidden"
    );


    /*
      Actualmente utilizamos
      la primera imagen del área.

      La estructura ya permite
      múltiples imágenes por área.
    */

    const image =
      area.images[0];


    if (texture) {

      texture.dispose();

    }


    const loader =
      new THREE.TextureLoader();


    loader.load(

      image,

      function (loadedTexture) {

        texture =
          loadedTexture;


        texture.colorSpace =
          THREE.SRGBColorSpace;


        /*
          No hacemos mirror horizontal.
        */

        texture.wrapS =
          THREE.ClampToEdgeWrapping;


        texture.wrapT =
          THREE.ClampToEdgeWrapping;


        sphere.material.map =
          texture;


        sphere.material.needsUpdate =
          true;


        /*
          Reiniciar posición
        */

        targetRotation =
          0;

        currentRotation =
          0;

        velocity =
          0;


        loading.classList.add(
          "hidden"
        );


        setTimeout(
          () => {

            hint.classList.add(
              "hidden"
            );

          },
          3500
        );

      },

      undefined,

      function () {

        loading.innerHTML =
          "<span>No se pudo cargar la imagen.</span>";

      }

    );

  }


  /* ==========================================================
     INTERACCIÓN
  ========================================================== */

  function pointerDown(
    event
  ) {

    isDragging =
      true;

    startX =
      getPointerX(event);

    lastX =
      startX;

    velocity =
      0;

    stage.setPointerCapture?.(
      event.pointerId
    );

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
      delta * 0.0009;

  }


  function pointerUp() {

    isDragging =
      false;

  }


  function getPointerX(
    event
  ) {

    if (
      event.touches &&
      event.touches.length
    ) {

      return event.touches[0].clientX;

    }


    return event.clientX;

  }


  /* ==========================================================
     ZOOM
  ========================================================== */

  function setZoom(
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


  /* ==========================================================
     EVENTOS
  ========================================================== */

  function addEvents() {

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


    zoomIn.addEventListener(
      "click",
      () => setZoom(-5)
    );


    zoomOut.addEventListener(
      "click",
      () => setZoom(5)
    );


    recenter.addEventListener(
      "click",
      () => {

        targetRotation =
          0;

        velocity =
          0;

      }
    );


    fullscreen.addEventListener(
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

            const area =
              button.dataset.area;


            buttons.forEach(
              b => {

                b.classList.remove(
                  "active"
                );

              }
            );


            button.classList.add(
              "active"
            );


            loadArea(
              area
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


  /* ==========================================================
     RESIZE
  ========================================================== */

  function resize() {

    const width =
      stage.clientWidth;

    const height =
      stage.clientHeight;


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


    /*
      Inercia después de arrastrar.
    */

    if (!isDragging) {

      targetRotation +=
        velocity;


      velocity *=
        0.94;

    }


    /*
      Suavizado.
    */

    currentRotation +=
      (
        targetRotation -
        currentRotation
      ) * 0.08;


    sphere.rotation.y =
      currentRotation;


    renderer.render(
      scene,
      camera
    );

  }


  /* ==========================================================
     START
  ========================================================== */

  init();

})();