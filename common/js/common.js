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
      lerp: 0.06,
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

    productImages.forEach(function (defaultImage) {
      var hoverSrc = defaultImage.getAttribute("data-hover-src").trim();
      var media = defaultImage.closest(".card_product_media");

      if (!hoverSrc || !media || media.classList.contains("has_hover_image")) {
        return;
      }

      var preload = new Image();

      preload.onload = function () {
        var hoverImage = document.createElement("img");
        hoverImage.className = "card_product_img card_product_img_hover";
        hoverImage.src = hoverSrc;
        hoverImage.alt = "";
        hoverImage.setAttribute("aria-hidden", "true");

        defaultImage.classList.add("card_product_img_default");
        defaultImage.parentNode.insertBefore(hoverImage, defaultImage.nextSibling);
        media.classList.add("has_hover_image");
      };

      preload.src = hoverSrc;
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
      slot.outerHTML = markup;
    });
  }

  function applyHeaderVariant() {
    var currentPage = document.body.getAttribute("data-page");
    var headerVariant = document.body.getAttribute("data-header-variant") || "white";
    var header = document.querySelector(".header");
    var headerLogo = document.querySelector("[data-header-logo]");
    var currentLink = document.querySelector('[data-nav-page="' + currentPage + '"]');

    if (header) {
      header.classList.add(headerVariant === "black" ? "is_black" : "is_white");
    }

    if (headerLogo) {
      headerLogo.src = headerVariant === "black"
        ? "/asset/logos/header_logo-01.svg"
        : "/asset/logos/header_logo-02.svg";
    }

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

  function setMenuOpen(isOpen) {
    if (!headerToggle || !headerInner) {
      return;
    }

    headerInner.classList.toggle("is_open", isOpen);
    headerToggle.setAttribute("aria-expanded", String(isOpen));

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
