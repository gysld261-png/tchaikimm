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
