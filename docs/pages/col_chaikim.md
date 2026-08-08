# col_chaikim 페이지 작업 기록

`pages/col_chaikim/` 페이지의 작업 내역입니다.
대상 화면은 Figma `4조 한복판 - 차이킴` node `1710:3971`("col_chaikim", 1920 × 9796.75)입니다.

자매 페이지 `pages/col_chaikimyoungjin/`(node `1710:3865`)와 **레이아웃·class 이름·인터랙션이 같습니다.**
두 시안이 같은 구조를 공유하고 글과 사진만 다르기 때문입니다.
레이아웃 규칙을 고칠 일이 생기면 두 폴더를 함께 봐야 합니다.

---

## 기존 Collection 페이지를 두 폴더로 나눔 (2026-08-06)

한 폴더에 있던 Collection을 시안 두 개에 맞춰 나눴습니다.

| 이전 | 이후 |
|---|---|
| `pages/collection_test/` | `pages/col_chaikimyoungjin/` |
| `pages/collection_test/css/collection.css` | `pages/col_chaikimyoungjin/css/col_chaikimyoungjin.css` |
| `pages/collection_test/js/collection.js` | `pages/col_chaikimyoungjin/js/col_chaikimyoungjin.js` |
| `/asset/collection/` (70개, 220MB+) | 각 페이지 폴더 안의 `asset/` 두 개로 분리 |
| — | `pages/col_chaikim/` (이번에 새로 만든 페이지) |

- 페이지 안의 이미지 경로는 절대경로 `/asset/collection/...`에서 **상대경로 `asset/...`**으로 바꿨습니다.
  JS 안의 경로도 문서 기준으로 해석되므로 같은 상대경로가 그대로 동작합니다.
- 공유 파일 `common/components/header.html` / `footer.html`의 Collection 링크를 새 경로로 바꿨습니다.
  헤더 서브메뉴는 원래부터 두 갈래(`TCHAI KIM YOUNG JIN` / `TCHAI KIM`)였고, 이제 각각 실제 페이지로 갑니다.
  (전에는 둘 다 같은 페이지의 앵커였습니다.)
- 두 페이지 모두 `data-page="collection"`이라 헤더의 COLLECTION 현재 표시가 양쪽에서 켜집니다.

### 에셋 분배 기준

- `pages/col_chaikim/asset/` — 이 시안이 쓰는 사진. Figma에서 내려받은 17장과
  저장소에 이미 있던 `archive_kim20xx_*` 내보내기입니다.
- `pages/col_chaikimyoungjin/asset/` — 나머지 전부(50개). 기존 페이지가 참조하는 25개와,
  두 페이지 어느 쪽도 참조하지 않는 작업용 파일(Gemini 생성 이미지, AI 영상 클립, 원본 영상 등)입니다.
  **어느 쪽에도 안 쓰이는 파일이 그쪽에 모여 있습니다.** 정리하려면 그 폴더를 보면 됩니다.
- 나눈 뒤 두 폴더의 파일을 MD5로 대조해, **col_chaikim이 쓰는 사진과 내용이 같으면서
  col_chaikimyoungjin에서는 쓰이지 않는 파일 5개를 지웠습니다**
  (`9641772…jpg`, `Gemini_…irh7bg….png`, `Image5.png`, `vogue201607_2.jpg`, `vogue_08_05_shop1_144659.jpg`).
  같은 내용이 `pages/col_chaikim/asset/`에 이름을 바꿔 남아 있고, 지운 파일은 git 이력에도 있습니다.
- `다운로드 (2).jpg`(= col_chaikim의 `showcase_d.png`)는 **두 페이지가 모두 쓰는 사진**이라
  양쪽에 한 벌씩 둡니다. 페이지별 asset 폴더를 쓰기로 한 이상 이런 중복은 피할 수 없습니다.

### 파일 이름 정리 (내용 변경 없음)

```
archive_kim2019_ 1 1.png  →  archive_kim2019_1.png      (5장, 이번 페이지에서는 미사용)
archive_kim2020_ 1 1.png  →  archive_2020_1.png         (2020 세트)
archive_kim2021_2 1.png   →  archive_2021_1.png         (2021 세트)
main_img.png              →  showcase_c.png
```

### 남은 문제

- **`asset/collection/콜렉션 패션쇼 영상.mp4`(191MB)가 아직 지워지지 않았습니다.**
  다른 프로그램이 파일을 잡고 있어 이동이 실패했고, 대신 복사해서 옮겼습니다.
  같은 파일이 `pages/col_chaikimyoungjin/asset/`에 있으므로 원본은 지워도 됩니다.
  파일을 잡고 있는 프로그램(다른 세션의 정적 서버·미디어 플레이어 등)을 닫고 아래를 실행하세요.

  ```
  Remove-Item -LiteralPath "asset\collection\콜렉션 패션쇼 영상.mp4" -Force
  ```

