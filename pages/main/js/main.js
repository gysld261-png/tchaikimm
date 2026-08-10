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
    var figure = section ? section.querySelector(".model_figure") : null;
    var text = section ? section.querySelector(".model_text") : null;
    var detailHead = document.querySelector(".detail_head.common_container");

    /* 태블릿·모바일 고정형 구간 길이입니다.
       데스크탑 길이는 main.css의 --model_flow_height에서 조절합니다. */
    var MODEL_SCROLL_LENGTH_TABLET = 3.8;
    var MODEL_SCROLL_LENGTH_MOBILE = 2.8;
    /* ★ 모델 좌우 이동 폭 조절 위치
       현재 화면 너비에 곱하는 비율입니다. 데스크탑 0.22는 화면 너비의 22%입니다. */
    var MODEL_TRAVEL_DESKTOP = 0.22;
    var MODEL_TRAVEL_TABLET = 0.16;
    var MODEL_TRAVEL_MOBILE = 0.1;
    var MODEL_TEXT_HOLD_RATIO = 0.2;
    var MODEL_TEXT_FADE_RATIO = 0.12;
    var MODEL_VIDEO_START_RATIO = 0.08;
    /* ★ 데스크탑 모델 스크롤 감도 조절 위치
       값을 키우면 스크롤을 놓은 뒤에도 더 천천히 따라와 묵직해집니다.
       권장 범위: 0.8 ~ 1.5 / 현재 1.3
       전체 도착 거리는 main.css의 --model_flow_height에서 조절합니다. */
    var MODEL_DESKTOP_SCRUB = 1.5;
    /* ★ 마지막 모델과 detail_head 사이 간격(px)입니다.
       숫자를 줄이면 모델이 detail 제목에 더 가까워집니다. */
    var MODEL_DETAIL_HEAD_GAP = 32;

    if (!section || !video || !figure || !text) {
      return;
    }

    function getModelScrollLength() {
      if (window.innerWidth >= 768) {
        return MODEL_SCROLL_LENGTH_TABLET;
      }

      return MODEL_SCROLL_LENGTH_MOBILE;
    }

    function getModelTravelDistance() {
      var travelRatio = MODEL_TRAVEL_MOBILE;

      if (window.innerWidth >= 1280) {
        travelRatio = MODEL_TRAVEL_DESKTOP;
      } else if (window.innerWidth >= 768) {
        travelRatio = MODEL_TRAVEL_TABLET;
      }

      return document.documentElement.clientWidth * travelRatio;
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
    section.classList.add("is_scroll_ready");
    var isDesktopModelFlow = window.matchMedia("(min-width: 1280px)").matches;
    var modelPlayhead = { progress: 0 };
    var modelMotion = { progress: 0 };
    var desktopSectionTravel = 0;
    var desktopEndDrift = 0;

    if (isDesktopModelFlow) {
      section.classList.add("is_model_flow");
    }

    function measureDesktopModelMotion() {
      var sectionRect = section.getBoundingClientRect();
      var figureRect = figure.getBoundingClientRect();
      var figureBaseTop = parseFloat(window.getComputedStyle(figure).top) || 0;

      desktopSectionTravel = Math.max(0, sectionRect.height - window.innerHeight);

      if (!detailHead) {
        desktopEndDrift = window.innerHeight * 0.32;
        return;
      }

      var sectionBottom = window.scrollY + sectionRect.top + sectionRect.height;
      var detailHeadTop = window.scrollY + detailHead.getBoundingClientRect().top;
      var detailHeadTopAtSectionEnd = window.innerHeight + detailHeadTop - sectionBottom;

      desktopEndDrift = Math.max(
        0,
        detailHeadTopAtSectionEnd - MODEL_DETAIL_HEAD_GAP - figureRect.height - figureBaseTop
      );
    }

    if (isDesktopModelFlow) {
      measureDesktopModelMotion();
    }

    function applyDesktopModelMotion() {
      var progress = modelMotion.progress;
      var horizontalWave = Math.sin(progress * Math.PI * 3);
      var horizontalPosition = -horizontalWave * getModelTravelDistance();

      gsap.set(figure, {
        x: horizontalPosition,
        y: desktopSectionTravel * progress + desktopEndDrift * progress
      });
    }

    var timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: function () {
          if (isDesktopModelFlow) {
            return "bottom bottom";
          }

          return "+=" + window.innerHeight * getModelScrollLength();
        },
        pin: !isDesktopModelFlow,
        scrub: isDesktopModelFlow ? MODEL_DESKTOP_SCRUB : 0.35,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
        onRefresh: function () {
          if (isDesktopModelFlow) {
            measureDesktopModelMotion();
          }
        }
      }
    });

    timeline
      .to(
        text,
        { autoAlpha: 0, y: -20, duration: MODEL_TEXT_FADE_RATIO, ease: "none" },
        MODEL_TEXT_HOLD_RATIO
      );

    if (isDesktopModelFlow) {
      /* 여러 트윈을 꺾어 붙이지 않고 하나의 연속 사인 곡선으로 좌우 위치를 계산합니다.
         y는 실제 섹션 길이를 따라 내려가고 마지막에 화면 아래쪽으로 조금 더 이동합니다. */
      timeline.to(
        modelMotion,
        {
          progress: 1,
          duration: 1,
          ease: "none",
          onUpdate: applyDesktopModelMotion
        },
        0
      );
    } else {
      /* 태블릿·모바일은 직전의 고정형 좌우 이동을 그대로 유지합니다. */
      timeline
        .to(
          figure,
          { x: function () { return -getModelTravelDistance(); }, duration: 0.22, ease: "sine.inOut" },
          0.08
        )
        .to(
          figure,
          { x: function () { return getModelTravelDistance(); }, duration: 0.3, ease: "sine.inOut" },
          0.3
        )
        .to(
          figure,
          { x: function () { return -getModelTravelDistance() * 0.55; }, duration: 0.2, ease: "sine.inOut" },
          0.6
        )
        .to(
          figure,
          { x: 0, duration: 0.2, ease: "sine.inOut" },
          0.8
        );
    }

    timeline.to(
        modelPlayhead,
        {
          progress: 1,
          duration: 1 - MODEL_VIDEO_START_RATIO,
          ease: "none",
          onUpdate: function () {
            /* 메타데이터가 아직 안 왔으면 duration이 NaN이라 건너뜁니다. */
            if (!video.duration) {
              return;
            }
            requestVideoTime(video.duration * 0.9 * modelPlayhead.progress);
          }
        },
        MODEL_VIDEO_START_RATIO
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
        /* ★ 여기에 filter: blur()를 넣지 마세요. 글자 17개가 각각 blur를 스크롤에
           맞춰 애니메이션하면 매 프레임 글자마다 다시 그려져 이 섹션부터 눈에 띄게
           버벅입니다. 지금은 transform(scale·skew·이동)과 opacity만 씁니다 —
           둘 다 GPU 합성으로 끝나 페인트가 발생하지 않습니다.
           blur 느낌을 되살리고 싶다면 글자마다가 아니라 nameLeft/nameRight
           두 요소에만 걸어야 합니다(레이어 17개 → 2개). */
        gsap.set(leftLetters, {
          opacity: 0,
          xPercent: -25,
          yPercent: 100,
          scale: 2,
          skewX: 15,
          skewY: 30,
          transformOrigin: "50% 100%"
        });
        gsap.set(rightLetters, {
          opacity: 0,
          xPercent: 25,
          yPercent: -100,
          scale: 2,
          skewX: 15,
          skewY: 30,
          transformOrigin: "50% 0%"
        });
      }

      /* ★ 카드 사진을 "드러나기 전에" 미리 디코딩해 둡니다.
         사진은 loading="lazy"라 브라우저가 알아서 늦게 받는데, 그러면 디코딩이
         카드가 나타나는 바로 그 프레임에 겹쳐 스크롤이 멈칫합니다.
         고정 구간에 들어오는 순간(카드가 보이기 화면 여러 개 전)에 decode()를 불러
         그 비용을 미리 치릅니다. decode()는 실패해도 무시하면 되므로 catch만 답니다. */
      var warmDecodedCards = false;

      function warmDecodeCards() {
        if (warmDecodedCards || !cardItems.length) {
          return;
        }
        warmDecodedCards = true;

        cardItems.forEach(function (card) {
          var img = card.querySelector("img");

          if (img && typeof img.decode === "function") {
            img.decode().catch(function () {});
          }
        });
      }

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: "+=" + window.innerHeight * 10,
          pin: true,
          scrub: 1,
          onEnter: warmDecodeCards,
          onEnterBack: warmDecodeCards,
          /* ★ 이 핀은 페이지에서 제일 아래에 있으므로 **가장 나중에** 계산돼야 합니다.
             ScrollTrigger는 기본적으로 "만들어진 순서"대로 다시 계산하는데, detail의
             핀은 이 파일 아래쪽 별도 IIFE에서 나중에 만들어집니다. 그대로 두면 이
             트리거가 detail의 pin-spacer(화면 높이 3.4배)가 생기기 전의 위치로
             굳어서, detail 스크롤이 끝나기도 전에 여기가 고정되며 detail 위로
             겹쳐 올라옵니다(실제로 겪음 — 시작 지점 6307 vs detail 끝 8129).
             음수 우선순위를 주면 다른 핀들이 자리를 다 잡은 뒤에 계산합니다.
             위 model 핀과 같은 종류의 문제이며, 그 사연은 이 파일 위쪽 주석에 있습니다. */
          refreshPriority: -1,
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
     lerp 방식입니다.
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
    /* ★ 패널이 사르륵 넓어지는 속도입니다. 숫자가 클수록 빠릅니다.
       예전 0.012는 수초 동안 뒤늦게 쫓아왔고, 0.14는 너무 즉각적이었습니다.
       0.045는 의도한 패널로 약 1.5초 동안 부드럽게 따라가는 중간값입니다.
       화면 밖에서 멋대로 움직이는 문제는 아래 노출 감시가 별도로 막습니다. */
    var SMOOTH_LERP = 0.03;
    var SETTLE_THRESHOLD = 0.0008;
    var FADE_DURATION = 0.75;
    var ACTIVATION_MOVEMENT_PX = 18;
    var CENTER_DEAD_ZONE_RATIO = 0.08;
    var MIN_VISIBLE_RATIO = 0.65;
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
      var pointerEntryX = 0;
      var pointerEntryY = 0;
      var hasIntentionalPointerMove = false;
      var heroVisibilityObserver = null;

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
          var isActive = panel === activePanel;
          var isDimmed = activePanel !== null && !isActive;

          panel.classList.toggle("is_active", isActive);
          panel.classList.toggle("is_dimmed", isDimmed);
          setPanelCrossfade(panel, isActive, activePanel !== null);
        });
      }

      function isHeroMostlyVisible(rect) {
        var visibleHeight = Math.max(
          0,
          Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)
        );
        var visibleBase = Math.min(rect.height, window.innerHeight);

        return visibleBase > 0 && visibleHeight / visibleBase >= MIN_VISIBLE_RATIO;
      }

      function handleHeroPointerEnter(event) {
        /* 페이지가 열리거나 스크롤되어 히어로가 정지한 포인터 밑으로 들어오는
           것만으로는 반응하지 않습니다. 히어로 안에서 실제 이동이 있어야 합니다. */
        pointerEntryX = event.clientX;
        pointerEntryY = event.clientY;
        hasIntentionalPointerMove = false;
      }

      function handleHeroPointerMove(event) {
        var rect = hero.getBoundingClientRect();
        var movedDistance = Math.hypot(
          event.clientX - pointerEntryX,
          event.clientY - pointerEntryY
        );

        /* 제목·설명·CTA는 읽고 클릭하는 고정 UI 영역입니다. 이 안에서 마우스를
           움직이는 것은 패널 탐색 의도가 아니므로 폭·영상 전환을 건드리지 않습니다.
           본문을 빠져나간 뒤에는 다시 18px 이상 움직여야 패널 호버가 시작됩니다. */
        if (event.target.closest(".hero_panel_body")) {
          pointerEntryX = event.clientX;
          pointerEntryY = event.clientY;
          hasIntentionalPointerMove = false;
          return;
        }

        if (!isHeroMostlyVisible(rect)) {
          applyActivePanel(null);
          return;
        }

        if (!hasIntentionalPointerMove) {
          if (movedDistance < ACTIVATION_MOVEMENT_PX) {
            return;
          }
          hasIntentionalPointerMove = true;
        }

        var xRatio = (event.clientX - rect.left) / rect.width;
        var leftBoundary = 0.5 - CENTER_DEAD_ZONE_RATIO;
        var rightBoundary = 0.5 + CENTER_DEAD_ZONE_RATIO;

        if (xRatio < leftBoundary) {
          applyActivePanel(panelA);
        } else if (xRatio > rightBoundary) {
          applyActivePanel(panelB);
        } else {
          /* 중앙 16%에서는 어느 쪽도 쫓아오지 않고 50:50으로 돌아갑니다. */
          applyActivePanel(null);
        }
      }

      function handleHeroPointerLeave() {
        hasIntentionalPointerMove = false;
        applyActivePanel(null);
      }

      function handleDocumentVisibilityChange() {
        if (document.hidden) {
          handleHeroPointerLeave();
        }
      }

      /* 스크롤로 히어로가 정지한 포인터 아래에서 빠져나갈 때 브라우저가
         pointerleave를 보내지 않는 경우가 있습니다. 노출 비율을 별도로 감시해
         화면의 65% 아래로 내려가는 즉시 마지막 활성 패널을 해제합니다. */
      if (typeof window.IntersectionObserver === "function") {
        heroVisibilityObserver = new window.IntersectionObserver(function (entries) {
          if (entries[0].intersectionRatio < MIN_VISIBLE_RATIO) {
            handleHeroPointerLeave();
          }
        }, { threshold: [0, MIN_VISIBLE_RATIO, 1] });
        heroVisibilityObserver.observe(hero);
      }

      hero.addEventListener("pointerenter", handleHeroPointerEnter);
      hero.addEventListener("pointermove", handleHeroPointerMove);
      hero.addEventListener("pointerleave", handleHeroPointerLeave);
      window.addEventListener("blur", handleHeroPointerLeave);
      document.addEventListener("visibilitychange", handleDocumentVisibilityChange);

      return function cleanup() {
        hero.removeEventListener("pointerenter", handleHeroPointerEnter);
        hero.removeEventListener("pointermove", handleHeroPointerMove);
        hero.removeEventListener("pointerleave", handleHeroPointerLeave);
        window.removeEventListener("blur", handleHeroPointerLeave);
        document.removeEventListener("visibilitychange", handleDocumentVisibilityChange);
        window.removeEventListener("resize", applyFixedMediaSize);
        if (heroVisibilityObserver) {
          heroVisibilityObserver.disconnect();
        }
        gsap.ticker.remove(updateRatio);
        activePanel = null;

        panels.forEach(function (panel) {
          var video = panel.querySelector(".hero_panel_video");
          var img = panel.querySelector(".hero_panel_img");
          panel.classList.remove("is_active", "is_dimmed");
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
   detail — 스크롤에 따라 돋보기가 부위를 훑는 연출

   기본 동작은 사진 아래 버튼 4개로 부위를 고르는 것입니다(GSAP이 없어도, 모션을
   줄이는 설정이어도, 좁은 화면이어도 이 방식). 조건이 맞을 때만 .detail에
   .is_scroll_ready를 붙여 스크롤 연출로 바꿉니다 — 섹션이 화면에 고정된 채
   스크롤에 따라 돋보기가 Collar → Sleeve → Body → Skirt를 차례로 훑고,
   그 자리에 설명이 하나씩 나타납니다.

   ★ 마우스 호버는 쓰지 않습니다. 예전에는 커서를 따라다니는 돋보기였는데,
     올려보기 전에는 인터랙션이 있는지 알 수 없고 손가락으로는 "지나간다"가 없어
     터치 기기에서 아예 성립하지 않았습니다. 스크롤은 두 환경에서 동일합니다.

   ★ 이 블록은 위쪽 GSAP IIFE(GSAP이 없으면 통째로 return) 밖에 있어야 합니다.
     버튼 방식은 GSAP 없이도 동작해야 하기 때문입니다.

   ★ 배율의 상한은 에셋이 정합니다. img.png는 4380 × 1905인데 화면에는 1460px로
     그려지므로 원본이 정확히 3배입니다. DETAIL_LENS_ZOOM을 3보다 크게 올리면
     없는 픽셀을 늘리는 것이라 흐려집니다.
   ========================================================= */
(function () {
  "use strict";

  /* 조절값 — 숫자만 바꾸면 됩니다 */
  var DETAIL_LENS_ZOOM = 2.5; /* 확대 배율. 3까지가 원본 해상도 안쪽입니다 */
  var DETAIL_PART_ORDER = ["collar", "sleeve", "body", "skirt"]; /* 훑는 순서 */
  /* ★ 부위 사이를 옮겨가는 속도는 아래 두 값의 곱이 정합니다.
       이동 거리 = DETAIL_SCROLL_PER_PART × (1 − DETAIL_HOLD_RATIO) × 화면 높이
     "너무 빨리 휙 바뀐다"면 PER_PART를 올리거나 HOLD_RATIO를 낮추면 됩니다.
     - PER_PART를 올리면: 머무는 시간과 이동이 함께 길어집니다(섹션 전체가 길어짐)
     - HOLD_RATIO를 낮추면: 섹션 길이는 그대로 두고 이동에만 더 배분합니다
                            (대신 설명을 읽는 구간이 짧아집니다) */
  var DETAIL_SCROLL_PER_PART = 115; /* 부위 하나에 쓰는 스크롤 길이(화면 높이 %) */
  /* 한 부위 구간에서 앞의 이만큼은 머무르고, 나머지에서 다음 부위로 옮겨갑니다.
     올리면 설명을 읽는 시간이 길어지고 이동이 빨라집니다(0 ~ 1). */
  var DETAIL_HOLD_RATIO = 0.45;
  /* 스크롤 연출을 켜는 조건. 좁은 화면에서는 사진 위에 겹치는 설명이 들어갈
     자리가 없어 버튼 방식을 그대로 씁니다. */
  var DETAIL_SCROLL_MEDIA = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

  var section = document.querySelector(".detail");
  var pin = section && section.querySelector(".detail_pin");
  var stage = section && section.querySelector(".detail_stage");
  var lens = stage && stage.querySelector(".detail_lens");
  var lensImage = lens && lens.querySelector(".detail_lens_base");
  var lensCrops = lens ? lens.querySelectorAll(".detail_lens_crop") : [];
  var image = stage && stage.querySelector(".detail_img");
  var texts = stage ? stage.querySelectorAll(".detail_text") : [];
  var markers = stage ? stage.querySelectorAll(".detail_marker") : [];
  var tabs = stage ? stage.querySelectorAll(".detail_part_tab") : [];
  var keywordList = section ? section.querySelector(".detail_keywords") : null;
  var keywords = section ? section.querySelectorAll("[data-detail-keyword]") : [];

  if (!section || !pin || !stage || !lens || !image || !texts.length) {
    return;
  }

  var activePart = "";

  function markLensCropReady(crop) {
    crop.classList.add("is_ready");
    setLensSource(activePart);
  }

  /* src를 스크롤 도중 바꾸지 않고 확대컷 네 장을 처음부터 겹쳐 둡니다. 각 이미지가
     실제로 디코딩된 뒤에만 페이드 인하므로 네트워크가 느려도 흰 화면이 끼지 않고,
     준비 전에는 아래의 큰 원본 확대 화면이 그대로 보입니다. */
  Array.prototype.forEach.call(lensCrops, function (crop) {
    function handleCropLoad() {
      if (typeof crop.decode === "function") {
        crop.decode().then(
          function () {
            markLensCropReady(crop);
          },
          function () {
            markLensCropReady(crop);
          }
        );
        return;
      }

      markLensCropReady(crop);
    }

    if (crop.complete && crop.naturalWidth > 0) {
      handleCropLoad();
    } else {
      crop.addEventListener("load", handleCropLoad, { once: true });
    }
  });

  function setLensSource(part) {
    var hasActiveCrop = false;

    Array.prototype.forEach.call(lensCrops, function (crop) {
      var isActive =
        crop.classList.contains("is_ready") && crop.getAttribute("data-part") === part;
      crop.classList.toggle("is_active", isActive);
      hasActiveCrop = hasActiveCrop || isActive;
    });

    lens.classList.toggle("has_active_crop", hasActiveCrop);
  }

  /* 어느 부위를 보여줄지 한 곳에서 정합니다. 빈 문자열이면 전부 끕니다
     (부위와 부위 사이를 이동하는 동안이 그렇습니다). */
  function setActivePart(part) {
    if (part === activePart) {
      return;
    }
    activePart = part;
    setLensSource(part);

    Array.prototype.forEach.call(texts, function (text) {
      text.classList.toggle("is_active", text.getAttribute("data-part") === part);
    });

    Array.prototype.forEach.call(markers, function (marker) {
      marker.classList.toggle("is_active", marker.getAttribute("data-part") === part);
    });

    Array.prototype.forEach.call(keywords, function (keyword) {
      var isActive = keyword.getAttribute("data-detail-keyword") === part;
      keyword.classList.toggle("is_active", isActive);

      if (isActive) {
        keyword.setAttribute("aria-current", "step");
      } else {
        keyword.removeAttribute("aria-current");
      }
    });
  }

  function findText(part) {
    return stage.querySelector('.detail_text[data-part="' + part + '"]');
  }

  /* 왼쪽 세로선은 각 부위에서 멈추고, 돋보기가 다음 부위로 이동할 때만 함께
     내려갑니다. 지난 점은 point color로 남고 텍스트는 현재 부위만 활성화합니다. */
  function setKeywordProgress(progress) {
    var safeProgress = clamp(progress, 0, 1);

    if (keywordList) {
      keywordList.style.setProperty("--detail_progress", safeProgress);
    }

    Array.prototype.forEach.call(keywords, function (keyword, index) {
      var stepProgress = keywords.length > 1 ? index / (keywords.length - 1) : 0;
      keyword.classList.toggle("is_reached", safeProgress + 0.001 >= stepProgress);
    });
  }

  /* =========================================================
     기본 — 버튼으로 부위 고르기

     실제 표시는 main.css의 .detail:not(.is_scroll_ready) 규칙이 하고,
     여기서는 상태(data-active-part, aria-pressed)만 바꿉니다.
     ========================================================= */
  function handlePartTabClick(event) {
    var part = event.currentTarget.getAttribute("data-part");

    stage.setAttribute("data-active-part", part);

    Array.prototype.forEach.call(tabs, function (tab) {
      tab.setAttribute("aria-pressed", tab.getAttribute("data-part") === part ? "true" : "false");
    });
  }

  Array.prototype.forEach.call(tabs, function (tab) {
    tab.addEventListener("click", handlePartTabClick);
  });

  /* =========================================================
     스크롤 연출
     ========================================================= */

  /* 매 프레임 다시 재면 스타일을 쓰는 도중에 레이아웃을 읽게 되어 느려집니다.
     크기는 여기서 한 번만 재고, ScrollTrigger가 새로고침할 때 다시 잽니다. */
  var stops = [];
  var stageWidth = 0;
  var stageHeight = 0;
  var lensSize = 0;
  var verticalRoom = 0; /* 사진 위(아래)로 설명이 걸칠 수 있는 여유 높이 */

  /* 설명과 돋보기 사이 간격, 화면 가장자리에서 남길 여백 */
  var TEXT_GAP = 28;
  var EDGE_MARGIN = 16;

  function clamp(value, min, max) {
    if (max < min) {
      return min;
    }
    return Math.min(Math.max(value, min), max);
  }

  /* 확대해 보여줄 사진의 크기를 정합니다. 위치는 매 프레임 transform으로 밉니다.
     ★ 크기(width)는 여기서 딱 한 번만 씁니다 — 매 프레임 바꾸면 레이아웃이
       다시 계산되어 transform으로 옮긴 이점이 사라집니다. */
  function applyLensImage() {
    if (!lensImage) {
      return;
    }

    lensImage.style.width = stageWidth * DETAIL_LENS_ZOOM + "px";
    lensImage.style.height = stageHeight * DETAIL_LENS_ZOOM + "px";
  }

  /* 돋보기가 들를 지점은 화면에 보이는 점(.detail_marker) 위치를 그대로 씁니다.
     좌표를 CSS와 JS 두 곳에 두면 어긋나기 때문입니다. */
  function measure() {
    stageWidth = stage.offsetWidth;
    stageHeight = stage.offsetHeight;
    /* 사진은 고정 구간(.detail_pin) 안에서 세로 가운데에 있습니다. 그래서 위아래로
       남는 공간은 각각 (고정구간 높이 − 사진 높이) ÷ 2 입니다. 설명이 사진 밖으로
       걸칠 때 이 안쪽까지만 나가야 화면에서 잘리지 않습니다. */
    verticalRoom = Math.max(0, (pin.offsetHeight - stageHeight) / 2);
    /* ★ offsetWidth로 읽습니다. getBoundingClientRect는 transform이 반영된 값이라
       돋보기가 켜지는 중(scale 0.9 → 1)에는 실제보다 작게 나옵니다. */
    lensSize = lens.offsetWidth;

    stops = [];

    DETAIL_PART_ORDER.forEach(function (part) {
      var marker = stage.querySelector('.detail_marker[data-part="' + part + '"]');

      if (!marker) {
        return;
      }

      stops.push({
        part: part,
        x: marker.offsetLeft + marker.offsetWidth / 2,
        y: marker.offsetTop + marker.offsetHeight / 2
      });
    });
  }

  /* 돋보기를 스테이지 안 (x, y) 지점에 그립니다 */
  function paintLens(pointerX, pointerY) {
    /* 돋보기 중심을 지점에 맞춥니다. translate(-50%, -50%)는 CSS가 갖고 있습니다 */
    lens.style.left = pointerX + "px";
    lens.style.top = pointerY + "px";

    var zoomedWidth = stageWidth * DETAIL_LENS_ZOOM;
    var zoomedHeight = stageHeight * DETAIL_LENS_ZOOM;

    /* 확대된 사진에서 잘라 보여줄 위치. 가장자리에서 배경이 비지 않도록 가둡니다 —
       가두지 않으면 사진 밖 빈 영역이 돋보기 안에 초승달 모양으로 남습니다. */
    var backgroundX = clamp(
      pointerX * DETAIL_LENS_ZOOM - lensSize / 2,
      0,
      Math.max(0, zoomedWidth - lensSize)
    );
    var backgroundY = clamp(
      pointerY * DETAIL_LENS_ZOOM - lensSize / 2,
      0,
      Math.max(0, zoomedHeight - lensSize)
    );

    /* ★ transform만 씁니다. 예전에는 background-position을 바꿨는데, 그건 합성만으로
       처리되지 않아 확대된 사진 면적 전체를 매 프레임 다시 칠했습니다.
       translate3d는 GPU 합성으로 끝나 페인트가 발생하지 않습니다. */
    if (lensImage) {
      lensImage.style.transform =
        "translate3d(" + -backgroundX + "px, " + -backgroundY + "px, 0)";
    }
  }

  /* 설명을 돋보기 바로 옆에 놓습니다. 돋보기가 사진 오른쪽에 있으면 왼쪽에,
     왼쪽에 있으면 오른쪽에 붙여 사진 밖으로 밀려나지 않게 합니다.
     세로는 돋보기 중심에 맞추되, 고정 구간 밖으로 나가지 않도록 가둡니다 —
     시안의 고정 좌표를 그대로 쓰면 짧은 화면에서 Skirt 설명이 잘렸습니다. */
  function placeText(part, lensX, lensY) {
    var text = findText(part);

    if (!text) {
      return;
    }

    var width = text.offsetWidth;
    var height = text.offsetHeight;
    var half = lensSize / 2;

    var left =
      lensX > stageWidth / 2
        ? lensX - half - TEXT_GAP - width
        : lensX + half + TEXT_GAP;

    text.style.left = clamp(left, EDGE_MARGIN, stageWidth - width - EDGE_MARGIN) + "px";
    text.style.top =
      clamp(
        lensY - height / 2,
        -(verticalRoom - EDGE_MARGIN),
        stageHeight + verticalRoom - height - EDGE_MARGIN
      ) + "px";
  }

  /* 진행도 0~1을 네 구간으로 나눕니다. 한 구간은 "그 부위에 머무르기 → 다음
     부위로 옮겨가기" 두 토막이고, 마지막 구간은 갈 곳이 없어 계속 머무릅니다.
     그래서 스크롤을 내리면 설명이 하나씩 차례로 뜹니다. */
  function applyProgress(progress) {
    if (!stops.length) {
      return;
    }

    var segment = 1 / stops.length;
    var index = clamp(Math.floor(progress / segment), 0, stops.length - 1);
    var local = (progress - index * segment) / segment;
    var from = stops[index];
    var to = stops[index + 1];
    var fromKeywordProgress = stops.length > 1 ? index / (stops.length - 1) : 0;

    if (!to || local <= DETAIL_HOLD_RATIO) {
      setKeywordProgress(fromKeywordProgress);
      paintLens(from.x, from.y);
      placeText(from.part, from.x, from.y);
      setActivePart(from.part);
      return;
    }

    /* 이동 중에는 설명을 끕니다 — 글이 사진 위를 함께 날아다니지 않도록.
       smoothstep이라 출발과 도착에서 부드럽게 붙습니다. */
    var travel = (local - DETAIL_HOLD_RATIO) / (1 - DETAIL_HOLD_RATIO);
    var eased = travel * travel * (3 - 2 * travel);
    var toKeywordProgress = (index + 1) / (stops.length - 1);

    setKeywordProgress(fromKeywordProgress + (toKeywordProgress - fromKeywordProgress) * eased);
    setActivePart("");
    paintLens(from.x + (to.x - from.x) * eased, from.y + (to.y - from.y) * eased);
  }

  var isGsapReady = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (!isGsapReady) {
    return;
  }

  window.gsap.matchMedia().add(DETAIL_SCROLL_MEDIA, function () {
    /* ★ class를 먼저 붙여야 합니다. 이 class가 레이아웃(사진 폭, 설명 위치)을
       바꾸므로, 먼저 재면 버튼 방식의 크기를 재게 됩니다. */
    section.classList.add("is_scroll_ready");
    measure();
    applyLensImage();

    var trigger = window.ScrollTrigger.create({
      trigger: pin,
      start: "top top",
      end: "+=" + DETAIL_SCROLL_PER_PART * stops.length + "%",
      pin: pin,
      anticipatePin: 1,
      onRefresh: function () {
        measure();
        /* 창 크기가 바뀌면 사진 크기도 다시 잡아야 배율이 유지됩니다 */
        applyLensImage();
      },
      onUpdate: function (self) {
        applyProgress(self.progress);
      },
      /* 고정 구간에 들어와 있는 동안만 돋보기를 띄웁니다. onEnter/onLeave 네 개를
         따로 두는 대신 onToggle 하나로 처리하면 위·아래 어느 방향으로 지나가도
         상태가 어긋나지 않습니다. */
      onToggle: function (self) {
        lens.classList.toggle("is_active", self.isActive);

        /* 구간을 벗어나면 설명도 같이 끕니다. 끄지 않으면 마지막 지점(진행도 1)에서
           돋보기만 사라지고 Skirt 설명이 남습니다. */
        if (!self.isActive) {
          setActivePart("");
        }
      }
    });

    applyProgress(trigger.progress);

    /* ★ GSAP은 자기가 만든 것(트리거·pin)만 되돌립니다. 위에서 element.style에
       직접 쓴 돋보기 좌표와 배경, 그리고 우리가 붙인 class는 여기서 손으로
       지워야 합니다. 빼먹으면 창을 좁혔을 때 버튼 방식 화면에 돋보기 잔재가
       남습니다. */
    return function cleanup() {
      trigger.kill();
      section.classList.remove("is_scroll_ready");
      lens.classList.remove("is_active");
      lens.removeAttribute("style");
      setActivePart("");
      if (lensImage) {
        lensImage.removeAttribute("style");
      }
      Array.prototype.forEach.call(texts, function (text) {
        text.removeAttribute("style");
      });
      if (keywordList) {
        keywordList.style.removeProperty("--detail_progress");
      }
      Array.prototype.forEach.call(keywords, function (keyword) {
        keyword.classList.remove("is_reached");
      });
    };
  });
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
  /* ★ 고정 구간의 스크롤 길이(카드 흐름 단계당 화면 높이 %)입니다.
     카드 위치는 스크롤이 아니라 CARD_INTERVAL 시간으로 자동 재생됩니다. */
  var COLLECTION_SCROLL_PER_CARD = 32;
  /* 고정 연출을 켜는 조건. 좁은 화면에서는 무대가 낮아 고정할 이점이 없습니다. */
  var COLLECTION_SCROLL_MEDIA = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
  /* ★ 진입 안착(아래 "진입 안착" 주석 참고) 조절값 3개.
     SHIFT — 컨테이너가 몇 px 아래에서 올라올지. 키우면 더 크게 움직입니다.
     START — 언제부터 따라오기 시작할지. "top bottom"은 섹션 윗변이 화면 아래에
             닿는 순간이라 화면 하나를 꽉 쓰는 가장 완만한 설정입니다.
     SCRUB — 스크롤을 멈춘 뒤 더 따라오는 여운(초). 0이면 딱딱해집니다.
     FADE  — 따라오기 시작할 때의 불투명도. 1이면 페이드 없이 움직임만 남고,
             0에 가까울수록 화면 하나에 걸쳐 크게 나타납니다. 시안에 없는
             연출이라 "흐릿하게 들어와 또렷해지는" 정도로만 두었습니다. */
  var COLLECTION_SETTLE_SHIFT = 120;
  var COLLECTION_SETTLE_START = "top bottom";
  var COLLECTION_SETTLE_SCRUB = 1;
  var COLLECTION_SETTLE_FADE = 0.4;
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
  /* 흐름 전체를 한 번 다 보여주는 데 필요한 단계 수.
     카드 i는 phase가 i일 때 출발해 i + streamLength에서 한 바퀴를 끝냅니다.
     마지막 카드(index streamLength-1)까지 끝나려면 2 × streamLength − 1이 필요하고,
     오른쪽 줄은 RIGHT_STREAM_OFFSET만큼 늦게 출발하므로 그만큼 더 갑니다. */
  var streamLength = Math.max(leftItems.length, rightItems.length);
  var phaseSpan = streamLength * 2 - 1 + RIGHT_STREAM_OFFSET;

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

  /* 두 줄을 한 시점(phase)으로 그립니다. 시간 기반 반복과 스크롤 연출이 같은
     경로를 쓰도록 분리해 두었습니다 — 어느 쪽이 밀든 화면 결과는 같습니다. */
  function renderPhase(phase) {
    leftItems.forEach(function (element, index) {
      renderStreamCard(element, index, phase, -1, leftItems.length);
    });
    rightItems.forEach(function (element, index) {
      renderStreamCard(element, index, phase - RIGHT_STREAM_OFFSET, 1, rightItems.length);
    });
  }

  function render(time) {
    var elapsed = time - startTime;

    renderPhase((elapsed - CARD_INTRO_DELAY) / CARD_INTERVAL);

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

  /* =========================================================
     자동 재생 + pin — 섹션은 화면에 고정하고 카드는 시간으로 흐릅니다.

     ScrollTrigger는 고정과 여백만 담당합니다. 카드 위치를 progress로 덮어쓰지
     않아 사용자가 스크롤을 멈춰도 기존 자동 반복이 계속 재생됩니다.

     ★ 이 핀은 페이지에서 brand_word_pin보다 아래에 있으므로 refreshPriority가
       그보다 더 낮아야 합니다(-1 → -2). 핀은 "페이지 순서"대로 다시 계산돼야
       하는데 ScrollTrigger는 기본적으로 "만들어진 순서"를 쓰기 때문입니다.
       이 값을 지우면 위 핀이 자리를 잡기 전 좌표로 굳어 섹션이 겹칩니다.
     ========================================================= */
  var section = row.closest(".collection");
  var container = section ? section.querySelector(".collection_container") : null;
  var isGsapReady = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (!section || !container || !isGsapReady) {
    return;
  }

  window.gsap.matchMedia().add(COLLECTION_SCROLL_MEDIA, function () {
    section.classList.add("is_scroll_ready");
    /* 가운데 검은 프레임은 연출 내내 보여야 합니다 */
    row.classList.add("is_loop_active");

    /* ---------------------------------------------------------
       진입 안착 — 고정되기 **전에** 컨테이너를 먼저 제자리에 앉힙니다.

       ★ 왜 필요한가
         고정 자체에는 튀는 지점이 없습니다(섹션 top이 199.5 → 119.5 → 59.5 →
         19.5 → 3.5 → -0.5로 이어지고 그대로 잠깁니다). "착 하고 떨어지는"
         느낌은 위치가 어긋나서가 아니라, 섹션이 **스크롤 속도 그대로 올라오다가
         한 프레임에 멈추기** 때문입니다. 멈추는 순간 속도가 0이 되니까 눈에는
         부딪혀 선 것처럼 보입니다.

         그래서 컨테이너를 페이지보다 느리게 따라오게 하고, 고정이 걸리는
         지점(= "top top")에서 정확히 끝나도록 맞췄습니다. 잠기는 순간에는
         컨테이너가 이미 멈춰 있어서, 고정이 "정지"가 아니라 "안착"으로 읽힙니다.

       ★ ease가 핵심입니다
         power2.out이라 움직임이 앞쪽에 몰립니다 — 진행도 50%에서 이미 목표의
         75%까지 와 있고 마지막 20% 구간에서는 거의 제자리입니다. 선형(none)으로
         두면 고정 직전까지 같은 속도로 움직여서 지금 문제가 그대로 남습니다.

       ★ scrub 값이 여운입니다. 스크롤을 멈춰도 이 시간만큼 더 따라와 멎습니다.
         0으로 두면 스크롤과 1:1로 붙어 딱딱해집니다.

       조절: COLLECTION_SETTLE_SHIFT(내려앉는 거리) ·
             COLLECTION_SETTLE_START(언제부터 따라올지) · COLLECTION_SETTLE_SCRUB
       --------------------------------------------------------- */
    var settle = window.gsap.fromTo(container, {
      y: COLLECTION_SETTLE_SHIFT,
      opacity: COLLECTION_SETTLE_FADE
    }, {
      y: 0,
      opacity: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: section,
        start: COLLECTION_SETTLE_START,
        /* ★ 끝이 고정 시작점과 같아야 합니다. 더 뒤로 두면 고정된 뒤에도
           컨테이너가 계속 움직여 화면 안에서 따로 떠다닙니다. */
        end: "top top",
        scrub: COLLECTION_SETTLE_SCRUB,
        refreshPriority: -2
      }
    });

    var trigger = window.ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=" + COLLECTION_SCROLL_PER_CARD * phaseSpan + "%",
      pin: section,
      anticipatePin: 1,
      refreshPriority: -2
    });

    syncPlayState();

    /* ★ GSAP은 자기가 만든 것만 되돌립니다. 카드의 transform·opacity·z-index는
       renderStreamCard가 element.style에 직접 쓰므로 여기서 손으로 지웁니다.
       빼먹으면 창을 좁혔을 때 카드가 마지막 위치에 굳은 채 남습니다. */
    return function cleanup() {
      trigger.kill();
      /* 안착 트윈은 컨테이너의 element.style에 transform·opacity를 남기므로
         트리거만 죽이지 말고 되돌린 뒤 지웁니다. 빼먹으면 창을 좁혔을 때
         컨테이너가 120px 내려간 채(또는 opacity 0으로) 굳습니다. */
      if (settle.scrollTrigger) {
        settle.scrollTrigger.kill();
      }
      settle.revert();
      container.removeAttribute("style");

      section.classList.remove("is_scroll_ready");

      sourceItems.forEach(function (element) {
        element.removeAttribute("style");
        element.style.opacity = "0";
      });

      /* breakpoint가 바뀌어도 시간 기반 반복을 새 좌표에서 다시 시작합니다 */
      startTime = window.performance.now();
      pausedAt = null;
      syncPlayState();
    };
  });
})();

/* ---------------------------------------------------------
   promo 배경 영상 자동재생 — bespoke · shop 두 개

   ★ 이 블록은 위쪽 GSAP IIFE 밖에 있어야 합니다.
     그 IIFE는 `if (!isGsapReady) return;`로 시작하므로, 안에 넣으면 CDN이
     막힌 환경에서 두 영상이 같이 죽습니다. 여기서는 GSAP을 쓰지 않습니다.

   ★ HTML에 autoplay 속성을 쓰지 않는 이유
     두 영상은 문서 19000px 부근에 있는데 autoplay는 화면 밖이어도 즉시 전부
     내려받습니다(합계 2.6MB). 화면에 다가올 때 재생하면 그만큼 첫 로딩에서
     빠지고, "다른 페이지에 갔다가 돌아왔을 때 다시 재생"하는 경로도 여기
     한 곳에 모입니다. preload="metadata"라 첫 프레임은 그대로 보입니다.
   --------------------------------------------------------- */
(function setupPromoVideos() {
  "use strict";

  var PROMO_VIDEO_IDS = ["promo_bespoke_video", "promo_shop_video"];
  /* 화면 높이의 60%만큼 앞에서 미리 걸어, 실제로 보일 때는 이미 돌고 있습니다. */
  var PROMO_VIEW_MARGIN_RATIO = 0.6;

  var videos = PROMO_VIDEO_IDS
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(function (video) {
      return video;
    });

  if (!videos.length) {
    return;
  }

  /* ★ 판정을 IntersectionObserver가 아니라 좌표로 합니다.
     관찰자 콜백은 "화면을 다시 그리는 단계"에서만 배달되기 때문에, 문서가
     아직 보이지 않는 동안(백그라운드 탭에서 열림, bfcache에서 되살아난 직후)에는
     한 번도 오지 않습니다. 첫 로딩과 되돌아온 순간이 정확히 그 시점이라
     관찰자에만 맡기면 그 두 경우에 영상이 멈춘 채로 남습니다.
     좌표는 언제 읽어도 답이 같으므로 아래 세 시점에서 직접 계산합니다. */
  function isNearViewport(video) {
    var rect = video.getBoundingClientRect();
    var margin = window.innerHeight * PROMO_VIEW_MARGIN_RATIO;

    return rect.bottom > -margin && rect.top < window.innerHeight + margin;
  }

  function playPromoVideo(video) {
    /* 소리가 있는 영상은 자동재생이 거절됩니다. 속성만이 아니라 속성값도 켜 둡니다
       — bfcache에서 되살아난 문서는 속성을 다시 읽지 않습니다. */
    video.muted = true;

    var attempt = video.play();

    if (attempt && typeof attempt.catch === "function") {
      /* 거절돼도 preload="metadata"의 첫 프레임이 남으므로 화면이 비지 않습니다. */
      attempt.catch(function () {});
    }
  }

  function syncPromoVideo(video) {
    if (isNearViewport(video)) {
      playPromoVideo(video);
      return;
    }

    if (!video.paused) {
      video.pause();
    }
  }

  function syncPromoVideos() {
    videos.forEach(syncPromoVideo);
  }

  /* 스크롤 중에는 관찰자가 값싸게 알려줍니다. 판정은 위 좌표 함수가 그대로 하므로
     관찰자는 "지금 다시 확인해라"는 신호로만 씁니다. */
  if (typeof window.IntersectionObserver === "function") {
    var observer = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        syncPromoVideo(entry.target);
      });
    }, { rootMargin: (PROMO_VIEW_MARGIN_RATIO * 100) + "% 0px" });

    videos.forEach(function (video) {
      observer.observe(video);
    });
  } else {
    window.addEventListener("scroll", syncPromoVideos, { passive: true });
  }

  /* ★ 아래 세 가지는 관찰자만으로 덮이지 않아서 따로 있습니다.
     관찰자 콜백(과 scroll 이벤트)은 "화면을 다시 그리는 단계"에서만 배달되는데,
     아래 세 시점은 그 단계가 아직 돌지 않았거나 화면이 그대로여서 콜백이
     오지 않는 순간입니다.
     - pageshow: 뒤로 가기로 bfcache에서 되살아나면 문서가 다시 실행되지 않고,
       브라우저가 캐시에 넣을 때 영상을 멈춰 둡니다. 화면은 그대로라 관찰자도
       조용합니다.
     - load: 뒤로 가기로 문서가 다시 실행되는 경우, 맨 아래 첫 호출은 브라우저가
       스크롤 위치를 되돌려 놓기 전에 돌아갑니다(그때 scrollY는 0이라 두 영상
       모두 "멀리 있음"이 됩니다).
     - visibilitychange: 백그라운드 탭에서 열렸다가 넘어온 경우. */
  window.addEventListener("pageshow", syncPromoVideos);
  window.addEventListener("load", syncPromoVideos);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      syncPromoVideos();
    }
  });

  syncPromoVideos();
})();
