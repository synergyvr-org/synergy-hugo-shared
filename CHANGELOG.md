# synergy-hugo-shared Changelog

Notable changes to the shared Hugo layer behind Synergy Team's documentation
sites. Unlike the sites, this is versioned. Each site pins a tag and upgrades
when it's ready, so entries are grouped by release. The format is based on
[Keep a Changelog](https://keepachangelog.com/).

Anything marked **breaking** needs a matching change in the site before it works
(usually a new key in `[params.synergy]` or a new file). See the README for what
a site is expected to supply.

## v0.6.0 — 2026-08-22

### Changed
- **Breaking:** the alert-aside's title bar takes its color from
  `--mgo-alert-title` instead of a hardcoded brown. Set it in the site palette.
Without it the bar no longer has its own background.

### Fixed
- Documented, but deliberately not fixed: the alert gradient's stops run
  `0%, 100%, 38%`, and that third accomplishes nothing, so `--mgo-alert-bg3`
  never renders. Correcting the order would restyle every alert on every site,
  so it stays as-is with a note in `_asides.scss` for now.

## v0.5.0 — 2026-08-22

### Added
- Retina cover banners. Set `coverRetina` to the suffix of a higher-resolution
  sibling (e.g. `'@2x'`) and `custom.js` switches from a plain `url()` to
  `image-set()`. Support is tested first, because a background-image the browser
  can't parse leaves the banner blank. Unsupported browsers get the 1x.

### Fixed
- `chapter-heading` built its image paths with `relURL` inside a `<style>` block.
  With `canonifyURLs` on, `relURL` emits a bare `/images/…` and Hugo canonifies
  HTML attributes only (never the inside of a style block) so every chapter
  heading thumbnail and hover GIF 404'd on a site under a base path. Now `absURL`.

## v0.4.1 — 2026-08-22

### Fixed
- The cover banner title was left-aligned despite `text-align: center`. As a row
  flex item the `h1` shrink-wrapped to its own text. It's a column flex container now.

## v0.4.0 — 2026-08-22

### Changed
- The cover banner scales its height with the viewport (`clamp(180px, 20vw,
  360px)`) instead of being sized by its title. It used to show 27% of a
  screenshot at 1920px wide. Now it shows about two-thirds. The title sits at the bottom
  over a gradient, because bright photographic covers left white text
  unreadable on a text-shadow alone. The taller treatment only applies once
  there's actually an image, so a site without `coverImages` keeps a plain title
  bar rather than a tall empty band.
- The page background tile is now translucent (`background-tile-alpha.png`), so
  the page color comes from `--mgo-bg` and each site can tint it without needing
  its own background image. Being a 400px asset drawn at 200px, it's inherently high-DPI, so
  the separate retina rule is gone.

## v0.3.0 — 2026-08-22

### Changed
- **Breaking:** load order separator colors come from the site. Declare `bands`
  of color stops across the top-level folders, plus `subtree`, `subtreeRoot`,
  `titlePrefix`, and `plain` under `[params.synergy.modlist]`. Bands let a list
  follow MO2 when its sections change hue partway down rather than running one
  continuous gradient. Without config, separators fall back to a neutral gray
  ramp (so they'll look boring, motivating me to add the real colors).
- Mod list tables show the mod version instead of the downloaded archive
  filename.
- The last MGO-specific strings are gone from `modlist`: the setup subtree's root
  folder, the list's title banner prefix, and its end marker are all config now.

## v0.2.0 — 2026-08-22

### Added
- Mod lists can hide a section and everything nested under it, for the dev-only
  folders a list ships but doesn't publish. Third positional argument to
  `modlist`.

### Changed
- **Breaking:** the palette lives in the site. This module imports
  `assets/css/_site-palette.scss` by name and ships none of its own, so no
  list's colors are baked into the shared layer. Structural variables and the
  MO2 separator colors stay here as shared defaults.
- **Breaking:** the sidebar logo and footer credits come from `[params.synergy]`
  (`logo`, `logo2x`, `logoAlt`, `footerCredit`, `footerCredit2`, plus
  `brandLogos.<brand>` for per-section overrides). With no logo configured the
  site title renders as text.
- The Skyrim console reference (`data/console_commands.yaml`) moved here from the
  MGO site, since the console belongs to the game rather than to any one list.

## v0.1.0 — 2026-08-21

### Added
- Initial extraction from the MGO site: shortcodes, styles, scripts, Relearn
  layout overrides, shared Skyrim art, and the console reference. Verified to
  produce identical output to the site it came from.