- `archive_kim2019_1~5.png`(스튜디오 흰 배경 5장)는 이번 구현에서 쓰지 않습니다.
  시안의 2019 세트가 이 사진들이 아니라 다른 다섯 장이라서입니다. 아래 "archive" 항목을 보세요.

---

## col_chaikim 페이지 구현 (2026-08-06)

### 파일

- `pages/col_chaikim/index.html`
- `pages/col_chaikim/css/col_chaikim.css` — col_chaikimyoungjin.css에서 시작
- `pages/col_chaikim/js/col_chaikim.js` — col_chaikimyoungjin.js에서 시작
- `pages/col_chaikim/assets/icons/arc.svg`, `arrow_right.svg` — 자매 페이지에서 복사
- `pages/col_chaikim/asset/` — 사진 28장

공통 시스템은 그대로 씁니다: `common/css/*` 4개 + `common/js/common.js`, header/footer 슬롯,
`data-page="collection"` / `data-header-variant="black"`.

### 섹션 구성 (시안 y좌표 기준)

1. `collection_hero` 0–1182 — 사진 전체화면 + 가운데 "TChai Kim"
2. `showcase` 1182–4516 — `arc.svg` + 세로 그라디언트 위에 사진 7장과
   "Reimagining / Tradition for / Daily Life" 세 줄
3. `archive` 4516–7271 — 왼쪽 연도 내비(sticky) + 연도별 사진
4. `asworn` 7271–8765 — "As worn" 제목 + 태그 5개 + 협업 카드 4장

좌표·크기·기울기는 자매 페이지와 **완전히 같습니다.** 확인한 값:
showcase 사진 7장 (95,1429) (1451,1497) (605,2432) (1398,2695) (138,2867) (1391,3325) (371,3522),
기울어진 두 장의 회전 -15.55° / +13.07°(회전 전 269.223 × 386.768),
문장 세 줄 (760,1894) (1026,2011) (760,2123).
그래서 CSS의 레이아웃 부분은 손대지 않았고, 바뀐 것은 아래 네 가지뿐입니다.

### 시안과 다르게 판단한 것 / 자매 페이지와 다른 것

1. ~~**hero는 영상이 아니라 이미지입니다.**~~ → **2026-08-07 영상으로 교체했습니다.**
   Figma 레이어 이름이 `Fashion_show_video`인데 시안 채우기가 정지 이미지라 처음엔
   `<img class="collection_hero_image">`로 두었지만, 사용자 요청으로 `asset/chaikim_video.mp4`를
   넣었습니다. 마크업·CSS는 자매 페이지(`col_chaikimyoungjin`)와 같은 구성입니다 —
   `<video autoplay muted loop playsinline preload="metadata">` + `<source>`,
   CSS class는 `.collection_hero_image` → **`.collection_hero_video`**로 바꿨습니다
   (선언 내용은 `position: absolute; inset: 0; object-fit: cover`로 동일).
   `poster`는 원래 쓰던 `asset/hero.png`를 그대로 씁니다.

   교체할 때 고친 것 두 가지:
   - **`</video>` 닫는 태그가 없었습니다.** 그러면 뒤따르는 `<h1>`이 video의
     **대체 콘텐츠(fallback)로 빨려 들어가** 영상이 재생되는 브라우저에서는 제목이
     아예 그려지지 않습니다. 실제로 `h1.parentElement`가 `VIDEO`였고, 지금은 `SECTION`입니다.
   - `alt`는 `<video>`에 없는 속성이라 `aria-label`로 바꿨고,
     `autoplay muted loop playsinline`이 없어 재생 자체가 시작되지 않던 것을 넣었습니다.

   **재생하는 파일은 `chaikim_video_web.mp4`(H.264)입니다.**
   사용자가 넣은 `chaikim_video.mp4`는 **HEVC(H.265)**라 그대로 쓰면 Firefox나 OS
   디코더가 없는 환경에서 재생되지 않고 poster만 남습니다(이 PC의 Chrome은 재생됨).
   자매 페이지와 같은 이유·같은 방식으로 변환했고, **HEVC 원본은 마스터로
   asset에 그대로 두었습니다.**

   | 파일 | 코덱 | 크기 | 원본 대비 SSIM |
   |---|---|---|---|
   | `chaikim_video.mp4` (원본·마스터) | HEVC Main | 15.4MB | — |
   | `chaikim_video_web.mp4` (**사용 중**) | H.264 High | **12.2MB** | 0.9698 |
   | (검토 후 버림) CRF 23 | H.264 High | 17.7MB | 0.9786 |

   **CRF 23이 아니라 26을 골랐습니다.** 프로젝트 표준 명령(CRF 23)으로 뽑으면
   17.7MB로 **HEVC 원본보다 오히려 커집니다**(HEVC가 더 효율적인 코덱이라 당연한
   결과입니다). CRF 26은 31% 작으면서 SSIM 차이가 0.009뿐이고, 잔디 텍스처
   구간을 640×400으로 잘라 눈으로 확인했을 때 블로킹·밴딩이 없었습니다.
   더 높은 화질이 필요하면 아래에서 `-crf 26`을 `23`으로 바꿔 다시 뽑으면 됩니다.

   ```
   ffmpeg -i chaikim_video.mp4 -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
     -crf 26 -preset slow -movflags +faststart chaikim_video_web.mp4
   ```

   - 오디오(AAC)는 `-an`으로 제거했습니다. 음소거 배경 루프라 쓰이지 않습니다.
   - `-movflags +faststart`라 앞부분부터 바로 재생됩니다.
   - **`poster`는 `hero.png`(2.86MB) 그대로 둡니다.** 시안 스틸이라 바꾸는 것은
     디자인 판단이라고 보고 손대지 않았습니다. 영상 첫 프레임(잔디밭 장면)은
     `hero.png`(크림 배경 착장 클로즈업)와 **다른 장면**이라, poster에서 영상으로
     넘어갈 때 화면이 한 번 바뀝니다. 그게 거슬리면 첫 프레임을 poster로 쓰면
     됩니다(146KB로 줄어듭니다):
     `ffmpeg -ss 0 -i chaikim_video.mp4 -frames:v 1 -q:v 4 chaikim_video_poster.jpg`

