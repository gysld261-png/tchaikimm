(function initShopTransition() {
  "use strict";

  if (window.tchaikimShopTransitionInitialized) {
    return;
  }

  window.tchaikimShopTransitionInitialized = true;

  var TRANSITION_KEY = "tchaikim_shop_transition";
  /* ★ 텍스트 체류 시간입니다. Main 쪽 2200ms + Shop 쪽 1000ms 동안 보여
     사용자가 Tchai Kim / Shop을 읽은 뒤 계단 퇴장이 시작됩니다. */
  var MIN_EXIT_DELAY_MS = 1000;
  var MIN_NAVIGATION_DELAY_MS = 2200;
  var MAX_WAIT_MS = 3200;
  var EXIT_DURATION_MS = 1100;
  var isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function createTransition() {
    var element = document.createElement("div");
    element.className = "shop_transition";
    element.setAttribute("aria-hidden", "true");
    element.innerHTML = [
      '<div class="shop_transition_steps" aria-hidden="true">',
      "<span></span><span></span><span></span><span></span>",
      "<span></span><span></span><span></span><span></span>",
      "</div>",
      '<div class="shop_transition_inner" role="status" aria-live="polite">',
      '<p class="shop_transition_kicker"><span>Ready-to-wear · Seoul</span></p>',
      '<p class="shop_transition_phrase" aria-label="Where tradition finds freedom.">',
      '<span class="shop_transition_line" aria-hidden="true">',
      '<span class="shop_transition_word">Where</span>',
      '<span class="shop_transition_word">tradition</span>',
      "</span>",
      '<span class="shop_transition_line" aria-hidden="true">',
      '<span class="shop_transition_word">finds</span>',
      '<span class="shop_transition_word">freedom.</span>',
      "</span>",
      "</p>",
      "</div>"
    ].join("");
    document.body.appendChild(element);
    return element;
  }

  var transition = document.querySelector(".shop_transition") || createTransition();

  function wait(delay) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, delay);
    });
  }

  function loadImage(url) {
    return new Promise(function (resolve) {
      var image = new Image();

      function finish() {
        resolve();
      }

      image.addEventListener("load", function () {
        if (typeof image.decode === "function") {
          image.decode().catch(function () {}).then(finish);
          return;
        }

        finish();
      }, { once: true });
      image.addEventListener("error", finish, { once: true });
      image.src = url;
    });
  }

  function fetchResource(url) {
    return window.fetch(url, { credentials: "same-origin" }).catch(function () {});
  }

  function setTransitionVisible() {
    transition.hidden = false;
    document.documentElement.classList.add("is_shop_transitioning");
    transition.classList.remove("is_exiting");
    transition.classList.add("is_active");
    transition.setAttribute("aria-hidden", "false");
  }

  function warmShopEntry(targetUrl) {
    var shopUrl = new URL(targetUrl, window.location.href);
    var baseUrl = new URL("./", shopUrl);

    return Promise.allSettled([
      fetchResource(shopUrl.href),
      fetchResource(new URL("css/shop.css", baseUrl).href),
      fetchResource(new URL("js/shop.js", baseUrl).href),
      loadImage(new URL("assets/images/hero_bg.png", baseUrl).href),
      loadImage(new URL("assets/images/gallery_image1.jpg", baseUrl).href)
    ]);
  }

  function isShopLink(link) {
    var targetUrl;

    try {
      targetUrl = new URL(link.href, window.location.href);
    } catch (error) {
      return false;
    }

    return targetUrl.origin === window.location.origin &&
      /\/pages\/shop\/(?:index\.html)?$/.test(targetUrl.pathname);
  }

  function handleDocumentClick(event) {
    var link = event.target.closest("a[href]");

    if (
      !link ||
      !isShopLink(link) ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target === "_blank"
    ) {
      return;
    }

    event.preventDefault();
    setTransitionVisible();

    try {
      window.sessionStorage.setItem(TRANSITION_KEY, "1");
    } catch (error) {
      /* 저장소가 막힌 환경에서도 현재 페이지의 전환은 그대로 진행합니다. */
    }

    var minimumDelay = wait(isReducedMotion ? 120 : MIN_NAVIGATION_DELAY_MS);
    var preload = warmShopEntry(link.href);

    Promise.race([
      Promise.all([minimumDelay, preload]),
      wait(MAX_WAIT_MS)
    ]).then(function () {
      window.location.assign(link.href);
    });
  }

  function revealShopPage() {
    var hasTransitionEntry = document.documentElement.classList.contains("has_shop_transition_entry");

    if (!hasTransitionEntry) {
      return;
    }

    document.documentElement.classList.add("is_shop_transition_ready");
    transition.hidden = false;
    transition.classList.add("is_active");
    transition.setAttribute("aria-hidden", "false");

    try {
      window.sessionStorage.removeItem(TRANSITION_KEY);
    } catch (error) {
      /* 저장소가 막혀 있어도 아래 화면 공개는 계속합니다. */
    }

    var criticalImages = Array.prototype.slice.call(document.querySelectorAll(
      ".hero_section_bg, .hero_gallery_fallback"
    ));
    var imagePromises = criticalImages.map(function (image) {
      if (image.complete) {
        return typeof image.decode === "function" ? image.decode().catch(function () {}) : Promise.resolve();
      }

      return new Promise(function (resolve) {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    });
    var minimumDelay = wait(isReducedMotion ? 80 : MIN_EXIT_DELAY_MS);

    Promise.race([
      Promise.all([minimumDelay, Promise.allSettled(imagePromises)]),
      wait(MAX_WAIT_MS)
    ]).then(function () {
      transition.classList.add("is_exiting");

      window.setTimeout(function () {
        /* 조각이 화면 위로 완전히 빠진 뒤 즉시 숨겨, 클래스를 정리할 때
           기본 위치(화면 아래)로 되돌아오는 프레임이 다시 보이지 않게 합니다. */
        transition.hidden = true;
        transition.classList.remove("is_active", "is_exiting");
        transition.setAttribute("aria-hidden", "true");
        document.documentElement.classList.remove(
          "has_shop_transition_entry",
          "is_shop_transition_entry",
          "is_shop_transition_ready"
        );
      }, isReducedMotion ? 140 : EXIT_DURATION_MS);
    });
  }

  /* 이벤트 위임이라 common.js가 나중에 주입하는 헤더·푸터 링크도 잡힙니다. */
  /* capture 단계에서 먼저 받아 헤더 메뉴 등 다른 클릭 핸들러가 버블링을
     중단하더라도 Shop 전환을 놓치지 않습니다. */
  document.addEventListener("click", handleDocumentClick, true);

  revealShopPage();
})();
