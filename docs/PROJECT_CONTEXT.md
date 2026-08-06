# Tchai Kim 현재 상태

## Shared system migration (2026-08-06)

- Repository-wide rules and project documents moved from `test/main_test/` to the repository root and `docs/`.
- Shared tokens, reset, base components, header/footer layout, and common behavior now live in `common/`.
- Main, Shop, and Bespoke load the same shared CSS and JavaScript files.
- Bespoke-only header/footer differences remain in `test/bespoke_test/css/bespoke.css` as page overrides.
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

## Shop 페이지 (`test/shop_test/`)

- 대상 화면: Figma `4조 한복판 - 차이킴` node `1523:1094`("shop_박효민"). main 페이지와 별도 폴더에 독립 구현.
  **폴더 위치가 `test/main_test/shop_test/` → `test/shop_test/`(main_test의 형제 폴더)로 이동했습니다.** 헤더 로고 링크(`../main_test/index.html`)와 `.claude/launch.json`의 `shop_test` 설정 경로를 이 위치 기준으로 갱신했습니다.
- 범위: 반응형은 다음 단계 예정. **레이아웃 구조는 main_test와 동일한 방식으로 전환**했습니다 — `body`/`.main`과 각 섹션(`hero_section`/`banner`/`new_arrivals_section`/`shop_section`)은 `width:100%`로 창 너비에 맞춰 늘어나고, Figma 절대좌표(1920 기준)에 의존하는 `hero_section`의 watermark·갤러리·카테고리 내비만 `.hero_section_frame`(1920px 고정, 가운데 정렬)으로 감쌌습니다. main_test가 코디·클로징 섹션에만 쓰는 "1920px 고정 프레임 가운데 정렬" 패턴을 hero_section에 적용한 것과 같은 방식입니다.
  이전에는 body/.main과 모든 섹션에 `width:1920px`를 직접 걸어서, 창이 1920px보다 넓으면 페이지 전체가 가운데의 작은 고정 박스로 보였습니다(main_test는 대부분 유동적이라 꽉 차 보였음) — 그 차이를 없앤 것입니다. 2560px 창에서 `hero_section_frame`이 정확히 1920px폭·가운데 정렬로 뜨는 것, 1920px 창에서 기존 레이아웃과 픽셀 단위로 동일한 것을 스크립트로 확인했습니다.
- 구현 완료 섹션: hero_section(카테고리 내비 + 회전 갤러리), banner, new_arrivals_section(2×2 상품 카드), shop(필터바 + 3×2 상품 카드 + View More), 공용 header/footer(main_test와 동일 마크업 재사용).
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
- 실행: `.claude/launch.json`의 `shop_test` 설정(PowerShell 정적 서버, `http://localhost:5602`, `test/shop_test`를 루트로 서빙, 스크립트는 세션 스크래치패드에 위치).
- 검증: 네트워크 요청 전량 200 OK(자산 경로 오류 없음), 콘솔 에러 없음, 8장 이미지 중 4장이 정확히 자리 class를 받는 것과 자동 회전 타이머가 실제로 진행되는 것을 스크립트로 확인, 카테고리 focus 이벤트로 해당 이미지가 featured 자리로 정확히 이동하는 것 확인. **다만 이번 세션에서는 Browser 미리보기 패널이 화면에 표시되지 않아 스크린샷 기반 시각 비교와 실제 마우스 hover(`:hover`) 동작 확인은 하지 못했습니다** — 이벤트 리스너 로직 자체는 focus 이벤트로 검증했지만, 사용자가 `http://localhost:5602`을 직접 열어 눈으로 확인 필요.

### Shop 다음 작업

1. garment_story, motif_detail 두 섹션 디자인 컨텍스트 조회 후 구현
2. 상품 카드 hover 시 원단 디테일컷으로 전환하는 기능은 카드별 정확한 이미지 매핑이 필요 — Figma에서 직접 확인 필요
3. shop 페이지 반응형(360/768/1280) 대응
4. 실제 브라우저 스크린샷으로 Figma 시안과 픽셀 단위 비교, 실제 마우스 hover(원통형 갤러리 회전, 카드 hover, 검색창 확장) 수동 확인

## Shop Detail 페이지 (`test/shop_detail_test/`) — 2026-08-06

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