2. **archive 연도 세트.** 시안은 **2019가 활성**이고 그 다섯 장만 그려져 있습니다.
   2020 / 2021은 시안에 없어서, 저장소에 있던 `archive_kim2020_*`(5장) / `archive_kim2021_*`(4장)
   내보내기를 세트로 삼았습니다.
   - 이 중 세 장은 hero / showcase에도 쓰이는 **같은 파일**입니다. 복사하지 않고 그 이름 그대로 참조합니다
     (`asset/hero.png`, `asset/showcase_a.png`, `asset/showcase_b.png`).
     파일이 같다는 것은 MD5로 확인했습니다.
   - **2021은 네 장뿐입니다.** 다섯 번째 자리는 `.archive_photo.is_empty { display: none }`로 감춥니다.
     `applyYearPhotos()`가 사진이 없는 자리에 이 class를 붙입니다.
   - `archive_kim2019_1~5.png`(스튜디오 흰 배경 5장)는 시안의 2019 사진과 다른 세트라 쓰지 않았습니다.
     이 다섯 장을 어디에 쓸지는 정해지지 않았습니다.

3. **archive 배치를 시안 좌표 그대로 쓰지 않았습니다.**
   시안은 사진 다섯 장이 세로 2310px(y 288~2598)에 걸쳐 있는데, 이 페이지의 `.archive_frame`은
   화면 한 장 높이(920px)입니다. 자매 페이지와 같은 방식으로, 좌우 위치와 순서는 시안대로 두고
   세로만 압축한 배치표를 새로 썼습니다. 값은 `ARCHIVE_LAYOUTS["2019"]`와 CSS의
   `.archive_photo_1 ~ _5` 기본값에 같이 있습니다(둘이 항상 같아야 합니다).

4. **as worn 카드가 넷입니다**(자매 페이지는 셋). `.asworn_item_4`를 `.asworn_item_3`과 같은 규칙에 묶었습니다.
   시안의 카드 네 장 폭 합계는 3327px입니다.

그 밖에 자매 페이지와 같은 판단을 그대로 이어받았습니다.
연도 내비의 2018 / 2017 / 2015 / 2013은 연결할 데이터가 없어 `href="#"` 정적 링크,
카드 설명은 시안의 줄바꿈 대신 폭 안에서 자연 줄바꿈, 본문 색은 토큰 `--color_text`.

### 시안에서 그대로 가져온 글

- hero: `TChai Kim`
- showcase: `Reimagining` / `Tradition for` / `Daily Life`
- archive: 제목 `Tchai Kim`, 연도 2021 · 2020 · **2019(활성)** · 2018 · 2017 · 2015 · 2013,
  링크 `Shop Now` → `/pages/shop/index.html`
- as worn: 제목 `As worn`,
  태그 `#Sim cheong ga` `#Mr. sunshine` `#Vogue korea` `#Vogue portugal` `#Fashion Show`,
  카드 `SIM CHEONG GA` · `MR. SUNSHINE` · `VOGUE KOREA 2016` · `VOGUE PORTUGAL 2019`(본문도 시안 그대로)

`#Fashion Show`만 연결할 카드가 없어 `disabled`입니다. 나머지 넷은 누르면 그 카드가 가운데로 옵니다.

### 인터랙션

