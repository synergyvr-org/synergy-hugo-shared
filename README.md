# synergy-hugo-shared

This is the shared [Hugo](https://gohugo.io/) layer behind Synergy Team's documentation sites, beginning with Mad God's Overhaul, with others to follow. It is a Hugo Module, so each site imports it and pins the version it needs.

The sites use the [Relearn](https://github.com/McShelby/hugo-theme-relearn) theme, and this module adds my custom shortcodes, styles, layout overrides and other assets that make a Synergy Team site look and behave the way it does. The individual sites then supply all of the list-specific content and branding.

## What's in it

| Path | Contents |
| ---- | -------- |
| `layouts/shortcodes/` | <p>I love making unique styles for links, video players, asides and other widgets, but I hate remembering how the heck I structured them. Therefore I love Hugo shortcodes. <p>**Fancy links**: `nexus`, `steam`, `ext`, `github`, `discord`, `youtube` <p>**Decorated inline elements**: `btn-inline`, `file`, `control` <p>**Media**: `caption`, `video` <p>**Widgets**: `aside`, `disclosure`, `dialog`, `chapter-heading` <p>**Fancy widgets**: `modlist`, `modlist-diff`, `console-commands` |
| `layouts/partials/`, `layouts/_default/`, `layouts/404.html` | Relearn theme overrides: logo, header, menu, base template, 404 page |
| `assets/css/` | `mgo.scss` and its many partials (all the visuals). No palette: it imports `_site-palette.scss` from the site. |
| `assets/js/custom.js` | Modlist filtering, disclosure deep-links, video player, background randomisers |
| `data/` | `console_commands.yaml` is the Skyrim console reference that the `console-commands` shortcode renders. It's here rather than in a site because the console belongs to the game, not to any one list. `synergy.yaml` holds defaults for the client-side image randomisers. |
| `static/images/` | Assets referenced by all of the above elements: controller glyphs, window chrome, webfonts, and the Skyrim art (page background tile, aside backdrops) |

## How to use it

In the site's `hugo.toml`:

```toml
theme = 'relearn'

[module]
  [[module.imports]]
    path = 'github.com/synergyvr-org/synergy-hugo-shared'
```

This module must be resolved ahead of Relearn so its overrides apply. Listing it under `module.imports` while Relearn stays in `theme` achieves that.

The site also needs a `go.mod`, and CI needs Go available before `hugo build`. For example:

```
module github.com/synergyvr-org/mgo

go 1.26

require github.com/synergyvr-org/synergy-hugo-shared v0.0.0
```

### Working on this module and a site together

Point the site at a local checkout instead of the published module, and edits here show up in the site's `hugo server` right away.

I recommend using an environment variable (fun how I write this like the audience is anyone but my future self, isn't it?), which keeps the dev-only path out of the repo, even in commented-out form:

```bash
HUGO_MODULE_REPLACEMENTS='github.com/synergyvr-org/synergy-hugo-shared -> /Users/you/wherever/synergy-hugo-shared' \
  hugo server -D --disableFastRender --bind 0.0.0.0 --baseURL http://localhost:1313/mgo
```

The path has to be **absolute**. A relative one like `../hugo-shared` won't work.

Without `--disableFastRender`, the dev server won't notice edits to this module's shortcodes, or to a site's load order CSVs.

`--bind 0.0.0.0` makes the site reachable from other devices on the same network (always good to test on a real phone!), and spelling out `--baseURL` keeps the path prefix (`/mgo`) working locally.

You can keep pulling the command out of your history, or you can alias it:

```bash
alias mgo-serve="HUGO_MODULE_REPLACEMENTS='github.com/synergyvr-org/synergy-hugo-shared -> /Users/you/wherever/synergy-hugo-shared' hugo server -D --disableFastRender --bind 0.0.0.0 --baseURL http://localhost:1313/mgo"
```

The alternative is a `replacements` line in the site's `hugo.toml` (absolute path here too):

```toml
[module]
  replacements = 'github.com/synergyvr-org/synergy-hugo-shared -> /Users/you/wherever/hugo-shared'
```

That works identically, but it lives in a tracked file, so it has to go before pushing the site or the deploy breaks (CI has no such directory). Commenting it out is enough, since TOML ignores the line completely. The environment variable avoids that trap altogether, which is why it's the better habit.

## What a site provides

Each site supplies the following:

- `content/`, its own `hugo.toml`, and any `data/`
- `assets/css/_site-palette.scss` — **required**. This module imports it by name and
  ships no palette of its own, so no list's colors are baked into the shared layer.
  Copy one from an existing site and change the values.
- Its logo, background art, and screenshots in `static/images/`
- Sidebar logo and footer credits, via `[params.synergy]`:

```toml
[params.synergy]
  logo = 'my-logo.webp'
  logo2x = 'my-logo@2x.webp'                # optional
  logoAlt = 'My List for Skyrim VR'         # optional, defaults to the site title
  footerCredit = 'My List by [Synergy Team](https://synergyvr.org/)'
  footerCredit2 = 'Docs by Davey'
  coverImages = ['ss-whiterun.webp']        # optional; omit and the randomiser skips
  [params.synergy.brandLogos.fus]           # optional per-brand override
    src = 'fus-splash.webp'
    alt = 'FUS, a modlist for Skyrim VR by Kvitekvist and Cangar'
```

With no logo configured the site title renders as text, so a new site looks
deliberate rather than broken.

Regarding `data/`: Hugo unions the site's data with this module's, but for list data it's _replacement_ rather than a _merge_. For example, add `data/console_commands.yaml` into a site with list-specific commands, and its `categories` list completely replaces the one from the module. If a list needs its own console entries, add them to the module.

### Per-page branding

This was born out of adding pages for FUS load order details to the MGO site (for lack of a better place to put them). But it may come in handy again. Who knows!

`layouts/_default/baseof.html` puts `brand-<name>` on `<body>` for any page with
a `brand` param, which cascades:

```toml
# content/some-section/_index.md
[cascade]
  brand = 'fus'
```

It can them scope a palette to `body.brand-fus`, overriding the `--mgo-*`
custom properties. `assets/css/mgo/_brand-fus.scss` is the example that's actually been implemented.

### List-specific images

Skyrim art is shared, since it isn't specific to any one list. That includes the Seal of Akatosh (a.k.a. the Skyrim logo) page background tile and the posterized artwork behind alert asides, which are referenced in `_layout.scss`, `_retina.scss`, and `_asides.scss`.

The two randomised sets are driven from config rather than hardcoded, so a site can supply its own:

```toml
[params.synergy]
  # This list's screenshots, randomized behind the page cover.
  coverImages = ['ss-whiterun.webp', 'ss-riften.webp']
  # Optional: override the shared Skyrim art behind alert asides.
  asideArt = ['bg-some-custom-helmet-or-something.webp']
```

`coverImages` has no shared default, because the lists all look quite distinctive and thus need their own screenshots. Leave it out and the cover randomiser simply doesn't run. `asideArt` falls back to `data/synergy.yaml` here.

Filenames in both lists are resolved against the site's `static/images/`, which Hugo unions with this module's, so those can live either place.

Keep `[params.synergy]` **last** inside `[params]`. TOML assigns every key after a sub-table header to that sub-table, so scalars like `themeVariant` placed below it would end up in the wrong place. The same trap applies one level down: put `[params.synergy.modlist]` after `coverImages`, or it swallows the array.

### Load order colors

The `modlist` shortcode colors its MO2 section headers from the site, so no list's scheme lives in this module:

```toml
[params.synergy.modlist]
  # The onboarding subtree's color gradient, and the separator name (as it reads in MO2).
  subtree = ['#7ec8e3', '#2d6c88']
  subtreeRoot = 'START HERE - EXPAND TO SETUP'
  # Separators that are labels rather than sections: the list's title banner
  # (matched on prefix, since the release text changes) and its end marker.
  titlePrefix = 'Synergy VR - Beta Release'
  plain = ['End Of List']
  # Bands of color across the top-level folders, in order.
  [[params.synergy.modlist.bands]]
    stops = ['#f0a03c', '#c2661c', '#5a2f14']
  [[params.synergy.modlist.bands]]
    from = 'AI Improvements'
    stops = ['#2a5f9e', '#16314f']
```

A band's `stops` are interpolated across however many top-level folders that band covers, and nested folders continue their parent's band. The first band starts at the top of the list. Each later one starts at its `from` folder. One band gives you a single continuous gradient. Several let a list match MO2 when its sections change hue partway down rather than fading evenly.

Leave `modlist` out entirely and separators fall back to a neutral gray gradient, leaving it looking unfinished, so it will annoy you (me) enough to remember to change it.
