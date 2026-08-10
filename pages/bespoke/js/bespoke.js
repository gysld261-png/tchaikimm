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
  /* 퇴장 — 아래 wordmark로 넘겨주는 구간이다.
     **끝(20%)을 더 일찍 잡으면 안 된다.** 글이 화면 위쪽에 아직 남아 있는 채로
     사라져 버려서, 겹치는 순간 없이 뚝 끊긴다. */
  var PHILOSOPHY_EXIT_SHIFT = 90; /* 글 상자가 위로 빠지는 거리(px) */
  var PHILOSOPHY_EXIT_START = "bottom 88%"; /* 섹션 아랫변이 화면 88%에 오면 시작 */
  var PHILOSOPHY_EXIT_END = "bottom 20%"; /* 아랫변이 20%에 오면 완전히 사라짐 */

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

      /* 3) 퇴장 — 섹션이 화면을 빠져나가는 동안 글 상자가 위로 사라진다.
            아래 wordmark가 화면 밑에서 올라오는 구간과 **겹친다.**
            그래서 두 콘텐츠가 잠깐 같이 보이고, philosophy → wordmark가
            끊긴 두 섹션이 아니라 한 흐름으로 읽힌다.

            ★ 대상이 자식(title/desc)이 아니라 글 상자(.philosophy_body)다.
            자식에는 위 등장 트윈이 이미 걸려 있어서, 같은 요소에 걸면
            둘이 서로 덮어쓴다. */
      gsap.fromTo(
        body,
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: -PHILOSOPHY_EXIT_SHIFT,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: PHILOSOPHY_EXIT_START,
            end: PHILOSOPHY_EXIT_END,
            scrub: 0.8
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
  /* ★ 1280px 이상은 아래 `initAtelierStory()`가 사진을 통째로 맡는다.
     같은 사진에 두 트리거가 scale을 쓰면 서로 덮어쓰고, 무엇보다 스토리
     무대는 `object-fit: contain`으로 **사진 전체를 보여주는** 것이 목적이라
     18% 확대(=잘림)와 목적이 정면으로 어긋난다.
     그래서 이 확대는 스토리가 없는 폭에서만 돈다. */
  var ATELIER_ZOOM_GATE = "(max-width: 1279px) and (prefers-reduced-motion: no-preference)";

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
  /* ★ 확대와 같은 이유로 1280px 이상에서는 돌지 않는다. 스토리 무대에서는
     글이 사진과 **순서를 맞춰** 떠올라야 하는데(사진이 가운데 안착한 뒤),
     이 물결은 자기 트리거로 따로 재생돼서 그 순서를 지킬 수 없다.
     그쪽은 `initAtelierStory()`가 블록 단위 stagger로 처리한다. */
  var ATELIER_TEXT_GATE = "(max-width: 1279px) and (prefers-reduced-motion: no-preference)";

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

     그쪽 동작을 그대로 옮겼다가 2026-08-10에 두 가지를 뒤집었다.

     · **클릭(탭)으로만 바뀐다. hover는 아무것도 하지 않는다**(사용자 결정).
       레퍼런스와 이전 구현은 hover였는데, 원단 사진이 원본 카메라 파일
       (장당 1~4MB)로 바뀌면서 마우스가 스쳐 지나가기만 해도 큰 사진이
       갈아 끼워지는 게 손해가 됐다. 되돌아가지 않는 것은 그대로다.
     · **큰 사진에 페이드가 없다. 클릭한 순간 갈아 끼운다.**
       예전에는 0.4초 흐렸다가(`.is_fading { opacity: 0 }`) 바꿨는데,
       그 0.4초가 화면에서는 **빈 자리로 보였다** — "눌렀는데 한참 비어
       있다가 사진이 뜬다"의 정체가 이것이다. 지금은 흐리는 단계가 없다.
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

    /* ★ 이 섹션의 사진은 원본 카메라 파일이다(3000~6000px, 장당 1~4MB).
       클릭한 뒤에 받기 시작하면 다 받을 때까지 자리가 비어 보이므로,
       **여섯 장을 미리 받아 둔다.** 목록은 스와치 마크업에서 그대로 읽으니
       사진을 바꿔도 여기를 고칠 필요가 없다.

       DOM의 <img>와 같은 URL이라 브라우저 캐시에서 한 벌만 받는다.
       이 섹션에서 실제로 쓰는 여섯 장만 대상이다. */
    var preloaded = Object.create(null);

    function preloadTexture(source) {
      if (!source || preloaded[source]) {
        return preloaded[source] || null;
      }

      var image = new Image();

      image.src = source;
      preloaded[source] = image;

      return image;
    }

    /* 클릭한 순간 갈아 끼운다. 페이드로 흐리는 단계가 없어 빈 자리가 없다.

       ★ **아직 안 받아진 사진이면 src를 바꾸지 않고 기다린다.** 바꿔 버리면
       받는 동안 <img>가 빈 상자가 되어(= 고치려던 그 증상) 자리가 비어 보인다.
       기다리는 동안에는 **직전 원단 사진이 그대로 떠 있다** — 화면이 비는
       구간이 어느 경로에서도 생기지 않는다. 미리 받아 두었으므로 보통은
       `complete`가 참이라 이 대기 경로를 타지 않는다. */
    function swapTexture(source, alt) {
      if (!source || textureImage.getAttribute("src") === source) {
        return;
      }

      var token = ++textureToken;
      var image = preloadTexture(source);

      function apply() {
        /* 기다리는 사이에 다른 원단을 눌렀으면 이 차례는 버린다. */
        if (token !== textureToken) {
          return;
        }

        textureImage.src = source;
        textureImage.alt = alt;
      }

      if (!image || image.complete) {
        apply();
        return;
      }

      image.addEventListener("load", apply, { once: true });
      /* 사진이 깨져 있으면 계속 기다리지 말고 그대로 넣는다 —
         그래야 alt가 읽히고 문제가 화면에 드러난다. */
      image.addEventListener("error", apply, { once: true });
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

    /* ★ 트리거는 클릭(탭) **하나뿐**이다. mouseover·focusin 위임을 두지 않는다.

       예전에는 셋 다 있었다. hover를 빼는 것은 사용자 결정이고, focusin도
       같이 뺐다 — Tab으로 지나가기만 해도 사진이 바뀌는 것은 "클릭으로만
       바뀐다"는 규칙과 어긋난다. `<button>`이라 키보드 Enter·Space가
       click 이벤트를 그대로 발생시키므로 **키보드로 고르는 길은 그대로
       남아 있다.** 터치도 tap이 click이라 같은 경로를 탄다. */
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

    /* 여섯 장을 미리 받아 둔다. 첫 클릭이 곧바로 갈아 끼워지려면
       이 시점에 시작해 두어야 한다. */
    swatches.forEach(function (swatch) {
      var image = swatch.querySelector(".materials_swatch_img img");

      if (image) {
        preloadTexture(image.getAttribute("src"));
      }
    });

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

  /* ---------------------------------------------------------
     wordmark — philosophy를 지나면 거대한 "TCHAI" 워터마크가 떠오르고,
     그다음 atelier로 넘어간다.

     philosophy·atelier와 같이 GSAP + ScrollTrigger다. 다만 이쪽은 스크롤
     위치에 1:1로 묶인 `scrub`이라 위로 되감으면 글자도 같이 내려간다.

     섹션은 시안 높이(986px) 그대로이고 sticky도 pin도 쓰지 않는다.
     **이 섹션에 긴 스크롤 구간을 주면 안 된다** — 글자 한 줄뿐이라
     아무 일도 일어나지 않는 빈 스크롤만 길어진다.
     (사진이 화면을 채우다 줄어드는 버전에서는 220svh를 썼지만,
      사진을 빼기로 하면서 같이 걷어냈다.)

     JS나 GSAP이 없거나 모션 감소 설정이면 아무것도 하지 않는다.
     그때는 css의 기본 규칙대로 워터마크가 그냥 보인다.
     --------------------------------------------------------- */

  /* 조절값 — 숫자만 바꾸면 된다 */
  var WORDMARK_RISE = 48; /* 글자가 아래에서 올라오는 거리(px) */
  /* 자간을 좁힌 상태에서 시작해 제자리로 펴진다. editorial 느낌의 핵심이다.
     ★ **양수(넓게)에서 시작하면 안 된다.** 1920에서 글자 폭이 이미 1759px라
     자간을 벌리면 화면(1920)을 넘어 무대 밖으로 잘린다. 좁혔다 펴야 안전하다. */
  var WORDMARK_TRACK_FROM = "-0.045em";

  /* 등장(0~0.5) → 유지(0.5~1) 두 박자다.

     ★ **퇴장 페이드를 두지 않는다.** sticky 무대는 구조상 마지막 100svh가
     "무대가 위로 밀려 나가는" 구간인데, 그 전에 글자를 지워 버리면
     **빈 크림색 화면이 한 화면 내내 지나간다**(실측 1080px). 글자를 켜 둔 채
     무대째 밀려 나가야 아래 atelier가 올라오는 것과 이어진다.

     ★ 시작을 "top top"이 아니라 "top 65%"로 잡는다. 섹션이 화면 밑에서
     올라오는 동안 이미 글자가 떠오르기 시작해야, 위 philosophy가 사라지는
     구간과 겹쳐서 한 흐름으로 읽힌다. "top top"이면 philosophy가 다 사라진
     뒤에야 시작해 두 섹션 사이가 끊긴다(실측 216px 공백). */
  var WORDMARK_REVEAL_END = 0.5;
  var WORDMARK_START = "top 65%";
  /* 아래 `ATELIER_STORY_GATE`와 같은 조건이다 — 이 무대는 그 스토리의 한 박자라
     둘의 켜짐 조건이 어긋나면 안 된다. 1280 미만에서는 섹션이 시안 높이로 남는다. */
  var WORDMARK_GATE = "(min-width: 1280px) and (prefers-reduced-motion: no-preference)";

  function initWordmarkScroll() {
    var section = document.querySelector(".wordmark");

    if (!section) {
      return;
    }

    var text = section.querySelector(".wordmark_text");

    if (!text || !window.gsap || !window.ScrollTrigger) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    /* ★ 게이트에 **폭 조건이 필요하다**(2026-08-10 추가).
       이 무대는 philosophy → atelier를 잇는 데스크톱 스토리의 한 박자인데,
       그 스토리(`initAtelierStory`)는 1280px 이상에서만 돈다. 폭 조건이
       없던 동안 **모바일에서도 240svh(360×800에서 1600px = 두 화면)**를
       열어 두고, 그 두 화면에서 일어나는 일은 "TCHAI" 한 단어가 떠오르는
       것뿐이었다. 손가락으로 두 번 넘겨야 다음 내용이 나온다.

       이제 1280 미만에서는 class가 붙지 않아 섹션이 시안 높이
       (`min-height: min(51.35vw, 986px)` = 360에서 185px)로 남는다.
       글자는 CSS 기본 상태 그대로 보인다. */
    gsap.matchMedia().add(WORDMARK_GATE, function () {
      /* 무대를 sticky로 바꾸고 스크롤 구간을 여는 것이 이 class다.
         트리거를 만들기 전에 붙여야 섹션 높이를 제대로 잰다. */
      section.classList.add("is_motion_ready");

      var timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: WORDMARK_START,
          end: "bottom bottom",
          scrub: 1
        }
      });

      /* 1박자 — 떠오른다.
         끝 불투명도는 1이고, 시안의 7%는 css가 글자 **색**에 담고 있다.
         (요소 opacity에 7%를 걸면 이 트윈과 서로 덮어쓴다.) */
      timeline.fromTo(
        text,
        { opacity: 0, y: WORDMARK_RISE, scale: 0.97, letterSpacing: WORDMARK_TRACK_FROM },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          letterSpacing: "0em",
          duration: WORDMARK_REVEAL_END,
          ease: "power2.out"
        },
        0
      );

      /* 2박자 — 그대로 둔다. 화면을 차지하는 순간이다.
         빈 트윈이지만 타임라인 길이를 1로 맞추는 역할을 한다. */
      timeline.to({}, { duration: 1 - WORDMARK_REVEAL_END }, WORDMARK_REVEAL_END);

      return function () {
        section.classList.remove("is_motion_ready");
      };
    });
  }

  /* ---------------------------------------------------------
     atelier 스토리 무대 — 사진이 왼쪽에서 들어와 화면 가운데로 이동하고,
     안착한 뒤 왼쪽에 글이 떠오른다. (레퍼런스: tarubali.com)

     **1280px 이상 + 모션 감소 아님**에서만 켜진다. 그 밖에서는 이 함수가
     아무것도 하지 않고, 시안 그대로 사진 위 · 글 아래로 쌓인다.

     무대 고정은 CSS sticky다(ScrollTrigger pin 아님) — pin-spacer가 끼면
     아래 quote·process의 문서 좌표가 전부 밀린다.

     타임라인 길이를 정확히 1로 맞춰 두어서, 아래 구간 상수가 곧 스크롤
     진행도가 된다. scrub이라 빠르게 굴리거나 위로 되감아도 값이 꼬이지
     않는다 — 스크롤 위치에서 매번 다시 계산되기 때문이다.
     --------------------------------------------------------- */

  /* 조절값 — 숫자만 바꾸면 된다 */
  var ATELIER_STORY_GATE = "(min-width: 1280px) and (prefers-reduced-motion: no-preference)";
  var ATELIER_STORY_RISE = 48; /* 사진이 아래에서 올라오는 거리(px) */
  var ATELIER_STORY_FROM_SCALE = 0.94; /* 등장 시작 배율 */
  var ATELIER_STORY_TEXT_RISE = 32; /* 글이 아래에서 올라오는 거리(px) */
  var ATELIER_STORY_TEXT_SPREAD = 0.1; /* 오른쪽 글 덩이 사이의 시차(진행도) */

  /* 구간 — 전체 스크롤을 1로 봤을 때의 위치다.
     사진(가운데) → 제목(왼쪽) → 설명(오른쪽) 순으로 자리를 잡는다.
     ★ 사진은 **처음부터 화면 정중앙**에서 떠오른다. 왼쪽에서 가운데로
     옮기던 이전 버전은 사용자 결정으로 걷어냈다 — 양옆이 글 자리라
     사진이 지나가면 글 위를 덮는다. */
  var ATELIER_STORY_ENTER_END = 0.4;
  var ATELIER_STORY_HEAD_START = 0.34;
  var ATELIER_STORY_HEAD_END = 0.62;
  var ATELIER_STORY_TEXT_START = 0.52;
  var ATELIER_STORY_TEXT_END = 0.88;
  /* ★ "top top"이 아니다. 위 wordmark 무대가 밀려 나가는 동안 이 섹션이 아래에서
     올라오는데, 사진이 무대 한가운데 있어서 **화면에 실제로 보이기 시작하는
     시점**이 섹션 윗변이 화면 40%에 닿을 무렵이다. 그때부터 페이드를 시작해야
     빈 구간 없이 이어진다. "top top"으로 두면 그 앞 400px가 빈 화면이 된다. */
  var ATELIER_STORY_START = "top 40%";

  function initAtelierStory() {
    var section = document.querySelector(".atelier");

    if (!section) {
      return;
    }

    var stage = section.querySelector(".atelier_stage");
    var image = section.querySelector(".atelier_image");
    var head = section.querySelector(".atelier_head");
    var parts = section.querySelectorAll(".atelier_body > *");

    if (!stage || !image || !head || !parts.length || !window.gsap || !window.ScrollTrigger) {
      return;
    }

    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    gsap.matchMedia().add(ATELIER_STORY_GATE, function () {
      /* 무대 레이아웃(sticky · 3열 그리드 · 가운데 사진)을 여는 것이 이 class다.
         트리거를 만들기 전에 붙여야 섹션 높이와 무대 폭을 제대로 잰다. */
      section.classList.add("is_story_ready");

      var timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: ATELIER_STORY_START,
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true /* 창이 바뀌면 시작값을 다시 잰다 */
        }
      });

      /* Phase 1 — 사진이 화면 정중앙에서 떠오른다.
         가로 위치는 그리드가 잡아 주므로 x를 건드리지 않는다. */
      timeline.fromTo(
        image,
        { opacity: 0, scale: ATELIER_STORY_FROM_SCALE, y: ATELIER_STORY_RISE },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: ATELIER_STORY_ENTER_END,
          ease: "power2.out"
        },
        0
      );

      /* Phase 2 — 왼쪽 제목이 떠오른다. 사진이 거의 자리를 잡을 무렵 시작해
         조금 겹친다(0.34 < 0.4). */
      timeline.fromTo(
        head,
        { opacity: 0, y: ATELIER_STORY_TEXT_RISE },
        {
          opacity: 1,
          y: 0,
          duration: ATELIER_STORY_HEAD_END - ATELIER_STORY_HEAD_START,
          ease: "power2.out"
        },
        ATELIER_STORY_HEAD_START
      );

      /* Phase 3 — 오른쪽 설명이 위에서부터 차례로 떠오른다.

         ★ `stagger`를 쓰지 않고 덩이마다 트윈을 따로 만든다.
         staggered fromTo를 scrub 타임라인에 넣으면 **첫 대상만** 시작 상태를
         유지하고 나머지는 자기 차례가 오기 전까지 원래 상태(opacity 1)로
         보인다. 실측에서 진행도 0에 meta가 이미 1이었다가 0.7에서 0으로
         **깜빡였다.** 트윈을 나누면 각자 자기 시작 상태를 지킨다. */
      var partList = Array.prototype.slice.call(parts);
      var textStep =
        ATELIER_STORY_TEXT_SPREAD / Math.max(1, partList.length - 1);
      var textDuration =
        ATELIER_STORY_TEXT_END -
        ATELIER_STORY_TEXT_START -
        ATELIER_STORY_TEXT_SPREAD;

      partList.forEach(function (part, index) {
        timeline.fromTo(
          part,
          { opacity: 0, y: ATELIER_STORY_TEXT_RISE },
          {
            opacity: 1,
            y: 0,
            duration: textDuration,
            ease: "power2.out"
          },
          ATELIER_STORY_TEXT_START + textStep * index
        );
      });

      /* Phase 4 — 완성된 구도를 눈에 남기는 여백.
         빈 트윈이지만 타임라인 길이를 1로 맞추는 역할을 한다. 이게 없으면
         타임라인이 0.88에서 끝나 위 구간 상수와 실제 진행도가 어긋난다. */
      timeline.to({}, { duration: 1 - ATELIER_STORY_TEXT_END }, ATELIER_STORY_TEXT_END);

      return function () {
        section.classList.remove("is_story_ready");
      };
    });
  }

  /* ---------------------------------------------------------
     begin 카드 + 핀 — 눌러서 상세 내용을 열어 둔다

     레퍼런스는 shop_detail의 `.look_pin`이다. 그쪽 동작을 그대로 따른다:
     · 같은 핀을 다시 누르면 닫힌다
     · 다른 핀을 누르면 앞의 것이 닫힌다(한 번에 하나)
     · Escape로 전부 닫힌다
     · 열림 상태는 class + `aria-expanded`로만 표현한다

     **CSS가 모든 시각 변화를 맡는다.** 여기서는 class만 붙였다 뗀다.
     인라인 스타일을 쓰지 않으므로 이 섹션에 GSAP이 나중에 붙어도
     같은 속성을 두고 다투지 않는다(현재 begin에는 GSAP이 없다).

     hover는 CSS `:hover`가 따로 처리하고, 이 class는 그것과 독립이다.
     그래서 hover → click → 마우스 벗어남 순서에서도 열린 상태가 남는다.
     --------------------------------------------------------- */

  function initBeginCards() {
    var pins = Array.prototype.slice.call(document.querySelectorAll(".begin_card_pin"));

    if (!pins.length) {
      return;
    }

    /* 열림일 때 `−`. 레퍼런스는 글자 그대로 `+`를 쓰므로 여기서도 글자를 바꾼다.
       읽어 주는 이름은 `aria-expanded`가 맡으므로 글자는 `aria-hidden`이다.

       ★ 닫힘일 때 글 안쪽 링크의 `tabindex`를 −1로 내린다.
       글이 `opacity: 0`으로만 숨겨져 있어서, 이걸 하지 않으면 **보이지 않는
       버튼·링크가 Tab 순서에 남는다.** shop_detail의 `.look_product`가
       `cardLink.tabIndex = shouldOpen ? 0 : -1`로 하는 것과 같은 처리다. */
    function setOpen(pin, shouldOpen) {
      var card = pin.closest(".begin_card");
      var glyph = pin.querySelector(".begin_card_pin_glyph");
      var content = card ? card.querySelector(".begin_card_content") : null;

      if (card) {
        card.classList.toggle("is_open", shouldOpen);
      }

      pin.setAttribute("aria-expanded", String(shouldOpen));

      if (glyph) {
        glyph.textContent = shouldOpen ? "−" : "+"; /* − (minus sign) */
      }

      if (content) {
        content.setAttribute("aria-hidden", String(!shouldOpen));

        var link = content.querySelector(".begin_card_link");

        if (link) {
          link.tabIndex = shouldOpen ? 0 : -1;
        }
      }
    }

    pins.forEach(function (pin) {
      pin.addEventListener("click", function () {
        var wasOpen = pin.getAttribute("aria-expanded") === "true";

        /* 하나만 열어 둔다 — 나머지는 접는다. */
        pins.forEach(function (item) {
          setOpen(item, item === pin && !wasOpen);
        });
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") {
        return;
      }

      pins.forEach(function (pin) {
        setOpen(pin, false);
      });
    });

    /* 시작은 전부 닫힘. 마크업의 `aria-expanded="false"`와 맞추고,
       숨어 있는 링크를 Tab 순서에서 빼 둔다. */
    pins.forEach(function (pin) {
      setOpen(pin, false);
    });
  }

  initProcessSteps();
  initBeginCards();
  initMaterialsSelector();
  initPhilosophyMotion();
  initAtelierZoom();
  initWordmarkScroll();
  initAtelierStory();

  /* 글 나누기는 **웹폰트가 적용된 뒤**에 해야 한다. 시스템 폰트로 재면 줄 폭이
     달라서 "글자로 나눠도 되는가" 판단이 뒤집힌다. 폰트를 못 기다리는
     환경에서는 바로 실행한다. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(initAtelierText);
  } else {
    initAtelierText();
  }
})();
