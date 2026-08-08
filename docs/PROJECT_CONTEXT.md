# Tchai Kim 현재 상태


## 공통 헤더 — COLLECTION 하위메뉴 제거 (2026-08-09)

COLLECTION에 마우스를 올리면 뜨던 하위메뉴(TCHAI KIM YOUNG JIN / TCHAI KIM)를 없앴습니다.
**collection 페이지 안에서 탭바로 나누기로 결정**됐기 때문입니다.

수정 파일 두 개뿐입니다. 저장소 전체에서 `submenu`를 참조하던 곳이 이 둘밖에 없습니다.

- `common/components/header.html` — `<li>`를 다른 메뉴 항목과 같은 한 줄로 되돌림
  (`header_menu_item_has_submenu` class와 `<ul class="header_submenu">` 제거)
- `common/css/layout.css` — 하위메뉴 전용 규칙 4개 블록 제거,
  자리에 제거 사유 주석을 남김

COLLECTION 링크는 **`../col_chaikimyoungjin/index.html` 그대로** 두었습니다.
탭바가 들어갈 페이지가 아직 없어서 임의로 바꾸지 않았습니다.

### ★ col_chaikim 페이지가 고아가 됐습니다

`pages/col_chaikim/index.html`로 가는 링크가 **저장소에서 이 하위메뉴 하나뿐이었습니다.**
지금은 어떤 페이지에서도 도달할 수 없습니다. 탭바를 만들 때 그 안에서 연결해야 합니다.
(푸터의 Collection 링크는 `col_chaikimyoungjin` 쪽을 가리킵니다)

### 검증 (localhost:5621, 1920 × 1080)

main · bespoke 두 페이지에서 확인했습니다(bespoke는 자체 헤더 override가 있어 같이 봄).

| 항목 | 결과 |
|---|---|
| 메뉴 항목 | BRAND / SHOP / BESPOKE / COLLECTION 4개 |
| `.header_submenu` DOM | **0개** |
| `.header_menu_item_has_submenu` | **0개** |
| CSSOM에 남은 submenu 규칙 | **0개** |
| COLLECTION `<li>`의 자식 | `<a>` 하나뿐, `position: static` |
| 헤더 높이 / 로고 / 메뉴 글자 | 66px / 225×34 / 20px — **변경 전과 동일** |
| COLLECTION hover 후 | 헤더 높이 그대로 66px, 팝업 0개 |
| 헤더 안 넘치는 요소 / 페이지 가로 스크롤 | 0 / 0 |

### 확인하지 못한 부분

- 실제 마우스 hover는 확인하지 못했습니다. `mouseover`/`mouseenter` 디스패치와
  CSSOM에 규칙이 남아 있지 않은 것으로 확인했습니다.
- 1280px 미만의 모바일 토글 메뉴 안에서의 모습. 하위메뉴는 `position: absolute`라
  원래도 좁은 화면에서 제대로 안 보였고, 이번 제거로 그 문제도 같이 없어집니다.


## 공통 헤더/푸터 경로 점검 — 루트 절대경로 없음 (2026-08-08)

헤더 작업 전에 "어느 PC/어느 배포 경로에서 열어도 헤더가 뜨는지"를 전수 확인했습니다.

**코드는 이미 전부 상대경로입니다.** `href="/`, `src="/`, `url(/`, `data-component="/`
검색 결과 저장소 전체에서 **0건**입니다. 슬롯·공통 CSS/JS는 `../../common/...`,
컴포넌트 안의 로고·아이콘은 `../../asset/...` / `../../common/assets/...`입니다.

- 경로 해석 전수 검사: **10개 페이지 × (슬롯 2개 + 컴포넌트 내부 12개 경로) 전부 실제
  파일로 해석됨.** (`pages/yultest/index.html`은 빈 껍데기라 슬롯 없음)
- **하위 경로 배포 검증**: 상위 폴더를 서빙해 사이트를 `/tchaikimm/` 아래에 두고
  (GitHub Pages `/저장소이름/`과 같은 상황) main · shop · col_chaikim ·
  bespoke/reservation_done · yultest_move 다섯 페이지를 열었습니다.
  **다섯 페이지 모두 헤더·푸터 주입 성공, 로고 로드 성공, 깨진 이미지 0장.**
  로고가 `/tchaikimm/asset/logos/header_logo-02.svg`로, 메뉴 링크가
  `/tchaikimm/pages/shop/index.html`로 해석됐습니다 — 루트였다면 전부 404 날 자리입니다.

### 고친 것: 문서만 루트로 적혀 있었습니다

`docs/COMMON_SYSTEM.md`의 헤더/푸터 슬롯 예제가 `data-component="/common/components/header.html"`
였습니다. **코드는 `../../`인데 문서만 `/`**였고, 이걸 보고 새 페이지를 만들면 하위 경로
배포에서 헤더가 사라집니다. 예제를 상대경로로 고치고 금지 규칙을 명시했습니다.

### 헤더 작업 전에 알아야 할 제약

- **컴포넌트 안의 경로는 컴포넌트 파일이 아니라 "불러가는 페이지" 기준으로 풀립니다.**
  `fetch` 후 `innerHTML` 주입이라 그렇습니다.
- **그래서 모든 페이지는 `pages/<페이지>/` 한 단계 깊이여야 합니다.**
  `common/js/common.js`의 `HEADER_LOGO_BLACK`(96행) / `HEADER_LOGO_WHITE`(97행)도
  `../../asset/logos/...`로 고정입니다. 저장소 루트의 `index.html`이나
  `pages/shop/detail/` 같은 다른 깊이에 페이지를 만들면 **헤더 로고·아이콘이 깨집니다.**
  깊이를 바꾸려면 `header.html`·`footer.html`과 `common.js` 로고 상수를 같이 고쳐야 합니다.
- 저장소 루트에는 아직 `index.html`이 없습니다(`index_origin.html`만 있음).
  배포용 루트 진입 페이지를 만들 때 위 깊이 제약에 걸립니다.

### 확인하지 못한 부분

- `file://`로 직접 여는 경우는 여전히 헤더가 뜨지 않습니다. `fetch`가 막히기 때문이며
  경로와 무관한 제약입니다(문서에 이미 명시돼 있음).
- 실제 배포 서버(GitHub Pages 등)에서의 확인은 하지 못했습니다. 로컬에서 하위 경로
  상황을 재현해 검증한 것입니다.


## yultest_move detail — 헤더와 사진 사이 여백 축소 (2026-08-08)

`.detail_head`와 `.detail_img`가 520.8px(1920 기준)이나 떨어져 있어 한 섹션으로
읽히지 않았습니다. **변경 파일은 `pages/yultest_move/css/main.css`의 `.detail_stage`
하나뿐입니다.**

원인은 `margin-block: clamp(160px, 24vw, 470px)` — 위아래에 같은 값이 걸려 있었습니다.
`.detail`의 `gap: 60px`에 위쪽 460.8px이 더해진 것입니다.

**이 여백은 지울 수 없습니다.** `.detail_text` / `.detail_zoom`이 이미지 밖으로
겹쳐 걸리기 때문에 자리를 비워둬야 합니다. 다만 **실제 돌출량이 필요치의 3배였습니다.**

| 방향 | 가장 많이 나온 요소 | 실측 돌출 | 기존 여백 |
|---|---|---|---|
| 위 | `.detail_text[data-part="sleeve"]`(`top: -25.83%`) | 159.2px | 460.8px |
| 아래 | `.detail_text[data-part="skirt"]`(`top: 106.61%`) | 189.6px | 460.8px |

위/아래를 분리해 **위쪽만** `clamp(120px, 9.6vw, 190px)`으로 줄였습니다.
아래쪽(`clamp(160px, 24vw, 470px)`)은 다음 섹션과의 간격이라 손대지 않았습니다.

- **9.6vw는 임의값이 아닙니다.** 위 돌출량은 스테이지 높이(= 폭 `76.04%` × `1905/4380`)
  기준 25.83%라 화면 폭의 **약 8.6vw**로 폭에 비례해 커집니다. 고정 px로 두면
  넓은 화면에서 sleeve 설명이 헤더를 파고듭니다. 9.6vw는 거기에 여유를 둔 값입니다.
- 더 붙이고 싶으면 이 숫자만 낮추면 되지만 **8.6vw 아래로는 내리면 안 됩니다.**

### 검증 (localhost:5621, python3 http.server)

| 폭 | 헤더 → 사진 (전 → 후) | `margin-top` | sleeve 글이 헤더와 벌어진 거리 |
|---|---|---|---|
| 1920 | 520.8 → **244.3** | 184.3px | 85.1px |
| 1280 | — → **182.9** | 122.9px | 78.1px |
| 768 | — → **180.0** | 120px | 119px |

- 네 폭 모두 호버 시 글·확대컷이 `.detail_head`를 침범하지 않습니다(위 표 마지막 열, 전부 양수).
- `.detail` 섹션 안에서 화면 밖으로 나가는 요소 **0개**.
- 아래쪽 돌출(189.6px)은 그대로라 다음 섹션과의 관계는 변하지 않았습니다.

### 확인하지 못한 부분

- **이번 세션도 미리보기 패널이 크림색 빈 화면만 합성해 화면 캡처를 못 했습니다**
  (이전 세션들과 같은 증상). 위 수치는 전부 `getBoundingClientRect` 측정입니다.
  **눈으로 보는 간격 균형은 사용자가 직접 확인해야 합니다.**
- 1920에서 `.promo_media` / `.promo_media_video`가 화면 오른쪽으로 57px 넘칩니다.
  **이번 변경과 무관한 기존 문제**입니다(수정 전에도 같은 값). detail 섹션 밖입니다.
- 1280 이하의 가로 스크롤은 ScrollTrigger pin-spacer가 창 크기 변경 후
  이전 폭을 그대로 들고 있어서 생긴 것으로, 새로고침하면 사라집니다.


## Bespoke 메인 1920×1080 시안 정렬 — 2026-08-07

발표 PC(1920 × 1080 / 배율 100%) 기준으로 `pages/bespoke/index.html`을
Figma `1745:12160`(1920 × 10438.68)에 맞췄습니다.

**변경 파일은 `pages/bespoke/css/bespoke.css` 하나뿐입니다.**
`bespoke.css`는 `index.html`만 불러옵니다 — `reservation.html`·`reservation_done.html`은
`bespoke_base.css`를 쓰므로 영향이 없습니다. 공통 파일(`common/`)은 건드리지 않았습니다.

### 결정적 단서: 에셋이 이미 시안 크기였습니다

저장소 이미지가 전부 시안 원본 크기로 내보내져 있는데 CSS가 비율(%)로 늘리거나
줄이고 있었습니다. 앞으로도 크기가 의심되면 **에셋 원본 크기를 먼저 재보세요.**

| 에셋 | 실제 크기 | 고치기 전 렌더 |
|---|---|---|
| `philosophy.png` | 1920×1000 | 1905×720 (잘림) |
| `atelier.png` | 554×648 | 672×786 (늘어남) |
| `consultation.png` | 853×960 | 800×900 |
| `silk.png` | 180×200 | ~155×172 |
| `material.png` | 500×600 | 517×621 |
| `reservation_section.png` | 1700×650 | 1728×661 |

### 구조

파일 맨 끝에 `@media (min-width: 1840px)` 블록 하나로 몰아넣었습니다.
Shop 발표용 블록과 같은 방식이라 **주석부터 파일 끝까지 지우면 되돌아갑니다.**

- **왜 1280이 아니라 1840인가.** 이 블록의 값은 1920 캔버스 기준 절대 px이고,
  1700 컨테이너가 들어가려면 1700 + gutter 64×2 = **1828px**이 필요합니다(여유 12px).
  1280에 걸었더니 실제로 둘이 깨졌습니다 — begin 카드 3장(500×3 + 76×2 = 1652)이
  콘텐츠 폭 1152를 넘어 **가로 스크롤 194px**, process 목록이 727 → **404px**까지
  줄어 단계 설명이 여러 줄로 무너짐. **1280~1839px 구간은 기존 레이아웃 그대로입니다.**
- 1920 창은 스크롤바를 뺀 실제 폭이 1905px이라 이 블록이 걸립니다.

### 가로: 1700 컨테이너 — 세 섹션만

시안의 오른쪽 끝은 ~1810으로 일정한데 왼쪽 끝은 90 / 93 / 110 / 134 / 140 / 160으로
제각각입니다. 예약 페이지에서 이미 내린 "컨테이너 기준으로 통일" 결정을 유지하되,
**콘텐츠가 1600을 넘는 세 섹션만** 1700으로 넓혔습니다(process 1680 / fabric 1719 /
begin 카드 1652). hero·philosophy·atelier·quote는 시안이 160 근처라 공통 1600 그대로입니다.

- 고정폭은 전부 `flex: 0 1 <시안값>`입니다(`0 0` 아님). 1840 게이트가 폭을 보장하지만
  확대·경계에서 넘치지 않게 하는 안전장치입니다.
- **`.process_image`는 `flex: 1 1 0`이어야 합니다.** 기본값 `1 1 auto`는 이미지의
  고유 폭을 basis로 주장해서, 줄어들 수 있는 목록(`0 1 727px`)을 479px까지 밀어냅니다.
  실제로 이 버그를 겪었고 basis 0으로 고쳤습니다.
- **`.process_list`의 727px은 임의값이 아닙니다.** 03번 설명이 시안에서 정확히 727px
  한 줄입니다. 720px로 두면 폰트 로딩에 따라 두 줄로 넘어가 단계 높이가 무너집니다.
- **`.materials_body`의 gap만 시안(73)과 다릅니다(54).** 시안 그대로면 1719px라
  1700을 19px 넘겨서 이 한 곳에서 줄였습니다. 그래야 스와치가 정확히 180×200이 됩니다.

### 세로: 섹션별 결과

| 프레임 | 시안 | 적용 후 | 차이 |
|---|---|---|---|
| Header | 96 | 66 | **−30** (공통 파일, 손대지 않음) |
| hero | 1800 | 1799 | −1 |
| philosophy | 1000 | 1000 | 0 |
| atelier | 1000 | 1000 | 0 |
| designer_quote | 588 | 588 | 0 |
| process_section | 1505 | 1504 | −1 |
| fabric_section | 1408 | 1408 | 0 |
| reservation_section | 650 | 650 | 0 |
| begin | 1360 | 1358 | −2 |
| Footer | 1031.7 | 1041 | +9 |
| **전체** | **10438.7** | **10414** | **−24.7** |