자매 페이지와 같은 코드입니다. 자세한 설명은 `docs/PROJECT_CONTEXT.md`의
"Collection showcase 스크롤 인터랙션", "Collection As worn 흐르는 띠" 항목을 보세요.
조절값(`PIN_LENGTH`, `ASWORN_SPEED` 등)도 같은 이름으로 `js/col_chaikim.js` 위쪽에 있습니다.

---

## 검증 결과 (2026-08-06, 1920 × 1000, http://localhost:5611)

- 실행: `.claude/launch.json`의 `tchaikimm`(PowerShell 정적 서버, 저장소 루트 서빙, 포트 5611).
- lint / test / build: 이 저장소에 설정된 도구가 없어 실행하지 않았습니다.
  대신 브라우저에서 문법·구조 검사를 돌렸습니다 — 두 페이지 모두
  JS `new Function()` 컴파일 통과, CSS 중괄호 균형 0, 파서가 버린 규칙 없음(col_chaikim.css 88개 파싱),
  태그 짝 맞음, 중복 id 없음, alt 없는 img 0개.
- 에셋: 페이지가 요청한 파일 전부 200. 깨진 이미지 0개. 콘솔 404는 favicon뿐입니다.
- 좌표: showcase 사진 5장(c~g)과 문장 세 줄이 시안 좌표와 일치.
  기울어진 두 장(a·b)은 스크롤 0에서 GSAP 인트로의 시작 위치(화면 밖)에 있는 것이 정상입니다.
- archive: 다섯 장이 프레임(920px) 안에 들어갑니다 — 왼쪽 끝 501, 오른쪽 끝 1747, 아래 끝 803.
  왼쪽 sticky 글 영역(x 120~470)과 겹치지 않습니다. `.archive_txt_area`의 sticky 정상.
- 연도 전환: 2019 → 2021 → 2020 → 2019 순서로 눌러 사진·배치·활성 표시가 모두 바뀌는 것 확인.
  **2021에서 다섯 번째 자리가 `is_empty`로 감춰지고, 2019로 돌아오면 다시 나타납니다.**
- as worn: 카드 4장 + 복제 4장 = 8장, 한 벌 폭 3361px, 리스트 6702px(화면 1905 + 3361보다 큼).
  `track.scrollLeft`가 0에서 움직이지 않습니다(가로 스크롤바 없음).
  1초에 42px 흐르고, hover 중 0px, 벗어나면 다시 흐릅니다.
  **태그 네 개 각각 클릭 후 그 카드 중심과 트랙 중심 오차 0px.**
- 페이지 가로 스크롤 0.
- 헤더/푸터: COLLECTION → col_chaikimyoungjin, 서브메뉴 TCHAI KIM YOUNG JIN / TCHAI KIM이
  각각 두 페이지로 갑니다. 두 페이지 모두에서 COLLECTION 현재 표시가 켜집니다.
- 자매 페이지 회귀 확인: `pages/col_chaikimyoungjin/`도 이동한 `asset/`에서
  영상(1920×1080 재생)과 이미지를 모두 정상 로드합니다. 문법 검사도 통과합니다.

### 확인하지 못한 부분

- **이번 세션도 Browser 미리보기 패널이 화면에 표시되지 않아 스크린샷을 찍지 못했습니다.**
  `document.hidden`이 계속 `true`라 `requestAnimationFrame`이 한 번도 돌지 않습니다.
  위의 흐름·전환 수치는 `gsap.ticker.tick()`으로 프레임을 직접 진행시켜 측정한 값입니다.
  **시안과 실제 화면의 눈 비교, 실제 마우스 hover, 스크롤 인터랙션의 속도감은 사용자가
  `http://localhost:5611/pages/col_chaikim/index.html`을 직접 열어 확인해야 합니다.**
- 반응형(360 / 768 / 1280)은 자매 페이지와 마찬가지로 아직입니다. 이번 구현은 데스크톱(1920) 기준입니다.
- `asworn_sim_cheong_ga.png`는 시안 원본이 380 × 561로 작습니다(45KB).
  441 × 681 자리에 늘어나 들어가므로 확대되어 보입니다. 더 큰 원본이 있으면 교체가 필요합니다.

## 다음 작업

1. 실제 화면에서 시안과 비교(특히 archive 다섯 장의 배치 균형)
2. 반응형(360 / 768 / 1280)
3. `archive_kim2019_*` 5장의 용처 결정 — 안 쓸 거면 삭제
4. `asset/collection/콜렉션 패션쇼 영상.mp4` 원본 삭제(위 "남은 문제")

---

## showcase / archive 프레임 pin 전환 — 스크롤 진행도로 카드 등장 (2026-08-08)

`css/col_chaikim.css`와 `js/col_chaikim.js` 두 파일만 고쳤습니다.
HTML·에셋·공통 파일(`common/`)·다른 페이지는 건드리지 않았습니다.
**자매 페이지 `pages/col_chaikimyoungjin/`도 같은 문제라 같은 내용을 함께 적용했습니다.**

