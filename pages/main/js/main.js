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

  /* 페이지 안 이미지·웹폰트가 스크립트 실행 이후에 늦게 로드되면(특히 큰 사진들,
     Trirong/Montserrat 웹폰트 교체), 그 아래 섹션들의 실제 위치가 ScrollTrigger가
     처음 계산해 둔 값보다 밀려서 pin 시작 지점이 어긋나는 문제가 있었습니다
     (brand_word_pin이 실제보다 이른 스크롤 위치에서 고정되어 다른 섹션 위에
     겹쳐 보임). window의 load 이벤트는 웹폰트 교체를 기다려주지 않으므로
     document.fonts.ready까지 함께 기다렸다가 다시 계산해 이 오차를 없앱니다. */
  window.addEventListener("load", function () {
    ScrollTrigger.refresh();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      ScrollTrigger.refresh();
    });
  }

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

    video.pause();

    function seekToRestPose() {
      video.currentTime = video.duration * 0.9;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (video.readyState >= 1) {
        seekToRestPose();
      } else {
        video.addEventListener("loadedmetadata", seekToRestPose, { once: true });
      }
      return;
    }

    /* ★ 이 핀은 반드시 "동기적으로" 만들어야 합니다.
       원래는 video.duration을 알아야 해서 loadedmetadata를 기다린 뒤에
       만들었는데, 그러면 핀이 늦게 생기면서 pin-spacer(화면 높이 3배)가
       뒤늦게 문서에 끼어들어 아래 섹션들이 그만큼 밀립니다. 그때는 이미
       brand_word_pin의 트리거가 계산을 끝낸 뒤라 시작 지점이 화면 높이
       3배만큼 이르게 굳어버렸고, 그 결과 brand_story(배너) 위에 "TCHAI"가
       겹쳐 보였습니다. 영상이 캐시된 상태(readyState >= 1)에서는 동기적으로
       만들어져 버그가 안 보이는 탓에 재현이 들쭉날쭉했습니다.
       그래서 핀은 처음부터 만들고, duration이 필요한 재생 위치 계산만
       매 프레임 그때의 값으로 미룹니다. */
    var modelPlayhead = { progress: 0 };

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
      .to(
        modelPlayhead,
        {
          progress: 1,
          duration: 0.85,
          ease: "none",
          onUpdate: function () {
            /* 메타데이터가 아직 안 왔으면 duration이 NaN이라 건너뜁니다. */
            if (!video.duration) {
              return;
            }
            video.currentTime = video.duration * 0.9 * modelPlayhead.progress;
          }
        },
        0.15
      );
  })();

  gsap.matchMedia().add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", function () {
    var triggers = [];
    var resets = [];

    /* ---------------------------------------------------------
       브랜드 분기 — 두 이름이 중앙에서 나타난 뒤 좌우로 벌어지고,
       그 사이로 이미지 네 장이 서서히 드러납니다.
       --------------------------------------------------------- */
    (function setupBrandWordPin() {
      var pin = document.getElementById("brand_word_pin");
      if (!pin) {
        return;
      }

      var collageStep = pin.querySelector(".brand_collage");
      var cards = collageStep ? collageStep.querySelector(".brand_collage_cards") : null;
      var nameLeft = collageStep ? collageStep.querySelector(".brand_collage_name_left") : null;
      var nameRight = collageStep ? collageStep.querySelector(".brand_collage_name_right") : null;
      var hasCollageReveal = collageStep && cards && nameLeft && nameRight;
      var isDesktop = window.innerWidth >= 1280;

      var splitTextIntoLetters = function (element) {
        var text = element.textContent;
        var fragment = document.createDocumentFragment();

        element.setAttribute("aria-label", text);
        Array.prototype.forEach.call(text, function (character) {
          var letter = document.createElement("span");
          letter.className = "brand_collage_letter";
          letter.setAttribute("aria-hidden", "true");
          letter.textContent = character === " " ? "\u00a0" : character;
          fragment.appendChild(letter);
        });

        element.textContent = "";
        element.appendChild(fragment);
        return Array.prototype.slice.call(element.children);
      };

      var leftLetters = hasCollageReveal ? splitTextIntoLetters(nameLeft) : [];
      var rightLetters = hasCollageReveal ? splitTextIntoLetters(nameRight) : [];

      pin.classList.add("is_pinned");

      if (hasCollageReveal) {
        collageStep.classList.add("is_enhanced");
        gsap.set(collageStep, { opacity: 1, scale: 1 });
        gsap.set(cards, { opacity: 0, scale: 0.92 });
        gsap.set([nameLeft, nameRight], { opacity: 1, scale: 1.06 });
        gsap.set(leftLetters, {
          opacity: 0,
          xPercent: -25,
          yPercent: 100,
          scale: 2,
          skewX: 15,
          skewY: 30,
          filter: "blur(0.05em)",
          transformOrigin: "50% 100%"
        });
        gsap.set(rightLetters, {
          opacity: 0,
          xPercent: 25,
          yPercent: -100,
          scale: 2,
          skewX: 15,
          skewY: 30,
          filter: "blur(0.05em)",
          transformOrigin: "50% 0%"
        });
      }

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: "+=" + window.innerHeight * 3.2,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true
        }
      });

      if (hasCollageReveal) {
        var addLetterReveal = function (letters, seed) {
          letters.forEach(function (letter, index) {
            /* 레퍼런스처럼 글자 순서가 아니라 0~10 사이의 불규칙한 값으로 진입 시점을
               흩뜨립니다. Math.random() 대신 고정식이라 refresh 때 모양이 바뀌지 않습니다. */
            var randomOrder = (index * 7 + seed * 3 + index * index) % 11;
            tl.to(letter, {
              opacity: 1,
              xPercent: 0,
              yPercent: 0,
              scale: 1,
              skewX: 0,
              skewY: 0,
              filter: "blur(0em)",
              duration: 0.72,
              ease: "power3.out"
            }, randomOrder * 0.045);
          });
        };

        addLetterReveal(leftLetters, 2);
        addLetterReveal(rightLetters, 5);

        tl.to([nameLeft, nameRight], { scale: 1, duration: 0.9, ease: "power2.out" }, 0)
          .to(nameLeft, isDesktop ? { xPercent: -115, duration: 1.7, ease: "none" } : { y: -70, duration: 1.7, ease: "none" }, 0.78)
          .to(nameRight, isDesktop ? { xPercent: 58, duration: 1.7, ease: "none" } : { y: 70, duration: 1.7, ease: "none" }, 0.78)
          .to(cards, { opacity: 1, scale: 1, duration: 1.5, ease: "power1.out" }, 0.96)
          .to(collageStep, { opacity: 0, scale: 0.92, duration: 0.7, ease: "power1.in" }, 2.45);
      }

      triggers.push(tl.scrollTrigger);
      resets.push(function () {
        pin.classList.remove("is_pinned");
        if (hasCollageReveal) {
          collageStep.classList.remove("is_enhanced");
          gsap.set(collageStep, { clearProps: "scale,opacity" });
          gsap.set([cards, nameLeft, nameRight, leftLetters, rightLetters], { clearProps: "all" });
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
    var SMOOTH_LERP = 0.012;
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

/* =========================================================
   detail — 사진 위 돋보기 + 부위 설명

   이전에는 부위별로 미리 잘라 둔 확대컷 4장을 CSS의 :hover ~ 형제 선택자로
   각자 자리에 띄웠습니다. 지금은 돋보기 하나가 커서를 따라다니며 원본 사진을
   실시간으로 확대하고, collar/sleeve/body/skirt 영역을 지날 때 그 부위 설명이
   함께 나타납니다.

   ★ 배율의 상한은 에셋이 정합니다. img.png는 4380 × 1905인데 화면에는 1460px로
     그려지므로 원본이 정확히 3배입니다. DETAIL_LENS_ZOOM을 3보다 크게 올리면
     없는 픽셀을 늘리는 것이라 흐려집니다.

   ★ 이 블록은 GSAP을 쓰지 않으므로 위쪽 IIFE(GSAP이 없으면 통째로 return) 밖에
     있어야 합니다. 안에 넣으면 CDN이 막힌 환경에서 돋보기까지 같이 죽습니다.
   ========================================================= */
(function () {
  "use strict";

  /* 조절값 — 숫자만 바꾸면 됩니다 */
  var DETAIL_LENS_ZOOM = 2.5; /* 확대 배율. 3까지가 원본 해상도 안쪽입니다 */

  var stage = document.querySelector(".detail_stage");
  var lens = stage && stage.querySelector(".detail_lens");
  var image = stage && stage.querySelector(".detail_img");
  var texts = stage ? stage.querySelectorAll(".detail_text") : [];

  if (!stage || !lens || !image || !texts.length) {
    return;
  }

  /* 손가락으로는 "지나간다"는 동작이 없어 돋보기가 성립하지 않습니다.
     터치 기기에서는 아무것도 걸지 않고 기존 정적 레이아웃 그대로 둡니다. */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  var isBound = false;
  var frameId = 0;
  var pendingEvent = null;
  var activePart = "";

  /* 원본 경로는 마크업 한 곳(.detail_img)에만 두고 여기서 읽어옵니다 */
  function applyLensImage() {
    lens.style.backgroundImage = 'url("' + image.currentSrc + '")';
  }

  function clamp(value, min, max) {
    if (max < min) {
      return min;
    }
    return Math.min(Math.max(value, min), max);
  }

  /* 커서 밑에 어느 부위가 있는지 — elementFromPoint를 쓰면 겹친 영역의 우선순위가
     이전 :hover 방식과 정확히 같아집니다(위에 쌓인 것이 이깁니다).
     .detail_lens와 .detail_text는 pointer-events: none이라 잡히지 않습니다. */
  function findPart(clientX, clientY) {
    var target = document.elementFromPoint(clientX, clientY);
    var hotspot = target && target.closest ? target.closest(".detail_hotspot") : null;
    return hotspot ? hotspot.getAttribute("data-part") : "";
  }

  function setActivePart(part) {
    if (part === activePart) {
      return;
    }
    activePart = part;

    Array.prototype.forEach.call(texts, function (text) {
      text.classList.toggle("is_active", text.getAttribute("data-part") === part);
    });
  }

  function render() {
    frameId = 0;

    var event = pendingEvent;
    if (!event) {
      return;
    }

    var stageRect = stage.getBoundingClientRect();
    var lensRect = lens.getBoundingClientRect();

    var pointerX = event.clientX - stageRect.left;
    var pointerY = event.clientY - stageRect.top;

    /* 돋보기 중심을 커서에 맞춥니다. translate(-50%, -50%)는 CSS가 갖고 있습니다 */
    lens.style.left = pointerX + "px";
    lens.style.top = pointerY + "px";

    var zoomedWidth = stageRect.width * DETAIL_LENS_ZOOM;
    var zoomedHeight = stageRect.height * DETAIL_LENS_ZOOM;

    /* 확대된 사진에서 잘라 보여줄 위치. 가장자리에서 배경이 비지 않도록 가둡니다 —
       가두지 않으면 사진 밖 빈 영역이 돋보기 안에 초승달 모양으로 남습니다. */
    var backgroundX = clamp(
      pointerX * DETAIL_LENS_ZOOM - lensRect.width / 2,
      0,
      Math.max(0, zoomedWidth - lensRect.width)
    );
    var backgroundY = clamp(
      pointerY * DETAIL_LENS_ZOOM - lensRect.height / 2,
      0,
      Math.max(0, zoomedHeight - lensRect.height)
    );

    lens.style.backgroundSize = zoomedWidth + "px " + zoomedHeight + "px";
    lens.style.backgroundPosition = -backgroundX + "px " + -backgroundY + "px";

    setActivePart(findPart(event.clientX, event.clientY));
  }

  function handlePointerMove(event) {
    pendingEvent = event;
    if (!frameId) {
      frameId = window.requestAnimationFrame(render);
    }
  }

  function handlePointerEnter(event) {
    applyLensImage();
    stage.classList.add("is_lens_active");
    lens.classList.add("is_active");
    handlePointerMove(event);
  }

  function handlePointerLeave() {
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
    pendingEvent = null;
    stage.classList.remove("is_lens_active");
    lens.classList.remove("is_active");
    setActivePart("");
  }

  function bind() {
    if (isBound) {
      return;
    }
    isBound = true;
    stage.addEventListener("pointerenter", handlePointerEnter);
    stage.addEventListener("pointermove", handlePointerMove);
    stage.addEventListener("pointerleave", handlePointerLeave);
  }

  function unbind() {
    if (!isBound) {
      return;
    }
    isBound = false;
    stage.removeEventListener("pointerenter", handlePointerEnter);
    stage.removeEventListener("pointermove", handlePointerMove);
    stage.removeEventListener("pointerleave", handlePointerLeave);
    handlePointerLeave();
  }

  function syncPointerMode() {
    if (finePointer.matches) {
      bind();
    } else {
      unbind();
    }
  }

  syncPointerMode();

  /* 마우스를 꽂거나 뽑았을 때, 태블릿에서 키보드를 붙였을 때 다시 판정합니다 */
  if (typeof finePointer.addEventListener === "function") {
    finePointer.addEventListener("change", syncPointerMode);
  } else if (typeof finePointer.addListener === "function") {
    finePointer.addListener(syncPointerMode);
  }
})();
