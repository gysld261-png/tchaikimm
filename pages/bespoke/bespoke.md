# bespoke 페이지 작업 기록

`pages/bespoke/` 폴더의 작업 내역입니다. 저장소 전체 기록은 `docs/PROJECT_CONTEXT.md`에
있고, 이 문서는 이 폴더 안에서만 끝나는 작업을 남깁니다.

이 폴더에는 **페이지 세 개**가 들어 있습니다.

| 파일 | 화면 | CSS |
|---|---|---|
| `index.html` | Bespoke 메인 | `css/bespoke.css` (+ `bespoke_base.css`) |
| `reservation.html` | 예약 폼 | `css/reservation.css` (+ `bespoke_base.css`) |
| `reservation_done.html` | 예약 완료 | `css/reservation_done.css` (+ `bespoke_base.css`) |

**`css/bespoke.css`와 `js/bespoke.js`는 `index.html`만 불러옵니다.** 이 두 파일을
고쳐도 예약 페이지 두 개에는 영향이 없습니다. 반대로 `css/bespoke_base.css`는
세 페이지가 함께 쓰므로 고칠 때 세 페이지를 모두 확인해야 합니다.

---

## Materials 섹션 — 원단 선택 인터랙션 (2026-08-09)

정지 화면이던 원단 섹션을, **스와치나 이름에 마우스를 올리면 큰 사진과 설명이
그 원단으로 바뀌는** 방식으로 바꿨습니다.

- `index.html` — materials 섹션 마크업 교체
- `css/bespoke.css` — materials 블록에 상태 규칙 추가
- `js/bespoke.js` — `initMaterialsSelector()` 추가

### 레퍼런스 — eternalblue.co.nz `.ingredient-slider__grid`

구조를 실측했더니 **이 섹션과 배치가 거의 같았습니다.**

| 레퍼런스 | 여기 (이미 있던 것) |
|---|---|
| `.ingredient-slider__image` (큰 사진, 페이드) | `.materials_texture` |
| `.ingredient-slider__static-content` (머리글) | **없음 → 새로 추가** |
| `.ingredient-slider__slider-tabs` (썸네일 6칸) | `.materials_swatches` |
| `ul.ingredient-slider__number-tab` (이름 목록) | `.materials_list` |
| `.ingredient-slider__tab-description` | `.materials_caption` |

그래서 레이아웃을 새로 짜지 않고 **상태 규칙만 얹었습니다.**
레퍼런스에서 그대로 가져온 값:

| 대상 | 값 |
|---|---|
| 썸네일 | `opacity: .5` → `.active { 1 }`, `transition: .4s ease-in-out` |
| 이름 행 | `opacity: .5` → `.active { 1 }`, `transition: .3s ease` |
| 큰 사진 | `transition: opacity .4s ease`, `.is-fading { opacity: 0 }` |
| 번호 칸 | `min-width: 24px`, 이름과의 `gap: 16px` |
| 화살표 | 활성 행에만 표시 |

### ★ 큰 사진은 크로스페이드가 아닙니다

레퍼런스는 사진 두 장을 겹쳐 바꾸지 않습니다. **한 장을 0.4초에 걸쳐 흐리게 만든
뒤 `src`를 갈아 끼우고 다시 나타냅니다.** 중간에 배경이 비칩니다. 그대로 옮겼습니다
(process 섹션의 크로스페이드와 의도적으로 다릅니다).

전환 시간은 JS가 `getComputedStyle(...).transitionDuration`으로 **CSS에서
읽습니다.** 모션 감소 설정이면 `--materials_fade`가 `--duration_base`(0.01ms)라
기다리지 않고 즉시 바뀝니다 — 숫자를 JS에 박아두지 않은 이유입니다.

빠르게 훑고 지나갈 때를 위해 토큰으로 경합을 막습니다. 흐려지는 동안 더 최근
요청이 오면 앞선 차례는 버리고, 마지막 원단으로 마무리합니다(실측 확인).

### 시안과 다르게 판단한 것

- **이름 행만 불투명도 대신 기존 색 전환을 유지했습니다.** 시안이 이미
  `--color_text_muted` → `--color_text`를 쓰고 있어서, 폰트 색을 그대로 두라는
  요구에 맞췄습니다. 전환 시간만 레퍼런스(.3s)를 따릅니다.
