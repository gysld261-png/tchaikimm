(function () {
  "use strict";

  /* ---------------------------------------------------------
     process — 스크롤에 따라 활성 단계가 바뀌고 오른쪽 이미지가 전환된다
     (시안 주석: "왼쪽 프로세스 과정 설명글은 스크롤 시 나타난다.
                  오른쪽은 이미지 변경(예시 이미지)")
     JS가 동작하지 않으면 HTML의 기본 is_active(01 Consultation)와
     is_visible(consultation 이미지) 그대로 보인다.
     --------------------------------------------------------- */

  var processSteps = document.querySelectorAll(".process_step");
  var processImages = document.querySelectorAll(".process_image_img");

  function setActiveStep(stepName) {
    processSteps.forEach(function (step) {
      step.classList.toggle("is_active", step.dataset.step === stepName);
    });

    processImages.forEach(function (image) {
      var isMatch = image.id === "process_image_" + stepName;
      image.classList.toggle("is_visible", isMatch);
    });
  }

  if (processSteps.length && processImages.length && "IntersectionObserver" in window) {
    var stepObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveStep(entry.target.dataset.step);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    processSteps.forEach(function (step) {
      stepObserver.observe(step);
    });
  }
})();
