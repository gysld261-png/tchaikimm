# Common system guide

## Source of truth

Shared files live only in the repository-level `common/` directory. Do not copy them into individual page folders.

```text
common/
├─ css/
│  ├─ tokens.css
│  ├─ reset.css
│  ├─ common.css
│  └─ layout.css
├─ components/
│  ├─ header.html
│  └─ footer.html
└─ js/
   └─ common.js
```

## CSS responsibilities

- `tokens.css`: colors, typography, layout dimensions, radii, and motion values.
- `reset.css`: browser-default normalization only.
- `common.css`: body defaults, accessibility helpers, focus styles, and shared small components such as `.top_button`.
- `layout.css`: shared header and footer layout.
- Page CSS (`main.css`, `shop.css`, `bespoke.css`): page-specific sections and intentional page overrides only.

Load shared CSS before page CSS:

```html
<link rel="stylesheet" href="../../common/css/tokens.css">
<link rel="stylesheet" href="../../common/css/reset.css">
<link rel="stylesheet" href="../../common/css/common.css">
<link rel="stylesheet" href="../../common/css/layout.css">
<link rel="stylesheet" href="css/page.css">
```

## JavaScript responsibilities

`common/js/common.js` loads the shared header/footer and owns global navigation, newsletter, top-button, product-card, and smooth-scroll behavior. Lenis, GSAP, and ScrollTrigger are shared page dependencies; Three.js and section animations remain page-specific dependencies.

```html
<script src="../../common/js/common.js"></script>
<script src="js/page.js"></script>
```

## Top button

Add this markup immediately before the closing `</body>` when the page needs it:

```html
<button class="top_button" type="button" aria-label="Back to top">Top</button>
```

## Header and footer HTML

The header and footer each have one source of truth:

```text
common/components/header.html
common/components/footer.html
```

Add page and header-variant settings to the body:

```html
<!-- White header over imagery: Main and Shop -->
<body data-page="shop" data-header-variant="white">

<!-- Black header over a light background: Bespoke -->
<body class="page_bespoke" data-page="bespoke" data-header-variant="black">
```

Load the header with this slot:

```html
<div class="common_header_slot" data-component="../../common/components/header.html">
  <span class="a11y_hidden">Loading header</span>
</div>
```

`common.js` applies `is_white` or `is_black`, switches the matching logo, and marks the current navigation item from `data-page`. The shared `.header_menu_link` size is `20px` for both variants.

Each page loads it with this slot:

```html
<div class="common_footer_slot" data-component="../../common/components/footer.html">
  <span class="a11y_hidden">Loading footer</span>
</div>
```

The slot requires an HTTP server. Opening an HTML file directly with `file://` will not load the footer.

### 경로 규칙 — 루트 절대경로(`/common/...`)를 쓰지 않습니다

**슬롯 경로, 공통 CSS·JS, `header.html`·`footer.html` 안의 모든 `src`·`href`는 상대경로여야
합니다.** 루트로 쓰면 사이트가 도메인 최상위에 있을 때만 동작하고, GitHub Pages처럼
`/저장소이름/` 아래에 배포하거나 다른 사람이 다른 폴더 구조에서 열면 전부 404가 됩니다.
현재 저장소에는 루트 절대경로가 한 곳도 없습니다.

- **`header.html`·`footer.html` 안의 경로는 그 파일이 아니라 "불러가는 페이지" 기준으로
  풀립니다.** 컴포넌트가 `fetch` 후 `innerHTML`로 주입되기 때문입니다. 그래서 컴포넌트
  안에 `../../asset/...`이라고 적으면 `common/components/` 기준이 아니라
  `pages/<페이지>/` 기준으로 해석됩니다.
- **그 결과 모든 페이지는 `pages/<페이지>/` 한 단계 깊이에 있어야 합니다.**
  `common/js/common.js`의 `HEADER_LOGO_BLACK` / `HEADER_LOGO_WHITE`도 같은 이유로
  `../../asset/logos/...`로 고정돼 있습니다. 깊이가 다른 곳(저장소 루트의 `index.html`,
  `pages/shop/detail/` 같은 하위 폴더)에 페이지를 만들면 **헤더 로고와 아이콘이 깨집니다.**
  깊이를 바꿔야 한다면 컴포넌트 두 개와 `common.js`의 로고 상수를 같이 고쳐야 합니다.

## Shared JavaScript behaviors

`common/js/common.js` owns behavior that should stay identical across pages:

- Lenis smooth scrolling connected to the GSAP ticker and ScrollTrigger
- Header navigation and responsive menu behavior
- Header colour switching driven by the backdrop (see below)
- Footer newsletter validation
- Top button visibility and smooth return to the top
- Product-card action ordering and `data-hover-src` image preloading

