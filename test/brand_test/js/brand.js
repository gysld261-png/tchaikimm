/* brand 페이지 스크립트

   1. mood 인트로 — 페이지에 들어오면 저절로 한 번 재생됩니다(스크롤 무관).
      검은 화면의 초록 띠가 열리며 실내가 드러나고, 사진은 그대로 멈춘 채
      글과 무드 단어가 한 띠로 붙어 오른쪽에서 흘러 들어옵니다.

   2. tchaikim(5장면) 가로 스크롤 — 화면을 붙잡아 둔 채 트랙을 왼쪽으로 밉니다.

   3. tchaikim 영상 5개는 그 섹션을 보고 있을 때만 재생합니다.

   HTML/CSS의 기본 상태는 전부 "다 끝난 모습"입니다. 이 스크립트는 시작 상태로
   되돌린 뒤 재생합니다. 그래서 JS나 GSAP이 없으면 완성된 화면이 그대로 보입니다.
*/

(function () {
  "use strict";

  /* ---- mood 인트로 ------------------------------------------------------
     시안에서 온 값: 띠 30 × 484 → 실내 1920 × 700. */
  var REVEAL_WIDTH = 30;
  var REVEAL_HEIGHT = 484;
  var STAGE_WIDTH = 1920;
  var STAGE_HEIGHT = 700;

  /* 아래가 인트로 속도입니다(초). 전체 길이는 약 5.3초입니다.

     글과 무드 단어는 한 띠로 붙어 오른쪽 밖에서 흘러 들어와 제자리에 잦아듭니다.
     멈췄다 다시 가는 구간이 없어야 "휙, 휙" 하지 않습니다. 아래 DRIFT_* 값만
     쓰는 트윈 하나가 전부입니다. */
  var OPEN_DURATION = 1.4;      /* 문이 다 열리기까지 */
  var OPEN_HEIGHT_DELAY = 0.5;  /* 가로가 먼저 벌어지고 세로가 뒤따르는 간격 */
  var DRIFT_AT = 1.1;           /* 띠가 흐르기 시작하는 시점. 문이 다 열리기 전에
                                   시작해야 중간에 빈 박자가 생기지 않습니다 */
  var DRIFT_DURATION = 4.2;     /* 1920px을 흐르는 시간. 늘리면 더 느긋해집니다 */
  var DRIFT_EASE = "sine.out";  /* 들어올 때 속도가 붙어 있고 끝에서 서서히 잦아듭니다.
                                   power3.out은 급정거해서 "휙" 하고 멈춥니다 */
  var WALL_AT = 3.6;            /* 글 뒤 벽 사진이 드러나기 시작하는 시점 */
  var WALL_DURATION = 1.2;

  /* ---- tchaikim 가로 스크롤 --------------------------------------------- */
  var HORIZONTAL_MIN_WIDTH = 1280;
  var PANEL_WIDTH = 1920;

  function isReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* mood 인트로.
     스크립트가 body 끝에 있어 이 함수는 DOMContentLoaded를 기다리지 않고
     바로 실행됩니다. 시작 상태를 먼저 칠해야 완성된 화면이 한 번 번쩍이지
     않기 때문입니다. */
  function initMoodIntro() {
    if (typeof window.gsap === "undefined" || isReducedMotion()) {
      return;
    }

    var gsap = window.gsap;
    var reveal = document.querySelector(".mood_reveal");
    var room = document.querySelector(".mood_room");
    var wall = document.querySelector(".mood_wall");
    var copy = document.querySelector(".mood_copy");
    var words = document.querySelector(".mood_words");

    if (!reveal || !room || !wall || !copy || !words) {
      return;
    }

    /* 시작 상태 — 닫힌 문, 글과 무드 단어는 무대 오른쪽 바깥.

       둘 다 x를 STAGE_WIDTH(1920)만큼 밀어 둡니다. 최종 자리가 글 0, 단어 768이라
       같은 값을 주면 둘 사이 간격 768px이 그대로 유지됩니다. 즉 [글 | 단어]가
       하나의 띠처럼 붙어서 함께 흐릅니다. 이동 거리도 1920으로 똑같습니다.

       투명도로 나타내지 않습니다. .mood_reveal의 overflow: hidden이 무대 밖을
       가리고 있어서, 글자가 화면 오른쪽 끝에서 자연스럽게 밀려 들어옵니다. */
    gsap.set(reveal, { width: REVEAL_WIDTH, height: REVEAL_HEIGHT });
    gsap.set([copy, words], { x: STAGE_WIDTH });
    gsap.set(wall, { opacity: 0 });

    function play() {
      var timeline = gsap.timeline();

      /* 1. 문이 열린다. 가로가 먼저, 세로가 뒤따라야 상자가 커지는 게 아니라
            문이 열리는 것처럼 보입니다. */
      timeline.to(reveal, {
        width: STAGE_WIDTH,
        duration: OPEN_DURATION,
        ease: "power2.inOut"
      }, 0);

      timeline.to(reveal, {
        height: STAGE_HEIGHT,
        duration: OPEN_DURATION - OPEN_HEIGHT_DELAY,
        ease: "power2.inOut"
      }, OPEN_HEIGHT_DELAY);

      /* 2. [글 | 무드 단어] 띠가 오른쪽 밖에서 한 번에 흘러 들어옵니다.
            트윈 하나, 멈춤 없음. 도중에 글이 x 1152를 지나가는데, 시안 2장면의
            자리입니다 — 이제 머무는 자리가 아니라 지나가는 순간입니다. */
      timeline.to([copy, words], {
        x: 0,
        duration: DRIFT_DURATION,
        ease: DRIFT_EASE
      }, DRIFT_AT);

      /* 글 뒤의 벽 사진은 글이 왼쪽에 거의 다다랐을 때 드러납니다. */
      timeline.to(wall, {
        opacity: 1,
        duration: WALL_DURATION,
        ease: "none"
      }, WALL_AT);
    }

    /* 사진이 아직 안 왔는데 문이 열리면 빈 칸이 드러납니다. */
    if (room.complete && room.naturalWidth > 0) {
      play();
    } else {
      room.addEventListener("load", play, { once: true });
      room.addEventListener("error", play, { once: true });
    }
  }

  function initHorizontalSection(gsap, sectionSelector, trackSelector) {
    var section = document.querySelector(sectionSelector);
    var track = document.querySelector(trackSelector);

    if (!section || !track) {
      return;
    }

    var panelCount = track.children.length;

    if (panelCount < 2) {
      return;
    }

    section.classList.add("is_horizontal");

    /* 마지막 패널이 화면에 다 들어올 때까지 밀어야 하는 거리. */
    var travel = PANEL_WIDTH * (panelCount - 1);

    gsap.to(track, {
      x: -travel,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=" + travel,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
  }

  function initHorizontal() {
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    /* matchMedia를 쓰면 조건이 어긋날 때 GSAP이 스스로 원래 상태로
       되돌립니다. is_horizontal도 같이 떼어 CSS를 원상복구합니다. */
    gsap.matchMedia().add(
      "(min-width: " + HORIZONTAL_MIN_WIDTH + "px) and (prefers-reduced-motion: no-preference)",
      function () {
        initHorizontalSection(gsap, ".tchaikim", ".tchaikim_track");

        return function () {
          var section = document.querySelector(".tchaikim");

          if (section) {
            section.classList.remove("is_horizontal");
          }
        };
      }
    );
  }

  /* 영상은 그 섹션을 보고 있는 동안에만 재생합니다.
     재생 요청이 거절될 수 있어(자동재생 정책) 반환된 Promise를 받아둡니다. */
  function initVideos() {
    var section = document.querySelector(".tchaikim");

    if (!section || isReducedMotion()) {
      return;
    }

    var videos = Array.prototype.slice.call(section.querySelectorAll(".tchaikim_video"));

    if (!videos.length) {
      return;
    }

    function setPlaying(shouldPlay) {
      videos.forEach(function (video) {
        if (shouldPlay) {
          var played = video.play();

          if (played && typeof played.catch === "function") {
            played.catch(function () {
              /* 브라우저가 자동재생을 막은 경우입니다. 첫 프레임이 멈춘 채로
                 남고 레이아웃은 그대로입니다. */
            });
          }
        } else {
          video.pause();
        }
      });
    }

    if (typeof window.IntersectionObserver === "undefined") {
      setPlaying(true);
      return;
    }

    var observer = new window.IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          setPlaying(entry.isIntersecting);
        });
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(section);
  }

  /* 인트로는 첫 화면이라 한 프레임이라도 늦으면 완성된 모습이 비칩니다.
     나머지는 DOM이 다 준비된 뒤에 붙여도 됩니다. */
  initMoodIntro();

  function init() {
    initHorizontal();
    initVideos();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
