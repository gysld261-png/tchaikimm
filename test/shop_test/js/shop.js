import * as THREE from "three";

/* hero — follow.art 레퍼런스처럼 사진 카드들을 원통 둘레에 실제 3D로 배치하고
   Three.js로 렌더링합니다. 회전값은 GSAP로 트윈합니다(main 페이지가 이미
   GSAP를 쓰고 있어 같은 라이브러리로 통일). 페이지 진입 즉시 자동 회전이
   시작되고, ALL/NEW는 그 순환 중 하나일 뿐 고정값이 아닙니다. 카테고리
   hover/focus 시 그 카드가 정면으로 돌아오며 자동 회전이 멈추고, 벗어나면
   멈춘 지점부터 다시 돌아갑니다. Three.js/WebGL을 쓸 수 없으면 정지 이미지
   (`.hero_gallery_fallback`)가 그대로 보입니다. */

var heroGallery = document.getElementById("hero_gallery");
var canvas = document.getElementById("hero_gallery_canvas");
var navLinks = Array.prototype.slice.call(document.querySelectorAll(".hero_nav_link"));

var IMAGE_URLS = [
  "assets/images/gallery_image1.png",
  "assets/images/gallery_image2.png",
  "assets/images/gallery_image3.png",
  "assets/images/gallery_image4.png",
  "assets/images/gallery_image1.png",
  "assets/images/gallery_image2.png",
  "assets/images/gallery_image3.png",
  "assets/images/gallery_image4.png"
];

var CARD_COUNT = IMAGE_URLS.length;
var CARD_WIDTH = 440;
var CARD_HEIGHT = 460;
var RING_RADIUS = 620;
var CARD_CURVE_SEGMENTS = 32;
var CARD_HOVER_SCALE = 1.12;
var FULL_TURN_DURATION_S = 40;
var FOCUS_TWEEN_DURATION_S = 0.8;