### 작업 목적

"카드가 등장하는 동안 화면은 고정되고, 스크롤 입력량이 곧 등장 진행도가 되게 해 달라."

### 기존 문제와 원인

두 프레임 모두 카드가 뜨는 동안 페이지가 계속 흘러 **화면 상단에서 잘렸습니다.**
원인은 서로 달랐습니다.

**showcase — pin이 인트로만 감싸고 있었습니다.**

`.showcase`는 3335px인데 화면은 1080px입니다. 섹션을 그대로 pin하면 **위 1080px만**
보입니다. 갤러리 사진 다섯 장은 프레임 좌표 y 1250~2808에 있어서 pin이 끝날 때까지
한 번도 화면에 들어오지 못했습니다(pin 끝 지점에서 다섯 장 전부 `opacity: 0`,
top 1250~2340 측정). 등장 트리거는 **pin 바깥**에서 시작했고, 그때는 평범한 스크롤이라
프레임이 그대로 흘러갔습니다.

| 스크롤 | `showcase_photo_a` top | 문장 top |
|---|---|---|
| pin 끝 | 168 | 712 |
| +254 | **−86 (잘림)** | 458 |
| +654 | **−486** | 58 |

`PIN_LENGTH`가 `"+=1000%"`(10800px)여서, 화면 10장 분량을 붙잡는 동안
인트로 말고는 아무 일도 일어나지 않았습니다.

**archive — pin이 아예 없었습니다.**

`toggleActions: "play none none none"`은 스크롤이 아니라 **시간**으로 재생합니다.
다섯 장이 약 1.65초에 걸쳐 날아드는 동안 페이지는 계속 스크롤됐습니다.

| 스크롤 | 프레임 top | 1번 사진 top |
|---|---|---|
| 트리거 | 108 | 140 |
| +227 | −119 | **−87 (잘림)** |
| +627 | −519 | **−487** (다섯 장 중 넷이 화면 위) |

scrub이 아니라 **역스크롤 역재생도 되지 않았습니다.**

### GSAP / ScrollTrigger

이미 페이지가 gsap 3.13.0 + ScrollTrigger + Lenis를 CDN으로 불러오고 있고
`common.js`가 Lenis를 GSAP 티커·ScrollTrigger에 연결해 둡니다. **새로 추가한
라이브러리는 없습니다.** 기존 구조를 그대로 쓰되 `pin` + `scrub`으로 바꿨습니다.

### showcase — pin + 계단식 이동

섹션이 화면보다 3배 커서 통째로 pin할 수 없습니다. 대신:

1. `.showcase.is_pinned`가 **섹션을 화면 한 장 크기(`height: 100vh`)로 줄여 "창"으로**
   씁니다. 안쪽 배경과 프레임은 3335px 그대로 남아 `overflow: hidden`에 잘립니다.
2. 그 창을 `pin: true`로 고정하고, `scrub: 1`로 **배경(`.showcase_bg`)과
   프레임(`.showcase_frame`) 두 겹을 함께** 밀어 올립니다.
3. 타임라인이 **이동과 등장을 번갈아** 놓습니다. 카드가 뜨는 구간에는 이동 트윈이
   아예 없어 프레임이 1px도 움직이지 않습니다.

```
인트로(2.95) → 이동 → 카드 c 등장 → 이동 → 카드 d 등장 → … → 바닥까지 이동 → 머묾
```

- **배경도 같이 밀어야 합니다.** 프레임만 밀면 사진이 그라디언트 위를 미끄러져
  시안의 색 배치가 어긋납니다.
- **멈추는 위치는 하드코딩이 아닙니다.** `galleryStops()`가 "카드 중심이 화면 중심에
  오는 지점"을 계산해 0~travel로 자릅니다. **누적 최댓값으로 단조 증가시키는 것이
  중요합니다** — 시안에서 d의 중심이 c보다 59px 위에 있어서, 그대로 쓰면 스크롤을
  내리는데 프레임이 되올라갑니다.
- **pin 길이를 화면 배수로 적지 않습니다.** `타임라인 길이 × SHOWCASE_PX_PER_UNIT`으로
  냅니다. 예전 방식은 구간을 하나 더하면 전체 속도가 같이 바뀌었습니다.

### archive — 프레임 통째로 pin

프레임이 920px으로 화면(1080px)보다 작아서 **그대로 pin하면 됩니다.**
`start: "center center"`라 프레임이 화면 한가운데(top 80 / bottom 1000)에 멈춥니다.

