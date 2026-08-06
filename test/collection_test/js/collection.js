(function () {
  "use strict";

  /* 시안 캔버스 폭. 상단 카드가 "가운데로 모이는" 목표 지점을 잡을 때 씁니다. */
  var CANVAS_WIDTH = 1920;

  /* 상단 카드가 화면 중앙까지 가는 비율. 1이면 두 장이 겹칩니다. */
  var CONVERGE_RATIO = 0.45;

  /* 하단 갤러리 카드가 떠오르는 기본 거리(px). 카드마다 STEP만큼 더해 패럴랙스를 만듭니다. */
  var RISE_BASE = 110;
  var RISE_STEP = 26;

  /* hero 영상은 시안에 재생 컨트롤이 없습니다.
     모션 감소 설정에서는 자동 재생 대신 첫 화면에서 멈춰 있게 합니다. */
  function initHeroVideo() {
    var video = document.getElementById("collection_hero_video");

    if (!video) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.removeAttribute("autoplay");
      video.autoplay = false;
      video.pause();
    }
  }

  /* "You Won't / Find This in / Ordinary Fashion" 세 줄을 단어 단위 span으로 나눕니다.
     stagger는 요소 단위로만 걸리기 때문입니다.

     단어 span을 .showcase_quote_line에 바로 넣으면 안 됩니다.
     그 줄은 flex 컨테이너라서 flex item 사이의 공백 전용 텍스트 노드가 규격상 무시되고
     "YouWon't"처럼 단어가 붙어 버립니다. 그래서 inline 래퍼 한 겹을 두고
     그 안에서 일반 inline 흐름으로 단어와 공백을 배치합니다. */
  function splitQuoteWords() {
    var lines = Array.prototype.slice.call(
      document.querySelectorAll(".showcase_quote_line")
    );
    var words = [];

    lines.forEach(function (line) {
      var text = line.textContent.trim();

      if (!text) {
        return;
      }

      var wrap = document.createElement("span");
      wrap.className = "showcase_quote_text";

      text.split(/\s+/).forEach(function (word, index) {
        if (index > 0) {
          wrap.appendChild(document.createTextNode(" "));
        }

        var span = document.createElement("span");
        span.className = "showcase_quote_word";
        span.textContent = word;
        wrap.appendChild(span);
        words.push(span);
      });

      line.textContent = "";
      line.appendChild(wrap);
    });

    return words;
  }

  /* 카드 중심에서 캔버스 중앙까지의 거리 중 CONVERGE_RATIO 만큼을 이동량으로 씁니다.
     offsetLeft는 .showcase_frame(position: relative) 기준이라 시안 좌표와 같습니다. */
  function convergeDistance(card) {
    var cardCenter = card.offsetLeft + card.offsetWidth / 2;
    return (CANVAS_WIDTH / 2 - cardCenter) * CONVERGE_RATIO;
  }

  function buildIntroTimeline(gsap, showcase, cards, words) {
    /* blur는 시작값이 있어야 보간됩니다. CSS에 두면 항상 합성 레이어가 생기므로
       인터랙션이 실제로 켜질 때만 JS로 깔아 둡니다. */
    gsap.set(cards, { filter: "blur(0px)" });

    var timeline = gsap.timeline({
      scrollTrigger: {
        trigger: showcase,
        start: "top top",
        /* 화면 한 장 분량만큼 고정해 두고 그 사이에 인트로가 끝납니다. */
        end: "+=100%",
        pin: true,
        pinSpacing: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    timeline
      /* 상단 두 장: 가운데로 모이며 커지고, 흐려지면서 물러납니다. */
      .to(
        cards,
        {
          x: function (index, target) {
            return convergeDistance(target);
          },
          y: 90,
          scale: 1.35,
          opacity: 0.12,
          filter: "blur(14px)",
          ease: "none",
          duration: 1
        },
        0
      )
      /* 기울기는 0쪽으로 완화됩니다. 회전은 프레임이 아니라 안쪽 img에 걸려 있습니다. */
      .to(
        ".showcase_photo_a img",
        { rotation: -4, ease: "none", duration: 1 },
        0
      )
      .to(
        ".showcase_photo_b img",
        { rotation: 3.5, ease: "none", duration: 1 },
        0
      )
      /* 가운데 문장: 단어가 순서대로 아래에서 떠오릅니다. */
      .fromTo(
        words,
        { y: 42, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "power2.out",
          duration: 0.5,
          stagger: 0.08
        },
        0.2
      );

    return timeline;
  }

  /* 하단 갤러리는 카드마다 따로 트리거를 답니다.
     한 타임라인으로 묶으면 카드가 1500px 넘게 흩어져 있어 화면 위치와 어긋납니다.
     트리거는 figure(움직이지 않음), 움직이는 건 안쪽 img라서 시작 지점이 흔들리지 않습니다.

     pinnedContainer가 반드시 필요합니다. 이 카드들은 위에서 pin되는 .showcase 안에 있어서,
     지정하지 않으면 pin이 끼워 넣는 여백(100vh)만큼 시작 지점이 앞으로 당겨집니다.
     그러면 화면에 보이지도 않는 pin 구간에서 이미 애니메이션이 끝나 버립니다. */
  function buildGalleryTimelines(gsap, showcase) {
    var selectors = [
      ".showcase_photo_c",
      ".showcase_photo_d",
      ".showcase_photo_e",
      ".showcase_photo_f",
      ".showcase_photo_g"
    ];

    selectors.forEach(function (selector, index) {
      var card = document.querySelector(selector);
      var image = card && card.querySelector("img");

      if (!image) {
        return;
      }

      gsap
        .timeline({
          scrollTrigger: {
            trigger: card,
            pinnedContainer: showcase,
            start: "top bottom-=40",
            end: "top center+=80",
            scrub: 1,
            invalidateOnRefresh: true
          }
        })
        .fromTo(
          image,
          { y: RISE_BASE + index * RISE_STEP, opacity: 0 },
          { y: 0, opacity: 1, ease: "none", duration: 1 }
        );
    });
  }

  function initShowcaseScroll() {
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
      return;
    }

    var showcase = document.querySelector(".showcase");
    var cardA = document.querySelector(".showcase_photo_a");
    var cardB = document.querySelector(".showcase_photo_b");

    if (!showcase || !cardA || !cardB) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    var words = splitQuoteWords();

    /* 이번 구현은 데스크톱 기준입니다. 1280px 미만과 모션 감소 설정에서는
       인터랙션 없이 CSS 레이아웃 그대로 보입니다. matchMedia가 조건이 어긋나면
       설정한 값을 알아서 되돌립니다. */
    gsap.matchMedia().add(
      "(min-width: 1280px) and (prefers-reduced-motion: no-preference)",
      function () {
        buildIntroTimeline(gsap, showcase, [cardA, cardB], words);
        buildGalleryTimelines(gsap, showcase);
      }
    );
  }

  initHeroVideo();
  initShowcaseScroll();
})();
