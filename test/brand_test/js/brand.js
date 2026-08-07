/* brand 페이지 스크립트

   1. mood 인트로 — 페이지에 들어오면 저절로 한 번 재생됩니다(스크롤 무관).
      검은 화면의 초록 띠가 열리며 실내가 드러납니다.
      배경은 mood_inner.jpg 한 장뿐이고 처음부터 끝까지 제자리에 고정입니다.
      그 위로 글과 무드 단어가 한 띠로 붙어 오른쪽에서 흘러 들어옵니다.
      글과 단어는 그 뒤로도 계속 위아래로 천천히 흔들립니다(둥둥).
      속도와 흔들림은 파일 위쪽 "▼▼ 여기 숫자만 바꾸면 됩니다 ▼▼" 블록에 모아 두었습니다.

   2. tchaikim(5장면) 가로 스크롤 — 화면을 붙잡아 둔 채 트랙을 왼쪽으로 밉니다.

   3. tchaikim 영상 5개는 그 섹션을 보고 있을 때만 재생합니다.

   HTML/CSS의 기본 상태는 전부 "다 끝난 모습"입니다. 이 스크립트는 시작 상태로
   되돌린 뒤 재생합니다. 그래서 JS나 GSAP이 없으면 완성된 화면이 그대로 보입니다.
*/