- `toggleActions` → `pin: true` + `scrub: 1`. 스크롤 진행도가 곧 등장 진행도입니다.
- `ARCHIVE_STAGGER`를 0.18 → **0.5**로 올렸습니다(DURATION 0.95 → 0.75).
  예전 값은 겹침이 커서 다섯 장이 거의 동시에 들어왔습니다. 이제 한 장씩 보입니다.
- 마지막에 빈 트윈(`ARCHIVE_HOLD`)을 붙여 다섯 장이 다 놓인 화면을 읽을 시간을 둡니다.

#### ★ 연도 전환과 scrub의 충돌 (반드시 알아 둘 것)

`scrub` 타임라인은 값이 스크롤 위치에 묶여 있어 **`restart()`로 다시 재생할 수
없습니다.** 예전 코드의 `timeline.invalidate().restart()`가 그래서 못 쓰게 됐습니다.

지금은 이렇게 나눴습니다.

1. 스크롤 등장 → scrub 타임라인
2. 연도 전환 다시보기 → `archiveReplay`라는 **별도 트윈** (`ARCHIVE_REPLAY_*` 상수)
3. 둘이 같은 값을 서로 덮어쓰지 않도록, ScrollTrigger의 `onUpdate`가
   **스크롤이 들어오는 순간 `archiveReplay`를 kill합니다.** 스크롤 쪽을 진실로
   삼는 것이고, 스크롤이 정하는 값은 언제나 올바른 상태라 화면이 튀지 않습니다.

`timeline.pause()`는 제거했습니다. scrub 타임라인을 pause하면 스크롤이 먹지 않습니다.

### 창 크기 변화

카드가 멈추는 위치와 이동 거리는 창 높이에서 나오는데, 그 값이 **타임라인의 길이까지**
정합니다. 길이는 함수로 줄 수 없어서 `invalidateOnRefresh`로는 따라잡히지 않습니다.
그래서 `createRebuilder()`가 창이 실제로 달라졌을 때(`REBUILD_TOLERANCE` 40px)
`gsap.matchMedia()`를 통째로 새로 만듭니다. 디바운스 200ms입니다.

### 조절값

전부 파일 맨 위 한 블록에 주석과 함께 있습니다.

| 상수 | 값 | 의미 |
|---|---|---|
| `SHOWCASE_PX_PER_UNIT` | 512 | 타임라인 1단위 = 몇 px 스크롤. 올리면 전 구간이 느려집니다 |
| `GALLERY_HOLD` | 0.9 | 카드 한 장이 등장하는 동안 프레임이 멈춰 있는 길이 |
| `GALLERY_TRAVEL_SPEED` | 512 | 프레임 이동 속도(px / 1단위) |
| `SHOWCASE_TAIL_HOLD` | 0.4 | 마지막 카드 뒤 머무는 길이 |
| `ARCHIVE_DURATION` / `ARCHIVE_STAGGER` | 0.75 / 0.5 | 한 장 등장 길이 / 장 사이 간격 |
| `ARCHIVE_HOLD` | 0.7 | 다섯 장이 다 놓인 뒤 머무는 길이 |
| `ARCHIVE_PX_PER_UNIT` | 520 | archive pin 길이 계수 |
| `ARCHIVE_REPLAY_DURATION` / `_STAGGER` | 0.95 / 0.18 | 연도 전환 다시보기(초) |

### 검증 결과 (1920 × 1080, localhost:5615)

**showcase — 갤러리 다섯 장 전부 "프레임 완전 정지 + 잘림 없음":**

| 카드 | 등장 구간 | 그동안 프레임 이동 | 카드 top / bottom | 잘림 |
|---|---|---|---|---|
| c | 376px | **0px** (y −1189 고정) | 61 / 1020 | 없음 |
| d | 376px | **0px** (y −1189 고정) | 324 / 639 | 없음 |
| e | 376px | **0px** (y −1379 고정) | 306 / 774 | 없음 |
| f | 376px | **0px** (y −1823 고정) | 320 / 761 | 없음 |
| g | 376px | **0px** (y −2034 고정) | 306 / 774 | 없음 |

- pin 구간 6274px 전체에서 섹션 top이 **항상 0**(21개 지점 측정).
  프레임 이동 0 → −2255(= 3335 − 1080), 끝에서 프레임 바닥이 화면 바닥과 일치.
- 인트로 3박자 그대로: 카드가 시안 자리(top 247 / 315)에 안착 → 단어가 하나씩
  (`[1,0.92,0,0,0]` → `[1,1,1,1,1]`) → 중앙으로 모이며 퇴장.

**archive — 프레임이 pin 내내 top 80 / bottom 1000 고정**(11개 지점 전부 동일),
다섯 장이 한 장씩 순서대로:

```
p0.0 [0,0,0,0,0] → p0.2 [1,0.69,0,0,0] → p0.4 [1,1,0.94,0,0]
→ p0.6 [1,1,1,1,0.32] → p0.8 [1,1,1,1,1] → p1.0 유지(머묾)
```

