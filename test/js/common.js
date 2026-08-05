(function () {
  "use strict";

  var DESKTOP_MIN_WIDTH = 1280;
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------------------------------------------------------
     header — 모바일 메뉴 열기/닫기
     --------------------------------------------------------- */

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

    var isInsideHeader = event.target.closest(".header");
    if (!isInsideHeader) {
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

  /* ---------------------------------------------------------
     footer — 뉴스레터 이메일 확인
     --------------------------------------------------------- */

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
})();
