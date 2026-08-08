(function () {
  "use strict";

  /* =========================================================
     showcase 스크롤 인터랙션 조절값
     ========================================================= */

  /* 시안 캔버스 폭. 상단 카드가 "가운데로 모이는" 목표 지점을 잡을 때 씁니다. */
  var CANVAS_WIDTH = 1920;

  /* 타임라인 1단위가 몇 px의 스크롤에 해당하는지. pin 구간 전체 길이를
     "타임라인 총 길이 × 이 값"으로 냅니다. 올리면 전 구간이 함께 느려집니다.

     예전에는 pin 길이를 화면 높이의 배수(`"+=140%"`)로 직접 적었습니다.
     그러면 pin 길이와 타임라인 길이가 따로 놀아서, 구간을 하나 더하면
     전체 속도가 같이 바뀌었습니다. 지금은 타임라인이 길이를 정합니다. */
  var SHOWCASE_PX_PER_UNIT = 380;

  /* 갤러리 카드 한 장이 떠오르는 타임라인 길이. */
  var GALLERY_REVEAL = 0.62;

  /* 프레임이 안쪽에서 올라가는 속도(px / 타임라인 1단위).
     SHOWCASE_PX_PER_UNIT으로 나눈 값이 곧 "평소 스크롤 대비 배속"입니다
     (520 / 380 = 1.37배). 이 값은 pin 구간 내내 일정합니다.

     ★ 구간마다 다르게 두면 안 됩니다. 예전에는 "이동 → 정지 → 이동"으로 나누고
     이동만 880(2.32배)으로 몰아쳤는데, 속도가 0과 2.32 사이를 계단처럼 오가서
     스크롤이 뚝뚝 끊겨 보였습니다(pin 2454px 중 1360px이 완전 정지였습니다).
     끊김은 속도의 크기가 아니라 속도가 갑자기 바뀌는 데서 옵니다. */
  var GALLERY_TRAVEL_SPEED = 520;

  /* 카드가 제자리에 서는 지점 사이의 최소 간격(px).
     시안 좌표상 d의 중심이 c보다 59px 위라, 이 값이 없으면 두 장이 같은 지점에서
     동시에 떠 버립니다. 한 장씩 차례로 보이게 하는 값입니다. */
  var GALLERY_MIN_GAP = 150;

  /* 좌우 카드가 날아 들어오기 시작하는 지점. pin 구간 밖이라 이 구간의 스크롤
     속도는 평소와 같은 1배입니다. 끝은 항상 "top top"(= pin 시작 지점)이라
     카드가 다 앉는 순간 곧바로 pin으로 넘어갑니다.
     늦추고 싶으면 "top bottom-=200"처럼 줄이면 됩니다. */
  var INTRO_ENTER_START = "top bottom";

  /* 마지막 카드까지 끝나고 pin이 풀리기 전까지 머무는 길이.
     이 구간만 속도가 0이라 길게 잡으면 끝에서 한 번 걸리는 느낌이 납니다. */
  var SHOWCASE_TAIL_HOLD = 0.15;

  /* 스크롤 진행도에 맞춰 프레임 안에서 차례로 등장하는 갤러리 카드입니다.
     배열 순서가 곧 등장 순서입니다. */
  var SHOWCASE_GALLERY = [
    ".showcase_photo_c",
    ".showcase_photo_d",
    ".showcase_photo_e",
    ".showcase_photo_f",
    ".showcase_photo_g"
  ];

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

  /* 단어 연출. STAGGER가 클수록 "한 단어씩" 끊어져 올라오는 느낌이 또렷해집니다.

     ★ 올릴 때는 문장이 화면 밖으로 나가기 전에 다 뜨는지 확인해야 합니다.
     문장은 프레임 y 712에 있고 pin이 시작되면 프레임이 1.37배로 올라가므로,
     단어가 늦게 뜰수록 문장 블록이 화면 위쪽으로 밀립니다.
     0.16이었을 때 자매 페이지(단어 7개)에서 마지막 단어가 뜨는 순간
     문장 top이 11px까지 올라갔습니다 — 화면이 조금만 낮아도 잘립니다.
     0.12면 단어가 5개일 때 top 254, 7개일 때 130으로 여유가 있습니다. */
  var WORD_SLIDE = 64;
  var WORD_DURATION = 0.4;
  var WORD_STAGGER = 0.12;

  /* CARD_B_DELAY는 등장 타임라인(pin 밖) 기준,
     WORDS_START / EXIT_START는 pin 타임라인 기준입니다.

     pin이 시작되는 순간 좌우 카드는 이미 제자리에 앉아 있습니다. 그래서 문장과
     퇴장이 pin의 맨 앞에서 바로 시작합니다. 여기서 지체하면 그만큼
     "화면이 멈춘 채 기다리는" 구간이 됩니다. */
  var CARD_B_DELAY = 0.08;
  var WORDS_START = 0;
  var EXIT_START = 0.15;
  var EXIT_DURATION = 1;

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

  /* 한 장이 날아드는 길이와 장 사이 간격. scrub이므로 초가 아니라 스크롤 진행도입니다.
     STAGGER를 DURATION의 3분의 2쯤으로 두면 앞 장이 거의 도착한 뒤 다음 장이 출발해
     "한 장씩" 쌓이는 것이 또렷하게 보입니다. 예전 값(0.95 / 0.18)은 겹침이 커서
     다섯 장이 거의 동시에 들어왔습니다. */
  var ARCHIVE_DURATION = 0.75;
  var ARCHIVE_STAGGER = 0.42;

  /* 마지막 장이 도착한 뒤 pin이 풀리기 전까지 붙잡아 두는 길이.
     이 구간이 없으면 마지막 장을 보자마자 화면이 흘러갑니다. */
  var ARCHIVE_HOLD = 0.45;

  /* 타임라인 1단위가 몇 px의 스크롤에 해당하는지. pin 구간 길이를 이 값으로 냅니다. */
  var ARCHIVE_PX_PER_UNIT = 400;

  /* 연도를 바꿀 때 이전 세트가 사라지는 시간. 이 사이에 새 사진이 내려받기를 시작합니다. */
  var ARCHIVE_SWAP_FADE = 0.25;

  /* 연도를 바꿨을 때 다시 한 번 날아드는 트윈의 길이(초). 이쪽은 스크롤과 무관한
     한 번짜리 재생이라 스크롤용 값과 따로 둡니다. */
  var ARCHIVE_REPLAY_DURATION = 0.95;
  var ARCHIVE_REPLAY_STAGGER = 0.18;

  /* pin이 시작되는 지점. 프레임(920px)이 화면 한가운데에 놓인 순간 고정됩니다.
     화면(1080px)보다 작으므로 위아래에 여백이 남아 어느 카드도 잘리지 않습니다. */
  var ARCHIVE_START = "center center";

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

  /* =========================================================
     공통 — 데스크톱 게이트와 창 크기 변화
     ========================================================= */

  /* 두 인터랙션 모두 이 조건에서만 켜집니다. 어긋나면 gsap.matchMedia()가
     설정한 값을 알아서 되돌려 CSS 레이아웃 그대로 보입니다. */
  var DESKTOP_MOTION = "(min-width: 1280px) and (prefers-reduced-motion: no-preference)";

  /* 창 크기가 이만큼(px) 넘게 달라졌을 때만 다시 만듭니다.
     주소창이 접히는 정도의 변화로 매번 다시 만들지 않기 위한 여유입니다. */
  var REBUILD_TOLERANCE = 40;
  var REBUILD_DELAY = 200;

  /* 카드가 멈추는 위치와 이동 거리는 창 높이에서 나옵니다. 그런데 그 값은
     타임라인의 길이까지 정하기 때문에 함수형 값이나 invalidateOnRefresh로는
     따라잡을 수 없습니다(길이는 함수로 줄 수 없습니다).
     그래서 창이 실제로 달라졌을 때 matchMedia를 통째로 새로 만듭니다. */
  function createRebuilder(gsap, build) {
    var context = null;
    var height = window.innerHeight;
    var width = window.innerWidth;
    var timer = null;

    function apply() {
      if (context) {
        context.revert();
      }

      context = gsap.matchMedia();
      context.add(DESKTOP_MOTION, build);
    }

    function handleResize() {
      if (timer) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(function () {
        timer = null;

        if (Math.abs(window.innerHeight - height) < REBUILD_TOLERANCE &&
          Math.abs(window.innerWidth - width) < REBUILD_TOLERANCE) {
          return;
        }

        height = window.innerHeight;
        width = window.innerWidth;
        apply();
      }, REBUILD_DELAY);
    }

    apply();
    window.addEventListener("resize", handleResize);
  }

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

  /* --- 1박자: 좌우 카드 등장 ---

     ★ 이 박자만 pin 구간 밖, 섹션이 화면으로 올라오는 평범한 스크롤 구간에서
     재생됩니다. pin 안에 두면 화면이 멈춘 상태에서 카드가 들어와
     "스크롤이 뚝 멈추고 카드가 나타나는" 느낌이 납니다(사용자 지적).

     여기서는 섹션 윗변이 화면 아래에서 화면 위까지 올라오는 동안(화면 한 장 분량)
     두 장이 좌우 바깥에서 시안 자리로 날아 들어옵니다. 그 구간의 스크롤 속도는
     평소와 똑같은 1배이고, 카드가 다 앉는 순간이 곧 pin이 시작되는 지점입니다.

     프레임은 이 구간 내내 offset 0이라 카드가 시안 좌표(247 / 315) 그대로 앉습니다. */
  function buildIntroEntrance(gsap, showcase, cards) {
    var cardA = cards[0];
    var cardB = cards[1];
    var imageA = cardA.querySelector("img");
    var imageB = cardB.querySelector("img");

    /* 원근은 각 img 자신에게 겁니다. 부모에 CSS perspective를 두면
       showcase_frame의 다른 사진들까지 3D 맥락에 들어갑니다. */
    gsap.set([imageA, imageB], { transformPerspective: PERSPECTIVE });

    var timeline = gsap.timeline();

    timeline
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
      );

    window.ScrollTrigger.create({
      animation: timeline,
      trigger: showcase,
      start: INTRO_ENTER_START,
      /* pin이 시작되는 바로 그 지점에서 끝납니다. 두 구간이 빈틈 없이 이어집니다. */
      end: "top top",
      scrub: 1,
      invalidateOnRefresh: true
    });
  }

  /* --- 2박자: 문장 / 3박자: 좌우 카드 퇴장 ---
     이 둘은 pin 안에서 프레임이 흐르는 동안 함께 재생됩니다.

     `to`가 아니라 `fromTo`입니다. 등장이 다른 트리거에 있어서, `to`로 두면
     시작값을 언제 기록하느냐에 따라(빠르게 스크롤하거나 refresh가 겹치면)
     등장 도중의 값이 시작값으로 굳을 수 있습니다. */
  function addIntroBody(gsap, timeline, cards, words) {
    var cardA = cards[0];
    var cardB = cards[1];
    var imageA = cardA.querySelector("img");
    var imageB = cardB.querySelector("img");

    timeline
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
      .fromTo(
        [cardA, cardB],
        {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          filter: filterOf(0, 1)
        },
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
      .fromTo(
        imageA,
        { rotationY: 0, rotation: TILT_A },
        {
          rotationY: -EXIT_TURN,
          rotation: TILT_A * EXIT_TILT_RATIO,
          ease: "power2.in",
          duration: EXIT_DURATION
        },
        EXIT_START
      )
      .fromTo(
        imageB,
        { rotationY: 0, rotation: TILT_B },
        {
          rotationY: EXIT_TURN,
          rotation: TILT_B * EXIT_TILT_RATIO,
          ease: "power2.in",
          duration: EXIT_DURATION
        },
        EXIT_START
      );
  }

  /* 카드가 "다 뜬 순간" 프레임이 놓여 있어야 할 위치입니다(프레임 상단 기준 px).
     프레임은 멈추지 않고 계속 올라가므로, 이 값은 멈추는 자리가 아니라
     등장이 끝나는 시점을 정하는 기준입니다.

     기본값은 카드 중심이 화면 중심에 오는 지점이고, 거기에 두 가지를 겁니다.
     1. 앞 카드보다 최소 GALLERY_MIN_GAP만큼 뒤 — 한 장씩 차례로 뜨게 합니다.
     2. 그 지점에서 카드의 위끝과 아래끝이 모두 화면 안 — [아래끝 − 화면높이, 위끝]
        범위를 벗어나면 다 뜬 순간에 잘립니다. 이 범위가 위쪽 잘림을 막는 안전장치입니다. */
  function galleryRestOffsets(cards, viewHeight, travel) {
    var previous = 0;

    return cards.map(function (card) {
      var top = card.offsetTop;
      var bottom = top + card.offsetHeight;
      var rest = top + card.offsetHeight / 2 - viewHeight / 2;

      rest = Math.max(rest, previous + GALLERY_MIN_GAP);
      /* 화면 안에 들어오는 범위로 자릅니다. 카드가 화면보다 크면 위끝을 우선합니다
         (아래가 조금 넘치는 것보다 위가 잘리는 쪽이 눈에 띕니다). */
      rest = Math.min(rest, top);
      rest = Math.max(rest, Math.min(bottom - viewHeight, top));
      rest = Math.min(Math.max(rest, 0), travel);

      /* 위 자르기가 순서를 뒤집을 수 있어 마지막에 다시 단조 증가로 맞춥니다. */
      rest = Math.max(rest, previous);
      previous = rest;
      return rest;
    });
  }

  /* showcase 전체를 하나의 pin 구간으로 만듭니다.

     섹션은 3335px인데 화면은 1080px입니다. 그래서 예전처럼 섹션을 그대로 pin하면
     위 1080px만 보이고 갤러리 다섯 장(프레임 좌표 y 1250~2808)은 pin이 끝날 때까지
     한 번도 화면에 들어오지 못했습니다. pin이 풀린 뒤에야 등장이 시작되니
     카드가 뜨는 동안 페이지가 계속 흘러 상단이 잘렸습니다.

     여기서는 섹션을 화면 한 장 크기(`is_pinned`)로 줄여 창처럼 쓰고,
     그 안에서 배경과 프레임을 스크롤 진행도에 맞춰 밀어 올립니다.
     이동과 등장을 번갈아 두어, 카드가 뜨는 동안에는 프레임이 1px도 움직이지 않습니다.

     시안 좌표·크기·간격은 하나도 바뀌지 않습니다. 프레임 안의 배치는 그대로이고
     "언제 얼마나 올라가는가"만 스크롤이 정합니다. */
  function buildShowcaseTimeline(gsap, showcase, cards, words) {
    var frame = showcase.querySelector(".showcase_frame");
    var backdrop = showcase.querySelector(".showcase_bg");

    if (!frame) {
      return;
    }

    var gallery = SHOWCASE_GALLERY
      .map(function (selector) {
        return showcase.querySelector(selector);
      })
      .filter(Boolean);

    /* 배경(아치 + 그라디언트)과 프레임은 같은 만큼 움직여야 합니다.
       프레임만 밀면 사진이 그라디언트 위를 미끄러져 시안의 색 배치가 어긋납니다. */
    var stage = [backdrop, frame].filter(Boolean);

    /* class가 섹션을 화면 한 장 크기로 줄입니다. 실제 창 높이는 그 뒤에 재야 맞습니다. */
    showcase.classList.add("is_pinned");

    var viewHeight = showcase.offsetHeight;
    var travel = Math.max(0, frame.offsetHeight - viewHeight);
    var rests = galleryRestOffsets(gallery, viewHeight, travel);

    /* 좌우 카드 등장은 pin 밖(섹션이 올라오는 평범한 스크롤 구간)에서 끝납니다. */
    buildIntroEntrance(gsap, showcase, cards);

    var timeline = gsap.timeline();

    addIntroBody(gsap, timeline, cards, words);

    /* ★ 프레임은 pin의 첫 픽셀부터 흐릅니다. 예전에는 인트로가 다 끝날 때까지
       기다렸는데(600px), 그 구간 내내 속도가 0이라 "스크롤이 멈췄다"고 느껴졌습니다. */
    var travelStart = 0;
    var travelLength = travel / GALLERY_TRAVEL_SPEED;

    /* ★ 프레임은 트윈 하나로 처음부터 끝까지 일정한 속도로 올라갑니다.
       구간을 나눠 "이동 → 정지 → 이동"으로 만들면 스크롤 대비 속도가
       0과 2.32배 사이를 계단처럼 오가서 뚝뚝 끊겨 보입니다(실제로 그랬습니다).
       ease도 반드시 "none"입니다. 다른 이징을 주면 구간 안에서 속도가 변합니다. */
    if (travel > 1) {
      timeline.fromTo(
        stage,
        { y: 0 },
        { y: -travel, ease: "none", duration: travelLength },
        travelStart
      );
    }

    /* 등장은 그 흐름 위에 얹힙니다. 프레임을 멈추지 않으므로 카드는 올라오는
       도중에 떠오르고, 다 뜨는 순간 rest 위치에 정확히 놓입니다.
       그 순간 카드가 화면 안에 있다는 것은 galleryRestOffsets가 보장합니다. */
    gallery.forEach(function (card, index) {
      var image = card.querySelector("img");

      if (!image) {
        return;
      }

      var restAt = travelStart + rests[index] / GALLERY_TRAVEL_SPEED;

      timeline.fromTo(
        image,
        { y: RISE_BASE + index * RISE_STEP, opacity: 0 },
        { y: 0, opacity: 1, ease: "power3.out", duration: GALLERY_REVEAL },
        Math.max(restAt - GALLERY_REVEAL, 0)
      );
    });

    var cursor = travelStart + travelLength;

    /* 빈 트윈이 곧 "머무는 구간"입니다. scrub은 타임라인 길이를 스크롤 길이에
       비례해 나누므로, 길이를 더한 만큼 화면이 멈춰 있습니다. */
    timeline.to({}, { duration: SHOWCASE_TAIL_HOLD }, cursor);

    window.ScrollTrigger.create({
      animation: timeline,
      trigger: showcase,
      start: "top top",
      end: "+=" + Math.round(timeline.duration() * SHOWCASE_PX_PER_UNIT),
      pin: true,
      pinSpacing: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true
    });

    /* 조건이 어긋나(창을 좁히거나 모션 감소로 바꾸면) matchMedia가 되돌릴 때
       class와 인라인 transform을 함께 지웁니다. 그러면 3335px 원래 레이아웃입니다. */
    return function () {
      showcase.classList.remove("is_pinned");
      gsap.set(stage, { clearProps: "transform" });
    };
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
       인터랙션 없이 CSS 레이아웃 그대로 보입니다. */
    createRebuilder(gsap, function () {
      return buildShowcaseTimeline(gsap, showcase, [cardA, cardB], words);
    });
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

  /* 연도를 바꿨을 때 한 번만 다시 날아드는 트윈. 아래 onUpdate가 들고 있어야 해서
     함수 밖에 둡니다. 스크롤이 들어오면 즉시 끊깁니다. */
  var archiveReplay = null;

  /* showcase 하단 갤러리와 같이 figure는 가만히 두고 안쪽 img만 움직입니다.

     프레임(920px)이 화면(1080px)보다 작아 통째로 pin할 수 있습니다.
     예전에는 pin 없이 `toggleActions: "play"`로 재생했습니다. 그러면 다섯 장이
     1.65초에 걸쳐 날아드는 동안 페이지가 계속 스크롤돼 프레임이 위로 빠져나갔습니다
     (스크롤 15500에서 프레임 top −119px, 첫 장 top −87px로 잘림).
     이제 화면을 고정하고 스크롤 진행도가 곧 등장 진행도입니다 — 역스크롤도 역재생됩니다. */
  function buildArchiveTimeline(gsap, archive, images, enterVars) {
    /* stagger를 건 fromTo는 각 대상의 차례가 와야 from 값을 적용합니다.
       그래서 미리 넣어 두지 않으면 두 번째 사진부터는 트리거 전까지 제자리에 보이다가
       자기 차례에 갑자기 화면 밖으로 튀었다 다시 들어옵니다. */
    gsap.set(images, enterVars);

    var timeline = gsap.timeline();

    timeline
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
      )
      /* 빈 트윈이 곧 "머무는 구간"입니다. 마지막 장이 도착한 뒤에도 잠시 고정돼
         다섯 장이 다 놓인 화면을 읽을 수 있습니다. */
      .to({}, { duration: ARCHIVE_HOLD });

    window.ScrollTrigger.create({
      animation: timeline,
      trigger: archive,
      start: ARCHIVE_START,
      end: "+=" + Math.round(timeline.duration() * ARCHIVE_PX_PER_UNIT),
      pin: true,
      pinSpacing: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      /* 연도 전환 다시보기가 도는 중에 스크롤이 들어오면 두 트윈이 같은 값을
         서로 덮어씁니다. 스크롤 쪽을 진실로 삼고 다시보기를 끊습니다.
         스크롤이 정하는 값은 언제나 올바른 상태라 화면이 튀지 않습니다. */
      onUpdate: function () {
        if (archiveReplay) {
          archiveReplay.kill();
          archiveReplay = null;
        }
      }
    });

    return timeline;
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

      if (archiveReplay) {
        archiveReplay.kill();
        archiveReplay = null;
      }

      fadeTween = window.gsap.to(images, {
        opacity: 0,
        duration: ARCHIVE_SWAP_FADE,
        ease: "power2.in",
        onComplete: function () {
          fadeTween = null;
          applyYearPhotos(figures, year);
          /* invalidate()가 없으면 from 값이 첫 연도 배치 그대로 굳어 있습니다.
             기록해 둔 시작값을 버려야 위 함수형 값이 새 배치로 다시 계산됩니다. */
          timeline.invalidate();

          /* scrub 타임라인은 값이 스크롤 위치에 묶여 있어 restart()로 다시 재생할 수
             없습니다. 대신 같은 값을 한 번만 재생하는 트윈을 따로 만듭니다.
             스크롤이 들어오면 위 onUpdate가 이 트윈을 끊고 스크롤 값이 이깁니다. */
          window.gsap.set(images, enterVars);
          archiveReplay = window.gsap.to(images, {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            ease: "power3.out",
            duration: ARCHIVE_REPLAY_DURATION,
            stagger: ARCHIVE_REPLAY_STAGGER,
            onComplete: function () {
              archiveReplay = null;
            }
          });
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

    createRebuilder(gsap, function () {
      timeline = buildArchiveTimeline(gsap, archive, images, enterVars);

      return function () {
        timeline = null;

        /* 연도 전환 fade와 다시보기는 이 context 밖에서 만들어져 자동 복구 대상이
           아닙니다. 전환 도중 조건이 어긋나도 사진이 숨은 채 남지 않도록 직접 끕니다. */
        if (fadeTween) {
          fadeTween.kill();
          fadeTween = null;
        }

        if (archiveReplay) {
          archiveReplay.kill();
          archiveReplay = null;
        }

        gsap.set(images, { clearProps: "all" });
      };
    });
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