주요 판단:

- **philosophy 제목은 48px이 아니라 64px입니다.** 이 프레임은 Figma에서 자식이 없는
  단일 프레임이라 글이 이미지에 구워져 있어 타입 스펙을 읽을 수 없습니다.
  스크린샷 실측으로 정했습니다 — "Only your measurements,"가 시안에서 808px인데
  48px로는 603px, 64px로 804px입니다. `line-height`도 1.25 → 1.13(히어로 제목과 동일).
  `.philosophy_body`의 `max-width`를 840px로 올려야 그 줄이 접히지 않습니다.
- **`.process_step`의 `padding-bottom`은 40이 아니라 39입니다.**
  `border-bottom: 1px`이 높이에 더해집니다. 24+21+30+21+24+39+1 = 160.
- **reservation은 시안에서 위아래 섹션과 딱 붙어 있습니다**(fabric 끝 7397 =
  reservation 시작 7397). 그래서 세로 padding이 0이고, 간격은 이웃 섹션의 padding이
  만듭니다. 왼쪽 215px은 밴드 왼쪽 끝에서 글까지의 거리(1:1 스크린샷 실측).
- **`.begin_card_bg`의 opacity를 0.3 → 1로 올렸습니다.** `material`·`timeline`·
  `contact.png`는 **이미 흐리게 처리된 상태로 저장돼 있어** 0.3을 또 곱하면 사진이
  거의 보이지 않습니다. 반대로 `philosophy.png`·`reservation_section.png`는 원본
  강도라 기존 0.6을 그대로 뒀습니다.

### 검증 (localhost:5611)

- 섹션 높이 10개 중 8개가 시안과 **오차 2px 이내**(위 표). 요소 크기도 일치:
  atelier 이미지 554×648, process 단계 160 / 목록 727×960, 스와치 180×200,
  begin 카드 500×600, 예약 버튼 340×79, philosophy 제목 804px.
- **1920 / 1855 / 1854 / 1700 / 1280 / 768 / 360 일곱 폭에서 가로 스크롤 0**,
  넘치는 요소 0개. 1840 게이트 경계 양쪽 모두 확인.
- `bespoke.css` 규칙 148개(미디어 블록 14개), 파서가 버린 규칙 0, 빈 규칙 0.
- 깨진 이미지 0장. 404는 아래 히어로 영상 하나뿐이고 나머지 요청은 전부 200.

### 남은 문제

1. **히어로 영상이 없습니다.** `index.html:41`이 `assets/main/bespoke_main.mov`를
   가리키는데 파일이 없습니다(404). 사용자 지시로 이번에는 그대로 뒀습니다.
   저장소를 뒤졌지만 **시안의 히어로 장면(자수 원단 위 안경 클로즈업)과 맞는 파일이
   없습니다.** 후보와 실제 내용: `asset/main/bespoke/bespokevod.mp4`(흰 한복 걷는
   아틀리에) / `asset/main/hero/bespoke.mp4`(옆얼굴) / `asset/main/hero/bespoke.png`
   (검은 배경 착장) — 셋 다 다른 장면입니다.
2. **헤더가 시안보다 30px 낮습니다**(66 vs 96). `common/css/layout.css`의 공통
   컴포넌트라 Main·Shop·Collection·Shop Detail·예약 페이지가 같이 바뀝니다.
   위 전체 차이 −24.7px은 대부분 이것입니다.
3. 1280~1839px 구간은 시안 리듬이 아닌 기존 레이아웃입니다(의도된 것).

### 확인하지 못한 부분

- **이번 세션도 Browser 미리보기 패널이 온전히 표시되지 않아 화면 캡처가
  일부만 합성됐습니다.** 위 수치는 전부 `getBoundingClientRect` 측정입니다.
  **시안과 눈으로 비교하는 것은 사용자가 직접 해야 합니다**
  (`http://localhost:5611/pages/bespoke/index.html`).
- 실제 마우스 hover, 스크롤 감각, 스크린리더 낭독.

### philosophy 스크롤 인터랙션 (2026-08-07)

`css/bespoke.css`와 `js/bespoke.js`에 등장 + 패럴랙스를 넣었습니다. HTML은 그대로입니다.

**GSAP + ScrollTrigger를 씁니다.** 이 페이지가 이미 둘 다 불러오고 있고 `common.js`가
Lenis를 GSAP 티커·ScrollTrigger에 연결해 둬서 scrub이 부드럽게 따라옵니다.
같은 파일의 process 섹션은 IntersectionObserver를 쓰는데, **패럴랙스는
스크롤 위치에 비례하는 연속 이동이라 IO로는 만들 수 없어** 방식이 다릅니다.

- **등장**: `.philosophy_title` → `.philosophy_desc` 순서로 `y 72 → 0`,
  `opacity 0 → 1`. `power3.out`, 1.25초, 시차 0.26초. 배경은 조금 더 길게(×1.3)
  `power2.out`으로 따라옵니다. `once: true`라 한 번만 재생됩니다.
  `gsap.from()`이라 **끝값은 CSS가 정한 값 그대로**입니다(배경 불투명도 0.6을 알아서 읽음).
- **패럴랙스**: 섹션이 화면을 지나가는 동안(`top bottom` → `bottom top`)
  배경을 `y -110 → +110`, `scrub: true`, `ease: "none"`.
  페이지가 올라가는 만큼 배경이 아래로 상쇄돼 배경이 더 천천히 지나갑니다.

#### ★ 등장이 화면 밖에서 다 끝나던 문제 (2026-08-07 수정)

사용자가 "인터랙션이 있는지 모르겠다"고 해서 재보니 **등장이 화면 밖에서
전부 재생되고 있었습니다.**

트리거를 **섹션**에 걸고 `start: "top 78%"`로 뒀는데, 섹션은 1000px이고 글은
그 한가운데(`align-items: center`)에 있습니다. 그래서 섹션 윗변이 화면 78%
지점에 닿는 순간 글은 아직 **화면 아래 72px 밖**에 있었습니다(1080 기준
글 상자 top 1152). 시작 시점 노출 **0%**. atelier도 똑같은 이유로 0%였습니다.

**고친 방법: 트리거를 `.philosophy_body`(글 상자)로 옮겼습니다.**
`start: "top 82%"`는 이제 "글 상자의 윗변"을 기준으로 하므로, 시작 시점에
글의 51%가 이미 화면 안에 있습니다(360px에서는 35%).
**세로 중앙 정렬된 글에 섹션 기준 start를 쓰면 안 됩니다.**

같은 김에 강도도 올렸습니다 — 이동 30 → 72px, 시차 0.18 → 0.26초,
길이 1.1 → 1.25초, 패럴랙스 총 이동 160 → 220px.

#### 이 인터랙션에서 반드시 지켜야 하는 것

1. **배경의 등장 이동은 `y`가 아니라 `yPercent`입니다.** 같은 요소의 `y`를
   패럴랙스가 계속 쓰기 때문입니다. GSAP은 `y`와 `yPercent`를 따로 들고 있다가
   더해서 그리므로 두 트리거가 서로를 덮어쓰지 않습니다.
2. **`--philosophy_parallax_overscan`은 두 이동량의 합보다 커야 합니다.**
   배경을 밀면 섹션 위/아래에 빈 줄이 드러나므로 미리 이미지를 키워 둡니다.
   처음에 96px(패럴랙스 80만 고려)로 뒀다가 실제로 걸렸습니다 — **등장이 끝나기 전에
   빠르게 스크롤하면 합이 109.8px이 되어 섹션 위에 약 14px 빈 줄이 보입니다.**
   패럴랙스를 110으로 올리면서 **128 → 176px**로 같이 올렸습니다
   (110 + 배경 등장 34 = 144 < 176). JS 상수를 바꾸면 이 값도 같이 확인해야 합니다.
   - **대가: 배경이 더 잘립니다.** overscan이 커지면 배경 상자가 세로로 길어지고
     `object-fit: cover`가 그만큼 좌우를 잘라냅니다. 1905px 화면에서
     한쪽 **253px → 345px**(상자 1905×1256 → 1905×1352). 배경 구도가
     마음에 안 들면 `PHILOSOPHY_PARALLAX_SHIFT`를 80, overscan을 128px로
     되돌리면 됩니다.
3. **`.is_motion_ready` class가 게이트입니다.** JS가 붙입니다. GSAP·ScrollTrigger가
   없거나 모션 감소 설정이면 붙지 않고 CSS 레이아웃 그대로 보입니다
   (hero_gallery의 `is_ready`와 같은 방식). class를 떼면 배경이 다시
   `top: 0 / height: 100%`로 섹션에 딱 맞는 것을 확인했습니다.

조절값은 `js/bespoke.js`의 philosophy 블록 상단에 모여 있습니다:
`PHILOSOPHY_RISE`(72) `PHILOSOPHY_BG_RISE`(2.5%) `PHILOSOPHY_DURATION`(1.25)
`PHILOSOPHY_STAGGER`(0.26) `PHILOSOPHY_START`("top 82%") `PHILOSOPHY_PARALLAX_SHIFT`(110).

#### 검증

- **시작 시점 노출**: 1905px에서 글 상자 top 1152 → **886**, 노출 0% → **51%**.
  360px에서도 35% 노출(이전 0%).
- 등장 값: 제목·본문 `y 72 → 0`, `opacity 0 → 1`, 총 1.51초.
  진행도 0.45에서 제목 (3.1px, 0.96) / 본문 (14px, 0.81) — 시차가 눈에 띕니다.
- 패럴랙스 `y -110 → +110`(총 220px), `ease: "none"` 등간격 확인.
- **배경 빈틈 0**: 패럴랙스 양 끝과 등장 시작 상태를 겹친 최악의 경우에도
  배경이 섹션 밖으로 top −32.2px / bottom −99.8px 더 나가 있습니다(음수 = 덮고 있음).
  360px에서도 −44.7 / −87.3.
- 섹션 좌표 8개 전부 시안값 그대로, 문서 높이 10414, 가로 스크롤 0,
  콘솔 오류 0, 실패한 요청 0건.
- **확인하지 못한 부분**: 숨겨진 탭이라 `requestAnimationFrame`이 돌지 않아
  타임라인을 직접 진행시켜 측정했습니다. **실제로 흐르는 모습과
  속도감은 사용자가 직접 봐야 합니다.** `prefers-reduced-motion: reduce` 환경의
  실제 동작도 실행해 보지 못했습니다(`gsap.matchMedia()`가 되돌리도록 작성).

### atelier 사진 확대 + 글자 등장 (2026-08-07)

같은 날 세 번 고쳤습니다. **① pin + 전체화면 확대 → ② 사진만 1.06 미세 확대
→ ③ 확대 1.18로 강화 + 글자 하나씩 등장.** 지금은 ③입니다.
`css/bespoke.css`와 `js/bespoke.js`만 바꿨고 HTML과 `common/`은 그대로입니다.

2단 레이아웃·여백·타이포그래피·섹션 높이가 전부 그대로입니다.
섹션 좌표가 시안 검증값과 정확히 일치합니다 — hero 1799 / philosophy 1000 /
atelier 1000 / quote 588 / process 1504 / materials 1408 / reservation 650 /
begin 1358, 문서 높이 10414.

#### 1) 사진 확대 — `scale 1 → 1.18`, scrub

**처음엔 1.06이었는데 화면에서 너무 약해서 1.18로 올렸습니다.**
1.06은 가장자리가 33×39px 자라는 것이라 스크롤 중에 알아채기 어려웠습니다.
1.18은 **100×117px**이라 분명히 보입니다.

1. **키우는 대상은 상자가 아니라 안쪽 `img`입니다.** `.atelier_image`를 키우면
   flex 형제인 `.atelier_body`를 밀어냅니다. `img`는 상자의
   `overflow: hidden`에 잘리므로 아무리 키워도 레이아웃이 움직이지 않습니다.
2. **시작 배율을 1보다 작게 두면 안 됩니다.** `img`가 `object-fit: cover`로
   상자를 꽉 채우고 있어서 1 미만이면 가장자리에 빈 줄이 드러납니다.
3. **"또잉"을 bounce로 만들지 않았습니다.** 레퍼런스(verostudio.com)의 이징
   변수가 `--ease-out-quint: cubic-bezier(.22, 1, .36, 1)`이고 overshoot가
   없습니다. 대신 `power2.out`(끝으로 갈수록 느려짐) + `scrub: 1.2`(스크롤을
   멈춰도 조금 더 따라와 멎음)로 여운을 만듭니다.

#### 2) 글자 등장 — 제목 → 리드 → 본문 한 줄기 물결

JS가 텍스트 노드를 단어 상자(`.atelier_word`) → 글자 상자(`.atelier_char`)로
나누고, `yPercent 50 → 0` + `opacity 0 → 1`을 `stagger`로 흘려보냅니다.
`<br>`과 공백은 건드리지 않아 시안 줄바꿈이 그대로 남습니다.

1. **`stagger: { amount }`를 씁니다(`each` 아님).** `each`는 글자 수에 비례해
   길어져서 본문(109자)이 제목(10자)보다 열 배 넘게 걸립니다. `amount`는
   글자가 몇 개든 전체를 정해진 시간 안에 흘려보내 문구를 고쳐도 리듬이 같습니다.
2. **`once: true`입니다.** 본문은 읽는 글이라 scrub으로 묶으면 스크롤 위치에
   따라 반쯤 지워진 상태로 멈춰 읽기가 어렵습니다. 사진 확대만 scrub입니다.
2-1. **트리거는 섹션이 아니라 `.atelier_body`(글 상자)입니다.** 섹션에 걸었더니
   글이 아직 화면 아래 116px 밖에 있을 때 시작해서 다 끝나 버렸습니다
   (시작 시점 노출 **0%**, 사용자 지적: "읽기도 전에 모션이 끝나 있다").
   글 상자 기준 `"top 82%"`로 바꿔 시작 시점에 글의 66%가 화면 안에 있습니다
   (360px에서는 50%). philosophy도 같은 이유로 같이 고쳤습니다.