### Header colour switching

The header is `position: fixed`, so a white header can become unreadable once a light
section scrolls underneath it. `updateHeaderTheme()` samples three points across the
header band on every scroll frame, reads the backdrop's background colour, and applies
`is_white` or `is_black` from its relative luminance. The logo swaps with the variant.

`data-header-variant` on `<body>` is no longer the final answer — it is the **fallback**
used whenever the backdrop colour cannot be read.

The backdrop colour cannot be read when the sampled point sits on an image, video,
canvas, or a `background-image`. Images with `pointer-events: none` do not appear in
`document.elementsFromPoint`, so the code also checks each candidate's direct children
for media covering the point. Main's hero relies on this — without it the detector
walked past the photo and read the cream `body` behind it.

Tuning constants sit together above `updateHeaderOnScroll()`:

| Constant | Value | Meaning |
|---|---|---|
| `BACKDROP_SAMPLE_RATIOS` | `[0.12, 0.5, 0.88]` | Sample positions across the viewport width |
| `LIGHT_LUMINANCE_THRESHOLD` | `0.55` | Above this the backdrop counts as light, so the header goes black |
| `OPAQUE_ALPHA_MIN` | `0.5` | Minimum alpha before a background colour is trusted |

Measured cost is about 0.09 ms per frame (roughly 0.5% of a 60fps budget).

Load Lenis, GSAP, and ScrollTrigger before `common.js`.

### 스크롤 감각 조정 (Lenis)

**`common/js/common.js` 맨 위 상수 세 개만 고칩니다.** 페이지 CSS나 페이지 JS에
복사하지 마세요 — 여기를 고치면 전 페이지가 함께 바뀝니다. 각 상수 위에 값 범위와
느낌을 주석으로 적어 두었습니다.

| 상수 | 현재 | 의미 |
|---|---|---|
| `SCROLL_LERP` | `0.035` | 얼마나 늦게 따라오는가. **낮을수록 부드러움**(0.02 아주 미끄러움 / 0.1 Lenis 기본) |
| `SCROLL_WHEEL` | `0.7` | 휠 한 칸의 이동 거리 배수. 낮을수록 묵직 (1 = 브라우저 기본) |
| `SCROLL_TOUCH` | `1.6` | 터치 이동 배수. `syncTouch`를 켜지 않는 한 거의 영향 없음 |

값을 찾을 때는 브라우저 콘솔에서 바로 시험해 볼 수 있습니다:

```js
window.tchaikimmLenis.options.lerp = 0.02;
```

새로고침하면 파일의 상수 값으로 돌아갑니다. 마음에 드는 값을 찾은 뒤 파일을 고치세요.

`prefers-reduced-motion: reduce`이거나 Lenis·GSAP이 없으면 초기화하지 않고 브라우저
기본 스크롤을 씁니다.

Page-specific motion remains in each page script. For example, the Shop 3D hero,
Garment Story, category selector, and Motif interactions stay in `pages/shop/js/shop.js`.

## 1920px layout baseline

Figma screens use a 1920px canvas. Keep full-width backgrounds, images, and videos on
the section itself, then place the section's text, cards, and controls inside
`.common_container`.

```html
<section class="page_section">
  <div class="common_container">
    <!-- Text, cards, and controls -->
  </div>
</section>
```

`.common_container` is fluid below 1920px, includes the shared responsive gutter, and
stops growing at 1920px on wider displays. On a 2560px display the background remains
full width while the content stays centered instead of being forcibly enlarged.

Do not scale an entire page with `transform: scale()` and do not copy this container
rule into a page stylesheet. Check new pages at browser zoom 100% at these widths:

- 1440px: narrower desktop check
- 1920px: Figma reference check
- 2560px: wide-display check

## Local development

Serve the repository root, not an individual page folder. Shared URLs cannot load when the server root is `pages/shop` or another nested folder.

Example page URLs:

```text
/pages/main/index.html
/pages/shop/index.html
/pages/bespoke/index.html
```

## Open Graph image

The `og:image` value must be an absolute HTTPS URL that a social crawler can access. A Windows filesystem path and a relative URL are invalid for deployed OG metadata.

```html
<!-- Repository file: common/assets/og/og-default.jpg -->
<meta property="og:image" content="https://YOUR-DOMAIN.com/common/assets/og/og-default.jpg">
```

Replace `YOUR-DOMAIN.com` when the deployment domain is confirmed. Put the image itself at `common/assets/og/og-default.jpg`.

## Team rule

1. Change shared styles and behavior only in `common/`.
2. Keep page-specific behavior in the page folder.
3. Announce shared breaking changes before merging.
4. Verify Main, Shop, and Bespoke after every shared-file change.
