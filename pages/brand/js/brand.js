/* brand 페이지 스크립트

   1. mood 문 열림 — 스크롤해서 mood 섹션에 들어오면 한 번 재생됩니다
      (ScrollTrigger, once: true). 가운데 얇은 띠(30 × 484)에서 문
      (.mood_reveal)이 **세로 → 가로** 순서로 커집니다. 세로가 먼저
      무대 높이의 60%만큼만 자라 "띠 모양"이 완성되고(화면을 다 채우지
      않고 멈춤), 잠깐 뒤에 가로로 펼쳐지며 남은 세로(60% → 100%)도
      함께 자라 배경 사진이 다 드러납니다(레퍼런스 영상 순서). "초록 띠"로
      보이는 건 mood_inner.png 사진 한가운데의 좁은 부분(올리브색 벽)이고,
      문이 넓어질수록 사진에서 보이는 범위가 늘어날 뿐 사진 자체는 한 번도
      움직이지 않습니다. **사진이 다 드러난 뒤에야** 글·무드 단어
      (.mood_inner)가 옅게 떠오르며 나타납니다 — 그 전까지는 투명합니다.
      조절 값은 파일 위쪽 REVEAL_* 상수에 모아 두었습니다.

   2. tchaikim(5장면) 가로 스크롤 — 화면을 붙잡아 둔 채 트랙을 왼쪽으로 밉니다.

   3. atelier 사진 7장 — 왼쪽으로 계속 흐르는 무한 마퀴(CSS 애니메이션 +
      JS의 사진 복제/폭 측정). 속도는 ATELIER_SPEED 하나로 조절합니다.

   4. heritage — 화면을 붙잡아 둔 채(pin) 제목이 커지며 사라지고, 왼쪽
      사진 세 장이 순서대로 겹쳐 들어옵니다. 오른쪽 고정 텍스트는 첫
      사진과 함께 한 번만 나타나고, 마지막 사진 뒤에 Bespoke 버튼이
      뜹니다. 조절 값은 파일 위쪽 HERITAGE_* 상수에 모아 두었습니다.

   5. scroll 두루마기 영상 — 화면을 붙잡아 둔 채(pin) 스크롤 진행률을 영상의
      재생 시간(0~4.04초)에 그대로 매핑합니다(재생이 아니라 스크럽). 3초
      지점부터 텍스트가 페이드인합니다. 조절 값은 SCROLL_* 상수에 있습니다.

   6. tchaikim 영상 5개는 그 섹션을 보고 있을 때만 재생합니다.

   HTML/CSS의 기본 상태는 전부 "다 끝난 모습"입니다. 이 스크립트는 시작 상태로
   되돌린 뒤 재생합니다. 그래서 JS나 GSAP이 없으면 완성된 화면이 그대로 보입니다.
*/