- **머리글 문단(`.materials_intro`)은 새로 넣은 내용입니다.** 레퍼런스의
  `static-content` 자리입니다. 빼려면 `index.html`의 그 한 줄만 지우면 됩니다
  (다른 곳에서 참조하지 않습니다). 섹션 높이 1408 → **1485**의 원인입니다.
- **설명 6개를 새로 썼습니다.** 기존 것은 Silk 하나뿐이었습니다(Figma 카피).
  형식은 그대로 유지했습니다 — 형용사 세 개 + 설명. 1920에서 여섯 개 모두
  정확히 **140px(5줄)**로 맞춰 두었습니다.
- **`<div>` 대신 `<button>`을 씁니다.** 레퍼런스는 `cursor: pointer`만 걸어
  키보드로 고를 수 없습니다. `reset.css`가 button의 색·글꼴·여백을 상속으로
  되돌려 두어서 글자 크기와 색은 이전 마크업과 똑같이 나옵니다(측정 확인).

### 반드시 지켜야 하는 것

1. **`.materials_texture`에 `align-self: flex-start`가 필요합니다.** 없으면 flex
   기본값 stretch가 이 상자를 오른쪽 열 높이에 맞춰 늘여서 `aspect-ratio: 466/678`
   (시안값)을 무시합니다. 머리글이 들어오면서 실제로 466×**755**가 됐습니다.
2. **`.materials_detail`은 `flex-wrap: wrap` + 캡션 `flex: 1 1 360px`입니다.**
   1280px 화면에서 오른쪽 열이 606px뿐이라 목록(375) + gap(100)을 빼면 설명이
   **131px**까지 눌렸습니다(실측). 45단어짜리 설명이 그 폭에서는 읽히지 않습니다.
   레퍼런스도 좁은 폭에서는 세로로 쌓습니다(`grid-template-columns: 1fr`).
   고정 브레이크포인트 대신 flex-basis로 두어 어느 폭에서든 알아서 내려갑니다.
3. **캡션 높이를 JS가 미리 잡습니다.** 안 그러면 원단을 옮길 때마다 줄 수가 달라져
   섹션이 들썩입니다. 웹폰트 적용 후와 폭이 바뀔 때 다시 잽니다
   (shop_detail 아코디언과 같은 방식).
4. **큰 사진의 대체 텍스트는 스와치의 것을 고쳐 씁니다**(`" swatch"` →
   `" shown close up"`). 이름 목록에서 만들면 `"Seasonal Fabric fabric ..."`처럼
   겹칩니다 — 실제로 그렇게 났다가 고쳤습니다.
5. **hover는 버블링하지 않으므로 `mouseover`로 위임합니다.** 버튼 안쪽 요소를
   지날 때마다 다시 들어오지만 같은 값이면 바로 빠집니다.

### ★ 원단 사진이 원본보다 크게 그려집니다 (이번 작업과 무관한 기존 문제)

여섯 장 모두 **180 × 200**인데 큰 사진 자리는 **466 × 678**입니다. 가로 2.6배,
세로 3.4배로 늘어납니다. **바꾸기 전에도 `silk.png`가 같은 자리에 같은 크기로
들어가 있었으므로 화질은 이전과 동일합니다.** 여섯 장의 크기가 모두 같아서
어느 원단을 골라도 차이가 없습니다. 선명하게 하려면 원단 사진을 다시
내보내야 합니다.

### 검증 (localhost, 캐시 없는 정적 서버)

**타이포그래피·색 불변** (요구사항)

| 항목 | 값 |
|---|---|
| 이름 목록 | 20px Montserrat / line-height 32px |
| 이름 활성 / 비활성 | `rgb(10,10,10)` / `rgb(136,136,128)` — 전과 동일 |
| button 상속 | 20px Montserrat, 색 상속 — 마크업 변경 전과 동일 |
| 설명 | 16px `rgb(74,74,66)` / line-height 26.08px |
| 스와치 번호 | 14px `rgb(136,136,128)` |
| 스와치 이미지 | 180 × 200 (시안값) |
| 큰 사진 | 466 × 678 (시안값) |