3. **단어 상자가 반드시 필요합니다.** 글자마다 inline-block을 주면 줄바꿈이
   글자 사이 어디에서나 일어나 단어가 중간에서 끊깁니다.
4. **글자에 `will-change`를 주지 않습니다.** 이 섹션 글자가 127개인데 전부
   합성 레이어로 올리면 얻는 것보다 잃는 것이 큽니다.

##### ★ 글자 분할이 줄 수를 바꾸는 문제 (실제로 겪음)

글자를 inline-block으로 만들면 글자마다 폭이 소수점에서 올림돼 줄이 조금
넓어집니다. 실측:

| 방식 | `.atelier_lead` 자연 폭 | 상자 509px에 |
|---|---|---|
| 원본 | 508.23px | 들어감 (여유 0.77px) |
| 글자 단위 | 510.97px (**+2.74**) | **넘침 → 두 줄(32 → 64px)** |
| 단어 단위 | 508.34px (+0.11) | 들어감 |

그래서 `splitAtelierText()`가 **나눈 뒤 높이를 재서 줄이 늘었으면 단어 단위로
되돌립니다.** 값을 박아두지 않았으므로 폭·폰트가 달라도 시안 줄 수가 유지됩니다.
실제로 1905px에서는 `.atelier_lead`만 단어 단위로 내려가고
(제목 10자 / 본문 109자는 글자 단위), 753px·360px에서는 세 블록 모두 글자
단위가 됩니다.

**분할은 `document.fonts.ready` 이후에 합니다.** 시스템 폰트로 재면 줄 폭이
달라서 이 판단이 뒤집힙니다.

조절값은 `js/bespoke.js`의 각 블록 상단에 있습니다:
`ATELIER_ZOOM_TO`(1.18) `ATELIER_ZOOM_START`("top 85%")
`ATELIER_ZOOM_END`("bottom 65%") `ATELIER_ZOOM_SCRUB`(1.2)
`ATELIER_ZOOM_EASE`("power2.out") /
`ATELIER_TEXT_RISE`(50) `ATELIER_TEXT_DURATION`(0.8)
`ATELIER_TEXT_SPREAD`(1.2) `ATELIER_TEXT_START`("top 82%", 기준은 `.atelier_body`).

**둘 다 폭 조건이 없습니다.** 좁은 화면에서 사진이 위로 쌓여도 확대분은 여전히
상자 안에서만 일어나므로 1-column에서도 그대로 씁니다.

#### 검증 (localhost:5612)

- **pin 흔적 0**: pin 트리거 0개, pin-spacer 0개, 문서 높이 10414(시안값).
- **확대 곡선**(진행도 0→1, 0.25 간격): 1 / 1.1041 / 1.1575 / 1.1772 / 1.18.
  구간 1216px. 최대에서 사진 653.7×764.6, 상자는 554×648 그대로.
- **상자 밖으로 안 나감**: 상자 오른쪽 안쪽 3px은 `img`, 바깥 6px은
  `section.atelier`(크림 배경). 글 영역(x=1000)은 언제나 글(`span.atelier_word`)이고
  사진이 잡히지 않습니다. `.atelier_body` left 907 / width 509 고정.
- **되감기**: 시작 앞으로 올리면 배율 정확히 1.0.
- **글자 물결**(진행도 0 / 0.35 / 0.7 / 1, 총 2.0초): 첫 글자 `(0,50) → (1,0)`,
  가운데 `(0,50) → (0.41,29.3) → (1,0)`, 마지막 `(0,50) → (0.68,15.8) → (1,0)`.
  겹치지 않고 순서대로 넘어갑니다. 단위 127개.
- **줄 수 보존**: 1905 / 753 / 360 세 폭에서 세 블록 모두 **쪼갠 뒤 높이가
  원본과 정확히 같음**(1905: 72/32/128, 753: 41/26/102, 360: 41/51/128).
  `.atelier_body` 높이도 292로 원본과 동일.
- **반응형**: 753px 상자 673×787(화면의 89%×77%), 360px 상자 320×374(89%×51%)
  — 어느 폭에서도 사진이 화면을 채우지 않고, **가로 스크롤 0**, 되감기 정상.
