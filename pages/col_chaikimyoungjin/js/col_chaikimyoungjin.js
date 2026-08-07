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

  /* 화면 밖에서 날아 들어오는 기본 거리(px). 카드마다 아래 배치표의 travel 배수를 곱해
     서로 다른 거리에서 출발합니다. 방향은 카드가 프레임 중앙의 어느 쪽에 있는지로 정합니다.
     showcase 상단 두 장이 x ∓560에서 들어오는 것과 같은 크기입니다. */
  var ARCHIVE_ENTER_DISTANCE = 520;

  /* 뒤에서 앞으로 쌓이는 느낌을 주려고 작고 비뚤어진 상태에서 시작합니다.
     SPIN은 출발 방향의 좌우 성분에 곱해져 카드마다 기울기가 달라집니다. */
  var ARCHIVE_ENTER_SCALE = 0.78;
  var ARCHIVE_ENTER_SPIN = 14;

  /* 한 장이 날아드는 시간과 장 사이 간격. STAGGER가 DURATION의 절반보다 작아야
     앞 카드가 도착하기 전에 다음 카드가 출발해 "겹겹이 쌓이는" 흐름이 이어집니다. */
  var ARCHIVE_DURATION = 0.95;
  var ARCHIVE_STAGGER = 0.18;

  /* 연도를 바꿀 때 이전 세트가 사라지는 시간. 이 사이에 새 사진이 내려받기를 시작합니다. */
  var ARCHIVE_SWAP_FADE = 0.25;

  /* 날아들기 시작하는 지점. 섹션 상단이 화면 위에서 이만큼 내려온 순간입니다.
     섹션 높이가 화면 한 장 정도라, 이 값이 크면 아래쪽 카드가 아직 화면 밖일 때 시작합니다. */
  var ARCHIVE_START = "top top+=10%";

  var ARCHIVE_DEFAULT_YEAR = "2021";

  /* =========================================================
     as worn 조절값
     ========================================================= */

  /* 띠가 왼쪽으로 흐르는 속도(px/초). 올리면 빨라집니다. */
  var ASWORN_SPEED = 42;

  /* 태그를 눌렀을 때 그 카드가 가운데로 오기까지의 시간(초). */
  var ASWORN_FOCUS_DURATION = 1.1;

  /* 가운데에 도착한 뒤 멈춰 있는 시간(초). 이 시간이 지나면 다시 흐릅니다. */
  var ASWORN_HOLD = 2.4;

  /* 1920 프레임 안에서 카드가 놓이는 자리. 연도마다 완전히 다른 배치를 씁니다.
     격자나 대각선 같은 규칙을 두지 않고 손으로 흩어 놓은 값입니다.

     - left / top / width: px. 높이는 사진 원본 비율을 따르므로 적지 않습니다.
     - tilt: deg. layer: z-index로, 1~5를 순서 없이 섞어 겹침이 예측되지 않게 합니다.
     - travel: 출발 거리 배수. ARCHIVE_ENTER_DISTANCE에 곱합니다.

     지킬 것 세 가지입니다.
     1. 왼쪽 sticky 글 영역이 x 120~470을 쓰므로 left는 500 이상이어야 합니다.
     2. 오른쪽 끝은 1780 이하, 아래 끝은 프레임 높이(920) 이하여야 합니다.
        벗어나면 .archive의 overflow: clip에 잘립니다.
     3. 다섯 장이 데스크톱 한 화면에 다 보여야 합니다. 프레임 높이가 브라우저 화면
        높이(1920 × 1080에서 900~950px)에 맞춰 잡혀 있으므로 아래 끝을 830 근처로 둡니다.
        폭을 키우면 높이도 원본 비율만큼 따라 커진다는 점에 주의하세요
        (세로 사진은 높이 = 폭 × 1.5, 가로 사진은 폭 × 0.67).

     2021 배치는 CSS의 .archive_photo_1 ~ _5 기본값과 같은 값입니다(JS 없이 열었을 때의 화면). */
  var ARCHIVE_LAYOUTS = {
    "2021": [
      { left: 530, top: 90, width: 330, tilt: -4.5, layer: 2, travel: 1.15 },
      { left: 800, top: 40, width: 240, tilt: 6.2, layer: 5, travel: 0.8 },
      { left: 1000, top: 150, width: 480, tilt: -2.1, layer: 1, travel: 1.45 },
      { left: 800, top: 400, width: 300, tilt: 3.4, layer: 4, travel: 0.95 },
      { left: 1380, top: 400, width: 260, tilt: -7.8, layer: 3, travel: 1.3 }
    ],
    "2020": [
      { left: 1300, top: 60, width: 250, tilt: 5.6, layer: 3, travel: 0.9 },
      { left: 560, top: 130, width: 340, tilt: -3.1, layer: 1, travel: 1.4 },
      { left: 1150, top: 330, width: 200, tilt: 8.4, layer: 5, travel: 1.05 },
      { left: 830, top: 240, width: 390, tilt: -1.8, layer: 2, travel: 1.5 },
      { left: 620, top: 420, width: 270, tilt: 4.2, layer: 4, travel: 0.85 }
    ],
    "2019": [
      { left: 700, top: 50, width: 190, tilt: -6.8, layer: 4, travel: 1.35 },
      { left: 1100, top: 100, width: 300, tilt: 2.4, layer: 2, travel: 1 },
      { left: 540, top: 230, width: 370, tilt: -1.2, layer: 3, travel: 0.85 },
      { left: 860, top: 430, width: 260, tilt: 7.1, layer: 5, travel: 1.5 },
      { left: 1330, top: 330, width: 330, tilt: -4.6, layer: 1, travel: 1.1 }
    ]
  };

  /* 연도별 사진 세트. 배열 순서가 곧 자리(.archive_photo_1 ~ _5) 순서이자
     날아 들어오는 순서이며, 위 ARCHIVE_LAYOUTS의 배열 순서와 짝을 이룹니다.
     width / height는 원본 픽셀 크기입니다. 로딩 전 자리 확보와
     날아오는 방향을 계산할 때의 카드 중심 추정에 씁니다.
     2013 / 2015 / 2017 / 2018은 연결할 사진이 없어 여기에 없습니다. */
  var ARCHIVE_PHOTOS = {
    "2019": [
      {
        src: "asset/archive_2019_1.png",
        width: 3263,
        height: 4898,
        alt: "2019 collection — a mustard jeogori over a sheer black skirt beside a lantern-lit mirror panel"
      },
      {
        src: "asset/archive_2019_2.png",
        width: 3263,
        height: 4898,
        alt: "2019 collection — a red jeogori with a grey patterned skirt and a purple silk wrap"
      },
      {
        src: "asset/archive_2019_3.png",
        width: 3262,
        height: 4898,
        alt: "2019 collection — a seated look in a tartan jeogori and a bright pink skirt"
      },
      {
        src: "asset/archive_2019_4.png",
        width: 3263,
        height: 4898,
        alt: "2019 collection — a camel jeogori over a cobalt skirt with a gold woven hem band"
      },
      {
        src: "asset/archive_2019_5.png",
        width: 3262,
        height: 4898,
        alt: "2019 collection — a black jacket and pink floral skirt in front of a red plum blossom screen"
      }
    ],
    "2020": [
      {
        src: "asset/archive_2020_1.png",
        width: 3336,
        height: 5008,
        alt: "2020 collection — a red and ivory jeogori with a chartreuse skirt, holding bamboo branches"
      },
      {
        src: "asset/archive_2020_2.png",
        width: 3336,
        height: 5008,
        alt: "2020 collection — a model waving a rainbow silk banner beside a white swan sculpture"
      },
      {
        src: "asset/archive_2020_3.png",
        width: 3336,
        height: 5008,
        alt: "2020 collection — a sheer ivory coat over a pink skirt with a white feathered headpiece"
      },
      {
        src: "asset/archive_2020_4.png",
        width: 3704,
        height: 5559,
        alt: "2020 collection — a close view of a yellow silk jacket over an embroidered pale yellow skirt"
      },
      {
        src: "asset/archive_2020_5.png",
        width: 3336,
        height: 5008,
        alt: "2020 collection — a white embroidered jeogori with a coral skirt and a woven straw hat"
      }
    ],
    /* 2021은 파일 번호 순서가 아닙니다. archive_2021_1이 15장 중 유일한 가로형이라
       폭이 넉넉한 3번 자리(540px)에 두었습니다. 좁은 자리에 넣으면 혼자만 작아 보입니다.
       가로 사진은 같은 폭이어도 높이가 절반이라 너비를 크게 잡아야 균형이 맞습니다. */
    "2021": [
      {
        src: "asset/archive_2021_2.png",
        width: 3266,
        height: 4898,
        alt: "2021 collection — a black floral gown in front of a triptych of red mountain landscapes"
      },
      {
        src: "asset/archive_2021_3.png",
        width: 3347,
        height: 4730,
        alt: "2021 collection — a pink jeogori and chartreuse skirt seated at a carved palace lattice door"
      },
      {
        src: "asset/archive_2021_1.png",
        width: 4898,
        height: 3259,
        alt: "2021 collection — two hanbok looks displayed in a hall beside the Korean flag"
      },
      {
        src: "asset/archive_2021_4.png",
        width: 3347,
        height: 4730,
        alt: "2021 collection — a white robed look with a wide brimmed hat walking toward a palace hall"
      },
      {
        src: "asset/archive_2021_5.png",
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

  /* 한 자리에 사진 한 장을 끼웁니다. 표시 폭은 배치표가 정하고,
     높이는 img가 원본 비율대로 결정합니다(width / height 속성). */
  function applyPhoto(figure, photo) {
    var image = figure.querySelector("img");

    if (!image) {
      return;
    }

    image.width = photo.width;
    image.height = photo.height;
    image.alt = photo.alt;
    image.src = photo.src;
  }

  /* 배치는 CSS 커스텀 속성으로만 넘깁니다. 실제로 어떤 속성에 쓰이는지는
     collection.css의 .archive_photo 한 곳에 있습니다. */
  function applyLayout(figure, layout) {
    figure.style.setProperty("--archive_photo_left", layout.left + "px");
    figure.style.setProperty("--archive_photo_top", layout.top + "px");
    figure.style.setProperty("--archive_photo_width", layout.width + "px");
    figure.style.setProperty("--archive_photo_tilt", layout.tilt + "deg");
    figure.style.setProperty("--archive_photo_layer", layout.layer);
  }

  function applyYearPhotos(figures, year) {
    var photos = ARCHIVE_PHOTOS[year];
    var layouts = ARCHIVE_LAYOUTS[year];

    figures.forEach(function (figure, index) {
      if (photos[index]) {
        applyPhoto(figure, photos[index]);
      }

      if (layouts[index]) {
        applyLayout(figure, layouts[index]);
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

  /* 카드가 프레임 중앙의 어느 쪽에 있는지로 출발 방향을 정합니다.
     좌표를 바꾸면 날아오는 방향도 알아서 따라옵니다.
     (showcase 상단 두 장의 convergeDistance와 같은 생각입니다.)
     길이를 1로 맞춘 뒤 거리를 따로 곱해야, 중앙에 가까운 카드도 충분히 멀리서 출발합니다. */
  function enterDirection(layout, frameHeight, imageRatio) {
    var centerX = layout.left + layout.width / 2;
    var centerY = layout.top + (layout.width * imageRatio) / 2;
    var dx = centerX - CANVAS_WIDTH / 2;
    var dy = centerY - frameHeight / 2;
    var length = Math.sqrt(dx * dx + dy * dy);

    /* 정확히 중앙인 카드는 방향이 없습니다. 그때만 아래에서 올라오게 둡니다. */
    if (length < 1) {
      return { x: 0, y: 1 };
    }

    return { x: dx / length, y: dy / length };
  }

  /* 쌓이기 전 상태. 카드마다 방향도 거리도 다릅니다.
     함수형 값이라 매번 그때의 currentLayout을 읽습니다 —
     연도가 바뀌면 timeline.invalidate()가 이 함수들을 다시 부릅니다. */
  function archiveEnterVars(getLayouts, getPhotos, getFrameHeight) {
    function vectorAt(index) {
      var photo = getPhotos()[index];
      var layout = getLayouts()[index];
      /* 카드 중심을 알려면 높이가 필요합니다. img의 naturalHeight는 lazy 로딩이라
         첫 계산 시점에 0일 수 있으므로 데이터의 원본 크기로 비율을 냅니다. */
      var unit = enterDirection(layout, getFrameHeight(), photo.height / photo.width);

      return {
        x: unit.x * ARCHIVE_ENTER_DISTANCE * layout.travel,
        y: unit.y * ARCHIVE_ENTER_DISTANCE * layout.travel,
        spin: unit.x * ARCHIVE_ENTER_SPIN
      };
    }

    return {
      x: function (index) {
        return vectorAt(index).x;
      },
      y: function (index) {
        return vectorAt(index).y;
      },
      rotation: function (index) {
        return vectorAt(index).spin;
      },
      scale: ARCHIVE_ENTER_SCALE,
      opacity: 0
    };
  }

  /* showcase 하단 갤러리와 같이 figure는 가만히 두고 안쪽 img만 움직입니다.
     다른 점은 카드마다 트리거를 달지 않고 타임라인 하나에 stagger로 묶는다는 것입니다.
     연도를 바꿀 때 처음부터 다시 재생해야 하는데, scrub 트리거는 값이 스크롤 위치에
     묶여 있어 다시 재생할 수 없기 때문입니다. */
  function buildArchiveTimeline(gsap, archive, images, enterVars) {
    /* stagger를 건 fromTo는 각 대상의 차례가 와야 from 값을 적용합니다.
       그래서 미리 넣어 두지 않으면 두 번째 사진부터는 트리거 전까지 제자리에 보이다가
       자기 차례에 갑자기 화면 밖으로 튀었다 다시 들어옵니다. */
    gsap.set(images, enterVars);

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
        enterVars,
        {
          x: 0,
          y: 0,
          rotation: 0,
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

    var frame = archive.querySelector(".archive_frame");
    var images = figures.map(function (figure) {
      return figure.querySelector("img");
    });
    var currentYear = ARCHIVE_DEFAULT_YEAR;

    /* 1280px 미만과 모션 감소 설정에서는 타임라인을 만들지 않습니다.
       그때는 이 값이 계속 null이고, 사진은 CSS 레이아웃 그대로 보입니다. */
    var timeline = null;

    /* 연도 전환 때 이전 세트를 지우는 트윈. 연달아 누를 때 앞의 것을 끄려고 들고 있습니다. */
    var fadeTween = null;

    var enterVars = archiveEnterVars(
      function () {
        return ARCHIVE_LAYOUTS[currentYear];
      },
      function () {
        return ARCHIVE_PHOTOS[currentYear];
      },
      function () {
        return frame ? frame.offsetHeight : 0;
      }
    );

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
         타임라인은 opacity 0에서 출발하므로 이어서 다시 날아 들어옵니다.

         여기에 overwrite를 쓰면 안 됩니다. GSAP의 overwrite는 같은 대상의 다른 트윈을
         죽이는데, 그 "다른 트윈"에 타임라인 안의 등장 트윈까지 포함됩니다.
         한 번 죽으면 restart()를 해도 타임라인만 진행할 뿐 사진은 opacity 0에 멈춥니다
         (실제로 이 증상이 났습니다 — progress는 1인데 화면은 빈 채였습니다).
         연달아 누를 때의 중복은 앞의 트윈을 직접 kill해서 막습니다. */
      if (fadeTween) {
        fadeTween.kill();
      }

      timeline.pause();
      fadeTween = window.gsap.to(images, {
        opacity: 0,
        duration: ARCHIVE_SWAP_FADE,
        ease: "power2.in",
        onComplete: function () {
          fadeTween = null;
          applyYearPhotos(figures, year);
          /* invalidate()가 없으면 from 값이 첫 연도 배치 그대로 굳어 있습니다.
             기록해 둔 시작값을 버려야 위 함수형 값이 새 배치로 다시 계산됩니다. */
          timeline.invalidate().restart();
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
        timeline = buildArchiveTimeline(gsap, archive, images, enterVars);

        return function () {
          timeline = null;
          /* 연도 전환 fade는 이 context 밖에서 만들어져 자동 복구 대상이 아닙니다.
             전환 도중 조건이 어긋나도 사진이 숨은 채 남지 않도록 직접 되돌립니다. */
          gsap.set(images, { clearProps: "all" });
        };
      }
    );
  }

  /* =========================================================
     as worn — 스스로 흐르는 띠 + 태그로 카드 가운데 두기
     ========================================================= */

  /* 시안의 카드 세 장 폭 합계가 화면보다 넓습니다. 스크롤바 대신 카드가 스스로 흐르게 하고,
     사용자가 원하는 카드는 태그로 불러오게 합니다.

     한 벌(카드 3장 + 뒤따르는 간격 하나)의 폭을 period로 두고, 이동량을 period로 나눈
     나머지만큼 밀어 놓으면 같은 화면이 무한히 반복됩니다. 그래서 화면을 채우고도
     한 벌이 더 남을 만큼 복제해 둡니다. */
  function initAsworn() {
    var track = document.querySelector(".asworn_track");
    var list = track && track.querySelector(".asworn_list");

    if (!list) {
      return;
    }

    var originals = Array.prototype.slice.call(list.children);
    var tags = Array.prototype.slice.call(
      document.querySelectorAll(".asworn_tag[data-asworn-target]")
    );

    if (originals.length === 0) {
      return;
    }

    var gsap = typeof window.gsap === "undefined" ? null : window.gsap;
    var isAutoEnabled = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var offset = 0;
    var period = 0;
    var isHovered = false;
    var isFocusing = false;
    var focusTween = null;
    var holdTimer = 0;

    /* 복제본은 화면을 채우기 위한 것이므로 보조기술과 탭 순서에서 뺍니다.
       빼지 않으면 같은 "More collection" 링크가 여러 번 잡힙니다. */
    function appendSet() {
      originals.forEach(function (item) {
        var clone = item.cloneNode(true);

        clone.setAttribute("aria-hidden", "true");
        Array.prototype.forEach.call(
          clone.querySelectorAll("a, button"),
          function (node) {
            node.setAttribute("tabindex", "-1");
          }
        );

        list.appendChild(clone);
      });
    }

    /* 화면 폭이 넓어지면 빈자리가 생기므로 그때마다 다시 부릅니다. */
    function fillTrack() {
      var guard = 0;

      while (list.scrollWidth < track.clientWidth + period + 1 && guard < 6) {
        appendSet();
        guard += 1;
      }
    }

    function render() {
      var wrapped = ((offset % period) + period) % period;
      list.style.transform = "translate3d(" + -wrapped + "px, 0, 0)";
    }

    function markActiveTag(activeTag) {
      tags.forEach(function (tag) {
        var isActive = tag === activeTag;

        tag.classList.toggle("is_active", isActive);

        if (isActive) {
          tag.setAttribute("aria-current", "true");
        } else {
          tag.removeAttribute("aria-current");
        }
      });
    }

    function releaseFocus() {
      isFocusing = false;
      markActiveTag(null);
    }

    /* 띠가 순환하므로 같은 카드가 앞뒤 양쪽에 있습니다. 이동 거리를 period로 감아
       ±period/2 안으로 줄이면 가까운 쪽으로 돌아 되감기는 느낌이 없습니다. */
    function distanceTo(item) {
      var goal = item.offsetLeft + item.offsetWidth / 2 - track.clientWidth / 2;
      var delta = (((goal - offset) % period) + period) % period;

      return delta > period / 2 ? delta - period : delta;
    }

    function handleTagClick(event) {
      var tag = event.currentTarget;
      var index = Number(tag.getAttribute("data-asworn-target"));
      var item = originals[index];

      if (!item) {
        return;
      }

      window.clearTimeout(holdTimer);

      if (focusTween) {
        focusTween.kill();
        focusTween = null;
      }

      isFocusing = true;
      markActiveTag(tag);

      var delta = distanceTo(item);

      /* GSAP이 없거나 모션 감소 설정이면 그 자리로 바로 옮깁니다. */
      if (!gsap || !isAutoEnabled) {
        offset += delta;
        render();
        return;
      }

      var state = { value: offset };

      focusTween = gsap.to(state, {
        value: offset + delta,
        duration: ASWORN_FOCUS_DURATION,
        ease: "power3.out",
        onUpdate: function () {
          offset = state.value;
          render();
        },
        onComplete: function () {
          focusTween = null;
          holdTimer = window.setTimeout(releaseFocus, ASWORN_HOLD * 1000);
        }
      });
    }

    /* 다른 탭에 갔다 오면 프레임 간격이 몇 초씩 벌어집니다.
       그대로 곱하면 띠가 한 번에 몇백 px 튀므로 한 프레임 이동량을 잘라 둡니다. */
    function advance(deltaSeconds) {
      if (isHovered || isFocusing) {
        return;
      }

      offset += ASWORN_SPEED * Math.min(deltaSeconds, 0.1);
      render();
    }

    function handleEnter() {
      isHovered = true;
    }

    function handleLeave() {
      isHovered = false;
    }

    /* 한 벌의 폭은 첫 복제본의 왼쪽 좌표와 같습니다(.asworn_list가 position: relative).
       계산 대신 실제 배치를 읽어 두면 카드 폭이나 간격이 바뀌어도 따라옵니다. */
    appendSet();
    period = originals.length < list.children.length
      ? list.children[originals.length].offsetLeft
      : list.scrollWidth;

    if (period <= 0) {
      return;
    }

    fillTrack();
    render();

    tags.forEach(function (tag) {
      tag.addEventListener("click", handleTagClick);
    });

    track.addEventListener("mouseenter", handleEnter);
    track.addEventListener("mouseleave", handleLeave);
    /* 키보드로 카드 안 링크에 들어왔을 때도 멈춰 있어야 누를 수 있습니다. */
    track.addEventListener("focusin", handleEnter);
    track.addEventListener("focusout", handleLeave);

    window.addEventListener("resize", function () {
      fillTrack();
      render();
    });

    if (!isAutoEnabled) {
      return;
    }

    /* 흐름은 시간 기준입니다. 프레임이 밀려도 속도가 달라지지 않습니다. */
    if (gsap) {
      gsap.ticker.add(function (time, deltaMs) {
        advance(deltaMs / 1000);
      });
      return;
    }

    var previous = 0;

    window.requestAnimationFrame(function step(now) {
      if (previous) {
        advance((now - previous) / 1000);
      }

      previous = now;
      window.requestAnimationFrame(step);
    });
  }

  initHeroVideo();
  initShowcaseScroll();
  initArchive();
  initAsworn();
})();
