/* 예약 폼 페이지 (reservation.html)
   - 진행 단계 띠가 현재 보고 있는 구간을 따라갑니다.
   - 달력 날짜를 고르면 숨은 입력값이 함께 바뀝니다.
   - 두 약관에 모두 동의해야 전송됩니다.

   폼은 실제로 어디에도 보내지 않습니다. 확인만 하고 완료 페이지로 넘깁니다.
   (프로젝트 정책: 뉴스레터와 같은 처리) */

(function () {
  "use strict";

  var DONE_URL = "reservation_done.html";
  var BLOCKED_MESSAGE = "Both agreements above are required";

  /* ----------------------------------------------------------
     진행 단계 띠

     구간이 화면 위쪽에 들어오면 그 칸을 진하게 바꿉니다.
     띠 자체가 sticky라 화면 맨 위 60px 정도는 띠가 가립니다.
     그만큼 관찰 영역 위쪽을 잘라내야 한 칸 빨리 넘어가지 않습니다.
     ---------------------------------------------------------- */
  function initStepTracking() {
    var stepList = document.getElementById("reservation_steps");
    if (!stepList) {
      return;
    }

    var items = Array.prototype.slice.call(stepList.querySelectorAll("[data-step_for]"));
    var sections = items
      .map(function (item) {
        return document.getElementById(item.getAttribute("data-step_for"));
      })
      .filter(Boolean);

    if (sections.length === 0 || typeof IntersectionObserver !== "function") {
      return;
    }

    function setActiveStep(sectionId) {
      items.forEach(function (item) {
        var isActive = item.getAttribute("data-step_for") === sectionId;
        item.classList.toggle("is_active", isActive);
        var link = item.querySelector(".reservation_steps_link");
        if (link) {
          if (isActive) {
            link.setAttribute("aria-current", "step");
          } else {
            link.removeAttribute("aria-current");
          }
        }
      });
    }

    var visible = {};

    var observer = new IntersectionObserver(
      function handleStepIntersect(entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting;
        });

        /* 여러 구간이 동시에 보일 수 있습니다.
           화면 순서상 가장 위에 있는 것을 현재 구간으로 봅니다. */
        for (var i = 0; i < sections.length; i += 1) {
          if (visible[sections[i].id]) {
            setActiveStep(sections[i].id);
            return;
          }
        }
      },
      { rootMargin: "-70px 0px -55% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ----------------------------------------------------------
     달력

     날짜는 버튼입니다(값 선택이 아니라 동작에 가까워 라디오로 두지 않았습니다).
     고른 날짜는 name="meeting_date" 숨은 입력에 넣어 폼과 함께 다닙니다.
     ---------------------------------------------------------- */
  function initCalendar() {
    var body = document.getElementById("reservation_calendar_body");
    var dateValue = document.getElementById("reservation_date_value");
    if (!body || !dateValue) {
      return;
    }

    body.addEventListener("click", function handleDayClick(event) {
      var day = event.target.closest(".reservation_day");
      if (!day || day.disabled) {
        return;
      }

      var previous = body.querySelector(".reservation_day.is_selected");
      if (previous) {
        previous.classList.remove("is_selected");
        previous.removeAttribute("aria-pressed");
      }

      day.classList.add("is_selected");
      day.setAttribute("aria-pressed", "true");
      dateValue.value = day.value;
    });
  }

  /* ----------------------------------------------------------
     전송 확인

     보내기 전에 필수 항목과 약관 두 개를 확인합니다.
     실제 전송은 하지 않고 완료 페이지로 이동합니다.
     ---------------------------------------------------------- */
  function initSubmit() {
    var form = document.getElementById("reservation_form");
    var status = document.getElementById("reservation_status");
    if (!form || !status) {
      return;
    }

    var agreePrivacy = document.getElementById("agree_privacy");
    var agreeProduction = document.getElementById("agree_production");

    function isAgreed() {
      return Boolean(agreePrivacy && agreePrivacy.checked && agreeProduction && agreeProduction.checked);
    }

    function refreshStatus() {
      status.textContent = isAgreed() ? "" : BLOCKED_MESSAGE;
    }

    [agreePrivacy, agreeProduction].forEach(function (box) {
      if (box) {
        box.addEventListener("change", refreshStatus);
      }
    });

    function showFieldError(input, message) {
      var field = input.closest(".bespoke_field");
      if (!field) {
        return;
      }
      var slot = field.querySelector(".bespoke_field_error");
      field.classList.toggle("has_error", Boolean(message));
      if (slot) {
        slot.textContent = message;
      }
    }

    function validateRequiredText(input, message) {
      if (!input) {
        return true;
      }
      var value = input.value.trim();
      var isValid = value.length > 0 && (input.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
      showFieldError(input, isValid ? "" : message);
      return isValid;
    }

    form.addEventListener("submit", function handleSubmit(event) {
      event.preventDefault();

      var nameInput = document.getElementById("field_name");
      var emailInput = document.getElementById("field_email");

      var isNameValid = validateRequiredText(nameInput, "Please enter your name.");
      var isEmailValid = validateRequiredText(emailInput, "Please enter a valid email address.");

      refreshStatus();

      if (!isNameValid || !isEmailValid) {
        var firstBad = form.querySelector(".bespoke_field.has_error .bespoke_field_input");
        if (firstBad) {
          firstBad.focus();
        }
        return;
      }

      if (!isAgreed()) {
        if (agreePrivacy && !agreePrivacy.checked) {
          agreePrivacy.focus();
        } else if (agreeProduction) {
          agreeProduction.focus();
        }
        return;
      }

      window.location.href = DONE_URL;
    });

    refreshStatus();
  }

  function init() {
    initStepTracking();
    initCalendar();
    initSubmit();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
