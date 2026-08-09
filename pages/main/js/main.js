/* 스크롤 인터랙션 — model 영상 스크럽, brand_01~04 고정+텍스트 전환,
   brand_05/06 스크롤 리빌.
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

  /* 카드 덱 CTA — 현재 보이는 브랜드의 다음 섹션까지 Lenis로 부드럽게 이동합니다. */
  (function setupBrandStackAction() {
    var action = document.querySelector(".brand_stack_action");
    var bespokeTarget = document.getElementById("promo_bespoke_video");
    var readyTarget = document.getElementById("promo_shop_video");

    if (!action || !bespokeTarget || !readyTarget) {
      return;
    }

    function handleBrandStackActionClick(event) {
      var readyCopy = action.querySelector('[data-copy-variant="ready"]');
      var isReadyActive = readyCopy && parseFloat(getComputedStyle(readyCopy).opacity) > 0.5;
      var target = isReadyActive ? readyTarget : bespokeTarget;
      var isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      event.preventDefault();

      if (window.tchaikimmLenis && !isReducedMotion) {
        window.tchaikimmLenis.scrollTo(target, {
          duration: 2.4,
          easing: function (progress) {
            return Math.min(1, 1.001 - Math.pow(2, -8 * progress));
          }
        });
        return;
      }

      target.scrollIntoView({
        behavior: isReducedMotion ? "auto" : "smooth",
        block: "start"
      });
    }

    action.addEventListener("click", handleBrandStackActionClick);
  })();

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

    /* 스크롤 프레임마다 currentTime을 바로 바꾸면 이전 영상 탐색이 끝나기도 전에
       새 디코딩 요청이 계속 쌓여 섹션 진입 순간 스크롤까지 잠깐 멎습니다.
       가장 최근 재생 위치만 기억하고 seek가 끝난 뒤 다음 위치를 적용합니다. */
    var requestedVideoTime = 0;
    var appliedVideoTime = -1;
    var isVideoSeeking = false;
    var VIDEO_SEEK_THRESHOLD = 1 / 30;

    function applyRequestedVideoTime() {
      if (
        !video.duration ||
        isVideoSeeking ||
        Math.abs(requestedVideoTime - appliedVideoTime) < VIDEO_SEEK_THRESHOLD
      ) {
        return;
      }

      isVideoSeeking = true;
      appliedVideoTime = requestedVideoTime;
      video.currentTime = requestedVideoTime;
    }

    function requestVideoTime(time) {
      requestedVideoTime = time;
      applyRequestedVideoTime();
    }

    video.addEventListener("seeked", function () {
      isVideoSeeking = false;
      window.requestAnimationFrame(applyRequestedVideoTime);
    });

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
            requestVideoTime(video.duration * 0.9 * modelPlayhead.progress);
          }
        },
        0.15
      );
  })();

  gsap.matchMedia().add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", function () {
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
      var cardItems = cards ? Array.prototype.slice.call(cards.querySelectorAll(".brand_collage_card")) : [];
      var nameLeft = collageStep ? collageStep.querySelector(".brand_collage_name_left") : null;
      var nameRight = collageStep ? collageStep.querySelector(".brand_collage_name_right") : null;
      var stackCopy = collageStep ? collageStep.querySelector(".brand_stack_copy") : null;
      var stackAction = stackCopy ? stackCopy.querySelector(".brand_stack_action") : null;
      var stackCopyItems = stackCopy ? Array.prototype.slice.call(stackCopy.querySelectorAll("[data-copy-slot]")) : [];
      var stackCount = stackCopy ? stackCopy.querySelector(".brand_stack_count") : null;
      var stackCountItems = stackCount ? Array.prototype.slice.call(stackCount.querySelectorAll(".brand_stack_count_item")) : [];
      var stackTitleItems = stackCopy ? Array.prototype.slice.call(stackCopy.querySelectorAll(".brand_stack_title_item")) : [];
      var bespokeCopyItems = stackCopy ? Array.prototype.slice.call(stackCopy.querySelectorAll('[data-copy-variant="bespoke"]')) : [];
      var readyCopyItems = stackCopy ? Array.prototype.slice.call(stackCopy.querySelectorAll('[data-copy-variant="ready"]')) : [];
      var hasCollageReveal = collageStep && cards && nameLeft && nameRight;
      /* 카드 덱 애니메이션 자체가 1024px부터 실행되므로, 같은 구간에서는
         두 브랜드명도 실제 렌더링 폭을 기준으로 좌우 화면 밖까지 보냅니다. */
      var isDesktop = window.innerWidth >= 1024;
      var revealOrder = [1, 2, 0, 3];
      var viewportCenterX = window.innerWidth / 2;
      var cardNaturalCenterX = cardItems.map(function (card) {
        var cardBox = card.getBoundingClientRect();
        return cardBox.left + cardBox.width / 2;
      });
      var nameLeftBox = nameLeft ? nameLeft.getBoundingClientRect() : null;
      var nameRightBox = nameRight ? nameRight.getBoundingClientRect() : null;
      var nameLeftExitX = nameLeftBox ? -nameLeftBox.right - 40 : 0;
      var nameRightExitX = nameRightBox ? window.innerWidth - nameRightBox.left + 40 : 0;

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
        gsap.set(cards, { opacity: 1, scale: 1 });
        cardItems.forEach(function (card) {
          gsap.set(card, {
            y: window.innerHeight * 0.02,
            scale: 0.5,
            opacity: 0
          });
        });
        gsap.set([nameLeft, nameRight], { opacity: 1, scale: 1.06 });
        gsap.set(stackCopyItems, { opacity: 0, y: 18 });
        if (stackCountItems.length) {
          gsap.set(stackCountItems, { opacity: 1, yPercent: 100 });
          gsap.set(stackCountItems[0], { yPercent: 0 });
          gsap.set(stackCount, { "--ring_progress": "25%" });
        }
        if (stackTitleItems.length) {
          gsap.set(stackTitleItems, { opacity: 0, y: 12 });
          gsap.set(stackTitleItems[0], { opacity: 1, y: 0 });
        }
        gsap.set(bespokeCopyItems, { opacity: 1, y: 0 });
        gsap.set(readyCopyItems, { opacity: 0, y: 12 });
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
          end: "+=" + window.innerHeight * 10,
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

        tl.to([nameLeft, nameRight], { scale: 1, duration: 0.9, ease: "power2.out" }, 0);

        /* 사진은 각자의 가로 위치를 유지한 채 레퍼런스 순서인 2 → 3 → 1 → 4로
           하나씩 확대되며 다가옵니다. */
        revealOrder.forEach(function (cardIndex, orderIndex) {
          var card = cardItems[cardIndex];
          var cardStart = 0.88 + orderIndex * 0.2;

          /* 레퍼런스의 실제 수식:
             opacity = progress * 2, scale = .5 + progress / 2,
             translateY = 2vh - progress * 4vh. 회전과 개별 easing은 없습니다. */
          tl.to(card, { opacity: 1, duration: 0.4, ease: "none" }, cardStart)
            .to(card, {
              scale: 1,
              y: window.innerHeight * -0.02,
              duration: 0.8,
              ease: "none"
            }, cardStart);
        });

        /* 두 이름은 일부가 남지 않도록 실제 렌더링 폭을 기준으로 화면 밖까지 보냅니다. */
        tl.to(nameLeft, isDesktop ? { x: nameLeftExitX, duration: 1.15, ease: "none" } : { y: -70, duration: 1.15, ease: "none" }, 1.82)
          .to(nameRight, isDesktop ? { x: nameRightExitX, duration: 1.15, ease: "none" } : { y: 70, duration: 1.15, ease: "none" }, 1.82);

        /* 레퍼런스의 다음 장면: 가로 한 줄이 중앙 카드 덱으로 모입니다.
           세 번째 카드를 기준(order 0)으로 인접 카드는 7/8, 가장 먼 카드는 6/8,
           세로 간격은 12vh이며 전체 기본 배율은 2배입니다. */
        cardItems.forEach(function (card, index) {
          var sequenceOrder = index - 2;
          var stackScale = 2 * (1 - Math.abs(sequenceOrder) / 8);

          /* z-index는 보간하면 겹치는 도중 앞뒤 순서가 프레임마다 바뀌어 깜빡입니다.
             집결 직전에 한 번만 확정하고 transform만 애니메이션합니다. */
          tl.set(card, { zIndex: 20 - Math.abs(sequenceOrder) }, 3.14);
          tl.to(card, {
            x: viewportCenterX - cardNaturalCenterX[index],
            y: sequenceOrder * window.innerHeight * 0.12,
            scale: stackScale,
            force3D: true,
            duration: 1.25,
            ease: "power2.inOut"
          }, 3.15);
        });

        /* 주변 카피는 카드가 중앙 덱을 거의 완성한 뒤에만 순차적으로 나타납니다. */
        if (stackCopyItems.length) {
          tl.to(stackCopyItems, {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.06,
            ease: "power2.out"
          }, 4.02);
        }

        /* 첫 장(가운데 세 번째 카드)을 시작으로 네 장 전체가 한 칸씩 순환합니다.
           맨 위의 뒷장만 덱 뒤에서 아래 슬롯으로 돌아가고, 나머지 세 장은 동시에
           위 슬롯으로 이동해 낱장이 교체되는 대신 카드 덱 전체가 흐르도록 합니다. */
        var deckSlotOrders = [
          [1, -2, -1, 0],
          [0, 1, -2, -1],
          [-1, 0, 1, -2]
        ];
        var wrappingCardIndexes = [0, 1, 2];

        deckSlotOrders.forEach(function (slotOrders, stepIndex) {
          var phaseStart = 5.15 + stepIndex * 1.15;

          cardItems.forEach(function (card, cardIndex) {
            var targetOrder = slotOrders[cardIndex];
            var targetScale = 2 * (1 - Math.abs(targetOrder) / 8);
            var targetZIndex = 20 - Math.abs(targetOrder);
            var isWrappingCard = cardIndex === wrappingCardIndexes[stepIndex];

            if (isWrappingCard) {
              /* -2 슬롯에서 +1 슬롯으로 화면을 가로질러 내려오지 않도록,
                 덱 뒤에서 짧게 숨은 사이 아래쪽으로 위치를 넘깁니다. */
              tl.to(card, {
                y: window.innerHeight * -0.3,
                scale: 1.45,
                opacity: 0,
                duration: 0.42,
                ease: "sine.in"
              }, phaseStart)
                .set(card, {
                  y: window.innerHeight * 0.16,
                  scale: 1.65,
                  zIndex: targetZIndex
                }, phaseStart + 0.43)
                .to(card, {
                  y: targetOrder * window.innerHeight * 0.12,
                  scale: targetScale,
                  opacity: 1,
                  force3D: true,
                  duration: 0.47,
                  ease: "sine.out"
                }, phaseStart + 0.43);
              return;
            }

            tl.to(card, {
              y: targetOrder * window.innerHeight * 0.12,
              scale: targetScale,
              opacity: 1,
              force3D: true,
              duration: 0.9,
              ease: "sine.inOut"
            }, phaseStart)
              .set(card, { zIndex: targetZIndex }, phaseStart + 0.45);
          });

          if (stackCountItems.length === 4) {
            tl.to(stackCount, {
              "--ring_progress": ((stepIndex + 2) * 25) + "%",
              duration: 0.9,
              ease: "sine.inOut"
            }, phaseStart)
              .to(stackCountItems[stepIndex], {
                yPercent: -100,
                duration: 0.5,
                ease: "power2.inOut"
              }, phaseStart)
              .to(stackCountItems[stepIndex + 1], {
                yPercent: 0,
                duration: 0.5,
                ease: "power2.inOut"
              }, phaseStart)
              .set(stackCount, {
                attr: { "aria-label": "Card " + (stepIndex + 2) + " of 4" }
              }, phaseStart + 0.25);
          }

          /* 세 번째 카드부터는 두 번째 제목으로 한 번만 교체하고,
             네 번째 카드까지 같은 제목을 유지합니다. */
          if (stepIndex === 1 && stackTitleItems.length === 2) {
            tl.to(stackTitleItems[0], {
              opacity: 0,
              y: -12,
              duration: 0.3,
              ease: "power2.in"
            }, phaseStart)
              .to(stackTitleItems[1], {
                opacity: 1,
                y: 0,
                duration: 0.3,
                ease: "power2.out"
              }, phaseStart + 0.25);
          }

          /* 3/4부터 제목뿐 아니라 주변 설명도 Tchai Kim 카피로 함께 바뀝니다. */
          if (stepIndex === 1 && bespokeCopyItems.length && readyCopyItems.length) {
            tl.to(bespokeCopyItems, {
              opacity: 0,
              y: -12,
              duration: 0.3,
              ease: "power2.in"
            }, phaseStart)
              .to(readyCopyItems, {
                opacity: 1,
                y: 0,
                duration: 0.3,
                stagger: 0.03,
                ease: "power2.out"
              }, phaseStart + 0.25);

            if (stackAction) {
              tl.set(stackAction, {
                attr: {
                  href: "#promo_shop_video",
                  "aria-label": "Discover Tchai Kim"
                }
              }, phaseStart + 0.25);
            }
          }
        });
      }

      triggers.push(tl.scrollTrigger);
      resets.push(function () {
        pin.classList.remove("is_pinned");
        if (hasCollageReveal) {
          collageStep.classList.remove("is_enhanced");
          gsap.set(collageStep, { clearProps: "scale,opacity" });
          gsap.set([cards, cardItems, nameLeft, nameRight, leftLetters, rightLetters, stackCopyItems, stackCountItems, stackTitleItems, bespokeCopyItems, readyCopyItems], { clearProps: "all" });
        }
      });
    })();

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
    var HERO_HOVER_MEDIA = "(min-width: 768px) and (hover: hover) and (prefers-reduced-motion: no-preference)";
    var canUseHoverVideo = window.matchMedia(HERO_HOVER_MEDIA).matches;

    panels.forEach(function (panel) {
      var video = panel.querySelector(".hero_panel_video");
      if (video) {
        video.muted = true;

        /* 히어로 영상은 두 파일을 합쳐 약 1.9MB입니다. 호버 가능한 화면에서는
           첫 호버 전에 받아 두고, 모바일에서는 쓰지 않는 영상을 내려받지 않습니다. */
        if (canUseHoverVideo) {
          video.preload = "auto";
          video.load();
        }
      }
    });

    gsap.matchMedia().add(HERO_HOVER_MEDIA, function () {
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

        if (!video) {
          gsap.to(img, { opacity: isActive ? 0 : 0.9, duration: FADE_DURATION, ease: "power2.out" });
          return;
        }

        if (isActive) {
          function revealVideo() {
            /* 영상을 기다리는 사이 다른 패널로 이동했다면 뒤늦게 나타내지 않습니다. */
            if (activePanel !== panel) {
              return;
            }

            gsap.to(img, { opacity: 0, duration: FADE_DURATION, ease: "power2.out" });
            gsap.to(video, { opacity: 1, duration: FADE_DURATION, ease: "power2.out" });
          }

          if (video.readyState >= 3) {
            revealVideo();
          } else {
            /* 준비 전에는 기존 사진을 유지해 빈 영상 프레임이 드러나지 않게 합니다. */
            gsap.to(img, { opacity: 0.9, duration: FADE_DURATION, ease: "power2.out" });
            gsap.set(video, { opacity: 0 });
            video.addEventListener("canplay", revealVideo, { once: true });
          }

          var playPromise = video.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {});
          }
        } else {
          gsap.to(img, { opacity: 0.9, duration: FADE_DURATION, ease: "power2.out" });
          gsap.to(video, { opacity: 0, duration: FADE_DURATION, ease: "power2.out" });
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

/* =========================================================
   collection — 중앙 뒤에서 좌우 앞으로 흐르는 무한 반복
   ========================================================= */
(function () {
  "use strict";

  var CARD_INTERVAL = 620;
  var MAX_VISIBLE_CARDS = 9;
  var CARD_INTRO_DELAY = 850;
  var RIGHT_STREAM_OFFSET = 0.5;
  /* 배열을 한 번 섞은 뒤 홀수·짝수 위치를 좌우로 나눕니다.
     같은 이미지를 복제하지 않아 한 화면 안에서 중복되어 보이지 않습니다. */
  var STREAM_ORDER = [0, 7, 4, 3, 8, 11, 2, 1, 10, 9, 6, 5];

  var row = document.querySelector(".collection_row");
  if (!row) {
    return;
  }

  var sourceItems = Array.prototype.slice.call(row.querySelectorAll(".collection_item"));
  if (sourceItems.length < 2) {
    return;
  }

  /* 모션 감소 설정이면 시안의 가로 나열을 그대로 둡니다 */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var orderedItems = STREAM_ORDER.filter(function (index) {
    return index < sourceItems.length;
  }).map(function (index) {
    return sourceItems[index];
  });

  sourceItems.forEach(function (element) {
    if (!orderedItems.includes(element)) {
      orderedItems.push(element);
    }
  });

  var leftItems = [];
  var rightItems = [];

  orderedItems.forEach(function (element, index) {
    if (index % 2 === 0) {
      leftItems.push(element);
    } else {
      rightItems.push(element);
    }
  });

  row.classList.add("is_perspective_ready");
  sourceItems.forEach(function (element) {
    element.style.opacity = "0";
  });

  var frameId = null;
  var startTime = null;
  var pausedAt = null;
  var isInView = false;
  var hasStarted = false;

  function setCardPosition(element, progress, direction) {
    /* x는 일정하게 이동하고 깊이만 smoothstep으로 변화시켜
       뒤에서 앞으로 부드럽게 다가오는 원근감을 만듭니다. */
    var depthProgress = progress * progress * (3 - 2 * progress);
    var travel = window.innerWidth * 0.48;
    var x = direction * travel * progress;
    var z = -480 + depthProgress * 840;
    var scale = 0.5 + depthProgress * 0.62;
    var rotateY = direction * (14 - depthProgress * 9);
    var opacity = Math.min(progress / 0.025, (1 - progress) / 0.14, 1);

    element.style.zIndex = String(Math.round(progress * 100));
    element.style.opacity = String(Math.max(0, opacity));
    element.style.transform = "translate3d(calc(-50% + " + x.toFixed(2) + "px), -50%, " + z.toFixed(2) + "px) rotateY(" + rotateY.toFixed(2) + "deg) scale(" + scale.toFixed(4) + ")";
  }

  function renderStreamCard(element, index, phase, direction, streamLength) {
    var age = phase - index;

    /* 아직 발사 시간이 오지 않은 카드는 검정 프레임 뒤에 대기합니다 */
    if (age < 0) {
      element.style.opacity = "0";
      return;
    }

    var visibleCardCount = Math.min(MAX_VISIBLE_CARDS, streamLength);
    var position = age % streamLength;
    if (position >= visibleCardCount) {
      element.style.opacity = "0";
      return;
    }

    setCardPosition(element, position / visibleCardCount, direction);
  }

  function render(time) {
    var elapsed = time - startTime;
    var phase = (elapsed - CARD_INTRO_DELAY) / CARD_INTERVAL;

    leftItems.forEach(function (element, index) {
      renderStreamCard(element, index, phase, -1, leftItems.length);
    });
    rightItems.forEach(function (element, index) {
      renderStreamCard(element, index, phase - RIGHT_STREAM_OFFSET, 1, rightItems.length);
    });

    if (isInView && !document.hidden) {
      frameId = window.requestAnimationFrame(render);
    }
  }

  function syncPlayState() {
    if (isInView && hasStarted && !document.hidden) {
      if (pausedAt !== null) {
        startTime += performance.now() - pausedAt;
        pausedAt = null;
      }

      if (frameId === null) {
        frameId = window.requestAnimationFrame(render);
      }
    } else if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
      pausedAt = performance.now();
    }
  }

  /* 화면 밖이거나 다른 탭에 가 있으면 돌리지 않습니다 */
  if (typeof window.IntersectionObserver === "function") {
    new window.IntersectionObserver(function (entries) {
      isInView = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.15;

      if (isInView && !hasStarted) {
        hasStarted = true;
        startTime = performance.now();
        row.classList.add("is_loop_active");
      }

      syncPlayState();
    }, { threshold: [0, 0.15] }).observe(row);
  } else {
    isInView = true;
    hasStarted = true;
    startTime = performance.now();
    row.classList.add("is_loop_active");
    syncPlayState();
  }

  document.addEventListener("visibilitychange", syncPlayState);
})();


