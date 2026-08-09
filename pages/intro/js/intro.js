/* =========================================================
   intro — 두루마기 영상을 스크롤로 스크럽하는 진입 화면

   pages/brand/ → pages/main/ 인트로를 거쳐 이 독립 페이지로 옮겨왔습니다.
   이 페이지에는 이 섹션 하나뿐이라 pin이 스크롤 0에서 바로 시작하고,
   pin이 끝나면 문서도 함께 끝납니다 — 아래로 이어지는 섹션이 없습니다.
   사이트로 들어가는 유일한 입구는 오버레이의 START 버튼입니다.

   공통 헤더·푸터가 없는 화면이라 헤더를 숨기는 코드도 없습니다.
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollVideo);
  } else {
    initScrollVideo();
  }
})();