등장 완료 시점 다섯 장의 좌표가 전부 화면 안(112~883, 화면 1080), **잘림 0장.**

**그 밖에:**

- **역스크롤 역재생**: 정방향으로 훑은 6~7개 지점을 역방향으로 다시 훑어
  프레임 위치·모든 opacity가 **완전히 일치**(불일치 0건). 두 페이지 모두.
- **pin 해제 후 이어짐**: showcase pin 끝 +200px에서 archive가 top 880에 등장,
  archive pin 끝 +200px에서 asworn이 top 800에 등장. 끊김 없음.
- **연도 전환**: 2019 → 2021 → 2019 전환 시 사진 교체, `is_empty`로 남는 자리 감춤,
  다시보기 트윈 생성 확인. 전환 중 스크롤하면 `onUpdate`가 다시보기를 끊고
  스크롤 값으로 복귀(opacity 1 / x 0 / scale 1)하는 것까지 확인.
- **1280px 미만 복귀**: 창을 1100px로 줄이면 트리거 0개, `is_pinned` 제거,
  섹션 높이 3335px 복귀, 인라인 style 빈 문자열, transform `none`,
  모든 사진 `opacity: 1`, pin-spacer 0개 — CSS 레이아웃 그대로입니다.
  다시 1920px로 넓히면 트리거 2개로 재생성됩니다.
- 가로 스크롤 0. 문서 높이 18835 → 13848(1000% pin이 사라진 만큼 짧아졌습니다).
- `node --check` 두 파일 모두 통과. **JS 콘솔 오류 0건.**
- as worn 띠 무사: 카드 8장(원본 4 + 복제 4), `aria-hidden` 복제 4개,
  `track.scrollLeft` 0(스크롤 컨테이너 아님).

### 확인하지 못한 부분 / 추후 주의사항

- **스크롤된 상태의 화면 캡처를 못 했습니다.** 이 세션의 미리보기 패널은
  `document.hidden`이 `true`라 `requestAnimationFrame`이 돌지 않고, 첫 화면 말고는
  다시 그리지 않습니다(캡처하면 빈 크림색). 위 수치는 전부 `scrollTo()` +
  `ScrollTrigger.update()` 뒤의 `getBoundingClientRect()` / `getComputedStyle()`
  측정입니다. **실제 스크롤 감각, 이동과 등장의 리듬, 마우스 hover는 사용자가
  직접 봐야 합니다.**
- **showcase는 "카드가 뜨는 동안"만 고정입니다.** 카드가 다 뜬 뒤 다음 카드로 가는
  이동 구간에서는 앞 카드가 위로 지나갑니다. 섹션이 3335px이라 다섯 장을 한 화면에
  동시에 둘 수 없어서 그렇습니다(카드 c 혼자 959px). 시안 배치를 바꾸지 않는 한
  피할 수 없는 부분이고, 사용자가 지적한 "등장 중 잘림"과는 다른 현상입니다.
- **화면 높이가 830px 미만이면** archive 프레임(920px)이 화면보다 커져 pin해도
  잘립니다. 기존 제약 그대로입니다.
- **창 크기를 바꾸면 pin이 잠깐 사라졌다 다시 생깁니다**(`createRebuilder`).
  그 순간 스크롤 위치가 조금 튈 수 있습니다.
- 히어로 영상이 여전히 404입니다(`asset/`에 mp4가 없습니다). **기존 문제이고
  이번 수정과 무관합니다** — HTML은 건드리지 않았습니다.
- `prefers-reduced-motion: reduce` 환경의 실제 동작은 실행해 보지 못했습니다
  (`gsap.matchMedia()`가 위 1280px 미만과 같은 경로로 되돌리도록 작성).

### 속도 조정 + 인트로↔갤러리 이음매 제거 (2026-08-08, 같은 날 2차)

같은 두 파일(`css/col_chaikim.css`는 그대로, `js/col_chaikim.js`만)입니다.
요청: **"카드 등장 조금 빠르게, 처음 2개 카드 등장하고 멈추는 것 없애기, 너무 느림."**

#### 멈춤의 정확한 위치 (측정)

1차 구현에서 실제로 두 곳이 멈춰 있었습니다.

| 위치 | 정지 거리 | 그 사이에 일어나는 일 |
|---|---|---|
| 상단 두 장 안착 → 퇴장 시작 | **241px** | 없음(단어는 이미 다 떴음) |
| 인트로 끝 → 첫 갤러리 카드 | **1194px** | 배경만 미끄러짐 |

두 번째가 특히 컸습니다. `GALLERY_TRAVEL_SPEED`가 `SHOWCASE_PX_PER_UNIT`과 같아
프레임 이동이 1:1 스크롤이었고, 첫 카드까지 1189px을 그냥 지나가야 했습니다.