(function () {
  "use strict";

  /* ---- mood 문 열림 (스크롤로 mood에 들어오면 재생) -----------------------
     배경 사진·글·무드 단어는 절대 움직이지 않습니다. 문(.mood_reveal)의
     크기만 커집니다 — 사진은 처음부터 무대 전체 크기로 고정돼 있고,
     문을 통해 보이는 범위만 늘어납니다. */

  /* 문의 시작 크기(닫힌 상태)와 무대 크기(다 열린 상태). CSS(.mood_stage /
     .mood_reveal)와 같은 값이어야 합니다 — 여기서 숫자를 바꾸면 CSS의
     .mood_reveal width/height 기본값(끝난 모습, 1920 × 1080)도 같이
     바꿔야 크기가 어긋나지 않습니다. */
  var REVEAL_CLOSED_WIDTH = 30;
  var REVEAL_CLOSED_HEIGHT = 484;
  var REVEAL_STAGE_WIDTH = 1920;
  var REVEAL_STAGE_HEIGHT = 1080;

  /* ★ "띠 모양"이 완성됐을 때의 높이 — 무대 높이의 비율입니다. 레퍼런스
     영상에서 세로가 화면 높이를 다 채우지 않고 60%만큼만 자란 뒤 멈춥니다.
     1로 두면 무대 높이(1080)까지 다 자랍니다. */
  var REVEAL_BAND_HEIGHT_RATIO = 0.6;

  /* ★ 1) 띠가 위아래로 자라 위 비율만큼 "띠 모양"이 완성되기까지 걸리는
     시간(초). */
  var REVEAL_HEIGHT_DURATION = 1;

  /* ★ 2) 띠 모양이 완성된 뒤, 가로로 펼쳐지기(배경처럼 넓어지기) 시작할
     때까지 멈춰 있는 시간(초). 레퍼런스 영상의 "완성 후 조금 뒤"입니다. */
  var REVEAL_WIDTH_DELAY = 0.3;

  /* ★ 3) 가로로 펼쳐지며 남은 세로(60% → 100%)도 함께 자라 배경 사진이
     다 드러나기까지 걸리는 시간(초). */
  var REVEAL_WIDTH_DURATION = 2.5;

  /* ★ 4) 사진이 다 드러난 뒤, 글·무드 단어(.mood_inner)가 떠오르며
     나타나는 데 걸리는 시간(초). 그 전까지는 배경 사진만 보입니다. */
  var REVEAL_TEXT_RISE = 24;       /* 아래에서 떠오르는 거리(px) */
  var REVEAL_TEXT_DURATION = 0.9;

  /* ---- tchaikim 가로 스크롤 --------------------------------------------- */
  var HORIZONTAL_MIN_WIDTH = 1280;
  var PANEL_WIDTH = 1920;

  /* ---- atelier 무한 마퀴 -------------------------------------------------
     ★ 속도를 바꾸고 싶으면 이 숫자만 고치면 됩니다. 사진 띠가 1초에 흐르는
     거리(px)입니다. 낮출수록 천천히 흐릅니다. */
  var ATELIER_SPEED = 40;

  /* ---- heritage 스크롤 리빌 -----------------------------------------------
     디자이너 주석 원문: "스크롤 하면 텍스트(Find Your Difference)가 앞으로
     커지면서 스크롤 한 번에 이미지 하나씩 오버레이 되고 3번째 사진 하단에
     비스포크로 이동하는 버튼이 나옴"

     구현: 화면에 붙잡아 둔(pin) 채로 스크롤량에 그대로 연결된(scrub) 타임라인
     하나가 4장면을 순서대로 재생합니다 — initHeritageReveal() 참고. */
  var HERITAGE_MIN_WIDTH = 1280;

  /* ★ 화면에 붙잡아 두는 길이. 늘리면 스크롤을 더 많이 해야 다음 장면으로
     넘어갑니다 — 전체 인터랙션이 더 천천히 진행됩니다. */
  var HERITAGE_PIN_LENGTH = "+=320%";

  /* ★ 제목이 앞으로 커지며 사라질 때의 최종 배율. 1.5면 원래 크기의
     1.5배까지 커진 뒤 사라집니다. */
  var HERITAGE_TITLE_SCALE = 1.5;
  var HERITAGE_TITLE_DURATION = 1; /* 제목이 커지며 사라지는 데 걸리는 길이(타임라인 단위) */

  /* ★ 사진이 겹쳐 들어오는 데 걸리는 길이(장당). 사진마다 이만큼씩 씁니다. */
  var HERITAGE_IMAGE_STEP = 1;

  /* ★ 사진이 자리를 잡기 전 살짝 확대돼 있는 시작 배율. 1에 가까울수록
     확대 느낌이 옅어집니다. */
  var HERITAGE_IMAGE_SCALE_FROM = 1.12;

  /* ★ 앞 장면이 채 안 끝났을 때 다음 장면이 미리 시작하는 겹침 길이.
     0이면 장면 사이가 뚝뚝 끊깁니다. */
  var HERITAGE_OVERLAP = 0.2;

  /* ★ 마지막 사진이 다 들어온 뒤 Bespoke 버튼이 뜨기까지 쉬는 시간 / 뜨는 길이.
     DURATION을 늘리면 버튼이 다 뜰 때까지 스크롤을 더 많이 해야 해서
     "천천히 올라온다"는 느낌이 강해집니다. */
  var HERITAGE_BUTTON_DELAY = 0.2;
  var HERITAGE_BUTTON_DURATION = 1.5;

  /* ★ 흑백 → 컬러. "과거 → 현재"를 색으로 보여주는 연출입니다. 전체 사진이
     겹쳐지는 동안 이 범위(FROM → TO) 안에서 사진 수만큼 고르게 나눠 갖습니다
     (3장이면 1→0.66→0.33→0 이런 식). 즉 첫 사진이 가장 흑백에 가깝게
     시작하고, 마지막 사진이 다 들어왔을 때 완전한 컬러(0)가 됩니다.
     FROM을 1보다 낮추면 "완전 흑백"까지는 안 가고 시작합니다. */
  var HERITAGE_GRAYSCALE_FROM = 1;
  var HERITAGE_GRAYSCALE_TO = 0;

  /* ---- scroll 두루마기 영상 스크럽 -----------------------------------------
     디자이너 주석 원문(Figma 'intro' 노드): "스크롤 4번에 두루마리가 펼쳐지게
     하면 좋을듯 / 두루마리 펼쳐지면서 텍스트 페이드아웃?되게 -> keyframe 사용? /
     brand 영상관련 / 영상 총 4초로 추정 / 1,2,3,4 스크롤에 맞춰서 4초로 /
     fade in opacity 3초부터해서 4초에 딱 텍스트가 보이게"

     구현: 화면에 붙잡아 둔(pin) 채로 스크롤 진행률(0→1)을 영상의
     currentTime(0→영상 길이)에 그대로 매핑합니다("영상 재생"이 아니라
     "스크롤한 만큼만 영상이 진행"). 별도 GSAP 트윈 없이, 진행률을 담은
     proxy 객체 하나를 ScrollTrigger로 스크럽하면서 매 프레임 video.currentTime을
     직접 seek합니다. */
  var SCROLL_MIN_WIDTH = 1280;

  /* ★ 화면에 붙잡아 두는 길이. 늘리면 영상 4초를 다 보려면 스크롤을 더 많이
     해야 합니다 — 더 천천히 진행됩니다. */
  var SCROLL_PIN_LENGTH = "+=250%";

  /* ★ 텍스트가 뜨기 시작하는 영상 시점(초). 디자이너 주석의 "3초부터"
     그대로입니다. 영상 길이(video.duration, 지금은 약 4.04초)는 하드코딩하지
     않고 재생 시점에 직접 읽으므로, 영상 파일이 바뀌어 길이가 달라져도
     이 숫자만 "영상이 끝나기 몇 초 전"이라는 의미로 자동 환산됩니다. */
  var SCROLL_TEXT_START_SECONDS = 3;

  /* ★ 핀이 풀리는 순간이 "뚝" 걸리듯 느껴지는 문제를 줄이는 값입니다.
     SETTLE_RATIO — 핀 구간 끝의 여유(0~1 비율). 영상/텍스트가 다 끝난
     뒤에도 곧바로 풀리지 않고, 이 비율까지는 화면이 가만히 멈춰 있다가
     풀립니다. 풀리는 순간 화면이 같이 바뀌지 않아야 "뚝" 하는 느낌이
     없습니다. 실제 영상 재생은 0에서 이 지점까지 0→1로 진행됩니다.

     ★ 붙잡히는 순간(진입) 쪽 여유는 뺐습니다. 핀에 걸리자마자 영상이
     바로 반응해야 "스크롤이 씹힌다"는 느낌이 안 듭니다 — 여유를 두면
     오히려 그 구간 동안 스크롤해도 아무 반응이 없어서 더 "걸린" 것처럼
     보였습니다. 진입이 무겁게 느껴지는 진짜 원인은 바로 앞 heritage
     섹션도 핀 섹션이라 두 핀이 곧바로 이어지는 것이었고, 이건
     anticipatePin으로 다룹니다(heritage/scroll 두 ScrollTrigger 모두 켜져
     있습니다). */
  var SCROLL_LEAD_RATIO = 0;
  var SCROLL_SETTLE_RATIO = 0.9;

  function isReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* mood 문 열림. 스크립트가 body 끝에 있어 이 함수는 DOMContentLoaded를
     기다리지 않고 바로 실행됩니다 — mood가 첫 화면이라 스크롤 조건이 거의
     즉시 만족되므로, 늦게 붙이면 문이 열리기 전에 완성된 모습이 먼저
     비칠 수 있습니다.

     이 함수는 문(.mood_reveal)의 크기만 움직입니다. 배경 사진(.mood_room),
     .mood_left / .mood_right 안의 글·무드 단어는 시작부터 끝까지 한 번도
     건드리지 않습니다(정적 레이아웃) — 전부 문 안에 무대 전체 크기로
     이미 놓여 있고, 문이 열리는 만큼 보이는 범위만 늘어날 뿐입니다. */
  function initMoodReveal() {
    if (
      typeof window.gsap === "undefined" ||
      typeof window.ScrollTrigger === "undefined" ||
      isReducedMotion()
    ) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    var section = document.querySelector(".mood");
    var reveal = document.querySelector(".mood_reveal");
    var room = document.querySelector(".mood_room");
    var inner = document.querySelector(".mood_inner");

    if (!section || !reveal || !room || !inner) {
      return;
    }

    /* 시작 상태 — 닫힌 문(30 × 484), 글·무드 단어(.mood_inner)는 투명 +
       아래로 24px. CSS 기본값(끝난 모습 = 다 열리고 다 보이는 상태)과
       반대이므로, 재생 전에 반드시 되돌려야 합니다. */
    gsap.set(reveal, {
      width: REVEAL_CLOSED_WIDTH,
      height: REVEAL_CLOSED_HEIGHT
    });
    gsap.set(inner, {
      opacity: 0,
      y: REVEAL_TEXT_RISE
    });

    function play() {
      /* 스크롤로 mood 섹션에 들어오는 순간 한 번만 재생합니다(once: true).
         섹션이 첫 화면이라 페이지를 열자마자(=거의 즉시 스크롤 조건을
         만족) 재생되는 게 정상입니다. */
      var timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          once: true
        }
      });

      /* 1. 세로가 먼저 무대 높이의 REVEAL_BAND_HEIGHT_RATIO(60%)만큼만
            자라 "띠 모양"이 완성됩니다(레퍼런스 영상 순서 — 화면을 다
            채우지 않고 멈춥니다). */
      timeline.to(reveal, {
        height: REVEAL_STAGE_HEIGHT * REVEAL_BAND_HEIGHT_RATIO,
        duration: REVEAL_HEIGHT_DURATION,
        ease: "power2.inOut"
      }, 0);

      /* 2. 띠 모양이 완성된 뒤 잠깐 멈췄다가(REVEAL_WIDTH_DELAY), 가로로
            펼쳐지며 배경처럼 넓어집니다. 남은 세로(60% → 100%)도 이때
            함께 자라 배경 사진이 다 드러납니다. 이 시점까지 글·무드
            단어는 여전히 투명합니다. */
      timeline.to(reveal, {
        width: REVEAL_STAGE_WIDTH,
        height: REVEAL_STAGE_HEIGHT,
        duration: REVEAL_WIDTH_DURATION,
        ease: "power2.inOut"
      }, REVEAL_HEIGHT_DURATION + REVEAL_WIDTH_DELAY);

      /* 3. 사진이 다 드러난 뒤에야 글·무드 단어(.mood_inner)가 떠오르며
            나타납니다 — "사진이 드러난 후 텍스트가 뜬다" 순서입니다. */
      var revealEnd = REVEAL_HEIGHT_DURATION + REVEAL_WIDTH_DELAY + REVEAL_WIDTH_DURATION;

      timeline.to(inner, {
        opacity: 1,
        y: 0,
        duration: REVEAL_TEXT_DURATION,
        ease: "power2.out"
      }, revealEnd);
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

  /* heritage 섹션 — 제목이 커지며 사라지고, 사진 세 장이 차례로 겹쳐
     들어온 뒤 Bespoke 버튼이 뜹니다. 위 HERITAGE_* 상수 설명을 먼저 보세요.

     타이밍은 "고정 초"가 아니라 "타임라인 단위"입니다. scrub:1이라
     타임라인 진행이 스크롤 위치에 그대로 묶여 있고, 전체 길이는
     HERITAGE_PIN_LENGTH(스크롤 거리)가 정합니다. 그래서 여기 숫자를 조절해도
     "몇 초"가 아니라 "전체 스크롤 구간에서 몇 %를 쓰는지"가 바뀝니다.

     사진 오버레이는 왼쪽 사진 칼럼(.heritage_photos, CSS에서 400×714로
     고정된 자리) 안에서 세 장을 전부 같은 자리(position:absolute + inset:0)에
     포개 두고 opacity만 바꾸는 방식입니다. 나중 사진일수록 HTML에서 뒤에
     오므로 저절로 위에 그려져서, 앞 사진을 따로 숨기지 않아도 "겹쳐
     들어오는" 것처럼 보입니다. 오른쪽 텍스트(.heritage_info)는 사진과
     달리 겹치지 않는 고정 칼럼이라, 첫 사진이 뜨는 시점에 딱 한 번만
     나타나 그대로 있습니다. */
  function initHeritageReveal() {
    var section = document.querySelector(".heritage");
    var frame = document.querySelector(".heritage_frame");
    var titleStage = document.querySelector(".heritage_stage_title");
    var info = document.querySelector(".heritage_info");
    var imageStages = Array.prototype.slice.call(
      document.querySelectorAll(".heritage_photos .heritage_stage")
    );

    if (
      typeof window.gsap === "undefined" ||
      typeof window.ScrollTrigger === "undefined" ||
      !section || !frame || !titleStage || imageStages.length < 1
    ) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    /* matchMedia를 쓰면 조건이 어긋날 때(창을 좁히거나 모션 축소 설정을
       켜면) GSAP이 스스로 원래 상태로 되돌립니다. is_pinned도 같이 떼어
       CSS를 정지 레이아웃으로 원상복구합니다. */
    gsap.matchMedia().add(
      "(min-width: " + HERITAGE_MIN_WIDTH + "px) and (prefers-reduced-motion: no-preference)",
      function () {
        section.classList.add("is_pinned");

        var title = titleStage.querySelector(".heritage_headline");
        var button = document.querySelector(".heritage_button");

        /* 시작 상태 — 제목만 보이고 사진 세 장·오른쪽 텍스트·버튼은 투명합니다. */
        gsap.set(imageStages, { opacity: 0 });

        if (info) {
          gsap.set(info, { opacity: 0, y: 24 });
        }

        if (button) {
          gsap.set(button, { opacity: 0, y: 40 });
        }

        var timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: HERITAGE_PIN_LENGTH,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });

        /* 1. 제목 — 앞으로 커지며(scale) 흐려져 사라짐 */
        if (title) {
          timeline.to(title, {
            scale: HERITAGE_TITLE_SCALE,
            opacity: 0,
            ease: "power1.in",
            duration: HERITAGE_TITLE_DURATION
          }, 0);
        }

        /* 2~4. 사진 세 장이 순서대로 겹쳐 들어옵니다. previousEnd를 계속
           갱신하면서 다음 장면 시작점을 "직전 장면 끝 − 겹침"으로 잡으므로,
           사진을 늘리거나 줄여도(HTML의 .heritage_stage 개수 변경) 이 함수는
           손댈 필요 없이 자동으로 이어집니다.

           사진마다 흑백→컬러 구간을 (HERITAGE_GRAYSCALE_FROM ~ TO) 안에서
           균등하게 나눠 갖습니다. imageStages.length로 나누므로 사진 수가
           바뀌어도 항상 첫 장 = 가장 흑백, 마지막 장 끝 = 완전 컬러(TO)로
           맞춰집니다. */
        var previousEnd = HERITAGE_TITLE_DURATION;
        var grayscaleRange = HERITAGE_GRAYSCALE_TO - HERITAGE_GRAYSCALE_FROM;

        imageStages.forEach(function (stage, index) {
          var img = stage.querySelector("img");
          var startAt = Math.max(0, previousEnd - HERITAGE_OVERLAP);
          var endAt = startAt + HERITAGE_IMAGE_STEP;
          var grayscaleFrom = HERITAGE_GRAYSCALE_FROM + grayscaleRange * (index / imageStages.length);
          var grayscaleTo = HERITAGE_GRAYSCALE_FROM + grayscaleRange * ((index + 1) / imageStages.length);

          timeline.fromTo(
            stage,
            { opacity: 0 },
            { opacity: 1, duration: HERITAGE_IMAGE_STEP, ease: "power1.inOut" },
            startAt
          );

          if (img) {
            timeline.fromTo(
              img,
              { scale: HERITAGE_IMAGE_SCALE_FROM, filter: "grayscale(" + grayscaleFrom + ")" },
              { scale: 1, filter: "grayscale(" + grayscaleTo + ")", duration: HERITAGE_IMAGE_STEP, ease: "power1.inOut" },
              startAt
            );
          }

          /* 오른쪽 텍스트는 사진처럼 매번 나타나지 않고, 첫 사진(past)이
             뜨는 시점에 딱 한 번만 같이 페이드인합니다. */
          if (index === 0 && info) {
            timeline.to(info, {
              opacity: 1,
              y: 0,
              duration: HERITAGE_IMAGE_STEP,
              ease: "power1.inOut"
            }, startAt);
          }

          previousEnd = endAt;
        });

        /* 5. 마지막 사진이 다 들어온 뒤 Bespoke 버튼이 아래에서 올라옴 */
        if (button) {
          var buttonStart = previousEnd + HERITAGE_BUTTON_DELAY;

          timeline.to(button, {
            opacity: 1,
            y: 0,
            duration: HERITAGE_BUTTON_DURATION,
            ease: "power2.out"
          }, buttonStart);
        }

        return function () {
          section.classList.remove("is_pinned");
        };
      }
    );
  }

  /* scroll 섹션 — 두루마기 영상을 스크롤로 스크럽합니다. 위 SCROLL_* 상수
     설명을 먼저 보세요.

     ★ assets/video/intro.mp4는 매 프레임이 키프레임입니다(ffmpeg -g 1로
     재인코딩, 원본 1840×1124·24fps·97프레임 그대로, 자르지 않음, 1.7MB).
     브라우저가 영상을 되감을 때 가장 가까운 키프레임부터 다시 디코딩하는데,
     일반적인 인코딩(키프레임 간격 넓음)은 이 되감기가 스크롤 속도를 못
     따라가 "멈췄다가 마지막 장면으로 점프"하는 것처럼 보입니다. 영상을
     새로 받으면 같은 명령으로 다시 인코딩해야 스크럽이 매끄럽습니다:
     ffmpeg -i 원본.mp4 -an -c:v libx264 -profile:v high -pix_fmt yuv420p
     -g 1 -keyint_min 1 -sc_threshold 0 -crf 20 -preset slow
     -movflags +faststart intro.mp4 */
  function initScrollVideo() {
    var section = document.querySelector(".scroll");
    var video = document.querySelector(".scroll_video");
    var overlay = document.querySelector(".scroll_overlay");

    if (
      typeof window.gsap === "undefined" ||
      typeof window.ScrollTrigger === "undefined" ||
      !section || !video
    ) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    gsap.matchMedia().add(
      "(min-width: " + SCROLL_MIN_WIDTH + "px) and (prefers-reduced-motion: no-preference)",
      function () {
        var scrollTween = null;

        function start() {
          var duration = video.duration;

          if (!duration) {
            return;
          }

          /* JS가 넘겨받는 순간부터는 스크롤이 재생을 대신합니다.
             HTML의 autoplay/loop는 JS 없을 때를 위한 기본값이었을 뿐입니다. */
          video.pause();
          video.removeAttribute("loop");

          if (overlay) {
            gsap.set(overlay, { opacity: 0 });
          }

          /* 사용자가 스크롤해서 들어오기 전에 디코더를 미리 깨워둡니다.
             영상을 실제로 다루는 "첫 요청"이 하필 스크롤로 진입하는 순간과
             겹치면, 디코더 준비·GPU 레이어 승격 비용이 그 타이밍에 몰려서
             "덜컥"하는 끊김으로 느껴집니다. 끝·중간·처음 세 지점을 미리
             seek해 두면 그 비용을 페이지 로드 시점으로 옮기고, 스크럽 중
             다른 구간으로 넘어갈 때도 이미 한 번 디코딩된 적이 있어 더
             가볍게 처리됩니다. */
          primeVideo(function () {
            setupScrollTrigger(duration);
          });
        }

        function primeVideo(done) {
          var checkpoints = [video.duration * 0.99, video.duration * 0.5, 0];
          var index = 0;

          function next() {
            if (index >= checkpoints.length) {
              video.removeEventListener("seeked", onSeeked);
              done();
              return;
            }

            video.currentTime = checkpoints[index];
          }

          function onSeeked() {
            index += 1;
            next();
          }

          video.addEventListener("seeked", onSeeked);
          next();
        }

        function setupScrollTrigger(duration) {
          /* 영상 길이 안에서 "텍스트가 뜨기 시작하는 지점"의 비율.
             예: 4.04초 영상에 SCROLL_TEXT_START_SECONDS=3이면 0.743. */
          var textStartRatio = Math.min(0.99, SCROLL_TEXT_START_SECONDS / duration);
          var settleSpan = SCROLL_SETTLE_RATIO - SCROLL_LEAD_RATIO;
          var proxy = { progress: 0 };

          scrollTween = gsap.to(proxy, {
            progress: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: SCROLL_PIN_LENGTH,
              pin: true,
              /* scrub: 1처럼 숫자를 주면 스크롤을 따라가는 데 최대 1초의
                 지연(관성)이 붙습니다. 이 사이트는 이미 Lenis로 스크롤
                 자체가 부드러운데, 그 위에 이 지연까지 겹치면 핀에 걸리는
                 순간 "즉각 반응 → 1초 늦게 따라옴"으로 반응 방식이 바뀌어
                 버려서 "턱 걸리고 나서야 움직인다"로 느껴집니다. true는
                 지연 없이 스크롤 위치에 그대로 붙습니다. */
              scrub: true,
              anticipatePin: 1,
              invalidateOnRefresh: true
            },
            onUpdate: function () {
              /* 핀 구간 전체(0~1)에서 앞뒤 여유(LEAD~SETTLE)를 뺀 가운데
                 구간만 영상 진행(0~1)으로 다시 매핑합니다. 여유 구간에서는
                 eased가 0 또는 1에 고정돼 있어 영상/텍스트가 그대로입니다. */
              var eased = Math.max(0, Math.min(1, (proxy.progress - SCROLL_LEAD_RATIO) / settleSpan));

              video.currentTime = eased * duration;

              if (overlay) {
                var textProgress = (eased - textStartRatio) / (1 - textStartRatio);
                overlay.style.opacity = String(Math.max(0, Math.min(1, textProgress)));
              }
            }
          });
        }

        if (video.readyState >= 1) {
          start();
        } else {
          video.addEventListener("loadedmetadata", start, { once: true });
        }

        /* 조건이 어긋나면(창을 좁히거나 모션 축소 설정을 켜면) pin과 스크럽을
           걷어내고, 영상은 다시 자동 반복 재생으로, 텍스트는 다시 항상 보이는
           상태로 되돌립니다. */
        return function () {
          if (scrollTween) {
            if (scrollTween.scrollTrigger) {
              scrollTween.scrollTrigger.kill();
            }
            scrollTween.kill();
          }

          video.setAttribute("loop", "");
          var played = video.play();

          if (played && typeof played.catch === "function") {
            played.catch(function () {
              /* 자동재생이 거절되면 첫 프레임에 멈춘 채로 남습니다. */
            });
          }

          if (overlay) {
            overlay.style.opacity = "";
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

  /* atelier 섹션의 사진 7장을 왼쪽으로 계속 흘려보내는 무한 마퀴입니다.

     실제로 흐르게 하는 건 CSS(@keyframes atelier_marquee, css/brand.css)입니다.
     여기서는 시작 전에 딱 한 번:
       1) 사진을 이어붙일 만큼 통째로 복제하고 (aria-hidden="true" — 스크린리더가
          같은 사진을 여러 번 읽지 않도록)
       2) 원본 한 벌의 폭(period)을 재서 --atelier_period로 CSS에 넘기고
       3) period ÷ ATELIER_SPEED로 애니메이션 길이(--atelier_duration)를 정합니다.
     그다음 CSS가 0 → -period로 무한 반복하고, 마지막에 원본 자리로 돌아온
     순간이 곧 복제본이 원본과 겹치는 순간이라 이음매가 보이지 않습니다.

     사진은 전부 고정 px 크기(css의 .atelier_photo_1~7)라 이미지 로딩을
     기다리지 않고 바로 폭을 잴 수 있습니다.

     ★ 속도는 이 함수가 아니라 위쪽 ATELIER_SPEED에서 바꾸세요.
     ★ 사진을 늘리거나 줄이면(HTML의 .atelier_photo 개수 변경) 이 함수는
       손댈 필요 없이 자동으로 새 폭에 맞춰집니다.
     ★ prefers-reduced-motion에서는 아예 실행하지 않습니다 — CSS 기본값인
       "가운데 정렬 + 좌우 크롭" 정지 화면(시안 그대로)이 보입니다. */
  function initAtelierMarquee() {
    var row = document.querySelector(".atelier_row");

    if (!row || isReducedMotion()) {
      return;
    }

    var originals = Array.prototype.slice.call(row.children);

    if (originals.length < 2) {
      return;
    }

    function appendOneSet() {
      originals.forEach(function (node) {
        var clone = node.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        row.appendChild(clone);
      });
    }

    /* period를 재려면 최소 한 벌은 더 있어야 "원본 시작 ~ 복제본 시작"
       사이 거리를 잴 수 있습니다. */
    appendOneSet();
    row.classList.add("is_marquee");

    var firstOriginal = originals[0];
    var firstClone = row.children[originals.length];
    var period = firstClone.getBoundingClientRect().left - firstOriginal.getBoundingClientRect().left;

    if (!(period > 0)) {
      /* 폭을 하나도 못 쟀으면(레이아웃이 아직 안 잡힌 특수한 경우) 마퀴를
         켜지 않습니다 — 끊기는 애니메이션보다 정지 화면이 낫습니다. */
      row.classList.remove("is_marquee");
      return;
    }

    row.style.setProperty("--atelier_period", period + "px");
    row.style.setProperty("--atelier_duration", (period / ATELIER_SPEED) + "s");

    /* 넓은 화면(예: 2560px)에서 이음매가 화면 밖으로 나가도록, 화면 폭 +
       한 벌을 채울 때까지 계속 복제해 둡니다. */
    while (row.scrollWidth < window.innerWidth + period) {
      appendOneSet();
    }
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

  /* mood는 첫 화면이라 한 프레임이라도 늦으면 문이 열리기 전에 완성된
     모습이 먼저 비칠 수 있습니다. 나머지는 DOM이 다 준비된 뒤에
     붙여도 됩니다. */
  initMoodReveal();

  function init() {
    initYoungjinMotion();
    initAtelierMarquee();
    initHeritageReveal();
    initScrollVideo();
    initTchaikimTabs();
    initVideos();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
