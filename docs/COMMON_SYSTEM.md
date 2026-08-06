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
<div class="common_header_slot" data-component="/common/components/header.html">
  <span class="a11y_hidden">Loading header</span>
</div>
```

`common.js` applies `is_white` or `is_black`, switches the matching logo, and marks the current navigation item from `data-page`. The shared `.header_menu_link` size is `20px` for both variants.

Each page loads it with this slot:

```html
<div class="common_footer_slot" data-component="/common/components/footer.html">
  <span class="a11y_hidden">Loading footer</span>
</div>
```

The slot requires an HTTP server. Opening an HTML file directly with `file://` will not load the footer.

## Shared JavaScript behaviors

`common/js/common.js` owns behavior that should stay identical across pages:

- Lenis smooth scrolling connected to the GSAP ticker and ScrollTrigger
- Header navigation and responsive menu behavior
- Footer newsletter validation
- Top button visibility and smooth return to the top
- Product-card action ordering and `data-hover-src` image preloading

Load Lenis, GSAP, and ScrollTrigger before `common.js`. The shared scroll values are
`lerp: 0.06` and `wheelMultiplier: 0.75`; change them in `initSmoothScroll()` only.

Page-specific motion remains in each page script. For example, the Shop 3D hero,
Garment Story, category selector, and Motif interactions stay in `test/shop_test/js/shop.js`.

## Local development

Serve the repository root, not an individual page folder. Shared URLs cannot load when the server root is `test/shop_test` or another nested folder.

Example page URLs:

```text
/test/main_test/index.html
/test/shop_test/index.html
/test/bespoke_test/index.html
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