**동작** — 이름 6개 hover, 썸네일 hover, 클릭(터치 경로) 모두에서
목록·썸네일·설명·큰 사진 `src`·`alt`·`aria-pressed`가 한 번에 맞물립니다.
빠르게 훑어도 마지막 원단에 정확히 안착하고 `is_fading`이 남지 않습니다.

**폭별**

| 폭 | 설명 칸 | 배치 | 설명 6개 높이 | 가로 스크롤 | 넘침 |
|---|---|---|---|---|---|
| 1920 | 500px | 목록 옆 | 140 ×6 (동일) | 0 | 0 |
| 1600 | 415px | 목록 옆 | — | 0 | 0 |
| 1280 | 500px | **목록 아래로 내려감** | 140 ×6 (동일) | 0 | 0 |
| 768 | 500px | 세로 | 140 ×6 | 0 | 0 |
| 360 | 320px | 세로 | 219 ×6 | 0 | 0 |

**다른 섹션 회귀 없음** — hero / philosophy / atelier / quote / process /
reservation / begin 일곱 개의 좌표·크기·padding이 전부 그대로입니다.
`.materials`만 1408 → **1485**(머리글 문단), 문서 높이 14301 → **14379**.

`node --check` 통과, CSS 중괄호 176/176, 중복 id 0, alt 누락 0, 깨진 이미지 0,
로컬 404 0건, Tab 순서 12개가 화면 순서와 일치.

### 확인하지 못한 부분

- **화면 캡처를 하지 못했습니다**(이 세션의 미리보기 패널이 이 구간을
  합성하지 못합니다). 위 수치는 전부 `getBoundingClientRect` /
  `getComputedStyle` 측정입니다. **실제 마우스로 훑을 때의 페이드 감각과
  0.4초가 적당한지는 사용자가 봐야 합니다.**
- 미리보기 탭이 `document.hidden`이라 **class가 바뀐 뒤의 다시 칠하기(불투명도
  0.5 → 1, 화살표 등장)를 눈으로 보지 못했습니다.** DOM 상태로만 확인했습니다.
- **`document.hasFocus()`가 false라 `.focus()`가 `focusin`을 쏘지 않습니다.**
  키보드 경로는 `focusin`을 직접 디스패치해 핸들러가 올바로 도는 것만
  확인했습니다(`001000` + 해당 설명).
- `prefers-reduced-motion: reduce` 실제 동작. 이 환경에서 에뮬레이트할 수
  없었습니다.

---

## Process 섹션 — hover로 열리는 행 목록 (2026-08-10)

**2026-08-09에 만든 pin 스크롤 방식(thecube.dk 참고)을 걷어내고 다시 만들었습니다.**
행에 마우스를 올리면 포인트 색이 차오르고 그 행이 열리면서 사진과 설명이 나옵니다.

- `index.html` — process 섹션 마크업 교체(오른쪽 sticky 사진 칸 제거)
- `css/bespoke.css` — process 블록 전체 교체
- `js/bespoke.js` — `initProcessMotion()` → `initProcessSteps()`

### 레퍼런스 — felix-nieto.com/about `.values_wrap`

실측한 행 구조입니다.

```
.values_cms_item { border-top: 1px solid; position: relative }
.values_cms_bg   { position: absolute; inset: auto 0 0;
                   width: 100%; height: 0% → 100%; z-index: 0 }
번호·제목        { z-index: 1 }
```

**색이 행 아래쪽에 붙어 위로 차오릅니다.** 그대로 옮기되 `height` 대신
`transform: scaleY()`를 씁니다 — 같은 그림이면서 합성만 하므로 매 프레임
레이아웃을 다시 잡지 않습니다.

### 레퍼런스와 다르게 한 것

- **레퍼런스 행은 열리지 않습니다.** 번호 + 제목뿐입니다. 여기서는 그 행이
  열리면서 그 단계의 사진과 설명이 나옵니다(요청).
