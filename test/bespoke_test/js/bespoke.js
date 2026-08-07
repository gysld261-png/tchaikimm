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

  /* ---------------------------------------------------------
     atelier — 섹션이 화면에 잠시 고정되고, 그 동안 왼쪽 사진이 돋보기처럼
     커지면서 오른쪽 글을 덮고 화면 전체를 채운다. 다 채우면 고정이 풀리고
     다음 섹션(quote)으로 스크롤이 그대로 이어진다.

     philosophy와 같이 GSAP + ScrollTrigger를 쓴다. 스크롤 위치에 비례해
     연속으로 커져야 하므로 IntersectionObserver로는 만들 수 없다.

     기본값은 시안 레이아웃 그대로다. JS나 GSAP이 없거나, 화면이 좁거나,
     모션 감소 설정이면 아무것도 하지 않는다.
     --------------------------------------------------------- */

  /* 조절값 — 숫자만 바꾸면 된다 */
  var ATELIER_PIN_LENGTH = "+=120%"; /* 고정된 채 스크롤하는 길이(화면 높이 기준) */
  var ATELIER_SCRUB = 0.6; /* 스크롤을 따라오는 지연(초). 0이면 1:1로 딱 붙는다 */
  /* 화면을 딱 채우는 배율에 곱하는 여유. 1이 "정확히 꽉 참"이다.
     1보다 키우지 말 것 — 이 사진(554×648)은 화면보다 세로로 긴 비율이라
     확대를 제한하는 쪽이 항상 가로다. 즉 여유를 주면 그만큼 사진이 화면
     좌우 밖으로 나가고, 그 폭이 문서에 가로 넘침으로 남는다.
     (`body { overflow-x: hidden }`이 휠 조작만 막을 뿐 없애지는 않는다 —
      1.04로 두었을 때 pin이 풀린 뒤 실제로 38px이 남는 것을 확인했다.) */
  var ATELIER_COVER_BLEED = 1;
  /* 1280px 미만에서는 사진이 글 위가 아니라 위쪽에 세로로 쌓이므로
     "글을 덮는다"가 성립하지 않는다. 그래서 가로 배치 구간에만 건다. */
  var ATELIER_GATE = "(min-width: 1280px) and (prefers-reduced-motion: no-preference)";

  function initAtelierZoom() {
    var section = document.querySelector(".atelier");

    if (!section) {
      return;
    }

    var image = section.querySelector(".atelier_image");

    if (!image || !window.gsap || !window.ScrollTrigger) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    gsap.matchMedia().add(ATELIER_GATE, function () {
      section.classList.add("is_zoom_ready");

      /* 목표값.

         **재는 시점이 중요하다.** `onRefreshInit`에서 재면 안 된다.
         그 시점에는 ScrollTrigger가 아직 pin-spacer를 새 폭으로 고쳐놓기
         전이라 이전 창 크기의 spacer(예: width 1728 / margin 0 88.5px)가
         그대로 남아 있고, 그걸 재면 창을 줄였을 때 사진이 88px 어긋난 자리로
         커진다(1905 → 1425로 줄여 실제로 확인함).
         그래서 여기서는 "다시 재야 한다"는 표시만 하고, 실제 측정은 아래
         함수형 값이 불릴 때 한다. GSAP은 invalidate 뒤 첫 렌더에서 이 함수를
         부르는데, 그때는 refresh가 이미 끝나 레이아웃이 제자리에 있다.

         **`offsetWidth`가 아니라 rect를 쓰는 이유**: offset 계열은 정수로
         반올림된다. 이 사진의 폭은 1280~1839px 구간에서 42%라 소수점이 남는데
         (예: 실제 428.86 → offsetWidth 429), 큰 값으로 나누면 배율이 그만큼
         모자라서 다 커진 뒤에도 화면 가장자리에 크림색 실선이 남는다.
         rect는 transform이 반영된 값이므로, 지금 걸려 있는 이동·배율을 도로
         빼서 변형 전 크기와 중심을 되찾는다. 중심은 이동량만 빼면 된다 —
         scale은 transform-origin이 중앙이라 중심을 움직이지 않는다. */
      var target = null;

      function measured() {
        if (target) {
          return target;
        }

        var view = document.documentElement;
        var scaleNow = Number(gsap.getProperty(image, "scaleX")) || 1;
        var xNow = Number(gsap.getProperty(image, "x")) || 0;
        var yNow = Number(gsap.getProperty(image, "y")) || 0;

        var sectionBox = section.getBoundingClientRect();
        var imageBox = image.getBoundingClientRect();

        var width = imageBox.width / scaleNow;
        var height = imageBox.height / scaleNow;
        var centerX = imageBox.left + imageBox.width / 2 - xNow;
        var centerY = imageBox.top + imageBox.height / 2 - yNow;

        target = {
          /* pin이 섹션 중심을 화면 중앙에 놓으므로(start: "center center"),
             사진 중심을 섹션 중심으로 옮기면 그대로 화면 중앙이다.
             두 rect를 같은 순간에 재므로 스크롤 위치는 서로 상쇄된다. */
          x: sectionBox.left + sectionBox.width / 2 - centerX,
          y: sectionBox.top + sectionBox.height / 2 - centerY,

          /* 가로·세로 중 더 모자란 쪽에 맞춘다. 하나의 값으로 x·y를 함께
             키우므로 가로세로 비율이 그대로 유지된다(돋보기 확대).
             innerWidth가 아니라 clientWidth를 쓰는 이유는 세로 스크롤바를 뺀
             실제로 보이는 폭이 기준이어야 하기 때문이다. */
          scale:
            Math.max(view.clientWidth / width, view.clientHeight / height) * ATELIER_COVER_BLEED
        };

        return target;
      }

      gsap.to(image, {
        /* 함수로 주면 invalidateOnRefresh가 새로 잰 값을 다시 읽어간다 */
        x: function () {
          return measured().x;
        },
        y: function () {
          return measured().y;
        },
        scale: function () {
          return measured().scale;
        },
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "center center",
          end: ATELIER_PIN_LENGTH,
          pin: true,
          anticipatePin: 1,
          scrub: ATELIER_SCRUB,
          invalidateOnRefresh: true,
          onRefreshInit: function () {
            target = null;
          }
        }
      });

      return function () {
        section.classList.remove("is_zoom_ready");
      };
    });
  }

  initPhilosophyMotion();
  initAtelierZoom();
})();
