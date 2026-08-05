/* hero — 8장의 사진이 4개의 고정 자리를 돌아가며 채우는 원통형 회전입니다.
   페이지 진입 즉시 자동 회전이 시작되고(ALL/NEW는 그 순환 중 하나일 뿐 고정값이
   아닙니다), 카테고리 hover/focus 시 그 카테고리의 사진이 즉시 중앙(featured)
   자리로 오면서 자동 회전이 멈추고, 벗어나면 멈춘 지점부터 다시 돌아갑니다. */
(function () {
  "use strict";

  var heroGallery = document.getElementById("hero_gallery");
  var galleryImages = heroGallery
    ? Array.prototype.slice.call(heroGallery.querySelectorAll(".hero_gallery_image"))
    : [];
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".hero_nav_link"));

  if (!heroGallery || galleryImages.length === 0) {
    return;
  }

  /* 활성 사진 기준 순서(0=중앙 featured)대로 나열한 자리 이름입니다.
     자리를 받지 못한 사진(offset 4 이상)은 숨깁니다. */
  var POSITION_CLASSES = ["is_pos_featured", "is_pos_b", "is_pos_c", "is_pos_d"];
  var ROTATE_INTERVAL_MS = 3200;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var activeIndex = 0;
  var timerId = null;

  function renderGallery() {
    galleryImages.forEach(function (image, index) {
      var offset = (index - activeIndex + galleryImages.length) % galleryImages.length;

      image.classList.remove.apply(image.classList, POSITION_CLASSES);
      if (offset < POSITION_CLASSES.length) {
        image.classList.add(POSITION_CLASSES[offset]);
      }
    });
  }

  function setActive(index) {
    activeIndex = index;
    renderGallery();
  }

  function handleAutoRotateTick() {
    setActive((activeIndex + 1) % galleryImages.length);
  }

  function startAutoRotate() {
    if (prefersReducedMotion || timerId !== null) {
      return;
    }
    timerId = window.setInterval(handleAutoRotateTick, ROTATE_INTERVAL_MS);
  }

  function stopAutoRotate() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function handleNavFocusIn(event) {
    var index = Number(event.currentTarget.getAttribute("data-gallery-index"));
    stopAutoRotate();
    setActive(index);
  }

  function handleNavFocusOut() {
    startAutoRotate();
  }

  navLinks.forEach(function (link) {
    link.addEventListener("mouseenter", handleNavFocusIn);
    link.addEventListener("focus", handleNavFocusIn);
    link.addEventListener("mouseleave", handleNavFocusOut);
    link.addEventListener("blur", handleNavFocusOut);
  });

  renderGallery();
  startAutoRotate();
})();
