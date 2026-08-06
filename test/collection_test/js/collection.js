(function () {
  "use strict";

  /* =========================================================
     showcase 스크롤 인터랙션 조절값
     ========================================================= */

  /* 시안 캔버스 폭. 상단 카드가 "가운데로 모이는" 목표 지점을 잡을 때 씁니다. */
  var CANVAS_WIDTH = 1920;

  /* pin 구간 길이. 화면 높이의 몇 배만큼 붙잡아 둘지입니다.
     늘리면 인트로 전체가 더 천천히, 더 여유 있게 진행됩니다. */
  var PIN_LENGTH = "+=140%";

  /* 상단 카드가 화면 바깥 어디에서 출발할지(px). 카드 폭보다 커야 완전히 가려집니다. */
  var ENTER_OFFSET = 560;

  /* 마지막에 화면 중앙까지 가는 비율. 1이면 두 장의 중심이 정확히 겹칩니다. */
  var CONVERGE_RATIO = 0.78;

  /* 물러날 때 커지는 배율과 3D 회전각. */
  var EXIT_SCALE = 1.9;
  var EXIT_TURN = 24;

  /* 들어올 때 3D 회전각과 원근 거리. 값이 작을수록 원근이 강해집니다. */
  var ENTER_TURN = 42;
  var PERSPECTIVE = 900;

  /* 시안 기울기. 들어올 때는 이 값의 ENTER_TILT_RATIO배에서 시작하고,
     물러날 때는 EXIT_TILT_RATIO배까지 수평에 가깝게 펴집니다. */
  var TILT_A = -15.55;
  var TILT_B = 13.07;
  var ENTER_TILT_RATIO = 2.2;
  var EXIT_TILT_RATIO = 0.13;

  /* 단어 연출. STAGGER가 클수록 "한 단어씩" 끊어져 올라오는 느낌이 또렷해집니다. */
  var WORD_SLIDE = 64;
  var WORD_DURATION = 0.45;
  var WORD_STAGGER = 0.22;

  /* 타임라인 위에서 각 박자가 시작하는 지점. */
  var CARD_B_DELAY = 0.08;
  var WORDS_START = 0.55;
  var EXIT_START = 1.55;
  var EXIT_DURATION = 1.4;

  /* 하단 갤러리 카드가 떠오르는 기본 거리(px). 카드마다 STEP만큼 더해 패럴랙스를 만듭니다. */
  var RISE_BASE = 110;
  var RISE_STEP = 26;

  /* =========================================================
     archive 조절값
     ========================================================= */

  /* 사진이 떠오르는 기본 거리와 카드별 증가폭.
     showcase 하단 갤러리와 같은 "y + opacity를 index만큼 어긋나게" 방식입니다. */
  var ARCHIVE_RISE_BASE = 90;
  var ARCHIVE_RISE_STEP = 18;

  /* 뒤에서 앞으로 쌓이는 느낌을 주려고 조금 작은 상태에서 시작합니다. */
  var ARCHIVE_ENTER_SCALE = 0.92;

  /* 한 장이 올라오는 시간과 장 사이 간격. STAGGER가 DURATION의 절반쯤이어야
     "한 장씩 얹히는" 리듬이 살아납니다(문장 단어 연출과 같은 기준). */
  var ARCHIVE_DURATION = 0.85;
  var ARCHIVE_STAGGER = 0.16;

  /* 연도를 바꿀 때 이전 세트가 사라지는 시간. 이 사이에 새 사진이 내려받기를 시작합니다. */
  var ARCHIVE_SWAP_FADE = 0.25;

  /* 쌓기 시작하는 지점. 섹션 상단이 화면 위에서 이만큼 내려온 순간입니다. */
  var ARCHIVE_START = "top top+=25%";

  var ARCHIVE_DEFAULT_YEAR = "2019";

  /* 연도별 사진 세트. 배열 순서가 곧 슬롯(.archive_photo_1 ~ _5) 순서이자
     쌓이는 순서입니다. width / height는 원본 픽셀 크기로,
     가로형 판별(is_wide)과 로딩 전 자리 확보에 씁니다.
     2013 / 2015 / 2017 / 2018은 연결할 사진이 없어 여기에 없습니다. */
  var ARCHIVE_PHOTOS = {
    "2019": [
      {
        src: "/asset/collection/archive_2019_1.png",
        width: 3263,
        height: 4898,
        alt: "2019 collection — a mustard jeogori over a sheer black skirt beside a lantern-lit mirror panel"
      },
      {
        src: "/asset/collection/archive_2019_2.png",
        width: 3263,
        height: 4898,
        alt: "2019 collection — a red jeogori with a grey patterned skirt and a purple silk wrap"
      },
      {
        src: "/asset/collection/archive_2019_3.png",
        width: 3262,
        height: 4898,
        alt: "2019 collection — a seated look in a tartan jeogori and a bright pink skirt"
      },
      {
        src: "/asset/collection/archive_2019_4.png",
        width: 3263,
        height: 4898,
        alt: "2019 collection — a camel jeogori over a cobalt skirt with a gold woven hem band"
      },
      {
        src: "/asset/collection/archive_2019_5.png",
        width: 3262,
        height: 4898,
        alt: "2019 collection — a black jacket and pink floral skirt in front of a red plum blossom screen"
      }
    ],
    "2020": [
      {
        src: "/asset/collection/archive_2020_1.png",
        width: 3336,
        height: 5008,
        alt: "2020 collection — a red and ivory jeogori with a chartreuse skirt, holding bamboo branches"
      },
      {
        src: "/asset/collection/archive_2020_2.png",
        width: 3336,
        height: 5008,
        alt: "2020 collection — a model waving a rainbow silk banner beside a white swan sculpture"
      },
      {
        src: "/asset/collection/archive_2020_3.png",
        width: 3336,
        height: 5008,
        alt: "2020 collection — a sheer ivory coat over a pink skirt with a white feathered headpiece"
      },
      {
        src: "/asset/collection/archive_2020_4.png",
        width: 3704,
        height: 5559,
        alt: "2020 collection — a close view of a yellow silk jacket over an embroidered pale yellow skirt"
      },
      {
        src: "/asset/collection/archive_2020_5.png",
        width: 3336,
        height: 5008,
        alt: "2020 collection — a white embroidered jeogori with a coral skirt and a woven straw hat"
      }
    ],
    /* 2021은 파일 번호 순서가 아닙니다. archive_2021_1이 유일한 가로형이라
       가장 넓은 3번 슬롯에 두었습니다. 좁은 슬롯에 넣으면 혼자만 작아 보입니다. */
    "2021": [
      {
        src: "/asset/collection/archive_2021_2.png",
        width: 3266,
        height: 4898,
        alt: "2021 collection — a black floral gown in front of a triptych of red mountain landscapes"
      },
      {
        src: "/asset/collection/archive_2021_3.png",
        width: 3347,
        height: 4730,
        alt: "2021 collection — a pink jeogori and chartreuse skirt seated at a carved palace lattice door"
      },
      {
        src: "/asset/collection/archive_2021_1.png",
        width: 4898,
        height: 3259,
        alt: "2021 collection — two hanbok looks displayed in a hall beside the Korean flag"
      },
      {
        src: "/asset/collection/archive_2021_4.png",
        width: 3347,
        height: 4730,
        alt: "2021 collection — a white robed look with a wide brimmed hat walking toward a palace hall"
      },
      {
        src: "/asset/collection/archive_2021_5.png",
        width: 3347,
        height: 4730,
        alt: "2021 collection — a pink hanbok on the stone steps of a palace pavilion"
      }
    ]
  };

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

  /* filter는 함수 종류와 순서가 처음부터 끝까지 같아야 보간됩니다.
     그래서 blur와 brightness를 항상 이 순서로 함께 씁니다. */
  function filterOf(blur, brightness) {
    return "blur(" + blur + "px) brightness(" + brightness + ")";
  }

  /* 상단 두 장은 세 박자로 움직입니다.
     1박자 — 화면 양 끝 바깥에서 시안 자리로 날아 들어와 안착
     2박자 — 가운데 문장이 한 단어씩 차례로 상승
     3박자 — 두 장이 중앙으로 모이며 커지고, 흐려지고 밝아지며 물러남
     2·3박자를 겹쳐 두어 사진이 물러나는 동안 문장이 자리를 넘겨받습니다. */
  function buildIntroTimeline(gsap, showcase, cards, words) {
    var cardA = cards[0];
    var cardB = cards[1];
    var imageA = cardA.querySelector("img");
    var imageB = cardB.querySelector("img");

    /* 원근은 각 img 자신에게 겁니다. 부모에 CSS perspective를 두면
       showcase_frame의 다른 사진들까지 3D 맥락에 들어갑니다. */
    gsap.set([imageA, imageB], { transformPerspective: PERSPECTIVE });

    var timeline = gsap.timeline({
      scrollTrigger: {
        trigger: showcase,
        start: "top top",
        end: PIN_LENGTH,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    timeline
      /* --- 1박자: 등장 --- */
      .fromTo(
        cardA,
        {
          x: -ENTER_OFFSET,
          y: 70,
          scale: 0.72,
          opacity: 0,
          filter: filterOf(12, 1.3)
        },
        {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          filter: filterOf(0, 1),
          ease: "power3.out",
          duration: 1
        },
        0
      )
      .fromTo(
        imageA,
        { rotationY: ENTER_TURN, rotation: TILT_A * ENTER_TILT_RATIO },
        { rotationY: 0, rotation: TILT_A, ease: "power3.out", duration: 1 },
        0
      )
      /* B는 살짝 늦게 들어와 두 장이 엇갈리는 리듬을 만듭니다. */
      .fromTo(
        cardB,
        {
          x: ENTER_OFFSET,
          y: 70,
          scale: 0.72,
          opacity: 0,
          filter: filterOf(12, 1.3)
        },
        {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          filter: filterOf(0, 1),
          ease: "power3.out",
          duration: 1
        },
        CARD_B_DELAY
      )
      .fromTo(
        imageB,
        { rotationY: -ENTER_TURN, rotation: TILT_B * ENTER_TILT_RATIO },
        { rotationY: 0, rotation: TILT_B, ease: "power3.out", duration: 1 },
        CARD_B_DELAY
      )

      /* --- 2박자: 단어가 하나씩 --- */
      .fromTo(
        words,
        { y: WORD_SLIDE, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "power3.out",
          duration: WORD_DURATION,
          stagger: WORD_STAGGER
        },
        WORDS_START
      )

      /* --- 3박자: 중앙으로 모이며 물러남 --- */
      .to(
        [cardA, cardB],
        {
          x: function (index, target) {
            return convergeDistance(target);
          },
          y: 130,
          scale: EXIT_SCALE,
          opacity: 0.08,
          filter: filterOf(26, 1.35),
          ease: "power2.in",
          duration: EXIT_DURATION
        },
        EXIT_START
      )
      .to(
        imageA,
        {
          rotationY: -EXIT_TURN,
          rotation: TILT_A * EXIT_TILT_RATIO,
          ease: "power2.in",
          duration: EXIT_DURATION
        },
        EXIT_START
      )
      .to(
        imageB,
        {
          rotationY: EXIT_TURN,
          rotation: TILT_B * EXIT_TILT_RATIO,
          ease: "power2.in",
          duration: EXIT_DURATION
        },
        EXIT_START
      );

    return timeline;
  }

  /* 하단 갤러리는 카드마다 따로 트리거를 답니다.
     한 타임라인으로 묶으면 카드가 1500px 넘게 흩어져 있어 화면 위치와 어긋납니다.
     트리거는 figure(움직이지 않음), 움직이는 건 안쪽 img라서 시작 지점이 흔들리지 않습니다.

     pinnedContainer가 반드시 필요합니다. 이 카드들은 위에서 pin되는 .showcase 안에 있어서,
     지정하지 않으면 pin이 끼워 넣는 여백만큼 시작 지점이 앞으로 당겨집니다.
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

  /* =========================================================
     archive — 연도 전환과 사진 쌓기
     ========================================================= */

  /* 한 슬롯에 사진 한 장을 끼웁니다. 폭은 CSS 슬롯이 정하고,
     높이는 img가 원본 비율대로 결정합니다(width / height 속성). */
  function applyPhoto(figure, photo) {
    var image = figure.querySelector("img");

    if (!image) {
      return;
    }

    figure.classList.toggle("is_wide", photo.width > photo.height);
    image.width = photo.width;
    image.height = photo.height;
    image.alt = photo.alt;
    image.src = photo.src;
  }

  function applyYearPhotos(figures, year) {
    var photos = ARCHIVE_PHOTOS[year];

    figures.forEach(function (figure, index) {
      if (photos[index]) {
        applyPhoto(figure, photos[index]);
      }
    });
  }

  /* 활성 연도 표시. 들여쓰기와 글자 크기는 CSS transition이 처리합니다. */
  function markActiveYear(buttons, year) {
    buttons.forEach(function (button) {
      var item = button.closest(".archive_year_item");
      var isActive = button.getAttribute("data-year") === year;

      if (item) {
        item.classList.toggle("is_active", isActive);
      }

      if (isActive) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  /* 쌓이기 전 상태. fromTo의 from 값과 완전히 같아야 합니다. */
  function archiveEnterVars() {
    return {
      /* 카드마다 출발 거리가 달라야 한 덩어리로 밀려 올라오지 않고 따로 얹힙니다. */
      y: function (index) {
        return ARCHIVE_RISE_BASE + index * ARCHIVE_RISE_STEP;
      },
      scale: ARCHIVE_ENTER_SCALE,
      opacity: 0
    };
  }

  /* showcase 하단 갤러리와 같은 fromTo(y + opacity)를 쓰되, 카드마다 트리거를 달지 않고
     타임라인 하나에 stagger로 묶습니다. 연도를 바꿀 때 처음부터 다시 재생해야 하는데
     scrub 트리거는 값이 스크롤 위치에 묶여 있어 다시 재생할 수 없기 때문입니다. */
  function buildArchiveTimeline(gsap, archive, images) {
    /* stagger를 건 fromTo는 각 대상의 차례가 와야 from 값을 적용합니다.
       그래서 미리 넣어 두지 않으면 두 번째 사진부터는 트리거 전까지 그대로 보이다가
       자기 차례에 갑자기 사라졌다 다시 나타납니다. */
    gsap.set(images, archiveEnterVars());

    return gsap
      .timeline({
        scrollTrigger: {
          trigger: archive,
          start: ARCHIVE_START,
          /* scrub이 아닙니다. 한 번 지나가면 재생하고, 그 뒤로는 스크롤이
             값을 건드리지 않으므로 연도 전환 때 restart()로 다시 쓸 수 있습니다. */
          toggleActions: "play none none none",
          invalidateOnRefresh: true
        }
      })
      .fromTo(
        images,
        archiveEnterVars(),
        {
          y: 0,
          scale: 1,
          opacity: 1,
          ease: "power3.out",
          duration: ARCHIVE_DURATION,
          stagger: ARCHIVE_STAGGER
        }
      );
  }

  function initArchive() {
    var archive = document.querySelector(".archive");

    if (!archive) {
      return;
    }

    var figures = Array.prototype.slice.call(archive.querySelectorAll(".archive_photo"));
    var buttons = Array.prototype.slice.call(archive.querySelectorAll(".archive_year_button"));

    if (figures.length === 0 || buttons.length === 0) {
      return;
    }

    var images = figures.map(function (figure) {
      return figure.querySelector("img");
    });
    var currentYear = ARCHIVE_DEFAULT_YEAR;

    /* 1280px 미만과 모션 감소 설정에서는 타임라인을 만들지 않습니다.
       그때는 이 값이 계속 null이고, 사진은 CSS 레이아웃 그대로 보입니다. */
    var timeline = null;

    function handleYearClick(event) {
      var button = event.currentTarget;
      var year = button.getAttribute("data-year");

      if (!year || year === currentYear || !ARCHIVE_PHOTOS[year]) {
        return;
      }

      currentYear = year;
      markActiveYear(buttons, year);

      if (!timeline) {
        applyYearPhotos(figures, year);
        return;
      }

      /* 이전 세트를 먼저 지웁니다. 사라지는 동안 새 사진이 내려받기를 시작하고,
         타임라인은 opacity 0에서 출발하므로 이어서 다시 쌓입니다. */
      window.gsap.to(images, {
        opacity: 0,
        duration: ARCHIVE_SWAP_FADE,
        ease: "power2.in",
        overwrite: true,
        onComplete: function () {
          applyYearPhotos(figures, year);
          timeline.restart();
        }
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", handleYearClick);
    });

    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    gsap.matchMedia().add(
      "(min-width: 1280px) and (prefers-reduced-motion: no-preference)",
      function () {
        timeline = buildArchiveTimeline(gsap, archive, images);

        return function () {
          timeline = null;
          /* 연도 전환 fade는 이 context 밖에서 만들어져 자동 복구 대상이 아닙니다.
             전환 도중 조건이 어긋나도 사진이 숨은 채 남지 않도록 직접 되돌립니다. */
          gsap.set(images, { clearProps: "all" });
        };
      }
    );
  }

  initHeroVideo();
  initShowcaseScroll();
  initArchive();
})();