#### 고친 방법

**① 이동 구간을 짧게.** `GALLERY_TRAVEL_SPEED` 512 → **880**.
이동에 쓰는 스크롤이 실제 이동 거리의 약 43%로 줄어, 카드 없는 구간이 짧아집니다.

**② 이동과 등장을 겹칩니다.** `GALLERY_LEAD`(0.3) 신설 — 이동이 끝나기 전에 등장이
시작됩니다. "이동 → 딱 멈춤 → 등장"의 이음매가 사라집니다.
**위쪽 잘림은 여전히 구조적으로 불가능합니다** — 프레임은 위로 올라가는 중이라
카드는 늘 아래에서 올라오고, 이동이 끝나는 지점이 곧 카드가 화면 한가운데에 서는
자리이며 그 뒤로는 프레임이 멈춰 있기 때문입니다.
`lead`는 `Math.min(GALLERY_LEAD, moveLength)`로 자릅니다. 이동보다 길면 앞 카드의
등장 구간을 침범합니다(e·g는 이동이 짧아 실제로 잘립니다).

**③ 인트로와 갤러리를 겹칩니다.** `INTRO_HANDOFF`(0.75) 신설 —
상단 두 장이 물러나는 동안 프레임이 이미 움직이기 시작합니다.

**④ 두 장이 뜬 뒤의 정지 제거.** `EXIT_START` 1.55 → **1.2**
(B가 안착하는 1.08의 바로 뒤), `EXIT_DURATION` 1.4 → **1.15**.

**⑤ 전체 속도.** `SHOWCASE_PX_PER_UNIT` 512 → **380**,
`GALLERY_HOLD` 0.9 → **0.62**, `SHOWCASE_TAIL_HOLD` 0.4 → **0.25**,
단어 `WORD_DURATION` 0.45 → **0.4** / `WORD_STAGGER` 0.22 → **0.16**.
archive는 `ARCHIVE_PX_PER_UNIT` 520 → **400**, `ARCHIVE_STAGGER` 0.5 → **0.42**,
`ARCHIVE_HOLD` 0.7 → **0.45**.

#### 결과

| | 1차 | 2차 |
|---|---|---|
| showcase pin 길이 | 6274px | **2454px** (2.6× 빠름) |
| archive pin 길이 | 1794px | **1152px** (1.6× 빠름) |
| 카드 한 장 등장 | 376px | **196px** |
| 인트로 → 첫 카드 빈 구간 | 1194px | **120px** |
| 문서 전체 높이 | 13848 | **9386** |

- **위쪽 잘림 0** — 다섯 장 등장 구간의 최소 top이 61 / 324 / 306 / 320 / 306입니다.
- 카드가 236px 간격으로 차례차례(1008 / 1244 / 1480 / 1796 / 2032).
- **화면이 60px 이상 전혀 안 바뀌는 구간은 3곳뿐**이고 전부 정상입니다 —
  66px 두 곳은 `power3.out`의 감속 꼬리(마지막 몇 px이 정수로 같아짐),
  90px 한 곳은 의도한 `SHOWCASE_TAIL_HOLD`입니다.
- archive: 프레임 top 80 고정, `[1,0.6,0,0,0]` → `[1,1,0.88,0,0]` →
  `[1,1,1,0.98,0.23]` → 전부 1. 등장 완료 시점 잘림 0장.
- 역스크롤 불일치 0건, 가로 스크롤 0, JS 오류 0, 실패한 요청 0건.
- 두 페이지의 조절값 13개가 완전히 동일합니다.

#### 알아 둘 것

- **카드 c만 등장 시작 시점에 아래쪽이 203px 화면 밖입니다.** c가 959px로 커서
  그렇고, 그 순간 opacity가 0이라 "아래에서 떠오르는" 모습으로 보입니다.
  위쪽 잘림과 달리 문제가 아니라고 판단했습니다.
- 더 빠르게: `SHOWCASE_PX_PER_UNIT` / `ARCHIVE_PX_PER_UNIT`을 내리세요.
  카드 등장만 빠르게: `GALLERY_HOLD`(0.62) / `ARCHIVE_STAGGER`(0.42).
  이음매가 다시 끊겨 보이면: `GALLERY_LEAD`(0.3) / `INTRO_HANDOFF`(0.75)를 올리세요.
- 이징은 바꾸지 않았습니다(`power3.out`). "튕기는" 재미를 더 원하면
  갤러리 등장 이징을 `back.out(1.4)`로 바꾸는 방법이 있으나,
  기존 모션 성격이 달라지므로 적용하지 않았습니다.
- **이번에도 스크롤된 상태의 화면 캡처는 못 했습니다**(패널이 다시 그리지 않음).
  위 수치는 전부 좌표·스타일 측정입니다. **속도감은 직접 보셔야 합니다.**