function createCurvedCardGeometry() {
  var geometry = new THREE.BufferGeometry();
  var positions = [];
  var uvs = [];
  var indices = [];
  var arcAngle = CARD_WIDTH / RING_RADIUS;

  for (var row = 0; row <= 1; row += 1) {
    var y = row === 0 ? CARD_HEIGHT / 2 : -CARD_HEIGHT / 2;

    for (var column = 0; column <= CARD_CURVE_SEGMENTS; column += 1) {
      var u = column / CARD_CURVE_SEGMENTS;
      var angle = (u - 0.5) * arcAngle;

      positions.push(
        Math.sin(angle) * RING_RADIUS,
        y,
        Math.cos(angle) * RING_RADIUS - RING_RADIUS
      );
      uvs.push(u, 1 - row);
    }
  }

  for (var segment = 0; segment < CARD_CURVE_SEGMENTS; segment += 1) {
    var topLeft = segment;
    var topRight = segment + 1;
    var bottomLeft = CARD_CURVE_SEGMENTS + 1 + segment;
    var bottomRight = bottomLeft + 1;

    indices.push(topLeft, bottomLeft, topRight, topRight, bottomLeft, bottomRight);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function initHeroGallery() {
  if (!heroGallery || !canvas || typeof window.gsap === "undefined") {
    return;
  }

  var gsap = window.gsap;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var width = heroGallery.clientWidth;
  var height = heroGallery.clientHeight;

  if (width === 0 || height === 0) {
    return;
  }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (error) {
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, width / height, 10, 5000);
  camera.position.set(0, 0, 1400);
  camera.lookAt(0, 0, 0);

  var ring = new THREE.Group();
  ring.rotation.z = THREE.MathUtils.degToRad(12);
  ring.rotation.x = THREE.MathUtils.degToRad(-4);
  scene.add(ring);

  var loader = new THREE.TextureLoader();
  var cards = [];

  IMAGE_URLS.forEach(function (url, index) {
    var geometry = createCurvedCardGeometry();
    var material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    var mesh = new THREE.Mesh(geometry, material);

    var angle = (index / CARD_COUNT) * Math.PI * 2;
    mesh.position.set(Math.sin(angle) * RING_RADIUS, 0, Math.cos(angle) * RING_RADIUS);
    mesh.rotation.y = angle;
    mesh.userData.galleryIndex = index;

    ring.add(mesh);
    cards.push(mesh);

    loader.load(
      url,
      function handleTextureLoaded(texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        material.map = texture;
        material.needsUpdate = true;
        gsap.to(material, { opacity: 1, duration: 0.6 });
      },
      undefined,
      function handleTextureError() {
        /* 이미지 하나가 실패해도 나머지 카드는 그대로 보여줍니다. */
      }
    );
  });

  function render() {
    renderer.render(scene, camera);
  }

  var rotation = { deg: 0 };
  var autoTween = null;
  var pauseReasons = new Set();
  var hoveredCard = null;

  function applyRotation() {
    ring.rotation.y = (rotation.deg * Math.PI) / 180;
  }

  function startAutoRotate() {
    if (prefersReducedMotion || autoTween !== null || pauseReasons.size > 0) {
      return;
    }
    autoTween = gsap.to(rotation, {
      deg: rotation.deg + 360,
      duration: FULL_TURN_DURATION_S,
      ease: "none",
      repeat: -1,
      onUpdate: applyRotation
    });
  }

  function stopAutoRotate() {
    if (autoTween !== null) {
      autoTween.kill();
      autoTween = null;
    }
  }

  function focusCard(index) {
    pauseReasons.add("navigation");
    stopAutoRotate();

    var cardAngleDeg = (index / CARD_COUNT) * 360;
    var targetMod = ((-cardAngleDeg % 360) + 360) % 360;
    var currentMod = ((rotation.deg % 360) + 360) % 360;
    var shortestDelta = ((targetMod - currentMod + 540) % 360) - 180;

    gsap.to(rotation, {
      deg: rotation.deg + shortestDelta,
      duration: FOCUS_TWEEN_DURATION_S,
      ease: "power2.out",
      onUpdate: applyRotation
    });
  }

  function handleNavFocusIn(event) {
    var index = Number(event.currentTarget.getAttribute("data-gallery-index"));
    focusCard(index);
  }

  function handleNavFocusOut() {
    pauseReasons.delete("navigation");
    startAutoRotate();
  }

  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();

  function setHoveredCard(nextCard) {
    if (hoveredCard === nextCard) {
      return;
    }

    if (hoveredCard) {
      gsap.to(hoveredCard.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.45,
        ease: "power2.out",
        overwrite: true
      });
    }

    hoveredCard = nextCard;

    if (hoveredCard) {
      pauseReasons.add("card");
      stopAutoRotate();
      canvas.style.cursor = "pointer";
      gsap.to(hoveredCard.scale, {
        x: CARD_HOVER_SCALE,
        y: CARD_HOVER_SCALE,
        z: CARD_HOVER_SCALE,
        duration: 0.45,
        ease: "power2.out",
        overwrite: true
      });
    } else {
      pauseReasons.delete("card");
      canvas.style.cursor = "default";
      startAutoRotate();
    }
  }

  function handleCanvasPointerMove(event) {
    var bounds = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    var intersections = raycaster.intersectObjects(cards, false);
    setHoveredCard(intersections.length ? intersections[0].object : null);
  }

  canvas.addEventListener("pointermove", handleCanvasPointerMove);
  canvas.addEventListener("pointerleave", function () {
    setHoveredCard(null);
  });

  navLinks.forEach(function (link) {
    link.addEventListener("mouseenter", handleNavFocusIn);
    link.addEventListener("focus", handleNavFocusIn);
    link.addEventListener("mouseleave", handleNavFocusOut);
    link.addEventListener("blur", handleNavFocusOut);
  });

  function handleWindowResize() {
    var newWidth = heroGallery.clientWidth;
    var newHeight = heroGallery.clientHeight;

    if (newWidth === 0 || newHeight === 0) {
      return;
    }

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight, false);
  }

  window.addEventListener("resize", handleWindowResize);

  gsap.ticker.add(render);
  heroGallery.classList.add("is_ready");
  startAutoRotate();
}

initHeroGallery();