- **읽히는 글 보존**: `textContent`가 원문 그대로("The Atelier",
  "Every garment passes through the same hands, from pattern to final press.
  Our tailors work in small batches, by appointment only."), `<br>` 3개 유지.
- `node --check js/bespoke.js` 통과. CSS 규칙 154개, 버려진 규칙 0, 빈 규칙 0.
  콘솔 오류 0, 실패한 요청 0건, 깨진 이미지 0장.
- 다른 섹션: 트리거는 philosophy 3개 + atelier 2개뿐이고 섹션 좌표가 전부
  그대로라 영향 없음.

#### 남은 문제

- **글자/단어 판단은 로드 시점에 한 번만 합니다.** 좁은 창에서 열어
  `.atelier_lead`가 글자 단위로 잡힌 뒤 창을 1905px로 넓히면 그 줄이 두 줄로
  넘어갑니다. 실제 사용자는 자기 화면 폭으로 로드하므로 세 폭 모두 정상이고,
  창을 넓히는 데스크톱 한정 경우입니다. 고치려면 `resize`에서 같은 높이 검사를
  다시 돌려 **글자 → 단어 방향으로만** 내리면 됩니다(단어 단위는 어느 폭에서도
  안전하므로 되올릴 필요가 없습니다).
- 글자 span에 ARIA를 붙이지 않았습니다. 접근성 트리는 inline 요소의 글을
  이어 붙여 읽으므로 `textContent` 그대로 낭독될 것으로 보지만,
  **실제 스크린리더로 확인하지 못했습니다.**

#### 확인하지 못한 부분

- **이번 세션도 Browser 미리보기 패널이 표시되지 않아 화면 캡처를 못 했습니다**
  (`Screenshot timed out: the pane is not compositing frames`). 위 수치는 전부
  `getBoundingClientRect` / `elementFromPoint` 측정입니다.
- 숨겨진 탭이라 `requestAnimationFrame`이 돌지 않아 타임라인을 직접
  진행시켜 쟀습니다. **확대의 세기(1.18), scrub 여운(1.2초), 글자가 흐르는
  속도(2.0초)의 실제 체감은 사용자가 직접 봐야 합니다.**
  세면 `ATELIER_ZOOM_TO`를 1.12로, 글자가 느리면 `ATELIER_TEXT_SPREAD`를
  0.8로 줄이면 됩니다.
- `prefers-reduced-motion: reduce` 환경의 실제 동작(philosophy와 동일한
  `gsap.matchMedia()` 게이트로 작성. class를 떼면 span이 평범한 inline이 되어
  원래 글과 똑같이 흐르는 것은 CSS 구조로 보장됩니다).
### 이 세션의 환경 메모

- 정적 서버 포트를 **5612**로 옮겼습니다. 다른 세션의 서버가 5611을 잡고 있어
  충돌했습니다. `.claude/launch.json`의 `tchaikimm_node`가 이 세션 스크래치패드의
  `serve.js`를 가리키므로 **다른 세션에서는 스크립트를 다시 만들어야 합니다.**
- **Figma MCP**: 프로젝트 `.mcp.json`에 `figma-desktop`
  (`https://mcp.figma.com/mcp`, OAuth 필요)을 등록했습니다.
  이 파일은 저장소에 커밋되므로 팀원마다 승인 창이 뜹니다.
- `.claude/launch.json`의 기존 두 설정(`python3` / `py`)이 이 PC에서 실행되지
  않습니다(`spawn ENOENT`). node 기반 `tchaikimm_node`를 추가했습니다.
  스크립트는 **세션 스크래치패드의 `serve.js`**라 다른 세션에서는 다시 만들어야 합니다.


## Bespoke 페이지 묶음 (`pages/bespoke/`) — 2026-08-07

Bespoke는 **한 폴더 안에 세 페이지**가 들어 있습니다. 다른 화면(shop / shop_detail)처럼
페이지마다 폴더를 나누지 않았습니다. 세 페이지가 에셋과 기본 틀을 함께 쓰기 때문입니다.

| 파일 | 화면 | Figma 노드 |
|---|---|---|
| `index.html` | Bespoke 메인 | `1745:12160` (1920 × 10438) |
| `reservation.html` | 예약 폼 | `1745:11901` (1920 × 7773) |
| `reservation_done.html` | 예약 완료 | `1745:12131` (1920 × 3637) |

### 기본 틀 `css/bespoke_base.css`

세 페이지가 함께 쓰는 레이어입니다. **두 페이지 이상이 쓰는 것만** 여기에 둡니다.
불러오는 순서는 `common/css/*` 4개 → `bespoke_base.css` → 페이지 CSS입니다.

들어 있는 것: 타이포 스케일(`--bespoke_fs_hero` / `_section` / `_card`), 섹션 리듬과 머리말
(`.bespoke_section_head` = eyebrow + title + desc), 선택 카드(`.bespoke_choice`),
버튼(`.bespoke_button`), 크로스링크(`.bespoke_crosslink`), 폼 컨트롤(`.bespoke_field`),
체크박스(`.bespoke_check`), 정보 그리드(`.bespoke_info_grid`), 진행 단계 띠(`.bespoke_steps`).

- **선택 카드는 `<label>` + 숨은 `<input type="radio">`입니다.** 버튼 + `aria-pressed`로 직접
  만들지 않았습니다. 라디오를 쓰면 화살표 키 이동, 그룹 읽기, 폼 전송이 브라우저 기본으로 됩니다.
  선택 상태는 `:has(.bespoke_choice_input:checked)`가 칠합니다. `.is_selected` class도 같이
  받아들이도록 두었으니 JS로 다뤄야 할 때 쓰면 됩니다.
- **상태를 HTML class로 박아두면 안 됩니다.** 회의 방식 버튼 두 개는 마크업에서 둘 다
  `is_secondary`이고, 켜진 쪽만 CSS가 딥그린으로 바꿉니다. 처음에 한쪽을 `is_primary`로
  적어뒀다가 JS 없이는 선택이 안 바뀌는 걸 발견해 고쳤습니다.
- **선택을 색으로만 알리지 않습니다.** `.bespoke_choice_mark`가 선택된 카드에만 글자를 펴서
  읽기 도구와 흑백 화면에서도 구분됩니다.
- 폭 기준은 `.common_container`(최대 1600px)입니다. Figma 1920 캔버스의 콘텐츠 폭이 정확히
  1600이라 그대로 맞습니다. 시안의 절대좌표(141 / 159 / 138 등)는 컨테이너 기준(160)으로
  통일했습니다 — 페이지마다 좌측 시작점이 달라지는 것보다 낫다고 판단했습니다.

### 브레이크포인트

**세 페이지 모두 768px / 1280px 두 개만 씁니다.** 원래 메인은 640 / 1024 / 1280이 섞여
있었는데 640 → 768, 1024 → 1280으로 통일했습니다(13개 블록).

- 대가: **1024~1279px 구간에서 메인의 atelier / process / materials / begin이 가로 2열 대신
  세로로 쌓입니다.** 이전에는 1024부터 가로였습니다. 세 페이지 기준을 맞추는 쪽을 택했습니다.
  이 구간에서 가로 배치를 되살리려면 해당 블록만 1024로 되돌리면 됩니다.
- 1152px에서 확인했고 가로 스크롤은 없습니다.

### 시안과 다르게 판단한 것

- **Figma 카피 오타 2개를 고쳤습니다.** `tarting from six signature fabrics` → `Starting…`(첫 글자 누락),
  `So your designer can perpare` → `prepare`. 시안 그대로 두는 것보다 낫다고 봤습니다.
  되돌리려면 `reservation.html`의 fabric 설명과 03 구간 설명입니다.
- **"Both agreements above are required"를 버튼이 아니라 안내 문구로 만들었습니다.**
  시안에서는 405 × 70 버튼 모양 상자인데, 내용이 "두 동의가 필요하다"는 안내라 버튼으로 두면
  누를 수 있어 보입니다. `.bespoke_status`로 두고 두 체크박스가 모두 켜지면 사라집니다.
- **달력 날짜는 `<button>`, 시간·실루엣·원단·회의방식은 라디오입니다.** 날짜는 월 이동에 따라
  내용이 바뀌는 조작이라 버튼이 맞다고 봤습니다.
- 달력은 **2026년 8월 정적 마크업**입니다(8/1이 토요일, 시안과 동일). 이전·다음 달 버튼은
  자리만 있고 아직 동작하지 않습니다.

### 새로 추가한 공통 토큰 (`common/css/tokens.css`)

Figma 변수 세트를 프로젝트 이름 규칙으로 옮겼습니다. 기존 토큰은 건드리지 않았습니다.

`--color_surface`(#ffffff) `--color_surface_subtle`(#f5efe4) `--color_surface_muted`(#f2f2f1)
`--color_border`(#e2ddd5) `--color_border_disabled`(#c9c9c9) `--color_text_secondary`(#4a4a42)
`--color_text_muted`(#888880) `--color_text_subtle`(#aaaaaa) `--color_text_inverse`(#fffdf9)

> **주의**: `--color_text_secondary`(#4a4a42)는 기존 `--color_text_sub`(#2e2e2e)와 **다른 값**입니다.
> Figma가 두 단계를 따로 두고 있어 덮어쓰지 않고 나란히 뒀습니다.

### 에셋

새로 만들거나 내려받은 이미지는 없습니다. 저장소에 이미 있던 것을 그대로 씁니다.
`assets/reservation/` 9장이 Figma 크기와 정확히 일치합니다(실루엣 400×400, 원단 400×300),
`assets/map.png`도 1400×706으로 시안과 같습니다.
새로 받은 것은 `assets/icons/chevron_left.svg` 하나뿐이며, 다음 달 화살표는 같은 파일을
`transform: scaleX(-1)`로 뒤집어 씁니다.

### 검증 결과 (2026-08-07, localhost:5611)

- lint / test / build: 이 저장소에 `node`·`npx`·`package.json`이 없어 도구를 쓸 수 없습니다.
  대신 브라우저 파서로 검사했습니다.
- 요청 전부 200, 콘솔 오류 없음, 이미지 전부 로드.
- **360 / 768 / 1152 / 1280 네 폭에서 세 페이지 모두 가로 스크롤 0.**
- 초기 렌더가 시안과 일치: 8월 7일 = 딥그린 + 밝은 글씨, 실루엣 Jeogori 선택,
  시간 1:00 PM 선택, 회의 방식 Visit the Atelier 선택, 단계 띠 `position: sticky`.
- 선택 카드 색: 선택 `rgb(31,67,63)`(#1f433f) / 비선택 `rgb(245,239,228)`(#f5efe4).
- 완료 페이지 지도 비율 1.983 = 시안 1400/706과 동일. 외부 링크 2개 모두 `rel="noopener"`.
- 중복 id 0, alt 누락 0, 이름 없는 입력 0, legend 없는 fieldset 0,
  CSS 버려진 규칙 0, 빈 규칙 0.
- Tab 순서: 어긋나 보이는 11건은 전부 정상입니다 — 공통 헤더의 하위메뉴 순서,
  2열 레이아웃(달력을 다 돈 뒤 오른쪽 시간표로 이동), 공통 푸터 순서.

### 확인하지 못한 부분

- **이 세션의 미리보기 탭도 `document.hidden === true`입니다.** 그래서 **클래스나 `:checked`가
  바뀐 뒤의 다시 칠하기를 눈으로 보지 못했습니다.** 숨은 탭에서는 Chrome이 선택자 재매칭을
  건너뜁니다(인라인 스타일만 반영됨). 대신 DOM 상태(`element.matches(선택자)` = true)와
  CSSOM 규칙 내용을 직접 읽어 확인했고, 새로고침 후 초기 렌더 값은 전부 시안과 맞습니다.
  **실제로 카드를 눌렀을 때 색이 바뀌는 모습은 사용자가 직접 봐야 합니다.**
- 실제 마우스 hover, 스크린리더 낭독.
- 진행 단계 띠가 스크롤을 따라 현재 구간을 바꾸는 동작(IntersectionObserver). 로직은
  들어가 있으나 위와 같은 이유로 재생을 보지 못했습니다.

### Bespoke 다음 작업

1. **메인 히어로 영상이 깨져 있습니다** — `index.html`이 `assets/main/bespoke_main.mov`를
   가리키는데 **파일이 없습니다**(`MEDIA_ELEMENT_ERROR: Format error`). 기존 문제입니다.
   파일을 넣거나, Collection처럼 web용 mp4 + 포스터 이미지로 바꿔야 합니다.
2. 달력 이전·다음 달 버튼 동작
3. `.begin_card`의 "View Guide" / "View Process" 버튼과 "Contact" 링크 연결 (`href="#"` 상태)
4. 예약 폼의 선택 내용을 완료 페이지에서 다시 보여줄지 결정 (현재는 넘기지 않음)


## Collection 페이지 (`pages/col_chaikimyoungjin/`) — 2026-08-06

> **2026-08-06 폴더·파일 이름이 바뀌었습니다.** 아래 본문의 옛 경로를 이렇게 읽으세요.
> `pages/collection_test/` → `pages/col_chaikimyoungjin/`,
> `css/collection.css` → `css/col_chaikimyoungjin.css`,
> `js/collection.js` → `js/col_chaikimyoungjin.js`,
> `/asset/collection/` → 페이지 폴더 안의 `asset/`(같은 파일, 위치만 이동).
> 같은 레이아웃을 쓰는 자매 페이지 `pages/col_chaikim/`가 생겼습니다 — `docs/pages/col_chaikim.md`.

- 대상 화면: Figma `4조 한복판 - 차이킴` node `1710:3865`("col_chaikimyoungjin", 1920 × 9796.75).
- 범위: **데스크톱(1920) 우선**. 반응형(360 / 768 / 1280)은 다음 단계입니다.
- 파일: `index.html`, `css/collection.css`, `js/collection.js`, `assets/icons/arc.svg`(Figma 내보내기),
  `assets/icons/arrow_right.svg`(shop의 `banner_arrow.svg` 복사본).
- `showcase` 섹션에는 GSAP pin + scrub 스크롤 인터랙션이 들어 있습니다.
  아래 "Collection showcase 스크롤 인터랙션" 항목을 먼저 읽고 수정하세요.
- 공통 시스템 사용: `common/css/*` 4개 + `common/js/common.js`, header/footer 슬롯,
  `data-page="collection"` / `data-header-variant="black"`(시안의 `header-b` = 크림 배경 + 검은 글씨).
- 이미지는 복사하지 않고 `/asset/collection/`을 직접 참조합니다.
  이미 저장소에 커밋된 파일(총 220MB 이상)이라 페이지 폴더로 복사하면 중복되기 때문입니다.
  공백·한글·`#`이 든 파일명은 `%20` / `%23` 등으로 URL 인코딩해 두었습니다.
- 섹션 구성 (시안 y좌표 기준):
  1. `collection_hero` 0–1182 — `collection_film.mp4` 전체화면 재생 + 가운데 제목
  2. `showcase` 1182–4516 — `arc.svg`(검은 곡선) + 세로 그라디언트(#282828 → #fffdf9) 위에
     사진 7장과 "You Won't / Find This in / Ordinary Fashion" 세 줄이 시안 좌표대로 절대배치
  3. `archive` 4516–7271 — 왼쪽 연도 내비(sticky) + 2019 컬렉션 사진 5장 절대배치
  4. `asworn` 7271–8765 — "As worn" 제목 + 태그 5개 + 협업 카드 3장
- 시안 좌표를 그대로 쓰는 구간은 `.collection_frame`(1920px 고정, `margin-left: calc(50% - 960px)`로
  가운데 정렬)으로 감쌌습니다. `margin-inline: auto`는 프레임이 화면보다 넓으면 왼쪽으로 붙어서
  좌우가 비대칭으로 잘립니다.
- `.archive`는 `overflow: hidden` 대신 **`overflow-x: clip`**을 씁니다.
  `hidden`은 스크롤 컨테이너를 만들어 안쪽 `.archive_txt_area`의 `position: sticky`를 죽입니다.
- 사진 두 장(`showcase_photo_a`, `_b`)은 시안에서 회전되어 있습니다.
  회전 전 크기 269.223 × 386.768을 프레임 가운데 두고 각각 -15.55° / +13.07°로 돌립니다.
- `arc.svg`는 1960 뷰박스 안에 0~1920 구간만 그려져 있어 `width: 102.0834%`로 넓혀
  곡선이 화면 폭에 정확히 맞도록 했습니다. (`reset.css`의 `max-width:100%` 때문에 `max-width: none` 필요)

### Collection에서 시안과 다르게 판단한 것

- **As worn 가로 스크롤**: 시안의 카드 3개 폭 합계가 2475px로 캔버스(1920px)보다 넓어
  세 번째 카드 설명이 잘립니다. 처음에는 `.asworn_track`에 `overflow-x: auto`를 걸었지만,
  2026-08-06 아래 "As worn 흐르는 띠"로 바뀌었습니다(스크롤바 없음).
- **archive 왼쪽 컬럼 sticky**: Figma 레이어 이름이 `sticky`이고 높이가 내용(497px)보다 훨씬 큰
  2505px입니다. 의도로 보고 `position: sticky; top: 160px`으로 구현했습니다.
- **연도 내비 / 태그 동작**: 2019 외 연도와 태그 5개는 연결할 데이터가 없어 `href="#"` 정적 링크입니다.
  (기존 프로젝트 정책과 동일)
- **본문 줄바꿈**: 시안의 카드 설명은 Figma에서 줄이 나뉘어 있지만, 289px 폭 안에서 자연 줄바꿈되도록
  한 문장으로 넣었습니다. 그래서 `asworn` 섹션 높이가 시안 1494 → 실제 1509px입니다.
- **본문 색**: 시안은 `#000000`이지만 기존 토큰 `--color_text`(#0a0a0a)를 사용했습니다.
  (korea 섹션·롤링 텍스트와 같은 판단)

### Collection 검증 결과 (2026-08-06, 1920 × 1000)

- 실행: `.claude/launch.json`의 `tchaikimm`(PowerShell 정적 서버, http://localhost:5610, 저장소 루트 서빙).
  Range 요청을 지원해야 191MB 영상이 재생됩니다. 스크립트는 세션 스크래치패드에 있습니다.
- lint / test / build: 설정된 도구 없음 — 실행하지 않았습니다.
- 좌표 일치(전부 시안과 동일): hero 0–1182 / showcase 1182–4517 / archive 4517–7272,
  showcase 사진 7장 (95,1429) (1451,1497) (605,2432) (1398,2695) (138,2867) (1391,3325) (371,3522),
  archive 사진 5장 (710,4714) (1054,5144) (566,5638) (1208,6011) (547,6460),
  문장 3줄 (760,1894) (1026,2011) (760,2123), 연도 목록 높이 235px, Reverse Now y=5333.8.
- 타이포그래피 계산값이 Figma 스타일과 일치: Trirong 64/600 ls -1.28, Trirong 48/600 ls -0.48,
  Montserrat 300/16 · 600/25 · 500/16 ls 1.28 · 400/14 lh 1.2 · 600/11 ls 2.42.
- 회전 행렬 확인: -15.55° / +13.07°, 회전 전 크기 269.22 × 386.77.
- 이미지 32장 전부 로드(`naturalWidth > 0`), 영상 재생 확인(3840×2160, `paused: false`).
- 가로 스크롤 없음(`scrollLeft`가 0에서 움직이지 않음), 콘솔 오류 없음(404는 favicon뿐).
- Tab 순서 39개가 화면 순서와 일치(skip → 헤더 → 연도 → Reverse Now → 태그 → 트랙 → 카드 링크 → 푸터).
- 공유 파일 변경 영향: `common/components/header.html`·`footer.html`의 Collection 링크를
  `#` → `/pages/collection_test/index.html`로 바꿨습니다. Shop·Bespoke에서 링크와 현재 페이지 표시 정상 확인.
  (main는 아직 공통 헤더/푸터 슬롯을 쓰지 않고 자체 마크업을 씁니다 — 이번 변경과 무관)
- **확인하지 못한 부분**: 이번 세션도 Browser 미리보기 패널이 화면에 표시되지 않아
  일부 구간만 캡처됐습니다(hero, arc + 문장 구간은 눈으로 확인). 아래 전체 화면 비교와
  실제 마우스 hover·휠 스크롤 감각은 사용자가 `http://localhost:5610/pages/collection_test/index.html`을
  직접 열어 확인이 필요합니다.
### Collection showcase 스크롤 인터랙션 (2026-08-06)

obsidianassembly.com 계열의 pin + scrub 연출을 `showcase` 섹션에 넣었습니다.
GSAP·ScrollTrigger는 페이지에 이미 로드돼 있어 CDN 추가 없이 `js/collection.js`에서만 씁니다.
이 저장소는 순수 HTML/CSS/JS라 `useGSAP`/`useEffect` 대신 즉시실행 함수로 작성했습니다.

- **인트로(pin)**: `.showcase`를 `start: "top top"`, `end: "+=140%"`, `pin: true`, `scrub: 1`로 고정.
  화면 1.4장 분량(1400px)을 스크롤하는 동안 길이 2.95의 `gsap.timeline()` 하나가 **3박자**로 진행됩니다.

  | 박자 | 타임라인 구간 | 내용 |
  |---|---|---|
  | 1. 등장 | 0 → 1.0 (B는 0.08 지연) | 상단 두 장이 화면 양 끝 **바깥**(x ∓560)에서 시안 자리로 날아 들어옴 |
  | 2. 문장 | 0.55 → 2.32 | `h2` 단어 7개가 **한 개씩** 차례로 상승 |
  | 3. 퇴장 | 1.55 → 2.95 | 두 장이 중앙으로 모이며 커지고 흐려지며 물러남 |

  - **1박자**: `x ∓560 → 0`, `scale 0.72 → 1`, `opacity 0 → 1`,
    `blur 12px → 0` + `brightness 1.3 → 1`, `rotationY ±42° → 0`,
    `rotation`은 시안 기울기의 2.2배(-34.2° / 28.8°)에서 시안값(-15.55° / 13.07°)으로 안착.
    ease `power3.out`. **1박자 끝(t=1.0)이 시안 레이아웃 그대로의 정지 화면**이고,
    3박자 시작(t=1.55)까지 0.55만큼 머뭅니다.
  - **2박자**: `y: 64 → 0`, `opacity: 0 → 1`, `duration 0.45`, `stagger 0.22`, ease `power3.out`.
    duration보다 stagger가 절반쯤 되게 잡아야 단어가 겹치지 않고 하나씩 끊어져 올라옵니다.
  - **3박자**: `x → ±527`(좌우 대칭), `y → 130`, `scale → 1.9`, `opacity → 0.08`,
    `blur → 26px` + `brightness → 1.35`, `rotationY → ∓24°`, `rotation`은 시안값의 0.13배로 거의 수평.
    ease `power2.in`이라 뒤로 갈수록 빨라집니다.
  - 3D는 CSS `perspective`가 아니라 각 `img`의 **`transformPerspective: 900`**으로 겁니다.
    부모(`.showcase_frame`)에 걸면 그 안의 사진 7장이 전부 3D 맥락에 들어갑니다.
  - 수렴 거리는 하드코딩이 아니라 `(960 - 카드중심x) * CONVERGE_RATIO(0.78)`로 계산해
    시안 좌표가 바뀌어도 따라갑니다.
- **하단 갤러리(pin 아님)**: `.showcase_photo_c ~ _g`가 카드마다 개별 트리거로
  `y: 110 + index*26 → 0`, `opacity: 0 → 1`. 이동 거리가 카드마다 달라 패럴랙스가 생깁니다.

#### 이 인터랙션에서 반드시 지켜야 하는 것

1. **`pinnedContainer: .showcase`가 없으면 갤러리가 깨집니다.**
   갤러리 카드는 pin되는 `.showcase` 안에 있어서, 지정하지 않으면 pin이 끼워 넣는
   여백만큼 시작 지점이 앞으로 당겨집니다. 실제로 처음엔 카드 c/d/e의 트리거가
   1472/1735/1907에서 시작해 pin 구간 안에 묻혔습니다.
   지정해 두면 `PIN_LENGTH`를 바꿔도 갤러리 시작 지점이 자동으로 따라옵니다
   (100% → 140%로 늘렸을 때 2472 → 2872로 스스로 교정됐습니다).
2. **단어 span은 `.showcase_quote_line`에 직접 넣으면 안 됩니다.**
   그 줄은 flex 컨테이너라 flex item 사이의 공백 전용 텍스트 노드가 규격상 무시되고
   "YouWon't"처럼 붙어 버립니다. `.showcase_quote_text` 래퍼 한 겹을 두고
   그 안에서 일반 inline 흐름으로 배치해야 합니다. (실제로 이 버그가 났고 화면에서 확인 후 고쳤습니다.)
3. **기울어진 두 장의 가운데 정렬은 음수 margin입니다.**
   `transform: translate(-50%,-50%) rotate()`로 두면 GSAP이 rotation을 건드릴 때
   translate까지 같이 분해합니다. 정렬은 margin으로 빼고 transform에는 rotation만 남겼습니다.
4. **`filter`는 함수 종류와 순서가 처음부터 끝까지 같아야 보간됩니다.**
   `blur()`만 쓰다가 중간에 `brightness()`를 더하면 값이 튑니다.
   그래서 `filterOf(blur, brightness)` 헬퍼로 항상 두 함수를 같은 순서로 만듭니다.
5. **pin 때문에 페이지가 140vh 길어집니다.** showcase 아래 섹션의 문서 좌표가 그만큼 밀립니다
   (1920×1000 기준 archive 4517 → 5917, asworn 7272 → 8672, footer 8781 → 10181).
   섹션 내부 좌표와 높이는 그대로입니다.
6. **`.showcase`의 `overflow: hidden`이 화면 밖 시작 위치를 가려 줍니다.**
   지우면 카드가 화면 양옆으로 튀어나옵니다. pin 구간 전체에서 가로 스크롤이 생기지 않는 것을
   `scrollLeft` 6개 지점에서 확인했습니다.

#### 검증 결과 (1920 × 1000)

- 트리거 6개 생성. pin 1182→2582(1400px) 구간에서 `position: fixed` 확인,
  progress가 0 / 0.16 / 0.37 / 0.58 / 0.8 / 1로 선형 추적. 타임라인 길이 2.95.
- 타임라인 값을 t = 0 / 0.5 / 1.0 / 1.55 / 2.0 / 2.4 / 2.95에서 직접 읽어 확인:

  | t | 카드 A x | scale | opacity | filter | rotation / rotationY |
  |---|---|---|---|---|---|
  | 0 | -560 | 0.72 | 0 | blur12 bright1.3 | -34.21° / 42° |
  | 0.5 | -35 | 0.98 | 0.94 | blur0.75 bright1.02 | -16.72° / 2.63° |
  | **1.0** | **0** | **1** | **1** | **blur0 bright1** | **-15.55° / 0°** (시안 그대로) |
  | 1.55 | 0 | 1 | 1 | blur0 bright1 | -15.55° / 0° (유지) |
  | 2.4 | 118 | 1.2 | 0.79 | blur5.82 bright1.08 | -12.52° / -5.37° |
  | 2.95 | 527 | 1.9 | 0.08 | blur26 bright1.35 | -2.02° / -24° |

  카드 B는 전 구간 좌우 대칭(t=2.95에서 -525.72).
- **단어가 하나씩 올라오는지** opacity 배열로 확인 —
  t1.0 `[1, 0.94, 0.09, 0, 0, 0, 0]` / t1.55 `[1,1,1,1,0.71,0,0]` / t2.0 `[1,1,1,1,1,1,0.74]` / t2.4 전부 1.
  동시에 뜨는 구간 없이 한 단어씩 넘어갑니다.
- 갤러리 5장 시작 y = 110 / 136 / 162 / 188 / 214, 끝 y = 0 · opacity 1.
  최종 위치가 CSS 레이아웃과 일치(figure 기준 img 오프셋 10px).
- 화면 확인: pin 진입 시점(카드 화면 밖, 아치만 보임) → "You"만 안착하고 "Won't"는 아직 아래에서
  올라오는 중 → "Ordinary"까지 안착, "Fashion" 대기 → 두 장이 중앙에서 뭉개져 사라지고
  세 줄 전체가 읽히는 상태까지 캡처로 확인했습니다.
- 단어 분리 후에도 세 줄 렌더 폭이 시안과 동일: 242.7 / 283.5 / 415.1 (시안 243 / 284 / 416),
  각 줄 가운데 정렬 오프셋 0.
- **1280px 미만 / `prefers-reduced-motion: reduce`**: 트리거 0개, 모든 값이 CSS 레이아웃으로 복귀
  (`opacity 1`, transform 없음, `filter: none`, rotation 시안값, 페이지 높이 pin 여백 없음) —
  `gsap.matchMedia()`가 알아서 되돌립니다.
- 가로 스크롤 없음, `archive`의 sticky 정상(y=160), 콘솔 오류 없음(404는 favicon뿐).
- 화면 확인: pin 진입 전 / pin 중(카드 수렴·블러 + 문장 등장) / pin 해제 후 갤러리 상승까지 캡처로 확인했습니다.

#### 조절할 수 있는 값 (`js/collection.js` 상단 상수)

전부 파일 맨 위 한 블록에 주석과 함께 모아 두었습니다.

| 상수 | 현재 | 의미 |
|---|---|---|
| `PIN_LENGTH` | `"+=140%"` | 붙잡아 두는 길이. 늘리면 인트로 전체가 더 천천히 진행됩니다 |
| `ENTER_OFFSET` | 560 | 화면 밖 출발 거리. 카드 폭보다 커야 완전히 가려집니다 |
| `CONVERGE_RATIO` | 0.78 | 중앙까지 가는 비율. 1이면 두 장의 중심이 정확히 겹칩니다 |
| `EXIT_SCALE` | 1.9 | 물러날 때 커지는 배율 |
| `ENTER_TURN` / `EXIT_TURN` | 42 / 24 | 들어올 때·나갈 때 `rotationY` |
| `PERSPECTIVE` | 900 | 작을수록 원근이 강해집니다 |
| `ENTER_TILT_RATIO` / `EXIT_TILT_RATIO` | 2.2 / 0.13 | 시안 기울기 대비 시작·끝 각도 배율 |
| `WORD_SLIDE` / `WORD_DURATION` / `WORD_STAGGER` | 64 / 0.45 / 0.22 | 단어 슬라이딩 거리·길이·간격 |
| `WORDS_START` / `EXIT_START` / `EXIT_DURATION` | 0.55 / 1.55 / 1.4 | 각 박자 시작 지점과 퇴장 길이 |
| `RISE_BASE` / `RISE_STEP` | 110 / 26 | 갤러리 카드 상승 거리와 카드별 증가폭 |

단어를 더 또렷하게 하나씩 끊고 싶으면 `WORD_STAGGER`를 올리고,
`EXIT_START`도 같이 올려 문장이 다 뜬 뒤에 사진이 물러나게 하면 됩니다.

### Collection As worn 흐르는 띠 (2026-08-06)

가로 스크롤바를 없애고 카드 3장이 스스로 왼쪽으로 흐르는 띠로 바꿨습니다.
`js/collection.js`의 `initAsworn()` 한 함수에 들어 있습니다.

- **스크롤바 제거**: `.asworn_track`이 `overflow-x: auto` → **`overflow-x: clip` + `overflow-y: visible`**입니다.
  `hidden`을 쓰면 안 됩니다. 스크롤 컨테이너가 다시 만들어져 스크롤바가 살아나고,
  hover 확대분(1.04배 = 위아래 약 14px)이 잘립니다. `clip`은 `visible`과 짝지을 수 있는 유일한 값입니다.
  HTML에서 `.asworn_track`의 `tabindex="0"` / `role="group"`을 뺐습니다 — 더 이상 스크롤 영역이 아닙니다.
- **무한 흐름**: 카드 3장 한 벌을 복제해 붙이고, 이동량을 **한 벌 폭(period)으로 나눈 나머지**만큼
  `translate3d`로 밉니다. period는 계산이 아니라 **첫 복제본의 `offsetLeft`를 읽어** 정합니다
  (그래서 `.asworn_list`에 `position: relative`가 필요합니다). 1920 기준 2509px입니다.
  화면 폭 + period를 채울 때까지 복제하므로 넓은 화면에서도 빈자리가 생기지 않습니다(창 크기 변경 시 다시 채움).
  복제본에는 `aria-hidden="true"`, 안쪽 링크에는 `tabindex="-1"`을 붙여 같은 링크가 여러 번 잡히지 않게 했습니다.
- **hover**: 띠 위에 마우스가 있으면 흐름이 멈추고(JS), 그 카드만 `scale(1.04)`로 커집니다(CSS).
  키보드로 카드 안 링크에 들어와도(`focusin`) 멈춥니다. 멈춘 지점에서 그대로 이어집니다.
- **태그로 카드 부르기**: 태그 5개를 `<a href="#">` → `<button>`으로 바꿨습니다(이동이 아니라 동작입니다).
  카드가 있는 앞의 셋만 `data-asworn-target="0~2"`를 갖고, `#Love, Lies` / `#Fashion Show`는 `disabled`입니다
  (색만이 아니라 점선 테두리 + `disabled` 속성으로도 구분됩니다).
  누르면 그 카드가 트랙 가운데로 1.1초에 이동하고(`power3.out`), **2.4초 멈췄다가 다시 흐릅니다.**
  띠가 순환하므로 같은 카드가 앞뒤 양쪽에 있습니다. 이동 거리를 period로 감아 ±period/2 안으로 줄여
  가까운 쪽으로 돕니다(되감기는 느낌이 없습니다).
- **한 프레임 이동량을 0.1초로 자릅니다.** 다른 탭에 갔다 오면 프레임 간격이 몇 초씩 벌어져
  띠가 한 번에 몇백 px 튑니다(실제로 이 세션에서 7.7초 = 323px 점프를 봤습니다).
- **모션 감소 설정**에서는 흐르지 않고, 태그를 누르면 그 카드로 바로 이동합니다.
  GSAP이 없으면 `requestAnimationFrame`으로 흐르고 태그 이동은 즉시 처리합니다.

조절값은 `js/collection.js` 상단에 있습니다: `ASWORN_SPEED`(42px/초),
`ASWORN_FOCUS_DURATION`(1.1초), `ASWORN_HOLD`(2.4초).

#### 검증 결과 (1920 × 1000, localhost:5611)

- 카드 6장(원본 3 + 복제 3), period 2509px, 리스트 폭 5023px ≥ 화면 1905 + period.
- `track.scrollLeft`가 0에서 움직이지 않음(스크롤 컨테이너 아님), 페이지 가로 스크롤 0.
- 속도: 1초에 정확히 42px 이동. hover 중 0px, `mouseleave` 후 다시 43px/초,
  `focusin` 중 0px, `focusout` 후 재개.
- 태그 3개 각각 클릭 후 그 카드 중심과 트랙 중심 오차 **0px**(#BTS / #TildaSwinton / #NewJeans).
  호버 중 클릭, 트윈 도중 다른 태그 클릭도 오차 0px. 2.4초 뒤 흐름 재개 확인.
- 태그 상태: 앞 3개 `cursor: pointer` / 실선, 뒤 2개 `disabled` + 점선 + `opacity 0.45`.
- 복제본 전부 `aria-hidden="true"`, 복제본 안 링크 전부 `tabIndex -1`.
- JS `new Function()` 컴파일 통과, CSS 중괄호 균형 0, 버려진 규칙 없음, As worn 규칙 28개 파싱.
- 에셋 요청 전부 200(As worn 사진 3장 포함), 콘솔 오류 없음.
- **확인하지 못한 부분**: 이번 세션도 Browser 미리보기 패널이 표시되지 않아 `document.hidden`이 true라
  `requestAnimationFrame`이 한 번도 돌지 않았습니다. 위 측정은 `gsap.ticker.tick()`을 직접 불러
  프레임을 진행시킨 값입니다. **실제로 흐르는 모습과 진짜 마우스 hover 확대는 사용자가
  `http://localhost:5611/pages/collection_test/index.html`에서 확인해야 합니다.**
  속도(42px/초)와 멈춤 시간(2.4초)이 느리거나 빠르면 위 상수만 바꾸면 됩니다.
- `.claude/launch.json`의 `tchaikimm` 포트를 5610 → **5611**로 바꿨습니다.
  이전 항목이 가리키던 스크립트 경로가 지난 세션 스크래치패드라 이번 세션 경로로 갱신했습니다.

### Collection hero 영상 압축 (2026-08-06)

- 원본 `asset/collection/콜렉션 패션쇼 영상.mp4` — HEVC Main10 / 3840×2160 / 60fps / 70.8Mbps / 21.57초 / **191MB**.
  아직 편집 중인 파일이라 **그대로 두었습니다.**
- 웹용 `asset/collection/collection_film.mp4` — H.264 High / 1920×1080 / 30fps / 3.1Mbps / **8.05MB** (96% 감소).
  오디오는 제거했습니다(음소거 배경 루프라 불필요). `-movflags +faststart`로 앞부분부터 바로 재생됩니다.
- 포스터 `asset/collection/collection_film_poster.jpg` (68KB) — 첫 프레임이 Figma 시안에 보이는 장면과 동일합니다.
  영상 로딩 전 빈 화면 대신 이 이미지가 보입니다.
- 재인코딩 명령:
  ```
  ffmpeg -i "콜렉션 패션쇼 영상.mp4" -an -vf "fps=30,scale=1920:1080:flags=lanczos" \
    -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 23 -preset slow \
    -movflags +faststart collection_film.mp4
  ```
- ffmpeg는 `winget install Gyan.FFmpeg`로 설치했습니다(9.0).
  실행 파일: `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\ffmpeg-9.0-full_build\bin\`.
  winget이 PATH를 수정했으므로 **새 터미널에서는 `ffmpeg`만 쳐도 됩니다.**
- 화질 검증: 압축본에서 프레임 3장(0 / 300 / 600)을 뽑아 확인 — 부드러운 그라디언트 배경에
  블로킹·밴딩 없음. 브라우저에서 `collection_film.mp4` 재생 확인(1920×1080, 21.6초, 요청 2건).
- 원본을 다시 내보내면 위 명령을 그대로 다시 돌리면 됩니다.

- **주의**: 원본 191MB 파일이 저장소에 커밋돼 있습니다. 페이지는 더 이상 참조하지 않으므로
  Git LFS로 옮기거나 저장소에서 빼는 것을 검토할 만합니다.


## Shared system migration (2026-08-06)

- Repository-wide rules and project documents moved from `pages/main/` to the repository root and `docs/`.
- Shared tokens, reset, base components, header/footer layout, and common behavior now live in `common/`.
- Main, Shop, and Bespoke load the same shared CSS and JavaScript files.
- Bespoke-only header/footer differences remain in `pages/bespoke/css/bespoke.css` as page overrides.
- Local development must serve the repository root so `/common/` resources are reachable.
- Browser verification completed for Main, Shop, and Bespoke with no console warnings or errors.
- Footer markup is shared from `common/components/footer.html` and injected by `common/js/common.js`.
- Header markup is shared from `common/components/header.html` with white and black variants selected per page.
- Shared header navigation uses a 20px menu size; `common.js` switches the logo/theme and current-page state.

마지막 업데이트: 2026-08-04

## 구현 완료

- 공통 디자인 토큰 (`css/base.css`) — Figma 변수 기준 색상/폰트/간격
- 헤더 (`css/layout.css`) — hero 위 투명 헤더, 1280px 미만 토글 메뉴
- 푸터 (`css/layout.css`) — 메뉴 / 뉴스레터 / 소셜 / 워드마크 / 약관 / 저작권
- 메인 hero 섹션 — bespoke·shop 2분할
- 메인 intro 섹션 (Figma `textbox`)
- 메인 banner 섹션
- 메인 brand 섹션 — 5패널 가로 스크롤 (GSAP ScrollTrigger pin + scrub)
- 공통 스크립트 (`js/common.js`) — 모바일 메뉴, 뉴스레터 이메일 확인
- 메인 스크립트 (`js/main.js`) — brand 가로 스크롤
- 메인 korea 섹션 — 제목 / 철릭 전체 / 부위 4행(Collar·Sleeve·Body·Skirt) / 착장 2컷
- 메인 Instagram · Bespoke · 롤링 텍스트 · Shop · 코디 · 셀럽착용 · 클로징 섹션
  (셀럽착용·클로징은 데스크톱 정적 레이아웃만)
- 롤링 텍스트 무한 마퀴 (CSS `marquee_scroll`, 무배경 + 검은 글씨)
- Shop 상품 띠 무한 자동 흐름 + hover 시 정지·확대 (CSS `shop_scroll`, `js/main.js` 복제)
- 코디 캐러셀 — 이전/다음 버튼으로 선택 룩을 가운데 자리로 이동 (`js/main.js`)

## 구현 중

- 메인페이지 전체 섹션의 반응형(360 / 768 / 1280) 대응
- 셀럽 캐러셀 인터랙션

## 확정된 UX 정책

- 헤더는 hero 위에 겹치는 투명 헤더입니다.
- 1280px 미만에서 헤더 메뉴는 닫힌 상태로 시작하고, 토글 버튼으로 엽니다.
  (시안에 없는 요소이며 반응형 대응으로 추가했습니다.)
- 1280px 이상으로 넓어지면 열려 있던 모바일 메뉴는 자동으로 닫힙니다.
- 통화 선택은 USD 하나만 제공합니다. (Figma 주석 반영)
- 뉴스레터는 클라이언트 확인만 하고 전송하지 않습니다. 성공 시 안내 문구만 표시합니다.
- 아직 만들지 않은 페이지로 가는 링크는 `href="#"`입니다. 해당 페이지 구현 시 연결합니다.
- brand 섹션은 768px 이상 + 모션 감소 설정이 아닐 때만 가로 스크롤로 동작합니다.
  그 외(모바일, JS 미동작, 모션 감소)에는 5개 패널이 세로로 쌓인 기본 레이아웃을 사용합니다.
- 롤링 텍스트·Shop 띠는 CSS 애니메이션만 사용합니다. 모션 감소 설정에서는 `css/base.css`의
  전역 `prefers-reduced-motion` 규칙이 애니메이션을 멈춥니다.
- Shop 띠는 hover 중에만 멈춥니다. 마우스를 떼면 멈춘 지점에서 이어서 흐릅니다.
- 코디 캐러셀은 시안의 다섯 자리(`is_pos_far_left` ~ `is_pos_far_right`)를 고정해 두고
  JS가 자리 class만 바꿔 끼우는 방식입니다. 마지막↔처음이 순환합니다.
  JS가 동작하지 않아도 HTML의 초기 자리 class 덕분에 시안 그대로 보입니다.

## 사용 중인 라이브러리

- GSAP 3.13.0 + ScrollTrigger (jsDelivr CDN): brand 섹션 가로 스크롤. `js/main.js`에서 `gsap.matchMedia()`로 조건부 적용.

## 저장 데이터

- 없음.

## 알려진 문제

- `assets/images/main/hero_bespoke.jpg`(Figma 원본 이미지)에 "HanbokWave" 워터마크가 있습니다.
  시안의 크롭 그대로 구현했기 때문에 hero 좌측 상단에 워터마크가 보입니다. 원본 교체가 필요합니다.
- hero shop 패널은 배경이 밝아 흰색 본문/버튼의 대비가 낮습니다. 시안과 동일한 상태입니다.
- hero의 `差 / 異 / 김영진` 텍스트는 Figma에서 색상이 `transparent`라 구현에서 제외했습니다.
- brand 4번 패널의 `Group 28 1` 레이어는 그 위의 사진이 같은 위치를 완전히 덮어서 보이지 않습니다.
  구현에서 제외했습니다.
- brand 5번 패널은 시안의 세로 좌표(제목 top 619 등)가 1734px 패널 기준이라 짧은 화면에서 겹칩니다.
  간격 비율만 유지한 세로 중앙 정렬로 바꿨습니다.

## 이번 작업에서 확인한 내용 (2026-08-04 추가)

- korea 섹션 `section1`의 "Before" 텍스트(`1100:1399`)는 Figma에서 흰색 13px입니다.
  흰 배경 위 흰 글씨라 화면에 보이지 않는 작업용 라벨로 판단하고 구현에서 제외했습니다.
- korea 부위 4행은 같은 철릭 이미지(1043 × 496)를 가로 띠로 잘라 쓰는 구조입니다.
  띠 높이/오프셋: Collar 114/0, Sleeve 191/43, Body 107/169, Skirt 248/248.
- 부위 설명 본문 색은 시안이 `#000000`이지만 기존 토큰 `--color_text`(#0a0a0a)를 사용했습니다.
- Montserrat Light(300), Trirong Regular(400)을 새로 불러옵니다. (시안에 사용됨)
- 셀럽착용 이미지 띠는 내보낸 PNG가 시안 프레임(1760)보다 넓은 1849px입니다.
  `overflow: hidden` 상자로 시안과 같은 폭만 보이도록 잘랐습니다.
- 롤링 텍스트의 구분 점(14px 원)은 아이콘이 아닌 도형이라 CSS로 그렸습니다.
- 코디·클로징은 요소가 겹쳐 있어 시안 좌표 그대로 절대 배치했습니다.
  (1920px 고정 폭 상자를 화면 중앙에 두고 좌우를 잘라냅니다.)

## 인터랙션 작업에서 확인한 내용 (2026-08-04 추가)

- 롤링 텍스트 마퀴는 같은 줄을 두 벌 두고 `translateX(calc(-50% - 19px))`로 밉니다.
  두 줄 사이 gap(38px)의 절반을 빼야 이음매가 맞습니다. 줄 끝에 구분 점을 하나 추가했습니다.
- 롤링 텍스트 글자색은 요청이 `#000`이지만 기존 토큰 `--color_text`(#0a0a0a)를 사용했습니다.
  (korea 부위 설명과 같은 판단입니다.)
- Shop 띠는 6개를 JS로 한 벌 복제(총 12개, 4368px)해 `translateX(-50%)`로 순환합니다.
  복제본에는 `aria-hidden="true"`를 붙였습니다.
- Shop hover 확대(1.06)가 잘리지 않도록 `.shop_marquee`에 위아래 20px 여백을 두고,
  시안의 `margin-top: 52px`은 32 + 20으로, `.shop` 아래 여백은 175 → 155로 나눠 유지했습니다.
- 코디 자리 전환은 `top / left / width` transition(0.6s)입니다.
  자리마다 크기가 달라 transform만으로는 시안 좌표를 유지할 수 없습니다.

## Shop 페이지 (`pages/shop/`)

- 대상 화면: Figma `4조 한복판 - 차이킴` node `1523:1094`("shop_박효민"). main 페이지와 별도 폴더에 독립 구현.
  **폴더 위치가 `pages/main/shop/` → `pages/shop/`(main의 형제 폴더)로 이동했습니다.** 헤더 로고 링크(`../main/index.html`)와 `.claude/launch.json`의 `shop` 설정 경로를 이 위치 기준으로 갱신했습니다.
- 범위: 반응형은 다음 단계 예정. **레이아웃 구조는 main와 동일한 방식으로 전환**했습니다 — `body`/`.main`과 각 섹션(`hero_section`/`banner`/`new_arrivals_section`/`shop_section`)은 `width:100%`로 창 너비에 맞춰 늘어나고, Figma 절대좌표(1920 기준)에 의존하는 `hero_section`의 watermark·갤러리·카테고리 내비만 `.hero_section_frame`(1920px 고정, 가운데 정렬)으로 감쌌습니다. main가 코디·클로징 섹션에만 쓰는 "1920px 고정 프레임 가운데 정렬" 패턴을 hero_section에 적용한 것과 같은 방식입니다.
  이전에는 body/.main과 모든 섹션에 `width:1920px`를 직접 걸어서, 창이 1920px보다 넓으면 페이지 전체가 가운데의 작은 고정 박스로 보였습니다(main는 대부분 유동적이라 꽉 차 보였음) — 그 차이를 없앤 것입니다. 2560px 창에서 `hero_section_frame`이 정확히 1920px폭·가운데 정렬로 뜨는 것, 1920px 창에서 기존 레이아웃과 픽셀 단위로 동일한 것을 스크립트로 확인했습니다.
- 구현 완료 섹션: hero_section(카테고리 내비 + 회전 갤러리), banner, new_arrivals_section(2×2 상품 카드), shop(필터바 + 3×2 상품 카드 + View More), 공용 header/footer(main와 동일 마크업 재사용).
- 상품 카드는 `.card_product` 공용 컴포넌트로 작성하고 `.is_size_new`(800×930) / `.is_size_shop`(528×950) modifier로 두 섹션에서 재사용.
- 상품 이미지·가격·설명·태그는 모두 Figma `get_design_context` 응답의 실제 카피를 그대로 사용(임의 생성 없음). 이미지 URL은 각 카드 인스턴스에서 실제로 보이는(레이어의 hover-opacity가 0이 아닌) 레이어 기준으로 1:1 매칭.
- **hero_section 갤러리 회전(최종, WebGL 3D)**: 사용자가 레퍼런스로 준 `follow.art` 히어로가 실제로는 WebGL 3D 카드 캐러셀(Three.js 계열, `Landing1IntroWebGl` 번들, 카드 이미지 9장)이라는 걸 확인하고, CSS 자리 교체 방식 대신 **Three.js + GSAP로 진짜 3D 원통 회전**을 구현했습니다.
  - **새 의존성**: Three.js(ESM, importmap으로 `three@0.160.0` jsDelivr 로드), GSAP(`gsap@3.13.0`, main 페이지와 동일 버전을 CDN `<script>`로 추가). `index.html`에 `<script type="importmap">` + `<script type="module" src="js/shop.js">` 로 구성.
  - `#hero_gallery` 안에 `<canvas id="hero_gallery_canvas">`를 두고, Three.js/WebGL을 못 쓰는 환경(로딩 전·초기화 실패)에서는 정지 이미지 `.hero_gallery_fallback`이 보이다가 초기화 성공 시 `.hero_gallery`에 `is_ready`가 붙어 canvas로 전환됩니다(brand 섹션의 "기본 레이아웃 → 조건부 향상" 패턴과 동일).
  - 사진 4장(`gallery_image1~4.png`)을 2벌씩 복제해 8장의 `PlaneGeometry` 카드를 반지름 620의 원통 둘레에 45°씩 배치하고, 8개 카테고리(ALL/NEW·DRESS·TOP·KNIT·BOTTOM·OUTER·ACC·LIVING)에 `data-gallery-index="0"~"7"`로 1:1 고정 매칭했습니다.
  - 회전값(`ring.rotation.y`)은 GSAP로 트윈합니다. **페이지 진입 즉시 무한 자동 회전이 시작**되며(40초/1바퀴) ALL/NEW는 순환 순서상 첫 항목일 뿐 고정 기본값이 아닙니다. 카테고리 hover/focus 시 그 카드가 최단 경로로 정면으로 회전하며(0.8초) 자동 회전이 멈추고, 벗어나면 멈춘 지점부터 재개합니다. `prefers-reduced-motion`에서는 자동 회전을 시작하지 않습니다.
  - 카드 크기(320×460)·반지름(620)·카메라 거리(1400)·FOV(45)는 시안에 없는 값이라 임의로 잡았습니다. 실제 화면에서 보고 조정이 필요할 가능성이 높습니다.
  - 예전에 쓰던 대각선 마스킹 이미지 4장과 `hero_gallery_shadow.svg`(그 이미지 전용 배경 도형)는 이 구조와 안 맞아 삭제했습니다.
  - **검증 관련 중요 사항**: 이 세션의 미리보기 탭은 `document.hasFocus()`가 계속 `false`라, `requestAnimationFrame` 기반인 GSAP 티커가 전혀 진행되지 않았습니다(`gsap.ticker.time`이 0에 고정). 그래서 자동 회전·페이드인·hover 전환 애니메이션 자체는 이 세션에서 재생되는 걸 못 봤습니다. 다만 디버그로 재질에 `opacity=1`을 강제로 주고 수동으로 한 프레임 렌더링했을 때 캔버스에 카드가 실제로 그려지는 건 확인했습니다(카메라·지오메트리·텍스처·셰이더 파이프라인은 정상). 즉 **렌더링 자체는 되는데, 애니메이션이 재생되는 걸 이 환경에서 직접 보지는 못했습니다.** 실제 브라우저(포커스가 있는 일반 탭)에서는 `requestAnimationFrame`이 정상 동작하므로 자동 회전·hover가 보일 것으로 예상하지만, 사용자가 `http://localhost:5602`을 직접 열어 확인 필요합니다.
- **garment_story 섹션(휠 스크롤 인터랙션)**: banner와 new_arrivals_section 사이, Figma 노드 `1531:2705`(`garment_story_section`으로 리네임 완료) → 컴포넌트 `SECTION/Garment Story`(`1523:1720`)의 `garment` variant 프로퍼티 4개 상태(Baeja/Cheollik/Geodeul/Sapok baji)를 4개 variant 각각 `get_design_context`로 조회해 실제 카피·사진을 그대로 구현했습니다.
  - 순환 순서는 Figma의 각 variant 라벨 좌표(활성 0°, 나머지 +30/+60/-30°)를 대조해 역산: `Baeja → Cheollik → Geodeul → Sapok baji`(순환). 페이지 기본 활성값은 Figma 페이지에 실제로 배치된 인스턴스와 동일하게 **Cheollik**.
  - **원형 회전(2차 수정, 연속 회전)**: 처음엔 4개 고정 슬롯 class를 정수 인덱스로 딱딱 전환하는 방식(코디 캐러셀 패턴)으로 만들었는데, 사용자가 레퍼런스(`orionix.framer.website/about` 연도 타임라인)를 다시 짚어주면서 "원이 부드럽게 돈다"는 걸 확인 — 실제 wheel 이벤트를 그 페이지에 직접 dispatch해서 그 구간에서 `preventDefault`가 걸리는 것도 확인했습니다. 그래서 정수 스텝 대신 **실수 `progress` 값**을 두고, 매 wheel 이벤트마다 목표값을 갱신해 GSAP로 관성감 있게(`power3.out`, 0.9초) 따라가게 하고, `onUpdate`마다 4개 라벨의 각도(`offset = itemIndex - progress`, 30도/스텝)를 다시 계산해 `left/top/rotate`를 인라인 스타일로 직접 씁니다. `deltaY` 누적 감도는 320(= 한 스텝)로 임의 설정했고 실제로 보면서 조정이 필요합니다.
  - **휠 스크롤 인터랙션**: 섹션이 화면 상단에 `position:sticky`로 붙어있는 동안 휠 스크롤을 가로채(`preventDefault`) progress를 이동시킵니다. 첫/마지막 가먼트에서 그 방향으로 더 스크롤하면 가로채지 않고 그대로 흘려보내 다음/이전 섹션으로 자연스럽게 넘어갑니다(사용자 확인: "전자로 하자" — 스크롤재킹 방식). sticky 유지용 여유 스크롤 구간은 `.garment_story_scroll`(높이 1500px + 60vh)로 확보했습니다.
  - **3차 수정(마커 추적 + 감도 조정)**: 사용자가 준 레퍼런스 스크린샷 3장 비교 결과 두 가지를 반영했습니다.
    1. `deltaY` 감도를 320 → **900**으로 낮춰 한 가먼트를 읽을 시간을 늘렸습니다("스크롤이 너무 짧다").
    2. 원 위의 점 마커(`.garment_orbit_marker`)가 항상 `left:800px` 고정이었던 걸, **매 프레임 "현재 활성 항목"이 실제로 그려지고 있는 자리**(반지름 400 기준, 라벨과 같은 각도)를 따라가도록 바꿨습니다. 전환 중엔 그 항목과 함께 부드럽게 움직이고, 활성 항목이 바뀌는 순간(반올림 경계) 다음 항목 자리로 넘어갑니다 — 레퍼런스에서 점이 항상 현재 텍스트 옆에 붙어 있는 것과 같은 동작입니다.
  - **4차 수정(간격·높이·속도)**: 점↔글자 간격(`LABEL_RADIUS` 436→480), 가먼트 사이 각도(`STEP_ANGLE_DEG` 30→40), 휠 감도(`WHEEL_SENSITIVITY` 1/900→1/1400, 더 낮출수록 한 항목에 머무는 시간이 늘어남), 회전 트윈 속도(`duration` 0.9→1.6초, `power2.out`)를 조정했습니다. 전부 `js/shop.js`의 garment_story 블록 상단에 주석과 함께 있어 사용자가 직접 숫자만 바꿔도 됩니다.
    사용자가 `.garment_story_frame`에 직접 `height:2000px`를 줬다가 정렬이 깨진 걸 발견 — frame이 sticky 부모(`garment_story_section`, 1500px)보다 커지면서 `overflow:hidden`에 위쪽 기준으로 잘려 중심축이 어긋난 것이었습니다. **`.garment_story_frame`은 항상 `height:100%`로 두고, 높이를 바꾸려면 `.garment_story_section`과 `.garment_story_scroll`(섹션 높이 + 60vh) 두 곳을 같이 바꿔야 합니다** — 지금은 2000px로 반영했습니다.
  - **검증 한계(반복)**: GSAP 트윈도 hero_gallery와 같은 이유로 이 세션(포커스 없는 미리보기 탭)에서는 `onUpdate`가 실제로 재생되는 걸 못 봤습니다. 대신 (a) 초기 렌더는 트윈을 거치지 않고 동기 호출이라 좌표 계산식이 기존 하드코딩 값과 정확히 일치하는 것, 마커가 활성 라벨과 같은 y좌표(400)에 오는 것, frame/section 높이가 2000px로 일치하고 콘텐츠 세로 중심이 섹션 중심과 정확히 겹치는 것 확인, (b) wheel 이벤트의 `preventDefault`/경계 릴리즈 판단 로직(트윈 재생과 무관하게 동기적으로 실행됨)은 정상 동작 확인. 실제 회전·마커 추적·속도감이 원하는 느낌인지는 사용자가 직접 확인 필요.
  - **버그 수정**: 이 작업 중 `.main`에 걸려 있던 `overflow:hidden`이 하위 `position:sticky` 요소를 무력화시키는 걸 발견해 제거했습니다(각 섹션이 이미 자체 `overflow:hidden`으로 bleed를 막고 있어서 `.main` 레벨의 클리핑은 불필요했습니다).
  - Show Details 버튼은 컴포넌트 설명 그대로 라운드 25px, hover 시 배경이 딥그린(`--color_point`)으로 반전됩니다.
  - 검증: 2560px sticky 상태에서 `section.getBoundingClientRect().top === 0` 확인, 휠 이벤트를 직접 dispatch해서 진행(cheollik→geodeul→sapok_baji)·경계 릴리즈(마지막 항목 이후 `preventDefault` 안 됨)·역방향 복귀까지 전부 스크립트로 확인. 에셋 7개 전부 200 OK. 실제 마우스 휠 조작(진짜 `:hover`/타이밍 감각)은 이번 세션에서도 확인 못 해 사용자가 직접 확인 필요.
- **범위에서 제외한 것**: motif_detail(모티프 상세 + 관련상품 캐러셀) 섹션은 디자인 상세를 아직 조회하지 않아 제외.
  hero_nav의 `nav_item_kids`(1523:1120) 레이어는 Figma에 텍스트 콘텐츠가 없어(빈 노드) 내비게이션에서 제외.
- 상품 카드 hover는 "원단 디테일컷으로 전환" 대신 **동일 사진의 확대(scale) 효과**로 단순화했습니다. 각 카드의 두 번째(hover) 이미지 URL이 카드마다 신뢰성 있게 식별되지 않아, 확인된 사진 한 장만 사용하고 확대 효과로 대체했습니다.
- 검색창(`shop_search`)의 "클릭 시 늘어남" 주석은 JS 없이 CSS `:focus-within`으로 구현(포커스 시 400→520px).
- "All"/"Filter" 버튼은 이번 1차 구현에서 시각적 정적 버튼만 배치(드롭다운/실제 필터링 로직 없음).
- 실행: `.claude/launch.json`의 `shop` 설정(PowerShell 정적 서버, `http://localhost:5602`, `pages/shop`를 루트로 서빙, 스크립트는 세션 스크래치패드에 위치).
- 검증: 네트워크 요청 전량 200 OK(자산 경로 오류 없음), 콘솔 에러 없음, 8장 이미지 중 4장이 정확히 자리 class를 받는 것과 자동 회전 타이머가 실제로 진행되는 것을 스크립트로 확인, 카테고리 focus 이벤트로 해당 이미지가 featured 자리로 정확히 이동하는 것 확인. **다만 이번 세션에서는 Browser 미리보기 패널이 화면에 표시되지 않아 스크린샷 기반 시각 비교와 실제 마우스 hover(`:hover`) 동작 확인은 하지 못했습니다** — 이벤트 리스너 로직 자체는 focus 이벤트로 검증했지만, 사용자가 `http://localhost:5602`을 직접 열어 눈으로 확인 필요.

### Shop 발표용 축소 (2026-08-07)

발표 PC가 1920 × 1080 / 배율 100% 고정인데, 2560 × 1440에서 보던 여유로운 비율을
유지하고 싶다는 요청입니다. 선생님 승인 후 진행했습니다.

- **이너로는 해결되지 않습니다.** 이 페이지 콘텐츠는 폭이 전부 고정값이라
  (상품 행 1764 / 필터바 1712 / New 1679 / motif 1523) 창을 넓혀도 크기가 그대로고
  좌우 여백만 늘어납니다. 1920과 2560에서 콘텐츠 폭·페이지 높이가 완전히 동일합니다.
  즉 **이미 이너와 같은 상태**이고, 여백을 늘리려면 콘텐츠를 줄이는 수밖에 없습니다.
- `pages/shop/css/shop.css` 맨 끝, `@media (min-width: 1850px) and (max-width: 1990px)`
  블록 하나에 전부 들어 있습니다. `html { zoom: var(--shop_view_scale) }`, 값은 `0.75`
  (= 1920 ÷ 2560이라 2560에서 100%로 보던 비율과 같아집니다).
- **`transform: scale()`이 아니라 `zoom`을 씁니다.** zoom은 레이아웃을 다시 계산해서
  스크롤 높이·pin·sticky가 함께 줄어듭니다. transform은 그림만 줄여 전부 어긋납니다.
- **적용 폭을 1850~1990px으로 좁게 잡았습니다.** zoom이 걸리면 안쪽 레이아웃 공간은
  넓어지지만 미디어쿼리는 실제 창 크기로 판단합니다. 좁은 화면까지 걸면 둘이 어긋납니다.

#### garment story를 축소에서 뺀 이유 (중요)

`.garment_story_scroll { zoom: calc(1 / var(--shop_view_scale)) }`로 이 섹션만 원래 크기로 되돌립니다.

ScrollTrigger는 pin을 걸 때 `getBoundingClientRect`로 잰 크기를 그대로 인라인
`width` / `height`에 써넣습니다. 그 값에는 이미 zoom이 반영돼 있어서 **zoom이 한 번 더**
곱해집니다. 실제로 섹션이 화면의 위 607px만 덮고 아래 473px로 New 섹션이 비쳤습니다
(화면 높이 1080). `end: "+=450%"`가 뷰포트 기준이라 pin 길이만 안 줄어드는 문제도 같이 있었습니다.

해당 섹션 안에서 zoom을 1로 되돌리면 잰 값과 실제 값이 같아져 둘 다 사라집니다.
**대가: 이 섹션만 다른 섹션보다 약 1.33배 크게 보입니다**(콘텐츠 폭 비율 0.49 vs 2560의 0.367).
전체화면 구성이라 어색하지는 않지만 의도된 차이입니다.

#### 검증 결과 (1920 × 1080, localhost:5611)

- 블록별 콘텐츠 폭 ÷ 화면폭이 2560 실측값과 오차 0.002 이내로 일치:
  hero 0.756/0.754, banner 0.283/0.283, New 0.661/0.660, 필터바 0.674/0.673,
  상품 행 0.694/0.693, motif 0.600/0.598, 상품 띠 0.724/0.723 (앞이 적용 후, 뒤가 2560).
  `.garment_content`만 0.49 / 0.367 — 위에 적은 의도된 예외입니다.
- pin 구간 5개 지점에서 섹션이 항상 1905 × 1080으로 화면을 꽉 채움. 다음 섹션이 비치는 구간 0px.
  pin 끝에서 New 섹션 top이 1090(화면 밖)이라 겹침 없음.
- 원형 내비: 원 800×800, 마커가 중심에서 정확히 400px(= `MARKER_RADIUS`),
  활성 라벨과 마커의 세로 오차 7px. JS 좌표계 정상.
- 1850px 미만·1990px 초과에서는 규칙이 걸리지 않음(2560과 1280 모두 `zoom: 1`, 상품 행 1764 그대로).
- 가로 스크롤 0, 콘솔 오류 없음. CSS 중괄호 181/181, 파싱 규칙 179개 중 버려진 것 0개.
  (`shop.js`는 ES module이라 `new Function()` 문법 검사가 적용되지 않습니다 — 페이지 로드로만 확인)
- **확인하지 못한 부분**: 이번 세션도 Browser 미리보기 패널이 표시되지 않아 화면 캡처를 못 했고,
  `requestAnimationFrame`이 돌지 않아 `ScrollTrigger.update()`를 직접 호출해 측정했습니다.
  실제 휠 스크롤 감각과 눈으로 보는 크기 균형은 사용자 확인이 필요합니다.

#### 되돌리기 / 조절

- 되돌리기: `git restore pages/shop/css/shop.css`
  또는 `[발표용 · 되돌리기 쉬움]` 주석부터 파일 끝까지 삭제.
- 크기 조절: `--shop_view_scale`만 변경(0.8 / 0.85는 덜 줄어듭니다).
  garment story의 역보정은 같은 변수를 쓰므로 자동으로 따라갑니다.

### Shop 다음 작업

1. garment_story, motif_detail 두 섹션 디자인 컨텍스트 조회 후 구현
2. 상품 카드 hover 시 원단 디테일컷으로 전환하는 기능은 카드별 정확한 이미지 매핑이 필요 — Figma에서 직접 확인 필요
3. shop 페이지 반응형(360/768/1280) 대응
4. 실제 브라우저 스크린샷으로 Figma 시안과 픽셀 단위 비교, 실제 마우스 hover(원통형 갤러리 회전, 카드 hover, 검색창 확장) 수동 확인

## Shop Detail 페이지 (`pages/shop_detail/`) — 2026-08-06

### purchase_panel

- **sticky를 쓰지 않습니다.** 사용자 결정: 패널이 화면을 따라오지 않고 왼쪽 갤러리와 함께 위로 스크롤되어 지나갑니다.
  `position`, `top`, `height`, `align-self` 없이 일반 흐름에 둡니다.
- 시도했다가 되돌린 것 두 가지를 기록합니다. 같은 실수를 반복하지 않기 위한 것입니다.
  1. `overflow-y: auto`를 주면 **CSS 규칙상 `overflow-x`도 `visible` → `auto`로 바뀝니다.** 패널 콘텐츠 폭(539px)이
     안쪽 폭(433px)보다 넓어서 패널 아래에 가로 스크롤바가 생겼습니다. 이 패널에 `overflow`를 걸면 안 됩니다.
  2. sticky를 쓸 경우, 박스 높이가 콘텐츠 높이(804px)라 부모 grid 영역 바닥에 먼저 닿아 히어로가
     한참 남았는데도 고정이 풀립니다. 되살릴 일이 있으면 `height: calc(100vh - 88px)`가 필요합니다.
- Lenis는 이 문제와 무관합니다. `wrapper: window` / `content: HTML` 기본 설정이라 `transform`이 아닌
  네이티브 `scrollTop`을 움직입니다(`html`·`body` transform 모두 `none` 확인). sticky를 깨는 종류의 설정이 아닙니다.

### 버튼 상태

- `.purchase_button.is_primary` hover: 딥그린 → `--detail_green_dark`. 검정으로 바뀌지 않습니다.
- `.purchase_button.is_secondary` hover: `--color_point` 그린 배경 + 흰 글씨.
- `.size_button` hover: `--duration_base`(0.4s)로 서서히 눌리는 연출. `translateY(2px)` + inset 그림자.
  선택 확정 상태(`.is_selected`)는 눌림 효과 없이 그린 채움만 유지하도록 hover 규칙과 분리했습니다.

### 사이즈 가이드 (`size_guide_panel`)

- **트리거는 SIZE GUIDE 버튼 하나뿐입니다.** size_button으로도 열자는 안을 검토했으나,
  사이즈 선택이라는 본래 역할과 충돌하고 누를 때마다 아래 CTA가 밀려서 제외했습니다(사용자 결정).
- 이 상품은 **One size**입니다. 화면의 XS~XL 버튼은 Figma 시안 그대로 두었지만
  실제 치수는 단일 사이즈 하나뿐이라 서로 맞지 않습니다. **미해결 사항입니다.**
- 치수(사용자 제공, 확정): 어깨너비 37 / 가슴 단면 45 / 허리 단면 39 / 소매기장 43 / 앞총장 49 / 뒤총장 138 (cm).
  inch 값은 cm ÷ 2.54를 소수 첫째 자리에서 반올림해 HTML에 함께 적어두었습니다.
- CM / INCH 전환은 JS가 값을 계산하지 않습니다. 두 값을 모두 `<span class="size_value" data-unit="...">`로
  마크업해두고 `.size_guide_panel.is_unit_inch` class로 한쪽만 보여줍니다.
- 높이 열림은 `grid-template-rows: 0fr → 1fr`, 행 등장은 `opacity` + `translateY`에 행마다 60ms씩 `transition-delay`.
  GSAP을 쓰지 않습니다.
- **공통 `prefers-reduced-motion` 규칙은 `transition-duration`만 0으로 만들고 `transition-delay`는 남깁니다.**
  그대로 두면 모션 최소화 설정에서도 행이 0.36초에 걸쳐 하나씩 나타납니다. `shop_detail.css` 안에
  `:nth-child(n)`으로 같은 특정도의 규칙을 두어 delay를 0으로 덮었습니다.

### craft 섹션 — 이미지 높이 선택자 충돌 (2026-08-06 수정)

- `.craft_media img { height: 100% }`(특정도 0,1,1)가 `.craft_main_image { height: 400px }`(0,1,0)를 이겨서
  메인 이미지가 `.craft_media` 높이 전체인 **689px로 렌더링**됐습니다(시안 400px).
- 그 결과 media 열 콘텐츠가 984px가 되어 `.craft_media`(689px)를 295px 넘쳤고,
  `.craft_section`의 `overflow: hidden`이 아래 66px을 잘라냈습니다. 초록 배경이 콘텐츠를 감싸지 못한 원인입니다.
- 같은 이유로 `@media` 안의 `.craft_main_image { height: auto; aspect-ratio: 470/400 }` 반응형 규칙도 전부 무시되고 있었습니다.
- 수정: 공통 img 규칙에서 `.craft_media img`를 분리해 `height: 100%`를 빼고 `width`/`object-fit`만 남겼습니다.
  craft 이미지 높이는 `.craft_main_image`(400px)와 `.craft_media_row > img`(240px)가 각자 갖습니다.
- 남은 것: `.craft_media { height: 689px }`인데 실제 콘텐츠는 695px이라 6px 넘칩니다. 잘리지는 않습니다(클리핑 0).
  689가 Figma 값이라 임의로 바꾸지 않았습니다.
- `.narrative_main_image` 안의 img는 **문제 없습니다.** 1024 / 1280 / 1600 세 폭에서 figure와 img 크기가
  정확히 같고 좌우·아래 여백 0입니다. `width: 100%`는 원인이 아닙니다.
  (`object-fit: cover`라 figure가 원본 460px보다 좁아지면 좌우가 잘립니다. 빈 공간이 생기는 게 아니라 그 반대입니다.)

### craft 섹션 높이 고정 (2026-08-06)

- 아코디언(`.accordion_item`)을 열면 `.craft_copy`가 커지면서 초록 섹션 전체가 늘어났습니다.
  측정: 닫힘 1058px / 1개 열림 1125px / 3개 모두 열림 1259px.
- **처음 시도(폐기): `.craft_section { height: 1290px }` 고정.** 두 가지가 남았습니다.
  1. `align-items: center` 때문에 내용이 열 때마다 **100px씩 위로 튀었습니다**("덜커덕"의 정체).
     섹션 높이만 고정하고 안쪽 내용은 재중앙정렬됐기 때문입니다.
  2. 1100px 이하에서는 `height: auto`라 여전히 늘어났습니다. 폭마다 필요한 높이가 달라 고정 px가 맞지 않습니다.
- **현재 방식: `shop_detail.js`의 `reserveAccordionSpace()`가 `.detail_accordion`에 자리를 미리 확보합니다.**
  모든 항목을 잠깐 열어 높이를 재고 그 값을 `min-height`로 넣습니다. 아코디언 박스 높이가 항상 고정이므로
  섹션 높이도, 내용 위치도 변하지 않습니다. **CSS에 고정 px를 박지 않아 모든 폭에서 자동으로 맞습니다.**
- 측정 중에는 `.detail_accordion.is_measuring`으로 트랜지션을 꺼서 실제 높이를 바로 읽습니다.
- 웹폰트 적용 후(`document.fonts.ready`), 그리고 폭이 바뀔 때(`ResizeObserver` + `window resize` 병행) 다시 잽니다.
  폭이 실제로 달라졌을 때만 다시 재도록 막아두어 무한 루프가 없습니다.
- 대가: 전부 닫힌 상태에서 아코디언 아래에 빈 자리가 생깁니다(1280px 기준 약 200px).
  줄이려면 "한 번에 하나만 열림"으로 바꾸면 되지만 상호작용이 바뀌므로 미적용.
- JS가 꺼져 있으면 예전처럼 늘어납니다(점진적 향상).

### 알려진 반응형 결함 (이번 작업 범위 밖)

- **1101~1280px**: `.narrative_grid`가 `width: 1040px` 고정이고 `.craft_container` 좌우 여백이 64px이라
  합계 1168px가 되어 창보다 넓습니다. 1101px에서 페이지 가로 스크롤 18px 발생. `≤1100` 미디어쿼리에서야 풀립니다.
- **768px**: `.look_products`의 `overflow-x: auto`가 `max-width: 767px`에만 걸려 있어 가로 스크롤 75px 발생.

### 문법·구조 검사 (2026-08-06부터 매 작업 후 실행)

- 이 저장소에는 `node`, `npx`, `package.json`이 없어 lint 도구를 쓸 수 없습니다.
- 대신 미리보기 브라우저(실제 Chrome 파서)에서 검사 스크립트를 실행합니다. 원본은 세션 스크래치패드의 `check.js`.
- 검사 항목: JS `new Function()` 컴파일(문법), HTML 태그 짝·중복 id·alt 누락·이름 없는 입력요소,
  CSS 중괄호 균형·파서가 버린 규칙·선언이 모두 버려진 규칙.
- **W3C 검사기가 아닙니다.** 속성값 안의 `>`를 정규식이 오인할 수 있고, 의미론적 마크업 규칙은 보지 않습니다.
  W3C validator는 코드를 외부로 전송하므로 사용자 허락 없이 쓰지 않습니다.

### 검증 (2026-08-06, localhost:5602)

- purchase_panel: `scrollTop` 0/300/600/900/1200에서 panelTop이 1:1로 함께 이동 — 고정 구간 없음
- 패널·페이지 가로 스크롤 모두 0 (1440 / 1280 / 1024)
- 버튼 hover 최종값: primary `rgb(22,51,47)`, secondary `rgb(31,67,63)` + 흰 글씨,
  size_button `matrix(1,0,0,1,0,2)` + inset 그림자
- 사이즈 가이드: 열림 시 내부 높이 431px, `aria-expanded` true/false 전환, 닫힘 시 높이 0 + `visibility: hidden`
- 단위 전환: CM → 37/45/39/43/49/138, INCH → 14.6/17.7/15.4/16.9/19.3/54.3, 헤더 라벨도 함께 전환
- 표 폭 264px(라벨 186 + 값 78), 영문 라벨 줄바꿈 없음
- 콘솔 에러 없음

### 확인하지 못한 부분

- **이 세션의 미리보기 탭은 실제 마우스 클릭 이벤트가 페이지에 전달되지 않습니다.**
  `pointerdown`/`click` 리스너를 붙이고 클릭해도 이벤트가 0건이었습니다(hover는 전달됨).
  위 검증은 모두 `element.click()` 디스패치와 최종 상태 측정으로 했습니다. 핸들러 경로는 같지만
  실제 마우스로 눌러보는 확인은 사용자가 해야 합니다.
- `requestAnimationFrame`이 돌지 않아(`gsap.ticker.time` 0 고정) **애니메이션이 재생되는 모습 자체는 못 봤습니다.**
  transition 속성·지연·최종 상태가 올바른 것만 확인했습니다. 스태거 속도감은 실제 브라우저에서 볼 필요가 있습니다.
- 사이즈 가이드의 반응형(360 / 768 / 1280) 확인

### Shop Detail 다음 작업

1. One size와 XS~XL 사이즈 버튼의 불일치 정리 방향 결정
2. 사이즈 가이드 반응형 확인
3. `.look_products`의 `overflow-x: auto`가 `max-width: 767px`에만 걸려 있어 768px에서 가로 스크롤 75px 발생 — 기존 문제

## 다음 작업

1. 메인페이지 전체 반응형(360 / 768 / 1280) 일괄 작업
2. 셀럽 캐러셀 인터랙션
3. 나머지 6개 Figma 노드의 화면 정체 확인 후 페이지 구현

## 마지막 검증 결과

- 실행 방법: `.claude/launch.json`의 `static` (PowerShell 정적 서버, http://localhost:5599)
- lint / test / build: 설정된 도구 없음 — 실행하지 않았습니다.
- 확인 화면: 360px, 768px, 1280px, 1920px
  - 가로 스크롤: 360/768 모두 `scrollWidth == clientWidth`, 없음
  - 1920px에서 시안 좌표 일치 확인:
    hero 제목 (80, 732) / 본문 (80, 797, w395) / 버튼 (80, 865) / shop 로고 (1022, 100, 130×118)
  - intro 높이 304.7px (시안 304px)
  - 폰트 Trirong · Montserrat · Pretendard Variable 로드 확인
- 콘솔 오류: 없음
- 모바일 메뉴: 열기/닫기, 아이콘 전환, 1280px 이상에서 자동 닫힘 확인
- 뉴스레터: 빈 값 / 형식 오류 / 정상 3가지 상태 동작 확인
- 키보드: Tab 순서 24개 요소가 화면 순서와 일치, focus-visible 외곽선 표시 확인
- brand 가로 스크롤:
  - 768px / 1440px에서 `is_horizontal` 적용, 360px에서 미적용(ScrollTrigger 0개) 확인
  - 패널 폭이 스크롤바를 뺀 실제 폭과 일치 (1440 → 1425px × 5 = 7125)
  - 5번 패널 제목·본문·버튼 가로 중심 일치, 세로 겹침 없음
  - 1~4번 패널 화면 확인 (제목 상단, 그림 좌측, 본문 중앙)
- 인터랙션 (2026-08-04, 1920 × 1000 데스크톱에서 확인):
  - 롤링 텍스트: 배경 `rgba(0,0,0,0)`, 글자 `rgb(10,10,10)`, `marquee_scroll 32s` 동작
  - Shop 띠: `li` 12개 / 4368px, hover 시 `animation-play-state: paused` + `scale(1.06)`,
    마우스를 떼면 `running`으로 복귀하고 0.7초에 34px 이동 확인
  - 코디: 다음 버튼 실제 클릭으로 가운데 룩 전환 확인,
    5 → 1 / 1 → 5 순환과 카운터(`3/5` → `4/5` → `1/5` → `5/5`) 확인
  - 콘솔 오류: 없음
- 확인하지 못한 부분:
  - 실제 스크린리더 낭독
  - 인터랙션 3종의 반응형(360 / 768 / 1280) 동작 — 이번 작업은 데스크톱 기준만 진행했습니다.
  - `prefers-reduced-motion: reduce` 환경에서의 실제 동작 (코드상 가로 스크롤이 꺼지도록 작성)
  - 미리보기 창이 GSAP pin(`position: fixed`) 상태를 캡처하지 못해, 가로 스크롤 구간 일부는
    화면 캡처 대신 DOM 좌표 측정으로 확인했습니다.
