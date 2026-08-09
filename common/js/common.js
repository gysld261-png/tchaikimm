(function () {
  "use strict";

  /* =========================================================
     부드러운 스크롤 (Lenis 1.3.26) — 모든 페이지 공통

     ★ 스크롤 감각을 바꾸려면 아래 세 숫자만 고치면 됩니다.
       이 파일은 공통 파일이라 여기를 고치면 전 페이지가 함께 바뀝니다.
       페이지별 CSS나 JS에 따로 복사하지 마세요.

     ─────────────────────────────────────────────────────────
     SCROLL_LERP — "얼마나 늦게 따라오는가" (0에 가까울수록 부드러움)

       Lenis는 매 프레임 [지금 위치]를 [목표 위치]쪽으로 이 비율만큼 당깁니다.
       값이 작을수록 천천히 따라와 미끄러지는 느낌이 강해지고,
       클수록 손가락에 딱 붙는 느낌이 됩니다.

       0.02  아주 미끄러움 — 멈춘 뒤에도 한참 흐릅니다. 멀미가 날 수 있습니다
       0.035 부드러움  ← 현재 값
       0.06  중간
       0.1   Lenis 기본값 (거의 즉각적)

       ※ 너무 낮추면 "부드럽다"가 아니라 "반응이 굼뜨다"로 느껴집니다.
         0.02 아래로는 권하지 않습니다.

     ─────────────────────────────────────────────────────────
     SCROLL_WHEEL — 휠 한 칸에 움직이는 거리 배수

       1이 브라우저 기본 거리입니다. 낮출수록 한 칸이 조금씩만 움직여
       묵직하고 정교한 느낌이 되고, 높이면 성큼성큼 넘어갑니다.
       0.55 묵직함  /  0.7 현재 값  /  1 기본  /  1.5 빠름

       ※ 이 값을 낮추면 페이지 끝까지 가는 데 휠을 더 많이 굴려야 합니다.
         페이지가 긴 편이라 0.5 아래로는 권하지 않습니다.

     ─────────────────────────────────────────────────────────
     SCROLL_TOUCH — 터치(모바일) 손가락 이동 거리 배수

       ※ 터치는 기본적으로 브라우저 native 스크롤을 씁니다.
         syncTouch를 켜지 않는 한 이 값은 거의 영향이 없습니다.
         모바일 관성 스크롤은 OS가 이미 잘 처리하므로 건드리지 않는 것을
         권합니다 — 켜면 iOS에서 오히려 끊겨 보이는 경우가 많습니다.
     ─────────────────────────────────────────────────────────

     조정 후에는 실제 마우스 휠로 확인하세요. 숫자만 보고는 판단할 수 없습니다.
     ========================================================= */
  var SCROLL_LERP = 0.035;
  var SCROLL_WHEEL = 0.7;
  var SCROLL_TOUCH = 1.6;

  function initSmoothScroll() {
    /* Lenis나 GSAP이 없으면(CDN 차단 등) 브라우저 기본 스크롤을 그대로 씁니다.
       모션 최소화 설정에서는 일부러 켜지 않습니다 — 부드러운 스크롤은
       사용자가 끄고 싶어 하는 종류의 움직임입니다. */
    if (
      typeof window.Lenis === "undefined" ||
      typeof window.gsap === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    var gsap = window.gsap;
    var lenis = new window.Lenis({
      /* GSAP 티커가 프레임을 돌리므로 Lenis 자체 rAF는 끕니다.
         둘 다 켜면 한 프레임에 두 번 계산돼 속도가 어긋납니다. */
      autoRaf: false,
      lerp: SCROLL_LERP,
      wheelMultiplier: SCROLL_WHEEL,
      touchMultiplier: SCROLL_TOUCH
    });

    /* ScrollTrigger에 스크롤이 움직였다고 알려줍니다. 이게 없으면 pin·scrub이
       Lenis가 만든 위치를 못 따라와 한 박자씩 늦게 반응합니다. */
    if (window.ScrollTrigger) {
      lenis.on("scroll", window.ScrollTrigger.update);
    }

    /* Lenis를 GSAP 티커에 물립니다. 시간 단위가 초(GSAP) / 밀리초(Lenis)로
       달라 1000을 곱합니다. */
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });

    /* 탭을 오래 비웠다 돌아오면 프레임 간격이 몇 초씩 벌어지는데, GSAP이 그걸
       보정하려고 시간을 건너뛰면 스크롤이 뚝뚝 끊깁니다. 보정을 끕니다. */
    gsap.ticker.lagSmoothing(0);

    /* 콘솔에서 window.tchaikimmLenis로 실시간 조정해 볼 수 있습니다.
       예: window.tchaikimmLenis.options.lerp = 0.02
       새로고침하면 위 상수 값으로 돌아갑니다 — 마음에 드는 값을 찾은 뒤
       이 파일의 상수를 고치세요. */
    window.tchaikimmLenis = lenis;
  }

  function initProductCards() {
    var mediaBoxes = Array.prototype.slice.call(
      document.querySelectorAll(".card_product_media")
    );

    mediaBoxes.forEach(function (media) {
      var actions = Array.prototype.slice.call(
        media.querySelectorAll(".card_product_action")
      );

      actions.forEach(function (action, index) {
        action.style.setProperty("--card_action_index", String(index));
      });
    });

    var productImages = Array.prototype.slice.call(
      document.querySelectorAll(".card_product_img[data-hover-src]")
    );

    /* hover 이미지를 실제로 내려받아 카드에 끼워 넣습니다.
       기존 동작(미리 받아 두고 hover 시 즉시 전환)은 그대로입니다 — 언제
       시작하느냐만 달라집니다. */
    function attachHoverImage(defaultImage) {
      var hoverSrc = (defaultImage.getAttribute("data-hover-src") || "").trim();
      var media = defaultImage.closest(".card_product_media");

      if (!hoverSrc || !media || media.classList.contains("has_hover_image")) {
        return;
      }

      /* 같은 카드가 두 번 들어오지 않도록 먼저 표시합니다. onload를 기다리면
         그 사이에 다시 호출될 수 있습니다. */
      media.classList.add("has_hover_image");

      var preload = new Image();

      preload.onload = function () {
        var hoverImage = document.createElement("img");
        hoverImage.className = "card_product_img card_product_img_hover";
        hoverImage.src = hoverSrc;
        hoverImage.alt = "";
        hoverImage.setAttribute("aria-hidden", "true");

        defaultImage.classList.add("card_product_img_default");
        defaultImage.parentNode.insertBefore(hoverImage, defaultImage.nextSibling);
      };

      preload.onerror = function () {
        /* 파일이 없으면 hover 전환만 생기지 않고 카드는 그대로 동작합니다 */
        media.classList.remove("has_hover_image");
      };

      preload.src = hoverSrc;
    }

    /* ★ 예전에는 페이지가 열리자마자 hover 이미지를 전부 내려받았습니다.
       shop 페이지 기준 10장 32MB로, 사용자가 카드에 마우스를 올리지 않아도
       첫 화면 로딩과 대역폭을 그만큼 잡아먹었습니다.
       지금은 카드가 화면 근처(200px 앞)에 왔을 때 받습니다 — 화면에 보이는
       카드는 hover 전에 이미 준비되므로 체감 동작은 같습니다.
       IntersectionObserver가 없는 환경에서는 예전처럼 전부 받습니다. */
    if (typeof window.IntersectionObserver === "undefined") {
      productImages.forEach(attachHoverImage);
      return;
    }

    var hoverObserver = new window.IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          hoverObserver.unobserve(entry.target);
          attachHoverImage(entry.target);
        });
      },
      { rootMargin: "200px" }
    );

    productImages.forEach(function (defaultImage) {
      hoverObserver.observe(defaultImage);
    });
  }

  initSmoothScroll();

  var componentSlots = Array.prototype.slice.call(document.querySelectorAll("[data-component]"));

  function loadComponent(slot) {
    var componentUrl = slot.getAttribute("data-component");

    return fetch(componentUrl).then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load shared component: " + componentUrl);
      }

      return response.text();
    }).then(function (markup) {
      slot.innerHTML = markup;
      slot.removeAttribute("data-component");
    });
  }

  var HEADER_LOGO_BLACK = "../../asset/logos/header_logo-01.svg";
  var HEADER_LOGO_WHITE = "../../asset/logos/header_logo-02.svg";

  // data-header-variant로 정한 페이지 기본값. 배경색을 읽지 못할 때 여기로 돌아갑니다.
  var pageHeaderTheme = "white";

  function setHeaderTheme(header, theme) {
    if (!header) {
      return;
    }

    var isBlack = theme === "black";
    if (header.classList.contains(isBlack ? "is_black" : "is_white")) {
      return;
    }

    header.classList.toggle("is_black", isBlack);
    header.classList.toggle("is_white", !isBlack);

    var headerLogo = document.querySelector("[data-header-logo]");
    if (headerLogo) {
      headerLogo.src = isBlack ? HEADER_LOGO_BLACK : HEADER_LOGO_WHITE;
    }
  }

  function applyHeaderVariant() {
    var currentPage = document.body.getAttribute("data-page");
    var header = document.querySelector(".header");
    var currentLink = document.querySelector('[data-nav-page="' + currentPage + '"]');

    pageHeaderTheme = document.body.getAttribute("data-header-variant") === "black" ? "black" : "white";
    setHeaderTheme(header, pageHeaderTheme);

    if (currentLink) {
      currentLink.classList.add("is_active");
      currentLink.setAttribute("aria-current", "page");
    }
  }

  function initCommonBehavior() {

  var DESKTOP_MIN_WIDTH = 1280;
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var headerToggle = document.getElementById("header_toggle");
  var headerInner = document.getElementById("header_inner");
  var header = document.querySelector(".header");
  var lastScrollY = window.scrollY;
  var headerScrollTicking = false;

  // 헤더가 fixed라 아래로 지나가는 배경이 밝은지 어두운지에 따라 글씨가 안 보일 수 있습니다.
  // 헤더가 덮고 있는 지점의 배경색을 읽어 밝기로 흑/백 변형을 고릅니다.
  // 배경이 이미지·영상·그라디언트면 색을 읽을 수 없으므로 페이지 기본값을 씁니다.
  var BACKDROP_SAMPLE_RATIOS = [0.12, 0.5, 0.88];
  var LIGHT_LUMINANCE_THRESHOLD = 0.55;
  var OPAQUE_ALPHA_MIN = 0.5;
  var MEDIA_TAGS = ["IMG", "VIDEO", "CANVAS", "SVG", "PICTURE"];

  function parseRgb(value) {
    var match = /rgba?\(([^)]+)\)/.exec(value);
    if (!match) {
      return null;
    }

    var parts = match[1].split(",").map(function (part) {
      return parseFloat(part);
    });

    if (parts.length < 3 || parts.slice(0, 3).some(isNaN)) {
      return null;
    }

    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts.length > 3 && !isNaN(parts[3]) ? parts[3] : 1
    };
  }

  function relativeLuminance(rgb) {
    var channels = [rgb.r, rgb.g, rgb.b].map(function (value) {
      var ratio = value / 255;
      return ratio <= 0.03928 ? ratio / 12.92 : Math.pow((ratio + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function coversPoint(element, x, y) {
    var rect = element.getBoundingClientRect();

    return rect.width > 0 && rect.height > 0 &&
      x >= rect.left && x <= rect.right &&
      y >= rect.top && y <= rect.bottom;
  }

  // 이미지에 pointer-events: none이 걸려 있으면 elementsFromPoint가 그 이미지를 건너뜁니다.
  // (main hero가 이 경우라 사진 위인데도 뒤쪽 크림색 body를 읽어 버렸습니다.)
  // 그래서 자식 중에 그 지점을 덮는 미디어가 있는지 직접 확인합니다.
  function hasMediaCovering(element, x, y) {
    var children = element.children;

    for (var index = 0; index < children.length; index++) {
      var child = children[index];

      if (MEDIA_TAGS.indexOf(child.tagName.toUpperCase()) === -1) {
        continue;
      }

      if (coversPoint(child, x, y)) {
        return true;
      }
    }

    return false;
  }

  // elementsFromPoint는 그 지점의 요소를 위에서부터 조상 순으로 돌려줍니다.
  // 헤더 자신은 건너뛰고, 처음 만나는 불투명한 배경색을 그 지점의 배경으로 봅니다.
  function backdropLuminanceAt(x, y) {
    var stack = document.elementsFromPoint(x, y);

    for (var index = 0; index < stack.length; index++) {
      var element = stack[index];

      if (header.contains(element)) {
        continue;
      }

      if (MEDIA_TAGS.indexOf(element.tagName.toUpperCase()) !== -1) {
        return null;
      }

      if (hasMediaCovering(element, x, y)) {
        return null;
      }

      var style = window.getComputedStyle(element);
      if (style.backgroundImage !== "none") {
        return null;
      }

      var rgb = parseRgb(style.backgroundColor);
      if (rgb && rgb.a >= OPAQUE_ALPHA_MIN) {
        return relativeLuminance(rgb);
      }
    }

    return null;
  }

  function explicitHeaderThemeAt(x, y) {
    var stack = document.elementsFromPoint(x, y);

    for (var index = 0; index < stack.length; index++) {
      var element = stack[index];

      if (header.contains(element)) {
        continue;
      }

      var themedSection = element.closest("[data-header-theme]");
      if (themedSection) {
        return themedSection.getAttribute("data-header-theme");
      }
    }

    return null;
  }

  function updateHeaderTheme() {
    var sampleY = Math.max(header.offsetHeight / 2, 1);
    var viewportWidth = document.documentElement.clientWidth;
    var explicitTheme = explicitHeaderThemeAt(Math.round(viewportWidth / 2), sampleY);
    var total = 0;
    var found = 0;

    if (explicitTheme === "black" || explicitTheme === "white") {
      setHeaderTheme(header, explicitTheme);
      return;
    }

    for (var index = 0; index < BACKDROP_SAMPLE_RATIOS.length; index++) {
      var luminance = backdropLuminanceAt(
        Math.round(viewportWidth * BACKDROP_SAMPLE_RATIOS[index]),
        sampleY
      );

      if (luminance !== null) {
        total += luminance;
        found += 1;
      }
    }

    if (found === 0) {
      setHeaderTheme(header, pageHeaderTheme);
      return;
    }

    setHeaderTheme(header, total / found > LIGHT_LUMINANCE_THRESHOLD ? "black" : "white");
  }

  function updateHeaderOnScroll() {
    if (!header) {
      return;
    }

    var currentScrollY = Math.max(window.scrollY, 0);
    var scrollDelta = currentScrollY - lastScrollY;
    var menuIsOpen = headerInner && headerInner.classList.contains("is_open");

    header.classList.toggle("is_scrolled", currentScrollY > 16);

    if (currentScrollY <= 16) {
      setHeaderTheme(header, pageHeaderTheme);
    } else {
      updateHeaderTheme();
    }

    if (currentScrollY <= 16 || menuIsOpen) {
      header.classList.remove("is_hidden");
    } else if (scrollDelta > 6 && currentScrollY > 80) {
      header.classList.add("is_hidden");
    } else if (scrollDelta < -6) {
      header.classList.remove("is_hidden");
    }

    lastScrollY = currentScrollY;
    headerScrollTicking = false;
  }

  function handleHeaderScroll() {
    if (headerScrollTicking) {
      return;
    }

    headerScrollTicking = true;
    window.requestAnimationFrame(updateHeaderOnScroll);
  }

  function setMenuOpen(isOpen) {
    if (!headerToggle || !headerInner) {
      return;
    }

    headerInner.classList.toggle("is_open", isOpen);
    headerToggle.setAttribute("aria-expanded", String(isOpen));

    if (isOpen && header) {
      header.classList.remove("is_hidden");
    }

    var toggleLabel = headerToggle.querySelector(".header_toggle_label");
    if (toggleLabel) {
      toggleLabel.textContent = isOpen ? "Close menu" : "Open menu";
    }
  }

  function handleToggleClick() {
    var isOpen = headerToggle.getAttribute("aria-expanded") === "true";
    setMenuOpen(!isOpen);
  }

  function handleDocumentKeydown(event) {
    if (event.key !== "Escape") {
      return;
    }

    if (headerInner && headerInner.classList.contains("is_open")) {
      setMenuOpen(false);
      headerToggle.focus();
    }
  }

  function handleDocumentClick(event) {
    if (!headerInner || !headerInner.classList.contains("is_open")) {
      return;
    }

    if (!event.target.closest(".header")) {
      setMenuOpen(false);
    }
  }

  function handleWindowResize() {
    if (window.innerWidth >= DESKTOP_MIN_WIDTH) {
      setMenuOpen(false);
    }
  }

  if (headerToggle && headerInner) {
    headerToggle.addEventListener("click", handleToggleClick);
    document.addEventListener("keydown", handleDocumentKeydown);
    document.addEventListener("click", handleDocumentClick);
    window.addEventListener("resize", handleWindowResize);
  }

  if (header) {
    updateHeaderOnScroll();
    window.addEventListener("scroll", handleHeaderScroll, { passive: true });
    // 폭이 바뀌면 헤더 아래에 오는 요소도 달라집니다.
    window.addEventListener("resize", handleHeaderScroll);
  }

  var newsletterForm = document.getElementById("footer_newsletter");
  var emailInput = document.getElementById("footer_email_input");
  var emailMessage = document.getElementById("footer_email_message");

  function setEmailMessage(message, hasError) {
    if (!emailMessage) {
      return;
    }

    emailMessage.textContent = message;
    emailMessage.classList.toggle("has_error", hasError);
  }

  function handleNewsletterSubmit(event) {
    event.preventDefault();

    var emailValue = emailInput.value.trim();

    if (emailValue === "") {
      setEmailMessage("Please enter your email address.", true);
      emailInput.setAttribute("aria-invalid", "true");
      emailInput.focus();
      return;
    }

    if (!EMAIL_PATTERN.test(emailValue)) {
      setEmailMessage("Please enter a valid email address.", true);
      emailInput.setAttribute("aria-invalid", "true");
      emailInput.focus();
      return;
    }

    emailInput.removeAttribute("aria-invalid");
    setEmailMessage("Thank you. You are on the list.", false);
    newsletterForm.reset();
  }

  function handleEmailInput() {
    if (emailMessage && emailMessage.textContent !== "") {
      setEmailMessage("", false);
      emailInput.removeAttribute("aria-invalid");
    }
  }

  if (newsletterForm && emailInput && emailMessage) {
    newsletterForm.addEventListener("submit", handleNewsletterSubmit);
    emailInput.addEventListener("input", handleEmailInput);
  }

  var topButton = document.querySelector(".top_button");

  function updateTopButton() {
    if (topButton) {
      topButton.classList.toggle("is_visible", window.scrollY > 600);
    }
  }

  function handleTopButtonClick() {
    if (window.tchaikimmLenis) {
      window.tchaikimmLenis.scrollTo(0);
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
  }

  if (topButton) {
    updateTopButton();
    window.addEventListener("scroll", updateTopButton, { passive: true });
    topButton.addEventListener("click", handleTopButtonClick);
  }

  initProductCards();

  }

  Promise.all(componentSlots.map(loadComponent)).then(function () {
    applyHeaderVariant();
    initCommonBehavior();
    document.dispatchEvent(new CustomEvent("common:ready"));
  }).catch(function (error) {
    console.error(error);
  });
})();