- **글자색을 뒤집습니다.** 레퍼런스의 brand 색(#96c4c8)은 밝아서 검은 글씨가
  그대로 읽히지만, 이 사이트 포인트 색(`--color_point` #1f433f)은 어둡습니다.
  색이 덮은 행은 `--color_text_inverse`로 뒤집어야 읽힙니다. 번호는 흰색을
  0.65로 눌러 제목과의 위계를 비활성 상태(muted vs text)와 같게 뒀습니다.
- **`<div>` 대신 `<button aria-expanded>`.** 레퍼런스는 `cursor: pointer`만
  걸어 키보드로 열 수 없습니다.

### ★ 오른쪽 sticky 사진 칸과 pin 스크롤을 없앴습니다

사진이 행 안으로 들어오면서 오른쪽 `.process_image`가 중복이 되고, 두 방식이
같은 class(`is_active`)를 두고 다투기 때문입니다(사용자 결정).
`.process_image` / `.process_image_img` / `.is_scrub_ready` 규칙과
`initProcessMotion()`은 전부 제거했습니다. **이 섹션은 더 이상 시안 2단
배치(목록 727 | 사진 873)가 아닙니다.** 위아래 여백(272px)만 시안값입니다.

### ★ 한 번에 한 행만 열립니다 — 높이가 변하지 않아야 합니다

닫기가 없습니다. 다른 행으로 옮기면 앞 행이 닫히면서 그 행이 열립니다.
**hover만으로 목록 높이가 변하면 아래 섹션이 따라 움직여서 쓸 수 없습니다.**

- 데스크톱은 열린 칸 높이가 사진 상자(280px) + 아래 여백(40px) = **320px로
  다섯 개 모두 같습니다**(설명 3줄 78px < 280px). 계산이 아니라 구조로 보장됩니다.
- 좁은 화면은 사진 아래로 설명이 쌓이는데 줄 수가 6줄과 7줄로 갈려
  407 / 380px로 벌어집니다(360px 실측). JS가 가장 큰 값을 재서 다섯 칸에
  `min-height`로 넣습니다. 데스크톱에서는 이미 같아서 아무 일도 하지 않습니다.
  웹폰트 적용 후와 폭이 바뀔 때 다시 잽니다.

### 반드시 지켜야 하는 것

1. **`.process_step_panel_clip`에는 padding을 주면 안 됩니다.** `min-height: 0`은
   내용 상자만 0으로 줄여 주고 padding은 그대로 남습니다. 처음에 이 요소에
   `padding-bottom: 40px`을 줬다가 **닫힌 행이 111이 아니라 151px**이 됐습니다.
   여백은 한 겹 안쪽 `.process_step_panel_inner`가 갖습니다.
2. **`min-height: 0` + `overflow: hidden`이 `0fr` 접힘의 전제입니다.** 둘 중
   하나라도 빠지면 칸이 내용 높이만큼 벌어진 채 닫히지 않습니다.
3. **차오르는 색은 `inset: 0` + `transform-origin: bottom`입니다.** 행이 열려
   커져도 항상 꽉 찹니다. 레퍼런스처럼 `inset: auto 0 0` + height로 하면
   열림과 채움이 서로를 밀어 어긋납니다.
4. **행 사이는 gap이 아니라 선입니다.** gap을 쓰면 색이 차오를 때 행 사이가
   끊겨 보입니다(레퍼런스도 `border-top`입니다).
5. **사진 5장에 `loading="lazy"`를 걸지 않습니다.** 닫힌 행은 높이 0으로 접혀
   있어 지연로딩이 계속 미뤄지고, 처음 마우스를 올리는 순간 빈 칸이 보입니다.
   이 5장은 이번 변경 전에도 전부 즉시 받던 파일입니다.

### 조절값

CSS `.process`의 변수만 바꾸면 됩니다.

| 변수 | 기본 / 1840+ | 의미 |
|---|---|---|
| `--process_fill_duration` | 0.55s | 색이 차오르는 시간 |
| `--process_open_duration` | 0.6s | 행이 열리는 시간 |
| `--process_media_height` | 240 / 280 / 180(모바일) | 사진 높이 = 열린 칸 높이 |
| `--process_row_padding` | 32 / 40 / 24(모바일) | 행 위아래 여백 |

모션 감소 설정에서는 두 시간이 `--duration_base`(0.01ms)를 따라갑니다.

### 설명 문구를 새로 썼습니다

한 줄짜리였던 다섯 개를 2~3문장으로 바꿨습니다(요청). 1920에서 다섯 개 모두
정확히 **3줄(78px)**이라 열린 칸 높이가 사진으로만 정해집니다.

### 검증 (localhost, 캐시 없는 정적 서버)

| 항목 | 값 |
|---|---|
| 닫힌 행 / 열린 행 | 111px / 431px (1920) |
| 열린 칸 5개 | **320 / 320 / 320 / 320 / 320** — 전부 동일 |
| 설명 5개 | 78px(3줄) ×5 |
| 목록 높이 | 876px — 어느 행을 열어도 동일 |
| 차오르는 색 | `rgb(31,67,63)` = `--color_point`, `scaleY 0 → 1`, origin bottom |
| 글자색 | 활성 제목 `rgb(255,253,249)` / 번호 `rgba(255,253,249,.65)` / 비활성 `rgb(10,10,10)` |
| 닫힌 칸 `grid-template-rows` | `0px` (열림 `320px`) |
| pin 트리거 / `is_scrub_ready` | **0개 / 없음** — 이전 방식이 남아 있지 않음 |

- **동작 4경로 전부 확인**: 행 hover, 행 안쪽 제목 hover, 클릭(터치), `focusin`
  (키보드). 목록 밖으로 나가도 마지막 행이 열린 채 유지됩니다(레퍼런스와 동일).
- **폭별**: 1920 / 1280 / 360 — 가로 스크롤 0, 넘치는 요소 0.
  1280은 열린 칸 272px ×5, 360은 407px ×5(JS 예약 후)로 전부 균일.
- **다른 섹션 회귀 없음** — hero / philosophy / atelier / quote / materials /
  reservation / begin 크기·여백 그대로. `.process`만 1504 → **1420**,
  문서 높이 14379 → **10407**(pin 3888px이 빠짐).
- 사진 5장 전부 로드(853×960 / 785×928 ×4), 로컬 404 0건, 중복 id 0, alt 누락 0,
  `node --check` 통과, CSS 중괄호 균형.
- **이번에는 화면 캡처가 됐습니다.** 03번 행이 열린 상태에서 딥그린 띠 + 왼쪽
  사진 + 오른쪽 흰 글씨, 위아래 행은 얇은 선으로 닫혀 있는 것을 확인했습니다.

### 확인하지 못한 부분

- **실제 마우스로 행 사이를 옮길 때의 감각**(색이 차오르는 0.55초, 열리는
  0.6초)은 사용자가 봐야 합니다. 빠르게 훑으면 여러 행이 연달아 열립니다 —
  레퍼런스와 같은 동작이지만 속도가 거슬리면 위 두 변수를 낮추면 됩니다.
- 미리보기 탭이 `document.hidden`이라 **class가 바뀐 뒤의 다시 칠하기를 눈으로
  보지 못했습니다.** 위 상태 전환은 DOM과 인라인 값으로 확인했습니다.
- `document.hasFocus()`가 false라 `.focus()`가 `focusin`을 쏘지 않습니다.
  키보드 경로는 이벤트를 직접 디스패치해 확인했습니다.
- `prefers-reduced-motion: reduce` 실제 동작.
- 이 환경은 GSAP CDN이 막혀 있습니다. **이 섹션은 GSAP을 쓰지 않으므로
  영향이 없지만**, philosophy·atelier 모션은 이 환경에서 돌지 않습니다.
---

## 이 폴더의 남은 문제

`docs/PROJECT_CONTEXT.md`의 "Bespoke 다음 작업"과 같은 내용입니다.

1. **메인 히어로 영상** — `index.html:41`이 `assets/main/bespoke_main.mp4`를
   가리키는데 파일이 없습니다(404). 저장소에 시안의 히어로 장면과 맞는 영상이
   없습니다.
2. **헤더가 시안보다 30px 낮습니다**(66 vs 96). `common/css/layout.css`의 공통
   컴포넌트라 다른 페이지가 같이 바뀝니다.
3. 예약 폼 달력의 이전·다음 달 버튼이 아직 동작하지 않습니다(2026년 8월 정적 마크업).
4. `.begin_card`의 "View Guide" / "View Process" 버튼과 "Contact" 링크가
   `href="#"` 상태입니다.
