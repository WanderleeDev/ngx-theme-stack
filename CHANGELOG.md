# Changelog

## [3.2.1](https://github.com/WanderleeDev/ngx-theme-stack/compare/v3.2.0...v3.2.1) (2026-04-24)

# [3.2.0](https://github.com/WanderleeDev/ngx-theme-stack/compare/v3.1.0...v3.2.0) (2026-04-24)


### Bug Fixes

* **schematics:** implement smart AST injection and re-configuration support ([dbe8e8b](https://github.com/WanderleeDev/ngx-theme-stack/commit/dbe8e8bdea76b5978890a8e17fa2c77cde96bf18))


### Features

* **demo:** add hydration guards and skeleton loaders to cycle view ([7f515f8](https://github.com/WanderleeDev/ngx-theme-stack/commit/7f515f89a882d47f8da7873a696f50b8f6ec8f5a))
* **demo:** enhance cycle view and update version tags ([f128bce](https://github.com/WanderleeDev/ngx-theme-stack/commit/f128bce742d93bcd951fb44eb2acc05baf193b3e))
* **demo:** link branding logo to docs and use dynamic version ([05008ec](https://github.com/WanderleeDev/ngx-theme-stack/commit/05008ec5cc18fe9846cb01bce96ae7f5247cfaad))
* **demo:** link cycle signals and update footer links ([e4dac90](https://github.com/WanderleeDev/ngx-theme-stack/commit/e4dac90d3445833920cb4c6f166669ddae8594da))
* **demo:** restore modern branding with GitHub Star CTA ([b8ad257](https://github.com/WanderleeDev/ngx-theme-stack/commit/b8ad257fb50f25a5a25e5fcd9db84a0114b49da8))
* **lib:** improve ThemeCycleService naming and add reactive signals ([316124a](https://github.com/WanderleeDev/ngx-theme-stack/commit/316124af0ddebd719ecba0e40c49f404d2d7c7b0))

# [3.1.0](https://github.com/WanderleeDev/ngx-theme-stack/compare/v3.0.0...v3.1.0) (2026-04-16)


### Features

* **schematics:** enhance logging UX with colored changeset summary ([adcaf87](https://github.com/WanderleeDev/ngx-theme-stack/commit/adcaf87b9743451700b7caa5b54c0297ffc756da))

# [3.0.0](https://github.com/WanderleeDev/ngx-theme-stack/compare/v2.1.1...v3.0.0) (2026-04-15)


### Bug Fixes

* **ci:** use pnpm workspace protocol and point tsconfig to source ([d1b496b](https://github.com/WanderleeDev/ngx-theme-stack/commit/d1b496bb85f3d79be78de767129962d9e1a425cd))


### Features

* **core:** update support to Angular 20+ ([8864686](https://github.com/WanderleeDev/ngx-theme-stack/commit/8864686a53cf9630033492b9a95cca1ce6ad39fa))


### BREAKING CHANGES

* **core:** dropped support for Angular versions below 20. The library now requires Angular 20 or higher.

## [2.1.1](https://github.com/WanderleeDev/ngx-theme-stack/compare/v2.1.0...v2.1.1) (2026-04-15)


### Bug Fixes

* **lib:** remove CSP logic and improve anti-flash replacement regex ([8c7ebc1](https://github.com/WanderleeDev/ngx-theme-stack/commit/8c7ebc10c3c4bf0d0e529419e9c3851edb852dfe))

# [2.1.0](https://github.com/WanderleeDev/ngx-theme-stack/compare/v2.0.0...v2.1.0) (2026-04-13)


### Features

* **demo:** implement blocking strategy for Material Symbols ([5d57ebd](https://github.com/WanderleeDev/ngx-theme-stack/commit/5d57ebd0a44c5222a64dab20d0247db8d963dd20))
* implement home view and update routing to support landing page navigation ([9348dca](https://github.com/WanderleeDev/ngx-theme-stack/commit/9348dca521bd3c1894fd88878dbd3ed75f9f940f))
* implement TopNav component and refactor theme switcher layout using content projection ([b6afb70](https://github.com/WanderleeDev/ngx-theme-stack/commit/b6afb70baf33083530a14b0283092784a7153f31))
* **schematics:** add support for critters-trick and optimized anti-flash ([29961cf](https://github.com/WanderleeDev/ngx-theme-stack/commit/29961cf801ca20e1e06a83e0402e68ef794ed5fe))


### Performance Improvements

* **demo:** enable inlineCritical CSS and critters-trick for SSR/SSG ([2189d6a](https://github.com/WanderleeDev/ngx-theme-stack/commit/2189d6a6456933c435e7ecf8917f401282d2a933))

# [2.0.0](https://github.com/WanderleeDev/ngx-theme-stack/compare/v1.0.1...v2.0.0) (2026-04-11)


### Features

* add _redirects file to configure root and SPA routing rules ([64ac2cc](https://github.com/WanderleeDev/ngx-theme-stack/commit/64ac2cc39b5bf5447dc8081413c7699e8fe7b549))
* add build:demo script and update deployment workflow to use it ([bbef60e](https://github.com/WanderleeDev/ngx-theme-stack/commit/bbef60e9f740ea198a66b6cc134da1cf44c3816e))
* add GitHub Actions workflow for Cloudflare Pages deployment ([8dd8df1](https://github.com/WanderleeDev/ngx-theme-stack/commit/8dd8df1b815a3e4b5e40136445835913d779b57b))
* add loading skeleton state to theme toggle button until hydration completes ([b6a6128](https://github.com/WanderleeDev/ngx-theme-stack/commit/b6a6128de6bf7600b2537d2e9474c31491b2b089))
* **demo:** add brand logo and wordmark to the main scene layout ([5c63569](https://github.com/WanderleeDev/ngx-theme-stack/commit/5c63569a2381430bf2e9200f352500bd2fe8536d))
* **demo:** add custom Angular-themed circular favicon with day/night diagonal design ([fd60acc](https://github.com/WanderleeDev/ngx-theme-stack/commit/fd60acc8fcc75654ebd85d07127b1dae10792de5))
* **demo:** add demo-ngx-theme-stack application source and configuration ([c083829](https://github.com/WanderleeDev/ngx-theme-stack/commit/c083829232c793411ecdeeb34756bccc873f8577))
* **demo:** add Open Graph meta tags and library banner ([9ee31b2](https://github.com/WanderleeDev/ngx-theme-stack/commit/9ee31b2553a1d9f45474c28ab333a0673b773a40))
* **demo:** extract branding to a fixed global component with glassmorphism ([61a87d1](https://github.com/WanderleeDev/ngx-theme-stack/commit/61a87d1d05a161f03b494e5c7c67744052b91054))
* **demo:** implement route-based architecture and immersive scene layout ([351c518](https://github.com/WanderleeDev/ngx-theme-stack/commit/351c518452e1b9006af1458ac575d9ea555e76b4))
* **demo:** implement specialized theme cards for Toggle, Cycle and Select services ([a11b971](https://github.com/WanderleeDev/ngx-theme-stack/commit/a11b9714437efc8751ef922aed596935ed038359))
* **demo:** implement standalone theme-status component and improve hydration safety in views ([d3c9caa](https://github.com/WanderleeDev/ngx-theme-stack/commit/d3c9caa41b5a3db4175c5da7eb3fb813ecb64f52))
* **demo:** unify theme status across all views and update layout styling ([20be0c6](https://github.com/WanderleeDev/ngx-theme-stack/commit/20be0c6f845e2926d4356b032641c99abafa0c3b))
* harden anti-flash script security, update service API documentation, and add project banner ([ebe92e8](https://github.com/WanderleeDev/ngx-theme-stack/commit/ebe92e8a1e63b8609ad372571af5135c3841fe19))
* inject anti-flash theme script into index.html during ng-add schematic ([8ef552d](https://github.com/WanderleeDev/ngx-theme-stack/commit/8ef552d3006e85f61ac7238958649606b1c350ce))
* **lib:** add custom NgxThemeStackError and enhance providing validation ([bf10a8f](https://github.com/WanderleeDev/ngx-theme-stack/commit/bf10a8f6e60773d43ab4cd819ded4e0e559f20c9))
* **lib:** add isHydrated signal and integrate custom NgxThemeStackError ([5c1d5db](https://github.com/WanderleeDev/ngx-theme-stack/commit/5c1d5db3c00cbe45c8ec4ea5c85f5ba3a48dadc8))
* **lib:** add isSystem signal and fix setTheme SSR validation order ([9547862](https://github.com/WanderleeDev/ngx-theme-stack/commit/9547862862db0eeea35a8f2c17bc9d3ae620c1be))
* **lib:** robust DOM cleanup identifying potential orphans via data-theme attribute ([5c6b1bf](https://github.com/WanderleeDev/ngx-theme-stack/commit/5c6b1bf25a94a3c08c8cf5270cc1dd832fcf82bd))
* **schematics:** add anti-flash blocking script injector ([18ec8be](https://github.com/WanderleeDev/ngx-theme-stack/commit/18ec8be86cebbd023644d29af13cd1fe18adde07))
* **schematics:** implement sync schematic to re-align anti-flash script with provider config ([a04d498](https://github.com/WanderleeDev/ngx-theme-stack/commit/a04d498f1da173f011b5c58dcc5025f5d90de380))
* update library metadata, improve loading skeleton UI, and refactor documentation formatting ([dad5a28](https://github.com/WanderleeDev/ngx-theme-stack/commit/dad5a286be13a965886367500789431c661aac78))
