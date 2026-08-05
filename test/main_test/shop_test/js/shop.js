/* hero — 갤러리 사진을 순서대로 강조(원통형 회전 연출)하고, 카테고리 hover/focus 시
   해당 사진을 바로 강조하며 자동 순환을 멈춥니다. 호버를 떼면 그 지점부터 다시 순환합니다. */
(function () {
  "use strict";

  var heroGallery = document.querySelector(".hero_gallery");
  var galleryImages = heroGallery
    ? Array.prototype.slice.call(heroGallery.querySelectorAll(".hero_gallery_image"))
    : [];
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".hero_nav_link"));

  if (!heroGallery || galleryImages.length === 0) {
    return;
  }

  var ROTATE_INTERVAL_MS = 3200;
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var activeIndex = 0;
  var timerId = null;

  function setFeatured(index) {
    activeIndex = index;
    galleryImages.forEach(function (image, i) {
      image.classList.toggle("is_featured", i === activeIndex);
    });
  }

  function handleAutoRotateTick() {
    setFeatured((activeIndex + 1) % galleryImages.length);
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
    setFeatured(index);
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

  setFeatured(0);
  startAutoRotate();
})();
