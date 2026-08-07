# col_chaikim 페이지 작업 기록

`test/col_chaikim_test/` 페이지의 작업 내역입니다.
대상 화면은 Figma `4조 한복판 - 차이킴` node `1710:3971`("col_chaikim", 1920 × 9796.75)입니다.

자매 페이지 `test/col_chaikimyoungjin_test/`(node `1710:3865`)와 **레이아웃·class 이름·인터랙션이 같습니다.**
두 시안이 같은 구조를 공유하고 글과 사진만 다르기 때문입니다.
레이아웃 규칙을 고칠 일이 생기면 두 폴더를 함께 봐야 합니다.

---

## 기존 Collection 페이지를 두 폴더로 나눔 (2026-08-06)

한 폴더에 있던 Collection을 시안 두 개에 맞춰 나눴습니다.

| 이전 | 이후 |
|---|---|
| `test/collection_test/` | `test/col_chaikimyoungjin_test/` |
| `test/collection_test/css/collection.css` | `test/col_chaikimyoungjin_test/css/col_chaikimyoungjin.css` |
| `test/collection_test/js/collection.js` | `test/col_chaikimyoungjin_test/js/col_chaikimyoungjin.js` |
| `/asset/collection/` (70개, 220MB+) | 각 페이지 폴더 안의 `asset/` 두 개로 분리 |
| — | `test/col_chaikim_test/` (이번에 새로 만든 페이지) |

- 페이지 안의 이미지 경로는 절대경로 `/asset/collection/...`에서 **상대경로 `asset/...`**으로 바꿨습니다.
  JS 안의 경로도 문서 기준으로 해석되므로 같은 상대경로가 그대로 동작합니다.
- 공유 파일 `common/components/header.html` / `footer.html`의 Collection 링크를 새 경로로 바꿨습니다.
  헤더 서브메뉴는 원래부터 두 갈래(`TCHAI KIM YOUNG JIN` / `TCHAI KIM`)였고, 이제 각각 실제 페이지로 갑니다.
  (전에는 둘 다 같은 페이지의 앵커였습니다.)
- 두 페이지 모두 `data-page="collection"`이라 헤더의 COLLECTION 현재 표시가 양쪽에서 켜집니다.

### 에셋 분배 기준

- `test/col_chaikim_test/asset/` — 이 시안이 쓰는 사진. Figma에서 내려받은 17장과
  저장소에 이미 있던 `archive_kim20xx_*` 내보내기입니다.
- `test/col_chaikimyoungjin_test/asset/` — 나머지 전부(50개). 기존 페이지가 참조하는 25개와,
  두 페이지 어느 쪽도 참조하지 않는 작업용 파일(Gemini 생성 이미지, AI 영상 클립, 원본 영상 등)입니다.
  **어느 쪽에도 안 쓰이는 파일이 그쪽에 모여 있습니다.** 정리하려면 그 폴더를 보면 됩니다.
- 나눈 뒤 두 폴더의 파일을 MD5로 대조해, **col_chaikim이 쓰는 사진과 내용이 같으면서
  col_chaikimyoungjin에서는 쓰이지 않는 파일 5개를 지웠습니다**
  (`9641772…jpg`, `Gemini_…irh7bg….png`, `Image5.png`, `vogue201607_2.jpg`, `vogue_08_05_shop1_144659.jpg`).
  같은 내용이 `test/col_chaikim_test/asset/`에 이름을 바꿔 남아 있고, 지운 파일은 git 이력에도 있습니다.
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
  같은 파일이 `test/col_chaikimyoungjin_test/asset/`에 있으므로 원본은 지워도 됩니다.
  파일을 잡고 있는 프로그램(다른 세션의 정적 서버·미디어 플레이어 등)을 닫고 아래를 실행하세요.

  ```
  Remove-Item -LiteralPath "asset\collection\콜렉션 패션쇼 영상.mp4" -Force
  ```

- `archive_kim2019_1~5.png`(스튜디오 흰 배경 5장)는 이번 구현에서 쓰지 않습니다.
  시안의 2019 세트가 이 사진들이 아니라 다른 다섯 장이라서입니다. 아래 "archive" 항목을 보세요.

---

## col_chaikim 페이지 구현 (2026-08-06)

### 파일

- `test/col_chaikim_test/index.html`
- `test/col_chaikim_test/css/col_chaikim.css` — col_chaikimyoungjin.css에서 시작
- `test/col_chaikim_test/js/col_chaikim.js` — col_chaikimyoungjin.js에서 시작
- `test/col_chaikim_test/assets/icons/arc.svg`, `arrow_right.svg` — 자매 페이지에서 복사
- `test/col_chaikim_test/asset/` — 사진 28장

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
   넣었습니다. 마크업·CSS는 자매 페이지(`col_chaikimyoungjin_test`)와 같은 구성입니다 —
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
  링크 `Shop Now` → `/test/shop_test/index.html`
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
- 자매 페이지 회귀 확인: `test/col_chaikimyoungjin_test/`도 이동한 `asset/`에서
  영상(1920×1080 재생)과 이미지를 모두 정상 로드합니다. 문법 검사도 통과합니다.

### 확인하지 못한 부분

- **이번 세션도 Browser 미리보기 패널이 화면에 표시되지 않아 스크린샷을 찍지 못했습니다.**
  `document.hidden`이 계속 `true`라 `requestAnimationFrame`이 한 번도 돌지 않습니다.
  위의 흐름·전환 수치는 `gsap.ticker.tick()`으로 프레임을 직접 진행시켜 측정한 값입니다.
  **시안과 실제 화면의 눈 비교, 실제 마우스 hover, 스크롤 인터랙션의 속도감은 사용자가
  `http://localhost:5611/test/col_chaikim_test/index.html`을 직접 열어 확인해야 합니다.**
- 반응형(360 / 768 / 1280)은 자매 페이지와 마찬가지로 아직입니다. 이번 구현은 데스크톱(1920) 기준입니다.
- `asworn_sim_cheong_ga.png`는 시안 원본이 380 × 561로 작습니다(45KB).
  441 × 681 자리에 늘어나 들어가므로 확대되어 보입니다. 더 큰 원본이 있으면 교체가 필요합니다.

## 다음 작업

1. 실제 화면에서 시안과 비교(특히 archive 다섯 장의 배치 균형)
2. 반응형(360 / 768 / 1280)
3. `archive_kim2019_*` 5장의 용처 결정 — 안 쓸 거면 삭제
4. `asset/collection/콜렉션 패션쇼 영상.mp4` 원본 삭제(위 "남은 문제")
