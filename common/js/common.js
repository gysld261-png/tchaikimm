(function () {
  "use strict";

  function initSmoothScroll() {
    if (
      typeof window.Lenis === "undefined" ||
      typeof window.gsap === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    var gsap = window.gsap;
    var lenis = new window.Lenis({
      autoRaf: false,
      lerp: 0.045,
      wheelMultiplier: 0.75
    });

    if (window.ScrollTrigger) {
      lenis.on("scroll", window.ScrollTrigger.update);
    }

    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

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
