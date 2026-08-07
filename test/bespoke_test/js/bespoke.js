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

  /* ---------------------------------------------------------
     philosophy — 등장(fade + slide up)과 배경 패럴랙스

     GSAP + ScrollTrigger를 쓴다. 이 페이지가 이미 둘 다 불러오고 있고,
     common.js가 Lenis를 GSAP 티커·ScrollTrigger에 연결해 둬서 scrub이
     부드럽게 따라온다. IntersectionObserver로는 패럴랙스(스크롤 위치에
     비례하는 연속 이동)를 만들 수 없어 위 process와 방식이 다르다.

     기본값은 "다 보이는 상태"다. JS나 GSAP이 없거나 모션 감소 설정이면
     아무것도 하지 않고 CSS 레이아웃 그대로 보인다.
     --------------------------------------------------------- */

  /* 조절값 — 숫자만 바꾸면 된다 */
  var PHILOSOPHY_RISE = 30; /* 글이 아래에서 올라오는 거리(px) */
  var PHILOSOPHY_BG_RISE = 2.5; /* 배경이 올라오는 거리(자기 높이의 %) */
  var PHILOSOPHY_DURATION = 1.1; /* 등장 길이(초) */
  var PHILOSOPHY_STAGGER = 0.18; /* 제목 → 본문 시차(초) */
  var PHILOSOPHY_START = "top 78%"; /* 섹션 윗변이 화면 78% 지점에 오면 시작 */
  var PHILOSOPHY_PARALLAX_SHIFT = 80; /* 배경이 위아래로 움직이는 거리(px) */

  function initPhilosophyMotion() {
    var section = document.querySelector(".philosophy");

    if (!section) {
      return;
    }

    var background = section.querySelector(".philosophy_bg");
    var contents = section.querySelectorAll(".philosophy_title, .philosophy_desc");

    if (!background || !contents.length || !window.gsap || !window.ScrollTrigger) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    /* 조건이 어긋나면(모션 감소 설정으로 바꾸면) matchMedia가 아래에서 준
       정리 함수를 부르고, GSAP이 자기가 넣은 인라인 스타일도 되돌린다. */
    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", function () {
      section.classList.add("is_motion_ready");

      /* 1) 등장 — 제목이 먼저, 본문이 조금 늦게 올라온다.
            `from`이라 끝값은 CSS가 정한 값 그대로다(불투명도 1). */
      gsap.from(contents, {
        y: PHILOSOPHY_RISE,
        opacity: 0,
        duration: PHILOSOPHY_DURATION,
        stagger: PHILOSOPHY_STAGGER,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: PHILOSOPHY_START,
          once: true
        }
      });

      /* 배경도 같이 떠오르되 글보다 길고 느리게 안착한다.
         끝 불투명도는 CSS의 .philosophy_bg(0.6)를 GSAP이 알아서 읽는다.

         **이동을 y가 아니라 yPercent로 준다.** 아래 패럴랙스가 같은 요소의
         y를 계속 쓰기 때문이다. GSAP은 y와 yPercent를 각각 따로 들고 있다가
         더해서 그리므로, 두 트리거가 서로를 덮어쓰지 않는다. */
      gsap.from(background, {
        yPercent: PHILOSOPHY_BG_RISE,
        opacity: 0,
        duration: PHILOSOPHY_DURATION * 1.3,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: PHILOSOPHY_START,
          once: true
        }
      });

      /* 2) 패럴랙스 — 섹션이 화면을 지나가는 동안 배경을 아래로 흘린다.
            페이지가 위로 올라가는 만큼 배경이 아래로 상쇄돼서, 결과적으로
            배경이 글보다 천천히 지나가는 것처럼 보인다.
            `scrub: true`라 스크롤 위치에 1:1로 묶이고, `ease: "none"`이라
            구간 내내 속도가 일정하다. */
      gsap.fromTo(
        background,
        { y: -PHILOSOPHY_PARALLAX_SHIFT },
        {
          y: PHILOSOPHY_PARALLAX_SHIFT,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );

      return function () {
        section.classList.remove("is_motion_ready");
      };
    });
  }

  initPhilosophyMotion();
})();
