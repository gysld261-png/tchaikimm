(function () {
  "use strict";

  var colorButtons = Array.prototype.slice.call(document.querySelectorAll(".color_swatch"));
  var sizeButtons = Array.prototype.slice.call(document.querySelectorAll(".size_button"));
  var colorName = document.getElementById("color_name");
  var addToCart = document.getElementById("add_to_cart");
  var purchaseMessage = document.getElementById("purchase_message");

  function selectButton(buttons, selected) {
    buttons.forEach(function (button) {
      var isSelected = button === selected;
      button.classList.toggle("is_selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  }

  colorButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectButton(colorButtons, button);
      colorName.textContent = button.getAttribute("data-color");
    });
  });

  sizeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectButton(sizeButtons, button);
      purchaseMessage.textContent = "";
      purchaseMessage.classList.remove("is_success");
    });
  });

  var sizeGuideToggle = document.getElementById("size_guide_toggle");
  var sizeGuidePanel = document.getElementById("size_guide_panel");
  var unitButtons = Array.prototype.slice.call(document.querySelectorAll(".size_unit_button"));

  function handleSizeGuideToggle() {
    var isOpen = sizeGuidePanel.classList.toggle("is_open");
    sizeGuideToggle.setAttribute("aria-expanded", String(isOpen));
  }

  if (sizeGuideToggle && sizeGuidePanel) {
    sizeGuideToggle.addEventListener("click", handleSizeGuideToggle);

    unitButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        selectButton(unitButtons, button);
        sizeGuidePanel.classList.toggle("is_unit_inch", button.getAttribute("data-unit") === "inch");
      });
    });
  }

  if (addToCart) {
    addToCart.addEventListener("click", function () {
      var selectedSize = document.querySelector(".size_button.is_selected");

      if (!selectedSize) {
        purchaseMessage.textContent = "Please select a size.";
        purchaseMessage.classList.remove("is_success");
        sizeButtons[0].focus();
        return;
      }

      purchaseMessage.textContent = "Added to your shopping bag.";
      purchaseMessage.classList.add("is_success");
    });
  }

  Array.prototype.slice.call(document.querySelectorAll(".accordion_item > button")).forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest(".accordion_item");
      var isOpen = item.classList.toggle("is_open");
      button.setAttribute("aria-expanded", String(isOpen));
    });
  });

  // 아코디언을 열고 닫아도 craft 섹션 높이가 변하지 않도록,
  // 모든 항목이 열린 상태의 높이를 미리 확보해 둡니다.
  // 폭마다 줄바꿈이 달라져 높이가 바뀌므로 고정 px 대신 그때그때 측정합니다.
  var accordion = document.querySelector(".detail_accordion");
  var accordionItems = Array.prototype.slice.call(document.querySelectorAll(".accordion_item"));

  function reserveAccordionSpace() {
    if (!accordion || !accordionItems.length) {
      return;
    }

    var openedBefore = accordionItems.map(function (item) {
      return item.classList.contains("is_open");
    });

    accordion.classList.add("is_measuring");
    accordion.style.minHeight = "";
    accordionItems.forEach(function (item) {
      item.classList.add("is_open");
    });

    var fullHeight = accordion.getBoundingClientRect().height;

    accordionItems.forEach(function (item, index) {
      item.classList.toggle("is_open", openedBefore[index]);
    });
    accordion.style.minHeight = Math.ceil(fullHeight) + "px";
    accordion.classList.remove("is_measuring");
  }

  if (accordion) {
    reserveAccordionSpace();

    // 웹폰트가 늦게 적용되면 글자 높이가 달라지므로 다시 잽니다.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(reserveAccordionSpace);
    }

    // 폭이 바뀌면 줄바꿈이 달라져 필요한 높이도 달라집니다.
    // ResizeObserver와 window resize를 함께 씁니다. 어느 한쪽만으로 놓치는 경우가 없도록.
    var lastWidth = accordion.getBoundingClientRect().width;
    var resizeTimer = null;

    function handleLayoutChange() {
      var width = accordion.getBoundingClientRect().width;
      if (Math.round(width) === Math.round(lastWidth)) {
        return;
      }
      lastWidth = width;
      reserveAccordionSpace();
    }

    if (window.ResizeObserver) {
      new window.ResizeObserver(handleLayoutChange).observe(accordion);
    }

    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleLayoutChange, 150);
    });
  }

  var lookPins = Array.prototype.slice.call(document.querySelectorAll(".look_pin"));
  var lookCards = Array.prototype.slice.call(document.querySelectorAll("[data-look-card]"));

  lookPins.forEach(function (pin) {
    pin.addEventListener("click", function () {
      var selectedLook = pin.getAttribute("data-look");
      var wasActive = pin.classList.contains("is_active");

      lookPins.forEach(function (item) {
        var shouldOpen = item === pin && !wasActive;
        item.classList.toggle("is_active", shouldOpen);
        item.setAttribute("aria-expanded", String(shouldOpen));
      });

      lookCards.forEach(function (card) {
        var shouldOpen = card.getAttribute("data-look-card") === selectedLook && !wasActive;
        card.classList.toggle("is_active", shouldOpen);
        card.setAttribute("aria-hidden", String(!shouldOpen));
        var cardLink = card.querySelector("a");
        if (cardLink) cardLink.tabIndex = shouldOpen ? 0 : -1;
      });
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;

    lookPins.forEach(function (pin) {
      pin.classList.remove("is_active");
      pin.setAttribute("aria-expanded", "false");
    });
    lookCards.forEach(function (card) {
      card.classList.remove("is_active");
      card.setAttribute("aria-hidden", "true");
      var cardLink = card.querySelector("a");
      if (cardLink) cardLink.tabIndex = -1;
    });
  });

  lookCards.forEach(function (card) {
    var cardLink = card.querySelector("a");
    if (cardLink) cardLink.tabIndex = -1;
  });
})();