(function () {
  "use strict";

  /* ---- mood 인트로 ------------------------------------------------------
     시안에서 온 값: 닫힌 문 30 × 484 → 다 열린 문 1920 × 무대 높이.

     무대 높이는 CSS의 --mood_stage_h가 정합니다. 여기서 숫자를 또 적어 두면
     둘이 어긋났을 때 GSAP이 남기는 인라인 style이 CSS를 덮어써서 문이
     엉뚱한 높이에서 멈춥니다. 그래서 재생할 때 DOM에서 직접 읽습니다.
     STAGE_HEIGHT는 못 읽었을 때만 쓰는 대비값입니다. */
  var REVEAL_WIDTH = 30;
  var REVEAL_HEIGHT = 484;
  var STAGE_WIDTH = 1920;
  var STAGE_HEIGHT = 1080;

  /* ======================================================================
     ▼▼ 여기 숫자만 바꾸면 됩니다 ▼▼
     ====================================================================== */

  /* ---- 1) 문이 열리는 속도 ----------------------------------------------
     검은 화면의 좁은 띠(30 × 484)가 실내 전체(1920 × 700)로 벌어집니다.
     가로가 먼저 벌어지고 세로가 뒤따라야 "상자가 커진다"가 아니라
     "문이 열린다"로 보입니다. */

  /* ★ 문 열림이 빠르면 이 숫자를 키우세요. 다 열리기까지 걸리는 시간(초)입니다.
       1.4 → 예전 (빨랐던 값)
       2.8 → 지금
       4.5 → 아주 느긋하게 */
  var OPEN_DURATION = 2.8;

  /* ★ 가로가 먼저 벌어지고 세로가 뒤따르기까지의 간격(초).
     키울수록 "옆으로 쫙 → 위아래로" 두 박자가 뚜렷해집니다.
     OPEN_DURATION보다 작아야 합니다(크면 자동으로 잘라냅니다). */
  var OPEN_HEIGHT_DELAY = 1;

  /* ★ 띠(글 + 무드 단어)가 흐르기 시작하는 시점(초).
     문이 다 열리기 조금 전에 시작해야 중간에 아무 일도 없는 빈 박자가 없습니다.
     기준: OPEN_DURATION보다 0.3~0.5초 작게. 문을 느리게 하면 이 값도 같이 키우세요. */
  var DRIFT_AT = 2.4;

  /* ---- 2) 흘러오는 속도 -------------------------------------------------
     글과 무드 단어는 한 띠로 붙어 오른쪽 밖에서 흘러 들어와 제자리에 잦아듭니다.
     멈췄다 다시 가는 구간이 없어야 "휙, 휙" 하지 않습니다. 트윈 하나가 전부입니다. */

  /* ★ 더 천천히 오게 하려면 이 숫자를 키우세요. 1920px을 흐르는 시간(초)입니다.
       4.2 → 최고 718px/초
       8.4 → 최고 359px/초
       15  → 최고 201px/초 (지금)
     전체 인트로 길이 = DRIFT_AT + DRIFT_DURATION 입니다. */
  var DRIFT_DURATION = 15;

  var DRIFT_EASE = "sine.out";  /* 들어올 때 속도가 붙어 있고 끝에서 서서히 잦아듭니다.
                                   power3.out은 급정거해서 "휙" 하고 멈춥니다 */

  /* ---- 3) 둥둥 뜨는 느낌 ------------------------------------------------
     흐르는 동안에도, 자리를 잡은 뒤에도 위아래로 계속 아주 천천히 흔들립니다.
     시안 자리를 한가운데 두고 위아래로 절반씩 오갑니다(평균은 시안 그대로). */

  /* ★ 더 크게 흔들리게 하려면 FLOAT_RANGE를, 더 느리게 하려면 FLOAT_TIME을 키우세요. */
  var FLOAT_RANGE = 14;  /* 위아래로 오가는 총 거리(px) */
  var FLOAT_TIME = 4.2;  /* 한 번 올라갔다 내려오는 데 걸리는 시간(초) */

  /* ★ 흔들 대상. 여기서 줄을 빼면 그 요소는 흔들리지 않습니다.
     글 상자(.mood_copy)는 사용자 요청으로 뺐습니다 — 되살리려면 아래 줄의 주석을 푸세요.

     셋이 똑같이 움직이면 기계처럼 보입니다. 요소마다 크기·속도·시작 시점을
     조금씩 달리해 서로 어긋나게 합니다. range와 time은 위 두 값의 배수입니다. */
  var FLOAT_TARGETS = [
    /* { selector: ".mood_copy",   range: 0.55, time: 1.45, delay: 0 }, */
    { selector: ".mood_word_unique",  range: 1,    time: 1,    delay: 0.35 },
    { selector: ".mood_word_modern",  range: 1.15, time: 0.86, delay: 0.9  },
    { selector: ".mood_word_elegant", range: 0.85, time: 1.18, delay: 0.6  }
  ];

  /* ======================================================================
     ▲▲ 여기까지 ▲▲
     ====================================================================== */

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
    var stage = document.querySelector(".mood_stage");
    var reveal = document.querySelector(".mood_reveal");
    var room = document.querySelector(".mood_room");
    var copy = document.querySelector(".mood_copy");
    var words = document.querySelector(".mood_words");

    /* 다 열린 문의 높이 = 무대 높이(CSS --mood_stage_h). CSS를 유일한 기준으로
       삼으려고 여기서 읽습니다. 스타일시트는 head에서 렌더링을 막고 들어오므로
       이 시점에 이미 적용돼 있습니다. */
    var stageHeight = (stage && Math.round(stage.getBoundingClientRect().height)) || STAGE_HEIGHT;

    if (!reveal || !room || !copy || !words) {
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

    /* 둥둥 뜨는 흔들림은 인트로와 따로 돕니다.

       흐르는 트윈은 x만, 이 트윈은 y만 건드립니다. GSAP은 transform의 x와 y를
       각각 따로 관리하므로 같은 요소에 두 트윈을 걸어도 서로 덮어쓰지 않습니다.
       무드 단어는 부모(.mood_words)가 x로 흐르고 자기 자신은 y로 흔들립니다.

       fromTo로 +절반에서 시작해 −절반까지 오가므로 평균 위치가 시안 좌표입니다.
       (0 → −range로 하면 늘 위로 치우칩니다.) */
    startFloating();

    function startFloating() {
      FLOAT_TARGETS.forEach(function (target) {
        var element = document.querySelector(target.selector);

        if (!element) {
          return;
        }

        var range = FLOAT_RANGE * target.range;

        gsap.fromTo(
          element,
          { y: range / 2 },
          {
            y: -range / 2,
            duration: FLOAT_TIME * target.time,
            delay: target.delay,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
          }
        );
      });
    }

    function play() {
      var timeline = gsap.timeline();

      /* 1. 문이 열린다. 가로가 먼저, 세로가 뒤따라야 상자가 커지는 게 아니라
            문이 열리는 것처럼 보입니다.

            세로 트윈 길이는 OPEN_DURATION − OPEN_HEIGHT_DELAY입니다. 지연을
            길이보다 크게 적으면 음수가 되어 트윈이 깨지므로 최소값으로 잘라냅니다. */
      var openHeightDuration = Math.max(0.2, OPEN_DURATION - OPEN_HEIGHT_DELAY);

      timeline.to(reveal, {
        width: STAGE_WIDTH,
        duration: OPEN_DURATION,
        ease: "power2.inOut"
      }, 0);

      timeline.to(reveal, {
        height: stageHeight,
        duration: openHeightDuration,
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
  function initYoungjinMotion() {
    if (
      typeof window.gsap === "undefined" ||
      typeof window.ScrollTrigger === "undefined" ||
      isReducedMotion()
    ) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    gsap.from(".youngjin_group_first", {
      x: -280,
      opacity: 0,
      duration: 2,
      ease: "power3.out",
      force3D: true,
      scrollTrigger: {
        trigger: ".youngjin_group_first",
        start: "top 82%",
        once: true
      }
    });

    gsap.from(".youngjin_group_second", {
      x: 280,
      opacity: 0,
      duration: 2,
      ease: "power3.out",
      force3D: true,
      scrollTrigger: {
        trigger: ".youngjin_group_second",
        start: "top 82%",
        once: true
      }
    });

    gsap.from(
      [".youngjin_wordmark", ".youngjin_handmade"],
      {
        y: 90,
        opacity: 0,
        duration: 2,
        stagger: 0.16,
        ease: "power3.out",
        force3D: true,
        scrollTrigger: {
          trigger: ".youngjin_handmade",
          start: "top 88%",
          once: true
        }
      }
    );
  }

  function initTchaikimTabs() {
    var tablist = document.querySelector(".tchaikim_tabs");

    if (!tablist) {
      return;
    }

    var tabs = Array.prototype.slice.call(tablist.querySelectorAll(".tchaikim_tab"));
    var panels = Array.prototype.slice.call(document.querySelectorAll(".tchaikim_panel"));

    function selectTab(nextTab) {
      var panelId = nextTab.getAttribute("aria-controls");

      tabs.forEach(function (tab) {
        var isSelected = tab === nextTab;
        tab.classList.toggle("is_active", isSelected);
        tab.setAttribute("aria-selected", String(isSelected));
        tab.setAttribute("tabindex", isSelected ? "0" : "-1");
      });

      panels.forEach(function (panel) {
        var isSelected = panel.id === panelId;
        panel.classList.toggle("is_active", isSelected);
        panel.hidden = !isSelected;
      });

      tablist.dispatchEvent(new window.CustomEvent("tchaikimchange"));
    }

    function handleTabClick(event) {
      var tab = event.target.closest(".tchaikim_tab");

      if (tab) {
        selectTab(tab);
      }
    }

    function handleTabKeydown(event) {
      var currentIndex = tabs.indexOf(event.target);

      if (currentIndex < 0 || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) {
        return;
      }

      event.preventDefault();
      var direction = event.key === "ArrowRight" ? 1 : -1;
      var nextTab = tabs[(currentIndex + direction + tabs.length) % tabs.length];
      nextTab.focus();
      selectTab(nextTab);
    }

    tablist.addEventListener("click", handleTabClick);
    tablist.addEventListener("keydown", handleTabKeydown);
  }

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
        var panel = video.closest(".tchaikim_panel");
        var shouldPlayVideo = shouldPlay && panel && !panel.hidden;

        if (shouldPlayVideo) {
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

    var tablist = section.querySelector(".tchaikim_tabs");

    if (tablist) {
      tablist.addEventListener("tchaikimchange", function () {
        var bounds = section.getBoundingClientRect();
        setPlaying(bounds.bottom > 0 && bounds.top < window.innerHeight);
      });
    }
  }

  /* 인트로는 첫 화면이라 한 프레임이라도 늦으면 완성된 모습이 비칩니다.
     나머지는 DOM이 다 준비된 뒤에 붙여도 됩니다. */
  initMoodIntro();

  function init() {
    initYoungjinMotion();
    initTchaikimTabs();
    initVideos();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
