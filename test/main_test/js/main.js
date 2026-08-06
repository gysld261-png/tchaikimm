/* 스크롤 인터랙션 — brand_01~04 고정+텍스트 전환, brand_05/06 스크롤 리빌,
   kyj_brand_story 1장→3장→확대→페이드아웃.
   768px 이상 + 모션 감소 설정이 아닐 때만 동작합니다(gsap.matchMedia).
   그 외(모바일, JS 미동작, 모션 감소)에는 각 섹션의 기본 정적 레이아웃이 그대로 보입니다. */
(function () {
  "use strict";

  var isGsapReady = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (!isGsapReady) {
    return;
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;

  gsap.registerPlugin(ScrollTrigger);

  gsap.matchMedia().add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", function () {
    var triggers = [];
    var resets = [];

    /* ---------------------------------------------------------
       brand_01~04 — 한 화면에 고정한 채 글자만 차례로 바뀝니다
       --------------------------------------------------------- */
    (function setupBrandWordPin() {
      var pin = document.getElementById("brand_word_pin");
      if (!pin) {
        return;
      }

      var steps = Array.prototype.slice.call(pin.querySelectorAll(".brand_word"));
      if (steps.length < 2) {
        return;
      }

      pin.classList.add("is_pinned");
      gsap.set(steps, { opacity: 0 });
      gsap.set(steps[0], { opacity: 1 });

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: "+=" + window.innerHeight * (steps.length - 1),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true
        }
      });

      steps.forEach(function (step, i) {
        if (i === 0) {
          return;
        }
        tl.to(steps[i - 1], { opacity: 0, duration: 0.6 }, i - 1)
          .to(step, { opacity: 1, duration: 0.6 }, i - 1);
      });

      triggers.push(tl.scrollTrigger);
      resets.push(function () {
        pin.classList.remove("is_pinned");
        gsap.set(steps, { clearProps: "opacity" });
      });
    })();

    /* ---------------------------------------------------------
       brand_05 / brand_06 — 스크롤해 들어오면 사진이 서서히 나타나고
       이름 두 줄이 벌어지며 갈라집니다
       --------------------------------------------------------- */
    Array.prototype.slice.call(document.querySelectorAll(".brand_collage")).forEach(function (section) {
      var cards = section.querySelector(".brand_collage_cards");
      var nameSpans = Array.prototype.slice.call(section.querySelectorAll(".brand_collage_name span"));

      if (!cards || nameSpans.length < 2) {
        return;
      }

      section.classList.add("is_enhanced");

      var isDesktop = window.innerWidth >= 1280;
      gsap.set(nameSpans[0], isDesktop ? { x: 30 } : { y: 14 });
      gsap.set(nameSpans[1], isDesktop ? { x: -30 } : { y: -14 });

      var st = ScrollTrigger.create({
        trigger: section,
        start: "top 75%",
        end: "top 25%",
        scrub: 1,
        onUpdate: function (self) {
          gsap.set(cards, { opacity: self.progress, scale: 0.94 + 0.06 * self.progress });
          gsap.set(nameSpans[0], isDesktop ? { x: 30 * (1 - self.progress) } : { y: 14 * (1 - self.progress) });
          gsap.set(nameSpans[1], isDesktop ? { x: -30 * (1 - self.progress) } : { y: -14 * (1 - self.progress) });
        }
      });

      triggers.push(st);
      resets.push(function () {
        section.classList.remove("is_enhanced");
        gsap.set([cards].concat(nameSpans), { clearProps: "all" });
      });
    });

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

      gsap.set(solo, { xPercent: -50, yPercent: -50, opacity: 1 });
      gsap.set(card1, { xPercent: -150, yPercent: -50, scale: 0.85, opacity: 0 });
      gsap.set(card2, { xPercent: -50, yPercent: -50, scale: 0.85, opacity: 0 });
      gsap.set(card3, { xPercent: 50, yPercent: -50, scale: 0.85, opacity: 0 });

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=" + window.innerHeight * 2,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true
        }
      });

      tl.to(solo, { opacity: 0, duration: 1 }, 0.4)
        .to(card1, { xPercent: -130, scale: 1, opacity: 1, duration: 1 }, 0.4)
        .to(card2, { scale: 1, opacity: 1, duration: 1 }, 0.4)
        .to(card3, { xPercent: 30, scale: 1, opacity: 1, duration: 1 }, 0.4)
        .to([card1, card2, card3], { xPercent: -50, scale: 1.5, opacity: 0, duration: 1 }, 1.8);

      triggers.push(tl.scrollTrigger);
      resets.push(function () {
        section.classList.remove("is_enhanced");
        gsap.set([solo, card1, card2, card3], { clearProps: "all" });
      });
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
