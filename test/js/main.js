(function () {
  "use strict";

  var brandSection = document.getElementById("brand");
  var brandTrack = document.getElementById("brand_track");

  var isGsapReady = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (!brandSection || !brandTrack || !isGsapReady) {
    return;
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;

  gsap.registerPlugin(ScrollTrigger);

  /* 세로 스크롤바를 뺀 실제 폭을 패널 폭으로 사용합니다. */
  function setPanelWidth() {
    brandSection.style.setProperty("--brand_panel_width", brandSection.clientWidth + "px");
  }

  function getScrollDistance() {
    return Math.max(0, brandTrack.scrollWidth - brandSection.clientWidth);
  }

  /* brand 가로 스크롤 — 768px 이상, 모션 감소 설정이 아닐 때만 동작합니다.
     그 외에는 세로로 쌓인 기본 레이아웃을 그대로 사용합니다. */
  gsap.matchMedia().add(
    "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
    function () {
      brandSection.classList.add("is_horizontal");
      setPanelWidth();
      ScrollTrigger.addEventListener("refreshInit", setPanelWidth);

      var tween = gsap.to(brandTrack, {
        x: function () {
          return -getScrollDistance();
        },
        ease: "none"
      });

      ScrollTrigger.create({
        animation: tween,
        trigger: brandSection,
        start: "top top",
        end: function () {
          return "+=" + getScrollDistance();
        },
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true
      });

      return function cleanup() {
        ScrollTrigger.removeEventListener("refreshInit", setPanelWidth);
        brandSection.style.removeProperty("--brand_panel_width");
        brandSection.classList.remove("is_horizontal");
      };
    }
  );
})();

/* shop — 상품 목록을 한 벌 복제해 CSS 자동 흐름이 끊기지 않게 합니다. */
(function () {
  "use strict";

  var shopLooks = document.getElementById("shop_looks");

  if (!shopLooks) {
    return;
  }

  Array.prototype.slice.call(shopLooks.children).forEach(function (look) {
    var clone = look.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    shopLooks.appendChild(clone);
  });
})();

/* 코디 — 이전/다음 버튼으로 선택한 룩을 가운데 자리로 옮깁니다. */
(function () {
  "use strict";

  var codiLooks = document.getElementById("codi_looks");
  var prevButton = document.getElementById("codi_prev");
  var nextButton = document.getElementById("codi_next");
  var countText = document.getElementById("codi_count");

  if (!codiLooks || !prevButton || !nextButton || !countText) {
    return;
  }

  /* 활성 룩 기준 순서(0=가운데)대로 나열한 자리 이름입니다. */
  var POSITION_CLASSES = [
    "is_pos_center",
    "is_pos_right",
    "is_pos_far_right",
    "is_pos_far_left",
    "is_pos_left"
  ];

  var looks = Array.prototype.slice.call(codiLooks.children);
  var activeIndex = 2;

  function renderLooks() {
    looks.forEach(function (look, index) {
      var offset = (index - activeIndex + looks.length) % looks.length;

      look.classList.remove.apply(look.classList, POSITION_CLASSES);
      look.classList.add(POSITION_CLASSES[offset]);
    });

    countText.textContent = (activeIndex + 1) + "/" + looks.length;
  }

  function moveLook(step) {
    activeIndex = (activeIndex + step + looks.length) % looks.length;
    renderLooks();
  }

  prevButton.addEventListener("click", function handlePrevClick() {
    moveLook(-1);
  });

  nextButton.addEventListener("click", function handleNextClick() {
    moveLook(1);
  });

  renderLooks();
})();