/* =========================================================
   intro (scroll) — 두루마기 영상을 스크롤로 스크럽

   원래 pages/brand/js/brand.js에 있던 것을 메인 인트로로 옮겼습니다
   (brand에서는 빠졌습니다). 이 페이지의 첫 섹션이라 pin이 스크롤 0에서
   바로 시작합니다 — brand에서는 바로 앞 heritage도 pin 섹션이라 두 pin이
   붙는 문제가 있었는데, 여기서는 앞에 아무것도 없어 그 문제가 없습니다.

   ★ GSAP·ScrollTrigger가 필요합니다. 위쪽 GSAP IIFE와 별개로 두어
     한쪽이 실패해도 서로 영향을 주지 않게 했습니다.
   ========================================================= */
(function () {
  "use strict";

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
     보였습니다.

     (brand 페이지에 있을 때는 바로 앞 heritage도 핀 섹션이라 두 핀이 곧바로
     이어지는 게 진입을 무겁게 만드는 원인이었습니다. 메인에서는 이 섹션이
     맨 앞이라 앞에 아무것도 없어 그 문제가 없습니다. anticipatePin은
     그대로 두었습니다.) */
  var SCROLL_LEAD_RATIO = 0;
  var SCROLL_SETTLE_RATIO = 0.9;

  /* scroll 섹션 — 두루마기 영상을 스크롤로 스크럽합니다. 위 SCROLL_* 상수
     설명을 먼저 보세요.

     ★ assets/main/intro/intro.mp4는 매 프레임이 키프레임입니다(ffmpeg -g 1로
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

  /* 인트로가 화면 맨 위를 덮고 있는 동안 body에 is_intro_active를 붙입니다.
     헤더를 감추는 건 main.css의 `body.is_intro_active .header` 규칙입니다.

     ★ initScrollVideo() 안에 넣으면 안 됩니다. 그 함수는 GSAP·ScrollTrigger가
       없으면 통째로 return하고, 스크럽 자체도 gsap.matchMedia()로 1280px
       이상에서만 켜집니다. 헤더 숨김은 1280px 미만과 모션 감소 설정에서도
       동작해야 하므로 밖에 둡니다.

     ★ 공통 .header.is_hidden을 쓰지 않는 이유는 main.css의 주석을 보세요.
       common.js가 스크롤 0 부근에서 그 클래스를 매 프레임 떼어냅니다. */
  var introHeaderTicking = false;

  function syncIntroHeader() {
    var section = document.querySelector(".scroll");

    introHeaderTicking = false;

    if (!section) {
      return;
    }

    /* 인트로는 첫 섹션이라 스크롤 0에서 top이 정확히 0입니다(1px 여유).
       pin 구간에서는 섹션이 top 0에 고정돼 있어 그동안 계속 참이고,
       pin이 없는 좁은 화면에서도 섹션이 위로 지나가면 bottom이 0 이하가
       되어 꺼집니다. */
    var rect = section.getBoundingClientRect();
    var isIntroCoveringTop = rect.top <= 1 && rect.bottom > 0;

    document.body.classList.toggle("is_intro_active", isIntroCoveringTop);
  }

  /* common.js의 handleHeaderScroll()과 같은 방식으로 프레임당 한 번만 잽니다 */
  function handleIntroHeaderScroll() {
    if (introHeaderTicking) {
      return;
    }

    introHeaderTicking = true;
    window.requestAnimationFrame(syncIntroHeader);
  }

  window.addEventListener("scroll", handleIntroHeaderScroll, { passive: true });
  window.addEventListener("resize", handleIntroHeaderScroll);

  function initIntro() {
    initScrollVideo();
    syncIntroHeader();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initIntro);
  } else {
    initIntro();
  }
})();
