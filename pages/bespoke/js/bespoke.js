(function () {
  "use strict";

  /* ---------------------------------------------------------
     process — 아래 번호 목록에 마우스를 올리면 위 사진과 글이 바뀐다

     레퍼런스는 j-cat.co.jp의 Project Story 섹션이다. 실측한 구성:
     콘텐츠 폭 1080 안에서 사진이 723 x 506(폭의 67%), 번호(Vol. 01)와 글은
     그 옆에 작게 붙고, 슬라이드를 넘기면 사진이 바뀐다.
     즉 **사진이 주인공이고 글이 딸린다.**

     이전 아코디언 방식(felix-nieto 참고)은 사진이 행 안에 들어가 작을
     수밖에 없었다. 그 관계를 뒤집어, 사진을 무대로 올리고 목록은 인덱스로
     내렸다. 색이 차오르는 행 연출은 그대로 남겼다.

     hover(데스크톱) / 클릭(터치) / 포커스(키보드) 세 경로가 같은 함수를
     부른다. 목록을 벗어나도 마지막 단계가 그대로 남는다.

     **높이를 JS로 재지 않는다.** 사진 상자가 고정 크기이고, 글 다섯 벌은
     CSS grid 한 칸에 겹쳐 두어 가장 긴 글이 높이를 정한다. 그래서 단계를
     옮겨도 무대 높이가 변하지 않는다(이전 버전은 여기서 min-height를
     계산해야 했다).

     JS가 없으면 마크업의 is_active / is_visible 그대로 01 Consultation이 보인다.
     --------------------------------------------------------- */

  function initProcessSteps() {
    var section = document.querySelector(".process");

    if (!section) {
      return;
    }

    var steps = Array.prototype.slice.call(section.querySelectorAll(".process_step"));
    var stageImages = Array.prototype.slice.call(section.querySelectorAll(".process_stage_img"));
    var stageItems = Array.prototype.slice.call(section.querySelectorAll(".process_stage_item"));

    if (!steps.length) {
      return;
    }

    var activeKey = null;

    var initialStep = steps.filter(function (step) {
      return step.classList.contains("is_active");
    })[0] || steps[0];

    activeKey = initialStep.dataset.step;

    function setActiveKey(key) {
      if (!key || key === activeKey) {
        return;
      }

      activeKey = key;

      steps.forEach(function (step) {
        var isMatch = step.dataset.step === key;
        var head = step.querySelector(".process_step_head");

        step.classList.toggle("is_active", isMatch);

        if (head) {
          head.setAttribute("aria-pressed", isMatch ? "true" : "false");
        }
      });

      /* 사진은 이름으로 짝짓는다(`process_stage_<data-step>`).
         마크업 순서가 바뀌어도 어긋나지 않는다. */
      stageImages.forEach(function (image) {
        image.classList.toggle("is_visible", image.id === "process_stage_" + key);
      });

      stageItems.forEach(function (item) {
        item.classList.toggle("is_active", item.dataset.step === key);
      });
    }

    function stepFrom(target) {
      if (!target || !target.closest) {
        return null;
      }

      var step = target.closest(".process_step");

      return step && section.contains(step) ? step : null;
    }

    function handlePointer(event) {
      var step = stepFrom(event.target);

      if (step) {
        setActiveKey(step.dataset.step);
      }
    }

    /* mouseenter는 버블링하지 않으므로 mouseover로 위임한다. 행 안쪽 요소를
       지날 때마다 다시 들어오지만 같은 단계면 setActiveKey가 바로 빠진다. */
    section.addEventListener("mouseover", handlePointer);

    /* 키보드 Tab. 포커스가 들어오면 그 단계로 바뀐다. */
    section.addEventListener("focusin", handlePointer);

    /* 터치에는 hover가 없어 이 경로가 유일하다. */
    section.addEventListener("click", handlePointer);
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
  var PHILOSOPHY_RISE = 72; /* 글이 아래에서 올라오는 거리(px) */
  var PHILOSOPHY_BG_RISE = 2.5; /* 배경이 올라오는 거리(자기 높이의 %) */
  var PHILOSOPHY_DURATION = 1.25; /* 등장 길이(초) */
  var PHILOSOPHY_STAGGER = 0.26; /* 제목 → 본문 시차(초) */
  /* **글 상자를 기준으로 잡는다(섹션이 아니다).** 섹션은 1000px인데 글은 그
     한가운데 있어서, 섹션 윗변으로 재면 글이 아직 화면 아래 172px 밖에 있을
     때 등장이 시작돼 화면 밖에서 다 끝나 버린다(실측: 시작 시점 노출 0%).
     글 상자의 윗변이 화면 82% 지점에 오면 시작한다. */
  var PHILOSOPHY_START = "top 82%";
  var PHILOSOPHY_PARALLAX_SHIFT = 110; /* 배경이 위아래로 움직이는 거리(px)
     주의: 이 값을 올리면 css의 --philosophy_parallax_overscan도 같이 올려야
     한다. overscan은 이 값 + 배경 등장 이동(자기 높이의 2.5%)보다 커야 한다. */

  function initPhilosophyMotion() {
    var section = document.querySelector(".philosophy");

    if (!section) {
      return;
    }

    var background = section.querySelector(".philosophy_bg");
    var body = section.querySelector(".philosophy_body");
    var contents = section.querySelectorAll(".philosophy_title, .philosophy_desc");

    if (!background || !body || !contents.length || !window.gsap || !window.ScrollTrigger) {
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
          trigger: body,
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
          trigger: body,
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
     atelier — 왼쪽 사진이 스크롤에 따라 아주 조금 커진다.

     레이아웃은 건드리지 않는다. 2단(사진 + 글) 구성, 여백, 섹션 높이가
     그대로다. 커지는 것은 상자가 아니라 **상자 안의 img**이고,
     .atelier_image의 `overflow: hidden`이 넘치는 부분을 잘라낸다.
     그래서 사진이 자기 자리 밖으로 나가거나 오른쪽 글을 밀어낼 수 없고,
     transform만 쓰므로 reflow도 없다.

     philosophy와 같이 GSAP + ScrollTrigger를 쓴다. 스크롤 위치에 비례해
     연속으로 변해야 하므로 IntersectionObserver로는 만들 수 없다.
     JS나 GSAP이 없거나 모션 감소 설정이면 아무것도 하지 않는다.

     이징 성격은 verostudio.com의 Diptych 계열을 참고했다. 코드를 옮긴 것이
     아니라, 그 사이트의 이징 어휘(`--ease-out-quint`,
     `cubic-bezier(.22, 1, .36, 1)`)에 overshoot가 없다는 점만 가져왔다.
     그래서 "또잉"을 튕김(bounce)으로 만들지 않았다. 아래 두 가지가 겹쳐서
     여운을 만든다:
     · `power2.out` — 앞에서 자라고 뒤로 갈수록 느려지며 안착한다
     · `scrub` 지연 — 스크롤을 멈춰도 사진이 조금 더 따라와 멎는다

     **확대량은 처음에 1.06이었는데 화면에서 너무 약해서 1.18로 올렸다.**
     1.06은 가장자리가 33px 자라는 것이라 스크롤 중에 알아채기 어려웠다.
     1.18은 가로 100 / 세로 117px이라 분명히 보인다. 상자에 잘리므로
     아무리 키워도 레이아웃에는 영향이 없다.
     --------------------------------------------------------- */

  /* 조절값 — 숫자만 바꾸면 된다 */
  var ATELIER_ZOOM_TO = 1.18; /* 최대 배율. 554×648 기준 가로 100 / 세로 117px 성장 */
  var ATELIER_ZOOM_START = "top 85%"; /* 섹션 윗변이 화면 85% 지점에 오면 시작 */
  var ATELIER_ZOOM_END = "bottom 65%"; /* 섹션 아랫변이 화면 65% 지점에 오면 최대 */
  var ATELIER_ZOOM_SCRUB = 1.2; /* 스크롤을 따라오는 지연(초). 여운의 크기다 */
  var ATELIER_ZOOM_EASE = "power2.out"; /* 끝으로 갈수록 느려지는 안착. 튕기지 않는다 */
  /* 폭 조건을 걸지 않는다. 좁은 화면에서 사진이 위로 쌓여도 확대분은
     여전히 상자 안에서만 일어나므로 레이아웃이 깨지지 않는다. */
  var ATELIER_ZOOM_GATE = "(prefers-reduced-motion: no-preference)";

  function initAtelierZoom() {
    var section = document.querySelector(".atelier");

    if (!section) {
      return;
    }

    /* 상자가 아니라 그 안의 사진을 키운다 */
    var image = section.querySelector(".atelier_image img");

    if (!image || !window.gsap || !window.ScrollTrigger) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    gsap.matchMedia().add(ATELIER_ZOOM_GATE, function () {
      section.classList.add("is_zoom_ready");

      /* `fromTo`라 시작값이 명시돼 있다. 위로 되감을 때도 정확히 1로
         돌아온다. 1보다 작게 시작하면 안 된다 — img가 상자를 꽉 채우고
         있어서(object-fit: cover) 줄이면 가장자리에 빈 줄이 드러난다. */
      gsap.fromTo(
        image,
        { scale: 1 },
        {
          scale: ATELIER_ZOOM_TO,
          ease: ATELIER_ZOOM_EASE,
          scrollTrigger: {
            trigger: section,
            start: ATELIER_ZOOM_START,
            end: ATELIER_ZOOM_END,
            scrub: ATELIER_ZOOM_SCRUB,
            invalidateOnRefresh: true
          }
        }
      );

      return function () {
        section.classList.remove("is_zoom_ready");
      };
    });
  }

  /* ---------------------------------------------------------
     atelier 글 — 섹션에 들어오면 글자가 하나씩 아래에서 올라온다.

     제목 → 리드 → 본문이 한 줄기 물결처럼 이어진다. 세 요소를 따로
     재생하지 않고 글자를 한 배열로 모아 `stagger`를 한 번만 건다.

     `stagger: { amount: N }`을 쓴다(`each`가 아니다). `each`는 글자 수에
     비례해 전체 길이가 늘어나서, 본문(140자 남짓)이 제목(10자)보다 열 배
     넘게 오래 걸린다. `amount`는 글자가 몇 개든 **전체를 N초 안에** 흘려
     보내므로 문구를 고쳐도 리듬이 그대로다.

     `once: true`라 한 번만 재생된다. 본문은 읽는 글이라 scrub으로 묶으면
     스크롤 위치에 따라 반쯤 지워진 상태로 멈춰 읽기가 어렵다.
     (사진 확대만 scrub이고, 이쪽은 philosophy와 같은 방식이다.)
     --------------------------------------------------------- */

  /* 조절값 — 숫자만 바꾸면 된다 */
  var ATELIER_TEXT_RISE = 50; /* 글자가 올라오는 거리(자기 높이의 %) */
  var ATELIER_TEXT_DURATION = 0.8; /* 글자 하나가 자리잡는 시간(초) */
  var ATELIER_TEXT_SPREAD = 1.2; /* 첫 글자부터 마지막 글자까지 걸리는 시간(초) */
  /* **글 상자를 기준으로 잡는다(섹션이 아니다).** 섹션은 1000px인데 글은 그
     한가운데 있어서, 섹션 윗변으로 재면 글이 아직 화면 아래 116px 밖에 있을
     때 시작해 화면 밖에서 다 끝나 버린다(실측: 시작 시점 노출 0%).
     글 상자의 윗변이 화면 82% 지점에 오면 시작한다 — 그 순간 글의 약 3분의
     2가 이미 화면 안에 있다. */
  var ATELIER_TEXT_START = "top 82%";
  var ATELIER_TEXT_GATE = "(prefers-reduced-motion: no-preference)";

  /* 글을 단어 상자로 감싸고, 그 안을 다시 글자 상자로 나눈다.
     `perChar`가 false면 단어 상자 자체가 움직이는 단위가 된다.

     **단어 상자가 반드시 필요하다.** 글자마다 inline-block을 주면 줄바꿈이
     글자 사이 어디에서나 일어나 단어가 중간에서 끊긴다. 단어를 한 번 더
     감싸야 줄바꿈이 단어 경계에서만 생긴다.

     `<br>`은 건드리지 않는다 — 텍스트 노드만 바꿔 끼우므로 시안의 줄바꿈이
     그대로 남는다. 공백도 텍스트 노드로 그대로 두어 단어 간격이 유지된다. */
  function splitAtelierBlock(element, perChar) {
    var units = [];
    var textNodes = [];
    var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach(function (node) {
      if (!node.nodeValue.trim()) {
        return; /* 들여쓰기로 생긴 공백 노드는 그대로 둔다 */
      }

      var fragment = document.createDocumentFragment();

      node.nodeValue.split(/(\s+)/).forEach(function (chunk) {
        if (!chunk) {
          return;
        }

        if (/^\s+$/.test(chunk)) {
          fragment.appendChild(document.createTextNode(chunk));
          return;
        }

        var word = document.createElement("span");
        word.className = "atelier_word";

        if (perChar) {
          chunk.split("").forEach(function (character) {
            var span = document.createElement("span");
            span.className = "atelier_char";
            span.textContent = character;
            word.appendChild(span);
            units.push(span);
          });
        } else {
          word.textContent = chunk;
          units.push(word);
        }

        fragment.appendChild(word);
      });

      node.parentNode.replaceChild(fragment, node);
    });

    return units;
  }

  /* 글자 단위로 나누되, **줄 수가 늘어나면 단어 단위로 되돌린다.**

     글자를 inline-block으로 만들면 글자마다 폭이 소수점에서 올림돼 줄 전체가
     아주 조금 넓어진다. 실측하면 `.atelier_lead`가 44글자에 2.74px 늘어나는데,
     이 줄은 원래 상자(509px)보다 0.77px 좁을 뿐이라 그대로 두면 두 줄로
     넘어간다(높이 32 → 64px). 단어 단위는 같은 줄에서 0.11px밖에 늘지 않아
     안전하다.

     폭이나 폰트에 따라 아슬아슬한 줄이 달라지므로 값을 박아두지 않고
     매번 실제 높이를 재서 정한다. 그래서 어느 화면 폭에서도 시안의 줄 수가
     그대로 유지된다. */
  function splitAtelierText(element) {
    var original = element.innerHTML;
    var heightBefore = element.offsetHeight;
    var units = splitAtelierBlock(element, true);

    if (element.offsetHeight > heightBefore) {
      element.innerHTML = original;
      units = splitAtelierBlock(element, false);
    }

    return units;
  }

  function initAtelierText() {
    var section = document.querySelector(".atelier");

    if (!section) {
      return;
    }

    var body = section.querySelector(".atelier_body");
    var blocks = section.querySelectorAll(".atelier_title, .atelier_lead, .atelier_desc");

    if (!body || !blocks.length || !window.gsap || !window.ScrollTrigger) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    /* 조건이 다시 맞아도 두 번 쪼개지 않도록 밖에 둔다 */
    var units = null;

    gsap.matchMedia().add(ATELIER_TEXT_GATE, function () {
      /* class가 먼저 붙어야 한다 — 나눈 뒤 높이를 재서 줄 수가 늘었는지
         판단하는데, inline-block이 걸려 있지 않으면 그 차이가 드러나지 않는다. */
      section.classList.add("is_text_ready");

      if (!units) {
        units = [];
        blocks.forEach(function (block) {
          units = units.concat(splitAtelierText(block));
        });
      }

      /* `from`이라 끝값은 CSS가 정한 값 그대로다. 트윈이 만들어지는 즉시
         시작 상태(투명 + 아래)가 적용되므로 재생 전에 글이 비쳐 보이지 않는다. */
      gsap.from(units, {
        yPercent: ATELIER_TEXT_RISE,
        opacity: 0,
        duration: ATELIER_TEXT_DURATION,
        ease: "power3.out",
        stagger: { amount: ATELIER_TEXT_SPREAD },
        scrollTrigger: {
          trigger: body,
          start: ATELIER_TEXT_START,
          once: true
        }
      });

      /* class를 떼면 span이 평범한 inline이 되어 원래 글과 똑같이 보인다.
         GSAP이 자기가 넣은 인라인 스타일은 알아서 되돌린다. */
      return function () {
        section.classList.remove("is_text_ready");
      };
    });
  }

  /* ---------------------------------------------------------
     materials — 원단을 고르면 큰 사진과 설명이 바뀐다

     레퍼런스는 eternalblue.co.nz의 `.ingredient-slider__grid`다.
     구조를 실측해 보니 이 섹션과 거의 같은 배치였다 —
     [큰 사진 | 머리글 + 썸네일 줄 + (이름 목록 | 설명)].

     그쪽 동작을 그대로 옮겼다.
     · **마우스를 올리면(hover) 바뀐다.** 클릭이 아니다. 벗어나도 되돌아가지
       않고 마지막에 지난 원단이 그대로 남는다(레퍼런스 확인).
     · 큰 사진은 **크로스페이드가 아니다.** 한 장을 0.4초에 걸쳐 흐리게
       만든 뒤 src를 갈아 끼우고 다시 나타낸다(`.is-fading { opacity: 0 }`).
     · 설명은 전환 없이 즉시 바뀐다(레퍼런스에 transition이 없다).

     레퍼런스는 `<div>`에 `cursor: pointer`만 걸었지만 여기서는 `<button>`을
     쓴다. 키보드로도 고를 수 있어야 하고, 이 저장소 규칙이기도 하다.
     `reset.css`가 button의 색·글꼴·여백을 상속으로 되돌려 두어서 글자
     크기와 색은 이전 마크업과 똑같이 나온다.

     JS가 없으면 마크업의 `is_active`(=[1] Silk) 그대로 보인다.
     --------------------------------------------------------- */

  function initMaterialsSelector() {
    var section = document.querySelector(".materials");

    if (!section) {
      return;
    }

    var textureImage = section.querySelector(".materials_texture_img");
    var swatches = Array.prototype.slice.call(section.querySelectorAll(".materials_swatch"));
    var listItems = Array.prototype.slice.call(section.querySelectorAll(".materials_list_item"));
    var captionBox = section.querySelector(".materials_caption");
    var captionItems = Array.prototype.slice.call(
      section.querySelectorAll(".materials_caption_item")
    );

    if (!textureImage || !swatches.length || !listItems.length || !captionItems.length) {
      return;
    }

    var activeFabric = null;
    var textureToken = 0;

    function fabricOf(element) {
      var button = element.querySelector("[data-fabric]");

      return button ? button.dataset.fabric : null;
    }

    /* 레퍼런스와 같은 "흐렸다가 갈아 끼우기". 전환 시간은 CSS에서 읽는다 —
       모션 감소 설정이면 --materials_fade가 0.01ms라 기다리지 않고 바뀐다. */
    function swapTexture(source, alt) {
      if (!source || textureImage.getAttribute("src") === source) {
        return;
      }

      var duration = parseFloat(getComputedStyle(textureImage).transitionDuration) * 1000;
      var token = ++textureToken;

      textureImage.classList.add("is_fading");

      window.setTimeout(function () {
        /* 흐려지는 동안 더 최근 요청이 들어왔으면 이 차례는 버린다.
           그쪽 타이머가 마지막 원단으로 마무리한다. */
        if (token !== textureToken) {
          return;
        }

        textureImage.src = source;
        textureImage.alt = alt;
        textureImage.classList.remove("is_fading");
      }, duration > 0 ? duration : 0);
    }

    function setActiveFabric(fabric) {
      if (!fabric || fabric === activeFabric) {
        return;
      }

      activeFabric = fabric;

      swatches.forEach(function (swatch) {
        var isMatch = fabricOf(swatch) === fabric;
        var button = swatch.querySelector(".materials_swatch_button");

        swatch.classList.toggle("is_active", isMatch);

        if (button) {
          button.setAttribute("aria-pressed", isMatch ? "true" : "false");
        }
      });

      listItems.forEach(function (item) {
        var isMatch = fabricOf(item) === fabric;
        var button = item.querySelector(".materials_list_button");

        item.classList.toggle("is_active", isMatch);

        if (button) {
          button.setAttribute("aria-pressed", isMatch ? "true" : "false");
        }
      });

      captionItems.forEach(function (item) {
        item.classList.toggle("is_active", item.dataset.fabric === fabric);
      });

      var swatchImage = section.querySelector(
        '.materials_swatch_button[data-fabric="' + fabric + '"] .materials_swatch_img img'
      );

      if (swatchImage) {
        /* 큰 사진의 대체 텍스트는 스와치의 것을 고쳐 쓴다. 이름 목록에서
           만들면 "Seasonal Fabric fabric ..."처럼 겹치는 경우가 생긴다. */
        var textureAlt = (swatchImage.getAttribute("alt") || "").replace(
          /\s*swatch$/,
          " shown close up"
        );

        swapTexture(swatchImage.getAttribute("src"), textureAlt);
      }
    }

    /* 설명 여섯 개의 줄 수가 서로 달라서, 자리를 미리 잡아 두지 않으면
       원단을 옮길 때마다 섹션 높이가 들썩인다. 가장 큰 것을 재서 고정한다
       (shop_detail 아코디언과 같은 방식이라 폭이 달라져도 값이 맞는다). */
    var reservedWidth = 0;

    function reserveCaptionHeight() {
      if (!captionBox) {
        return;
      }

      captionBox.style.minHeight = "";

      var tallest = 0;

      captionItems.forEach(function (item) {
        var wasActive = item.classList.contains("is_active");

        if (!wasActive) {
          item.classList.add("is_active");
        }

        tallest = Math.max(tallest, item.offsetHeight);

        if (!wasActive) {
          item.classList.remove("is_active");
        }
      });

      captionBox.style.minHeight = tallest + "px";
      reservedWidth = captionBox.clientWidth;
    }

    /* hover는 버블링하지 않으므로 mouseover로 위임한다. 버튼 안쪽 요소를
       지날 때마다 다시 들어오지만 setActiveFabric이 같은 값이면 바로 빠진다. */
    section.addEventListener("mouseover", function (event) {
      var button = event.target.closest ? event.target.closest("[data-fabric]") : null;

      if (button && section.contains(button)) {
        setActiveFabric(button.dataset.fabric);
      }
    });

    /* 키보드(Tab)와 터치(클릭) 경로. 터치에는 hover가 없어 이쪽이 유일하다. */
    section.addEventListener("focusin", function (event) {
      var button = event.target.closest ? event.target.closest("[data-fabric]") : null;

      if (button) {
        setActiveFabric(button.dataset.fabric);
      }
    });

    section.addEventListener("click", function (event) {
      var button = event.target.closest ? event.target.closest("[data-fabric]") : null;

      if (button) {
        setActiveFabric(button.dataset.fabric);
      }
    });

    /* 마크업이 이미 켜 둔 원단을 시작값으로 삼는다. 여기서 setActiveFabric을
       부르지 않는 이유: 부르면 같은 사진으로 한 번 페이드가 돌아 깜빡인다. */
    var initialItem = listItems.filter(function (item) {
      return item.classList.contains("is_active");
    })[0];

    activeFabric = fabricOf(initialItem || listItems[0]);

    reserveCaptionHeight();

    /* 웹폰트가 적용되면 줄 수가 달라지므로 다시 잰다. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(reserveCaptionHeight);
    }

    /* 폭이 실제로 달라졌을 때만 다시 잰다(무한 루프 방지). */
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        if (captionBox.clientWidth !== reservedWidth) {
          reserveCaptionHeight();
        }
      }).observe(captionBox);
    } else {
      window.addEventListener("resize", reserveCaptionHeight);
    }
  }

  initProcessSteps();
  initMaterialsSelector();
  initPhilosophyMotion();
  initAtelierZoom();

  /* 글 나누기는 **웹폰트가 적용된 뒤**에 해야 한다. 시스템 폰트로 재면 줄 폭이
     달라서 "글자로 나눠도 되는가" 판단이 뒤집힌다. 폰트를 못 기다리는
     환경에서는 바로 실행한다. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(initAtelierText);
  } else {
    initAtelierText();
  }
})();
