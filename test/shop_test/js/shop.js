import * as THREE from "three";

/* 발표용 상품 상세 연결.
   현재 상세 템플릿이 하나이므로 ALL / NEW의 열 개 카드에서 이미지, 상품명,
   가방 아이콘을 누르면 모두 같은 상세페이지로 이동합니다. 상품별 상세가
   추가되면 각 카드의 상품 식별값에 따라 경로만 나누면 됩니다. */
(function connectProductDetailLinks() {
  var detailUrl = "../shop_detail_test/index.html";
  var productLinks = document.querySelectorAll(
    ".card_product_media_link, .card_product_link, .card_product_action[href]"
  );

  productLinks.forEach(function (link) {
    link.setAttribute("href", detailUrl);
  });
})();

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
var CARD_WIDTH = 600;
var CARD_HEIGHT = 872;
var RING_RADIUS = 900;
var CARD_CURVE_SEGMENTS = 32;
var CARD_HOVER_SCALE = 1.12;
var FULL_TURN_DURATION_S = 40;
var FOCUS_TWEEN_DURATION_S = 0.8;

function createCurvedCardGeometry(cardHeight) {
  var geometry = new THREE.BufferGeometry();
  var positions = [];
  var uvs = [];
  var indices = [];
  var arcAngle = CARD_WIDTH / RING_RADIUS;

  for (var row = 0; row <= 1; row += 1) {
    var y = row === 0 ? cardHeight / 2 : -cardHeight / 2;

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

/* 원본 비율은 유지하면서 모든 사진이 동일한 카드 면을 꽉 채우게 합니다.
   CSS의 object-fit: cover와 같은 방식이라 남는 부분만 중앙 기준으로 잘립니다. */
function coverTextureWithoutStretching(texture, imageWidth, imageHeight) {
  var imageAspect = imageWidth / imageHeight;
  var cardAspect = CARD_WIDTH / CARD_HEIGHT;

  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);

  if (imageAspect > cardAspect) {
    texture.repeat.x = cardAspect / imageAspect;
    texture.offset.x = (1 - texture.repeat.x) / 2;
  } else {
    texture.repeat.y = imageAspect / cardAspect;
    texture.offset.y = (1 - texture.repeat.y) / 2;
  }
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
  /* 가장 앞쪽 카드(RING_RADIUS만큼 카메라에 가까움)가 호버로 확대되고
     원통 전체가 기울어져도 상하가 잘리지 않도록 충분한 프레이밍을 확보합니다. */
  camera.position.set(0, 0, 2600);
  camera.lookAt(0, 0, 0);

  var ring = new THREE.Group();
  ring.position.x = 80;
  ring.rotation.z = THREE.MathUtils.degToRad(12);
  ring.rotation.x = THREE.MathUtils.degToRad(-4);
  scene.add(ring);

  var loader = new THREE.TextureLoader();
  var cards = [];

  IMAGE_URLS.forEach(function (url, index) {
    var geometry = createCurvedCardGeometry(CARD_HEIGHT);
    var material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.FrontSide
    });
    var backMaterial = new THREE.MeshBasicMaterial({
      color: 0x191817,
      side: THREE.BackSide
    });
    var card = new THREE.Group();
    var mesh = new THREE.Mesh(geometry, material);
    var backMesh = new THREE.Mesh(geometry, backMaterial);

    card.add(mesh);
    card.add(backMesh);

    var angle = (index / CARD_COUNT) * Math.PI * 2;
    card.position.set(Math.sin(angle) * RING_RADIUS, 0, Math.cos(angle) * RING_RADIUS);
    card.rotation.y = angle;
    card.userData.galleryIndex = index;
    mesh.userData.galleryIndex = index;
    mesh.userData.hoverTarget = card;

    ring.add(card);
    cards.push(mesh);

    loader.load(
      url,
      function handleTextureLoaded(texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        coverTextureWithoutStretching(texture, texture.image.width, texture.image.height);
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
    heroGallery.parentElement.querySelector(".hero_nav").classList.add("has_active");
    navLinks.forEach(function (link) {
      link.classList.toggle("is_active", link === event.currentTarget);
    });
    focusCard(index);
  }

  function handleNavFocusOut() {
    heroGallery.parentElement.querySelector(".hero_nav").classList.remove("has_active");
    navLinks.forEach(function (link) {
      link.classList.remove("is_active");
    });
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
    setHoveredCard(
      intersections.length ? intersections[0].object.userData.hoverTarget : null
    );
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

/* garment_story — 원형 내비 4개(Baeja/Cheollik/Geodeul/Sapok baji)가 휠 스크롤
   양에 비례해 연속적으로 부드럽게 도는 원통형 인터랙션입니다(레퍼런스
   orionix.framer.website/about의 연도 타임라인 참고). 정수 스텝 사이를
   딱딱 끊어 전환하는 대신, "진행도"를 실수(progress)로 두고 GSAP 트윈으로
   목표값까지 관성감 있게 따라가게 하면서 매 프레임 각도를 다시 계산합니다.
   섹션이 화면 상단에 sticky로 붙어있는 동안 휠을 가로채고, 첫/마지막
   가먼트에서 그 방향으로 더 스크롤하면 그대로 흘려보내 페이지 스크롤이
   자연스럽게 이어지게 합니다. */
(function () {
  "use strict";

  var section = document.getElementById("garment_story_section");
  var scrollWrap = document.querySelector(".garment_story_scroll");
  var orbitList = document.getElementById("garment_orbit_list");
  var marker = document.querySelector(".garment_orbit_marker");
  var infoWrap = document.getElementById("garment_info");
  var mediaWrap = document.getElementById("garment_media");

  if (
    !section ||
    !scrollWrap ||
    !orbitList ||
    !infoWrap ||
    !mediaWrap ||
    typeof window.gsap === "undefined" ||
    typeof window.ScrollTrigger === "undefined"
  ) {
    return;
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  var ORDER = ["baeja", "cheollik", "geodeul", "sapok_baji"];
  var STEP_COUNT = ORDER.length;
  var CENTER_X = 400;
  var CENTER_Y = 400;
  /* 점(마커)이 원 중심에서 떨어진 거리 — 원 그래픽(garment_circle.svg)
     자체의 반지름(400)과 맞춰뒀습니다. */
  var MARKER_RADIUS = 400;
  /* 점과 글자 사이 간격 — 라벨을 "안쪽 끝" 기준으로 배치하므로 글자
     길이와 상관없이 네 항목 모두 이 값 하나로 통일됩니다. 늘리면 모든
     라벨이 원 바깥쪽으로 똑같이 밀려납니다.
     (CSS .garment_orbit_item의 left 기본값 418px = 400 + 18과 같은 값입니다.) */
  var LABEL_GAP = 18;
  /* 라벨의 안쪽 끝이 놓이는 거리. */
  var LABEL_RADIUS = MARKER_RADIUS + LABEL_GAP;
  /* 가먼트 하나당 원 둘레를 도는 각도 — 늘리면 라벨들 사이 간격이
     넓어집니다(원래 Figma 시안은 30도였습니다). */
  var STEP_ANGLE_DEG = 52;
  /* 설명과 이미지가 맞닿아 보이지 않도록 한 화면 높이보다 더 떨어뜨립니다. */
  var CONTENT_SPACING_MULTIPLIER = 2;
  /* 숫자가 작을수록 적은 스크롤로 네 콘텐츠를 빠르게 통과합니다. */
  var SCROLL_DISTANCE_PERCENT = 450;
  /* 숫자가 클수록 가먼트 한 칸 넘어가는 데 휠을 더 많이 굴려야 해서,
     한 항목에 머무르는 시간(=사용자가 쉬는 시간)이 늘어납니다.
     시안에 없는 값이라 추정치이며, 더 여유를 주고 싶으면 이 숫자를
     올리세요(예: 1400, 1800...). */
  var orbitItems = Array.prototype.slice.call(orbitList.querySelectorAll(".garment_orbit_item"));
  var panels = Array.prototype.slice.call(infoWrap.querySelectorAll(".garment_panel"));
  var mediaImages = Array.prototype.slice.call(mediaWrap.querySelectorAll(".garment_media_img"));

  var state = { progress: 0 };

  function applyProgress() {
    var roundedIndex = Math.max(0, Math.min(STEP_COUNT - 1, Math.round(state.progress)));
    var activeGarment = ORDER[roundedIndex];

    orbitItems.forEach(function (item) {
      var itemIndex = ORDER.indexOf(item.getAttribute("data-garment"));
      var offset = itemIndex - state.progress;
      var angleDeg = offset * STEP_ANGLE_DEG;
      var angleRad = (angleDeg * Math.PI) / 180;
      var x = CENTER_X + LABEL_RADIUS * Math.cos(angleRad);
      var y = CENTER_Y + LABEL_RADIUS * Math.sin(angleRad);

      item.style.left = x.toFixed(2) + "px";
      item.style.top = y.toFixed(2) + "px";
      /* transform-origin이 left center라 세로만 가운데로 당기면 됩니다
         (가로로 -50% 당기면 다시 글자 길이만큼 간격이 틀어집니다). */
      item.style.transform = "translate(0, -50%) rotate(" + angleDeg.toFixed(2) + "deg)";
      item.classList.toggle("is_pos_active", itemIndex === roundedIndex);

      /* 마커(점)는 항상 "현재 활성으로 지정된 항목"이 실제로 그려지고 있는
         자리를 그대로 따라갑니다 — 전환 중에는 그 항목과 함께 부드럽게
         움직이다가, 활성 항목이 바뀌는 순간 다음 항목의 자리로 휙 넘어갑니다. */
      if (itemIndex === roundedIndex && marker) {
        var markerX = CENTER_X + MARKER_RADIUS * Math.cos(angleRad);
        var markerY = CENTER_Y + MARKER_RADIUS * Math.sin(angleRad);
        marker.style.left = markerX.toFixed(2) + "px";
        marker.style.top = markerY.toFixed(2) + "px";
      }
    });

    panels.forEach(function (panel) {
      var panelIndex = ORDER.indexOf(panel.getAttribute("data-garment"));
      var panelOffset = panelIndex - state.progress;
      var panelY = panelOffset * infoWrap.clientHeight * CONTENT_SPACING_MULTIPLIER;
      var panelIsNear = Math.abs(panelOffset) < 1.05;

      panel.style.transform = "translate3d(0, " + panelY.toFixed(2) + "px, 0)";
      panel.style.opacity = panelIsNear ? "1" : "0";
      panel.classList.toggle("is_active", panel.getAttribute("data-garment") === activeGarment);
    });

    mediaImages.forEach(function (img) {
      var imageIndex = ORDER.indexOf(img.getAttribute("data-garment"));
      var imageOffset = imageIndex - state.progress;
      var imageY = imageOffset * mediaWrap.clientHeight * CONTENT_SPACING_MULTIPLIER;
      var imageIsNear = Math.abs(imageOffset) < 1.05;

      img.style.transform = "translate3d(0, " + imageY.toFixed(2) + "px, 0)";
      img.style.opacity = imageIsNear ? "1" : "0";
      img.classList.toggle("is_active", img.getAttribute("data-garment") === activeGarment);
    });
  }

  function isSectionEngaged() {
    var rect = section.getBoundingClientRect();
    return Math.abs(rect.top) <= STICKY_ENGAGED_TOLERANCE_PX;
  }

  function animateTo(nextTarget) {
    targetProgress = nextTarget;

    if (rotateTween) {
      rotateTween.kill();
    }

    /* duration을 늘리면 한 칸 넘어갈 때 도는 동작 자체가 더 느리고
       부드러워집니다. ease를 "power1.out"처럼 더 약한 곡선으로 바꾸면
       가속이 완만해져서 더 차분한 느낌을 줍니다. */
    rotateTween = gsap.to(state, {
      progress: targetProgress,
      duration: 1.6,
      ease: "power2.out",
      onUpdate: applyProgress
    });
  }

  function handleWheel(event) {
    if (!isSectionEngaged()) {
      return;
    }

    var atStartGoingUp = targetProgress <= 0 && event.deltaY < 0;
    var atEndGoingDown = targetProgress >= STEP_COUNT - 1 && event.deltaY > 0;

    if (atStartGoingUp || atEndGoingDown) {
      /* 첫/마지막 가먼트를 넘어가려는 스크롤은 가로채지 않고 그대로
         페이지 스크롤로 흘려보냅니다. */
      return;
    }

    var proposed = targetProgress + event.deltaY * WHEEL_SENSITIVITY;
    var clamped = Math.max(0, Math.min(STEP_COUNT - 1, proposed));

    event.preventDefault();
    animateTo(clamped);
  }

  applyProgress();

  var garmentTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: scrollWrap,
      start: "top top",
      end: "+=" + SCROLL_DISTANCE_PERCENT + "%",
      pin: section,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: true,
      invalidateOnRefresh: true
    }
  });

  garmentTimeline
    .to(state, {
      progress: STEP_COUNT - 1,
      duration: 1,
      ease: "none",
      onUpdate: applyProgress
    });
})();

/* shop — 카테고리 선택 목록. 버튼을 누르면 일곱 개 항목이 위에서부터 하나씩
   이어서 나타납니다. 실제 지연 계산은 css/shop.css의 --shop_select_delay /
   --shop_select_stagger가 하고, 여기서는 몇 번째 항목인지만 넘겨줍니다.

   지금은 목록에서 고르면 버튼 글자만 바뀌고 아래 상품은 그대로입니다.
   상품마다 어느 카테고리인지가 아직 마크업에 없어서, 거를 기준이 없습니다. */
(function initShopSelect() {
  "use strict";

  var wrap = document.getElementById("shop_select_wrap");
  var button = document.getElementById("shop_select_button");
  var list = document.getElementById("shop_select_list");

  if (!wrap || !button || !list) {
    return;
  }

  var label = button.querySelector(".shop_select_label");
  var items = Array.prototype.slice.call(list.querySelectorAll(".shop_select_item"));

  items.forEach(function (item, index) {
    item.style.setProperty("--shop_select_index", String(index));
  });

  function openList() {
    list.classList.add("is_open");
    button.setAttribute("aria-expanded", "true");
  }

  /* focusButton은 Escape나 항목 선택처럼 사용자가 직접 닫은 경우에만 참입니다.
     바깥을 클릭해서 닫힐 때까지 버튼으로 포커스를 끌어오면, 사용자가 누른
     곳이 아니라 엉뚱한 데로 포커스가 튑니다. */
  function closeList(focusButton) {
    list.classList.remove("is_open");
    button.setAttribute("aria-expanded", "false");

    if (focusButton) {
      button.focus();
    }
  }

  function isOpen() {
    return list.classList.contains("is_open");
  }

  button.addEventListener("click", function () {
    if (isOpen()) {
      closeList(false);
    } else {
      openList();
    }
  });

  items.forEach(function (item) {
    var option = item.querySelector(".shop_select_option");

    if (!option) {
      return;
    }

    option.addEventListener("click", function () {
      items.forEach(function (other) {
        other.classList.remove("is_selected");
        other.setAttribute("aria-selected", "false");
      });

      item.classList.add("is_selected");
      item.setAttribute("aria-selected", "true");

      if (label) {
        label.textContent = option.textContent.trim();
      }

      closeList(true);
    });
  });

  /* 목록 바깥을 누르면 닫힙니다. 버튼도 wrap 안에 있으므로 위 토글 처리와
     겹치지 않습니다. */
  document.addEventListener("click", function (event) {
    if (isOpen() && !wrap.contains(event.target)) {
      closeList(false);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isOpen()) {
      closeList(true);
    }
  });
})();

/* motif_detail — 관련 상품 스트립. 카드 크기는 선택된 카드(가장 큼), 그 양옆
   (중간), 나머지(가장 작음) 3단계이고 크기 규칙은 전부 CSS에 있습니다. 여기서는
   is_selected 클래스를 옮기는 일만 합니다. hover나 키보드 focus가 들어오면 그
   카드로 옮기고, 빠져나가도 되돌리지 않아 마지막으로 본 상품에 머무릅니다
   (Figma 주석: hover 해제 시 현재 선택된 상품 중심으로 복귀). */
(function initMotifProductStrip() {
  "use strict";

  var strip = document.getElementById("motif_product_strip");

  if (!strip) {
    return;
  }

  var cards = Array.prototype.slice.call(strip.querySelectorAll(".motif_product_card"));

  function selectCard(card) {
    if (card.classList.contains("is_selected")) {
      return;
    }

    cards.forEach(function (item) {
      item.classList.toggle("is_selected", item === card);
    });
  }

  cards.forEach(function (card) {
    function handleSelect() {
      selectCard(card);
    }

    card.addEventListener("mouseenter", handleSelect);
    /* 키보드로 탭 이동할 때도 따라오게 합니다. 없으면 focus 링만 옮겨다니고
       크기는 그대로라 지금 어디에 있는지 알아보기 어렵습니다. */
    card.addEventListener("focus", handleSelect);
  });
})();

/* motif_detail — 왼쪽 설명 블록이 오른쪽 영상을 따라 아래로 내려옵니다.
   영상 위 끝에서 시작해 영상 아래 끝에서 멈추므로, 그 아래 관련 상품 영역까지
   넘어가지 않습니다. scrub으로 스크롤 위치에 묶어둬서 되감으면 같이 올라옵니다
   (Figma 주석: "스크롤시 오른쪽 영상을 따라서 밑으로 내려옴"). */
(function initMotifReferenceScroll() {
  "use strict";

  var hero = document.querySelector(".motif_hero");
  var reference = document.getElementById("motif_reference");
  var video = document.querySelector(".motif_video");

  if (!hero || !reference || !video || typeof window.gsap === "undefined" || !window.ScrollTrigger) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  gsap.to(reference, {
    /* 영상 높이에서 글 블록 높이를 뺀 만큼 = 영상 위 끝에서 아래 끝까지.
       함수로 두면 창 크기가 바뀔 때 invalidateOnRefresh가 다시 계산합니다. */
    y: function () {
      return video.offsetHeight - reference.offsetHeight;
    },
    ease: "none",
    scrollTrigger: {
      trigger: hero,
      /* 영상 위 끝이 화면 위에 닿을 때 시작해서, 영상 아래 끝이 화면 아래에
         닿을 때 끝납니다. 이 구간이 곧 "영상이 화면을 지나가는 동안"입니다. */
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      invalidateOnRefresh: true
    }
  });
})();
