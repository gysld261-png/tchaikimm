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
})();
