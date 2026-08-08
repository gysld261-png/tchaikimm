/* 스크롤 인터랙션 — model 영상 스크럽, brand_01~04 고정+텍스트 전환,
   brand_05/06 스크롤 리빌, kyj_brand_story 1장→3장→확대→페이드아웃.
   model은 모든 화면에서 동작하고 나머지 장면은 768px 이상에서만 동작합니다. */
(function () {
  "use strict";

  var isGsapReady = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (!isGsapReady) {
    return;
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------
     model — 스크롤을 5초 영상의 90% 지점까지 연결합니다.
     마지막 빈 프레임으로 넘어가지 않고 시안의 정면 자세에서 멈춥니다.
     --------------------------------------------------------- */
  (function setupModelScroll() {
    var section = document.querySelector(".model");
    var video = section ? section.querySelector(".model_video") : null;
    var text = section ? section.querySelector(".model_text") : null;

    if (!section || !video || !text) {
      return;
    }

    function handleModelMetadata() {
      var endTime = video.duration * 0.9;

      video.pause();

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        video.currentTime = endTime;
        return;
      }

      var timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: function () {
            return "+=" + window.innerHeight * 3;
          },
          pin: true,
          scrub: 0.2,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true
        }
      });

      timeline
        .to(text, { autoAlpha: 0, y: -20, duration: 0.15, ease: "none" }, 0)
        .to(video, { currentTime: endTime, duration: 0.85, ease: "none" }, 0.15);

      ScrollTrigger.refresh();
    }

    if (video.readyState >= 1) {
      handleModelMetadata();
    } else {
      video.addEventListener("loadedmetadata", handleModelMetadata, { once: true });
    }
  })();

  gsap.matchMedia().add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", function () {
    var triggers = [];
    var resets = [];

    /* ---------------------------------------------------------
       brand_01~05 — 한 화면에 고정한 채 글자가 차례로 바뀌다가
       마지막 단계(brand_collage)에서 사진이 서서히 나타나고
       이름 두 줄이 벌어지며 갈라집니다. 05 뒤에 이어지는 정적 brand_06은
       이 시퀀스가 끝난 뒤 이미 다 드러난 상태로 보여주는 것이라
       별도 인터랙션 없이 시안 그대로 둡니다.
       --------------------------------------------------------- */
    (function setupBrandWordPin() {
      var pin = document.getElementById("brand_word_pin");
      if (!pin) {
        return;
      }

      var steps = Array.prototype.slice.call(pin.children);
      if (steps.length < 2) {
        return;
      }

      /* 마지막 단계(brand_collage)는 brand_04+05+06을 한 섹션 안에서 이어 만듭니다.
         사용자가 준 참고 사진 3장(흐름) 기준으로 다시 맞춘 순서:
         1) brand_03 크로스페이드와 같은 시점 — "TCHAI Kim"(왼쪽)과 "TCHAI Kim Young Jin"
            (오른쪽, "Young Jin"만 보이고 "TCHAI Kim " 접두어는 작게 접혀 있음)이 큰 글자
            (brand_03과 같은 크기)로, 화면 중앙 가까이 서로 가깝게 붙어서 나타남.
         2) 그 자리에 멈춘 채로, "Young Jin" 옆에 접혀 있던 "TCHAI Kim " 접두어가 (뒤에서
            나오듯) 오른쪽 끝을 기준으로 작은 크기에서 "Young Jin"과 같은 크기로 자라나
            "TCHAI Kim Young Jin"을 완성함.
         3) 완성된 두 텍스트가 함께 작아지며(scale) brand_05의 최종 위치(왼쪽 18.7%,
            오른쪽 71.5%)로 벌어지고, 그 사이로 사진 4장이 서서히 나타남.
         피그마 정적 프레임(1712:4341 brand_05)에는 1)/2)의 "가깝게 붙은 큰 글자" 중간
         상태가 별도로 정의돼 있지 않아서, 중앙(50%)과 brand_05 최종 위치의 중간 지점으로
         추정해 잡았습니다 — 참고 사진과 다르면 옵셋 값(CLOSE_LEFT_FRACTION 등)만 조정하면
         됩니다. */
      var collageStep = pin.querySelector(".brand_collage");
      var cards = collageStep ? collageStep.querySelector(".brand_collage_cards") : null;
      var nameLeft = collageStep ? collageStep.querySelector(".brand_collage_name_left") : null;
      var nameRight = collageStep ? collageStep.querySelector(".brand_collage_name_right") : null;
      var prefix = collageStep ? collageStep.querySelector(".brand_collage_name_prefix") : null;
      var suffix = collageStep ? collageStep.querySelector(".brand_collage_name_suffix") : null;
      var hasCollageReveal = collageStep && cards && nameLeft && nameRight && prefix && suffix;
      var isDesktop = window.innerWidth >= 1280;

      /* brand_word 마지막 패널("TCHAI Kim Young Jin", brand_03)의 실제 font-size — 1)단계
         목표 배율(bigScale = 큰 글자 ÷ 작은 글자)을 구하는 기준입니다. clamp() 반응형 값이라
         런타임에 측정합니다. */
      var lastWordText = hasCollageReveal ? steps[steps.length - 2].querySelector(".brand_word_text") : null;

      /* 접두어가 "작게 접혀 있다가 자라나는" 시작 배율. */
      var PREFIX_START_SCALE = 0.4;
      /* "가깝게 붙은" 두 블록 사이에 남겨둘 최소 여백 — nameBox 너비 대비 비율. */
      var CLOSE_GAP_RATIO = 0.028;
      /* 두 블록(간격 포함)이 nameBox 안에서 차지할 최대 비율 — 나머지는 좌우 여백. */
      var CLOSE_BLOCK_RATIO = 0.82;

      pin.classList.add("is_pinned");
      gsap.set(steps, { opacity: 0 });
      gsap.set(steps[0], { opacity: 1 });

      if (hasCollageReveal) {
        collageStep.classList.add("is_enhanced");
        gsap.set(cards, { opacity: 0, scale: 0.94 });
        /* 접두어는 오른쪽 끝(Young Jin에 붙는 지점)을 기준으로 자라나야 "뒤에서 나와
           옆에 붙는" 느낌이 나므로, 중심이 아니라 오른쪽 기준으로 스케일합니다. */
        gsap.set(prefix, { transformOrigin: "100% 50%" });

        /* 실제 렌더링된 레이아웃(반응형 gap·폰트 포함)을 측정해서 1)단계 위치를 역산합니다
           — 하드코딩된 px 대신이라 어떤 너비에서도 정확합니다. 커스텀 폰트가 늦게 로드되면
           (FOUT) 대체 폰트 기준으로 잰 값이 어긋나 "삐뚤어져 보이는" 원인이 되므로, 폰트
           로딩이 끝난 뒤 한 번 더 다시 잽니다. */
        var applyCollageStart = function () {
          if (!isDesktop) {
            gsap.set(nameLeft, { y: 40 });
            gsap.set(nameRight, { y: -40 });
            gsap.set(prefix, { scale: PREFIX_START_SCALE });
            return;
          }

          gsap.set([nameLeft, nameRight], { clearProps: "transform" });
          gsap.set(prefix, { scale: 1 });

          var wordFontSize = parseFloat(getComputedStyle(lastWordText).fontSize) || 1;
          var collageFontSize = parseFloat(getComputedStyle(nameRight).fontSize) || wordFontSize;
          var bigScale = wordFontSize / collageFontSize;

          var nameBox = collageStep.querySelector(".brand_collage_name").getBoundingClientRect();

          /* nameRight는 접두어("TCHAI Kim ")가 다 자란 뒤(prefix scale 1)를 기준으로
             폭을 잽니다 — 접두어의 자체 scale은 레이아웃 폭에 영향을 주지 않는(순수 페인트용)
             transform이라, 지금 값을 재도 항상 "다 자란 뒤"의 실제 폭과 같습니다. */
          var leftBox = nameLeft.getBoundingClientRect();
          var rightBox = nameRight.getBoundingClientRect();

          /* "TCHAI Kim"과 "TCHAI Kim Young Jin"을 겹치지 않게 나란히 붙이려면, 브랜드_03과
             똑같이 큰 글자(bigScale)로는 둘을 합친 폭이 화면보다 넓어질 수 있습니다 —
             그래서 "겹치지 않는 선에서 최대한 큰" 배율을 폭으로 역산합니다(최대 bigScale,
             최소 1.15배로 눈에 띄게 줄어드는 느낌은 유지). */
          var gapPx = nameBox.width * CLOSE_GAP_RATIO;
          var availableWidth = nameBox.width * CLOSE_BLOCK_RATIO;
          var fitScale = (availableWidth - gapPx) / (leftBox.width + rightBox.width);
          var closeScale = Math.max(1.15, Math.min(bigScale, fitScale));

          var totalWidth = leftBox.width * closeScale + gapPx + rightBox.width * closeScale;
          var blockLeftEdge = nameBox.left + (nameBox.width - totalWidth) / 2;
          var leftTargetCenterX = blockLeftEdge + (leftBox.width * closeScale) / 2;
          var rightBoxTargetLeftEdge = blockLeftEdge + leftBox.width * closeScale + gapPx;
          var rightTargetCenterX = rightBoxTargetLeftEdge + (rightBox.width * closeScale) / 2;

          var leftCenterNatural = leftBox.left + leftBox.width / 2;
          var rightCenterNatural = rightBox.left + rightBox.width / 2;

          gsap.set(nameLeft, {
            scale: closeScale,
            x: leftTargetCenterX - leftCenterNatural
          });
          gsap.set(nameRight, {
            scale: closeScale,
            x: rightTargetCenterX - rightCenterNatural
          });
          gsap.set(prefix, { scale: PREFIX_START_SCALE });
        };

        applyCollageStart();
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(function () {
            applyCollageStart();
            ScrollTrigger.refresh();
          });
        }
      }

      /* brand_collage가 끝난 뒤 아래 정적 brand_06으로 자연스럽게 이어지도록,
         핀이 풀리기 직전에 한 구간(scrollLength)을 더 두고 콜라주 전체를
         서서히 작아지며 옅어지게 합니다 — "다음 섹션과 연결"되는 느낌을 줍니다. */
      var scrollLength = hasCollageReveal ? steps.length + 1 : steps.length;

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: "+=" + window.innerHeight * scrollLength,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true
        }
      });

      /* brand_01→02→03→(1단계 모습의) brand_collage까지, 같은 자리·같은 글자 크기의
         중앙 정렬 텍스트가 이어지는 구간이라 전부 동일한 방식(오버랩 없는 opacity
         크로스페이드)으로 충분히 자연스럽게 이어집니다. */
      steps.forEach(function (step, i) {
        if (i === 0) {
          return;
        }
        tl.to(steps[i - 1], { opacity: 0, duration: 0.6 }, i - 1)
          .to(step, { opacity: 1, duration: 0.6 }, i - 1);
      });

      if (hasCollageReveal) {
        /* 2) brand_03→brand_collage 크로스페이드와 같은 시점에 시작 — 가깝게 붙은 큰 글자
           상태 그대로, "Young Jin" 옆에서 접두어 "TCHAI Kim "이 자라나 문구를 완성합니다. */
        var growStart = steps.length - 2;
        tl.to(prefix, { scale: 1, duration: 1 }, growStart);

        /* 3) 접두어가 다 자란 직후(약간 겹치게) — 완성된 두 텍스트가 함께 작아지며
           brand_05 최종 위치로 벌어지고, 그 사이로 사진 4장이 서서히 나타납니다. */
        var spreadStart = growStart + 0.9;
        tl.to(cards, { opacity: 1, scale: 1, duration: 1.1 }, spreadStart)
          .to(nameLeft, isDesktop ? { x: 0, scale: 1, duration: 1.1 } : { y: 0, duration: 1.1 }, spreadStart)
          .to(nameRight, isDesktop ? { x: 0, scale: 1, duration: 1.1 } : { y: 0, duration: 1.1 }, spreadStart);

        /* 다 나타난 뒤(steps.length) 이어서 한 구간 더 — 전체가 서서히 작아지며
           옅어지고, 바로 아래 정적 brand_06(같은 사진, 더 큰 사이즈)으로 넘어갑니다. */
        tl.to(collageStep, { scale: 0.82, opacity: 0, duration: 1, ease: "power1.in" }, steps.length);
      }

      triggers.push(tl.scrollTrigger);
      resets.push(function () {
        pin.classList.remove("is_pinned");
        gsap.set(steps, { clearProps: "opacity" });
        if (hasCollageReveal) {
          collageStep.classList.remove("is_enhanced");
          gsap.set(collageStep, { clearProps: "scale,opacity" });
          gsap.set([cards, nameLeft, nameRight, prefix], { clearProps: "all" });
        }
      });
    })();

    /* ---------------------------------------------------------
       kyj_brand_story — 1장 → 3장으로 갈라짐 → 모이며 확대 → 페이드아웃
       (시안 주석 그대로: 확대-> 페이드아웃 -> 아래 영상으로 이어짐)
       --------------------------------------------------------- */
    Array.prototype.slice.call(document.querySelectorAll(".kyj_sequence")).forEach(function (section) {
      var solo = section.querySelector(".kyj_story_solo");
      var card1 = section.querySelector(".kyj_story_1");
      var card2 = section.querySelector(".kyj_story_2");
      var card3 = section.querySelector(".kyj_story_3");

      if (!solo || !card1 || !card2 || !card3) {
        return;
      }

      section.classList.add("is_enhanced");

      /* pin:true가 걸리면 GSAP이 이 section을 pin-spacer로 감싸면서 DOM 형제 관계가
         바뀌므로(section.nextElementSibling이 더 이상 다음 섹션을 가리키지 않게 됨),
         핀이 생기기 "전"인 지금 미리 다음 섹션(bespoke/shop)의 영상을 찾아둡니다. */
      var nextMedia = section.nextElementSibling ? section.nextElementSibling.querySelector(".promo_media") : null;

      /* 3장 모두 처음엔 솔로 컷과 같은 정중앙(xPercent -50)에 겹쳐서 시작하고,
         스크롤하면 img1-1/img1-3만 양옆으로 벌어집니다("가운데에서 양쪽으로") —
         img1-2는 솔로 컷 자리 그대로 유지됩니다. xPercent -50은 세 장 모두 처음
         한 번만 고정으로 걸어 중앙 정렬 기준으로 삼고, 실제 벌어지는 움직임은
         별도의 x(px) 값으로만 애니메이션합니다 — xPercent를 tween 대상으로 두면
         GSAP이 요소별 폭 기준을 잘못 캐싱하는 경우가 있어(카드1/3만 어긋나는 버그
         확인됨) 더 확실한 px 오프셋 방식으로 바꿨습니다.

         카드 사이 간격은 피그마 실측(node 1712:4386) 그대로 60px(1920 기준)입니다.
         중심 간 거리(spreadPx) = 카드 폭 + 간격이어야 그 간격이 정확히 나오는데,
         여기서 실제로 렌더링되는 카드 폭(min(380px, 46vw), 피그마 원본 337px보다 큼)을
         쓰지 않고 피그마의 중심 간 거리(397px)만 그대로 비율 환산하면 카드가 더 커진
         만큼 간격이 줄어들거나 겹칩니다 — 그래서 "실제 카드 폭 + 화면 비율로 환산한
         60px 간격"으로 다시 계산합니다. */
      var stage = section.querySelector(".kyj_sequence_stage");
      var stageWidth = (stage ? stage.getBoundingClientRect().width : 0) || window.innerWidth;
      /* getBoundingClientRect()는 안 됩니다 — .kyj_story_card는 JS 실행 전 초기 페인트용
         CSS 폴백으로 이미 transform: scale(0.85)가 걸려 있어서, 그 스케일이 적용된
         "그려진" 폭(예: 380*0.85=323)을 재게 됩니다. getComputedStyle().width는 transform과
         무관한 실제 레이아웃 폭(380)이라 이걸 써야 간격 계산이 정확합니다. */
      var cardWidth = parseFloat(getComputedStyle(card1).width) || 380;
      var FIGMA_GAP_PX_AT_1920 = 60;
      var gapPx = (FIGMA_GAP_PX_AT_1920 / 1920) * stageWidth;
      var spreadPx = cardWidth + gapPx;

      /* CSS 폴백(.kyj_sequence.is_enhanced .kyj_story_solo/1/2/3)에 이미
         transform: translate(...)가 걸려 있습니다. GSAP은 xPercent/yPercent를
         "얹을" 때 그 기존 transform을 그대로 기준값(x/y)으로 흡수해버려서,
         거기에 새 xPercent/yPercent가 또 더해져 세로 위치가 카드 높이의
         -100%(의도한 -50%의 2배)만큼 밀리는 문제가 있었습니다 — clearProps로
         지우기만 하면 CSS 규칙이 다시 살아나 똑같이 반복되므로, x/y/xPercent/
         yPercent/scale/rotation을 전부 0(또는 1)으로 명시해 인라인으로 완전히
         눌러버린 뒤에야 원하는 값을 새로 얹습니다. */
      gsap.set([solo, card1, card2, card3], { x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1, rotation: 0 });
      gsap.set(solo, { xPercent: -50, yPercent: -50, opacity: 1 });
      gsap.set([card1, card2, card3], { xPercent: -50, yPercent: -50, x: 0, scale: 0.85, opacity: 0 });

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=" + window.innerHeight * 2,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true
        }
      });

      tl.to(solo, { opacity: 0, duration: 1 }, 0.4)
        .to(card1, { x: -spreadPx, scale: 1, opacity: 1, duration: 1 }, 0.4)
        .to(card2, { scale: 1, opacity: 1, duration: 1 }, 0.4)
        .to(card3, { x: spreadPx, scale: 1, opacity: 1, duration: 1 }, 0.4)
        .to([card1, card2, card3], { x: 0, scale: 1.5, opacity: 0, duration: 1 }, 1.8);

      triggers.push(tl.scrollTrigger);
      resets.push(function () {
        section.classList.remove("is_enhanced");
        gsap.set([solo, card1, card2, card3], { clearProps: "all" });
      });

      /* 페이드아웃이 끝나는 지점(핀이 풀리는 순간) 바로 다음 섹션(bespoke/shop)의
         영상이 곧바로 뚝 끊겨 나타나지 않도록, 스크롤로 화면에 들어오면서 서서히
         커지며 나타나게 해 "이어지는" 느낌을 이어줍니다. */
      if (nextMedia) {
        gsap.set(nextMedia, { opacity: 0, scale: 1.06 });
        var entranceTl = gsap.timeline({
          scrollTrigger: {
            trigger: nextMedia,
            start: "top bottom",
            end: "top 65%",
            scrub: 1
          }
        });
        entranceTl.to(nextMedia, { opacity: 1, scale: 1, duration: 1 });
        triggers.push(entranceTl.scrollTrigger);
        resets.push(function () {
          gsap.set(nextMedia, { clearProps: "all" });
        });
      }
    });

    return function cleanup() {
      triggers.forEach(function (trigger) {
        trigger.kill();
      });
      resets.forEach(function (reset) {
        reset();
      });
    };
  });

  /* ---------------------------------------------------------
     hero — 호버한 패널이 70%로 커지고(반대쪽 30%) 사진이 영상 재생으로 전환됩니다.
     768px 이상 + hover 가능한 입력장치 + 모션 감소 아닐 때만 동작합니다.
     (터치 기기에는 호버 개념이 없어 gsap.matchMedia가 (hover: hover)로 제외합니다.)

     폭 전환은 GSAP tween 대신 매 프레임 목표값을 향해 조금씩 따라가는
     lerp 방식입니다(common.js가 Lenis에 쓰는 lerp: 0.06과 같은 감각).
     이렇게 하면 마우스가 두 패널 경계 근처에서 빠르게 오갈 때도 tween이
     끊기고 새로 시작하며 튀는 대신, 목표가 바뀌는 순간에도 진행 중이던
     움직임 위에서 자연스럽게 방향만 바뀝니다 — "덜그럭거림"의 원인이었습니다.
     --------------------------------------------------------- */
  (function setupHeroHoverFill() {
    var hero = document.querySelector(".hero");
    var panels = hero ? Array.prototype.slice.call(hero.querySelectorAll(".hero_panel")) : [];

    if (!hero || panels.length !== 2) {
      return;
    }

    var panelA = panels[0];
    var panelB = panels[1];

    var EXPANDED_RATIO = 0.7;
    var NEUTRAL_RATIO = 0.5;
    var SMOOTH_LERP = 0.028;
    var SETTLE_THRESHOLD = 0.0008;
    var FADE_DURATION = 0.9;

    panels.forEach(function (panel) {
      var video = panel.querySelector(".hero_panel_video");
      if (video) {
        video.muted = true;
      }
    });

    gsap.matchMedia().add("(min-width: 768px) and (hover: hover) and (prefers-reduced-motion: no-preference)", function () {
      var activePanel = null;
      var targetRatio = NEUTRAL_RATIO;
      var currentRatio = NEUTRAL_RATIO;
      var isTicking = false;

      gsap.set([panelA, panelB], { width: "50%" });

      /* 사진/영상을 패널(창)이 아니라 hero 전체 폭의 EXPANDED_RATIO(70%)만큼 되는
         고정 크기로 두고, 패널의 overflow:hidden이 그중 일부만 보여주는 방식입니다.
         패널이 좁아졌다 넓어졌다 해도 사진 자체의 렌더 크기는 절대 바뀌지 않으므로
         object-fit: cover가 폭이 바뀔 때마다 다시 계산되며 사진이 "줄었다 늘었다"
         하는 것처럼 보이던 현상(왼쪽 bespoke.png가 거의 정사각형에 가까운 비율이라
         70% 근처에서 유독 두드러졌습니다)이 생기지 않습니다. 왼쪽은 왼쪽 끝(left:0),
         오른쪽은 오른쪽 끝(right:0)에 고정해 두어 창이 넓어질수록 반대쪽에서
         더 드러나는 방식이라 양쪽이 같은 방식으로 동작합니다. */
      function applyFixedMediaSize() {
        var maxWidth = hero.getBoundingClientRect().width * EXPANDED_RATIO;

        [
          { panel: panelA, edge: "left" },
          { panel: panelB, edge: "right" }
        ].forEach(function (entry) {
          ["hero_panel_img", "hero_panel_video"].forEach(function (className) {
            var el = entry.panel.querySelector("." + className);
            if (!el) {
              return;
            }
            var vars = { width: maxWidth, left: "auto", right: "auto" };
            vars[entry.edge] = 0;
            gsap.set(el, vars);
          });
        });
      }

      applyFixedMediaSize();
      window.addEventListener("resize", applyFixedMediaSize);

      function applyWidths() {
        panelA.style.width = (currentRatio * 100) + "%";
        panelB.style.width = ((1 - currentRatio) * 100) + "%";
      }

      function updateRatio() {
        currentRatio += (targetRatio - currentRatio) * SMOOTH_LERP;

        if (Math.abs(targetRatio - currentRatio) < SETTLE_THRESHOLD) {
          currentRatio = targetRatio;
          applyWidths();
          gsap.ticker.remove(updateRatio);
          isTicking = false;
          return;
        }

        applyWidths();
      }

      function ensureTicking() {
        if (!isTicking) {
          isTicking = true;
          gsap.ticker.add(updateRatio);
        }
      }

      function setPanelCrossfade(panel, isActive, hasActivePanel) {
        var img = panel.querySelector(".hero_panel_img");
        var video = panel.querySelector(".hero_panel_video");
        var body = panel.querySelector(".hero_panel_body");

        gsap.to(body, { opacity: hasActivePanel && !isActive ? 0 : 1, duration: FADE_DURATION, ease: "power2.out" });
        gsap.to(img, { opacity: isActive ? 0 : 0.9, duration: FADE_DURATION, ease: "power2.out" });

        if (!video) {
          return;
        }

        gsap.to(video, { opacity: isActive ? 1 : 0, duration: FADE_DURATION, ease: "power2.out" });

        if (isActive) {
          var playPromise = video.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {});
          }
        } else {
          video.pause();
          try {
            video.currentTime = 0;
          } catch (error) {
            /* 메타데이터 로딩 전이면 조용히 무시합니다 */
          }
        }
      }

      function applyActivePanel(nextActive) {
        if (nextActive === activePanel) {
          return;
        }
        activePanel = nextActive;
        targetRatio = !activePanel ? NEUTRAL_RATIO : (activePanel === panelA ? EXPANDED_RATIO : 1 - EXPANDED_RATIO);
        ensureTicking();

        panels.forEach(function (panel) {
          setPanelCrossfade(panel, panel === activePanel, activePanel !== null);
        });
      }

      function handleHeroPointerMove(event) {
        var rect = hero.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var half = x < rect.width / 2 ? panelA : panelB;
        applyActivePanel(half);
      }

      function handleHeroPointerLeave() {
        applyActivePanel(null);
      }

      hero.addEventListener("mousemove", handleHeroPointerMove);
      hero.addEventListener("mouseleave", handleHeroPointerLeave);

      return function cleanup() {
        hero.removeEventListener("mousemove", handleHeroPointerMove);
        hero.removeEventListener("mouseleave", handleHeroPointerLeave);
        window.removeEventListener("resize", applyFixedMediaSize);
        gsap.ticker.remove(updateRatio);
        activePanel = null;

        panels.forEach(function (panel) {
          var video = panel.querySelector(".hero_panel_video");
          var img = panel.querySelector(".hero_panel_img");
          gsap.set(panel, { clearProps: "width" });
          gsap.set(panel.querySelector(".hero_panel_body"), { clearProps: "opacity" });
          gsap.set(img, { clearProps: "width,left,right,opacity" });
          if (video) {
            gsap.set(video, { clearProps: "width,left,right,opacity" });
            video.pause();
            try {
              video.currentTime = 0;
            } catch (error) {
              /* 메타데이터 로딩 전이면 조용히 무시합니다 */
            }
          }
        });
      };
    });
  })();
})();
