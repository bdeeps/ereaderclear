<!-- glassbox:start -->
<!-- Generated from glassbox.json by the Glassbox hub (npm run readme -- ereaderclear). Edit glassbox.json, not this block. -->

<h1 align="center">EreaderClear</h1>

<p align="center"><b>How does an e-ink screen work?</b><br>A page of text with no backlight that stays on screen after the power is gone. Open a capsule thinner than a hair, push white and black particles around with a voltage, and see why the screen flashes and leaves ghosts.</p>

<p align="center"><a href="https://glassbox.how/ereaderclear/"><b>▶ Play with it</b></a> &nbsp;·&nbsp; <a href="https://glassbox.how/e/ereaderclear/">Read the 60-second explainer</a></p>

<p align="center">
  <a href="https://glassbox.how/e/ereaderclear/"><img alt="Glassbox No. 226" src="https://img.shields.io/badge/Glassbox-No.%20226-8ef0ff"></a>
  <a href="https://glassbox.how/e/ereaderclear/"><img alt="Computing" src="https://img.shields.io/badge/field-Computing-8ef0ff"></a>
  <a href="LICENSE"><img alt="Code: MIT" src="https://img.shields.io/badge/code-MIT-3fb950"></a>
  <a href="LICENSE-CONTENT.md"><img alt="Content: CC BY 4.0" src="https://img.shields.io/badge/content-CC%20BY%204.0-ef9421"></a>
  <a href="#privacy"><img alt="Privacy: explained" src="https://img.shields.io/badge/privacy-explained-555"></a>
</p>

## In 60 seconds

1. **Capsules of black and white.** An e-ink screen is a film of microcapsules, each thinner than a human hair. Every capsule holds clear fluid, positively charged white particles and negatively charged black ones. Whichever kind is nearest your eye decides whether that dot looks white or black. There is no light inside the screen. The picture is made by reflecting room light, like paper.
2. **A field pushes them.** Put a voltage across a capsule and charged particles drift toward the electrode of opposite sign. This is electrophoresis, first seen with clay in water in Moscow in the early 1800s. One direction sends the white particles to the front and the black ones to the back. Reverse it and the dot turns black.
3. **Grey is a short push.** How far the particles move depends on the voltage times the time it is on. A short pulse stops them part way, so black and white particles share the top and the dot looks grey. The first Kindle held 4 shades of grey. The second, in 2009, held 16.
4. **Flashes and ghosts.** The driver cannot see the particles, only what it asked them to do. Some are sluggish or stick to the electrode, so a quick update leaves a faint ghost of the last page. A full refresh flashes every pixel black and then white first, so the new page starts from a known state. That is the blink you see when a reader turns a page.
5. **Sunlight, and power only to change.** Glare adds the same light to the bright and dark parts of a glowing screen, so it washes out in the sun. A reflective page keeps its contrast, and gets brighter with the light. The particles stay where the field left them, so the page needs no power to stay put. Only a page turn costs energy, which is why a reader can last weeks.
6. **Light, colour and the cost.** A frontlight is an edge-lit sheet that shines down onto the page, so you can read in the dark. Colour comes from a filter over the black and white film, which is blurrier and dimmer, or from four pigments in each capsule, which is sharper but slower to update. Each choice trades speed, clean updates and detail.

## Words worth knowing

| Term | Meaning |
|---|---|
| **Microcapsule** | A tiny sealed bubble, thinner than a hair, filled with fluid and pigment particles. |
| **Electrophoresis** | The drift of charged particles through a fluid when an electric field is applied. |
| **Reflective display** | A screen that shows a picture by reflecting room light, as paper does, instead of making its own light. |
| **Bistable** | Stable in two states with no power. An e-ink dot stays white or black until a new pulse changes it. |
| **Waveform** | The voltage-against-time pattern sent to one pixel to take it from one shade to another. |
| **Full refresh** | An update that flashes the screen black and white first, so every pixel starts from a known state. |
| **Ghosting** | A faint trace of the previous image left because some particles did not end up quite where the driver expected. |
| **Frontlight** | An edge-lit sheet over the screen that lights the page from the front, unlike a backlight that shines through. |
| **Backplane** | The layer of thin-film transistors that applies a voltage to each pixel. |
| **Colour filter array** | A grid of red, green and blue filters over the dots, so a black and white film can show colour. |

## A short history

**From clay specks in a Moscow lab to a page that stays on screen with the power off, in two centuries.**

- **1807** · Clay moves in an electric field (Ferdinand Frederic Reuss, with Peter Strakhov, Moscow, Russia)
- **1969** · Patents for electrophoretic images (Isao Ota, Matsushita, Japan)
- **1975** · Gyricon: a sheet of twisting balls (Nick Sheridon, Xerox PARC, Palo Alto, California, USA)
- **1997** · A particle moves inside a capsule (Barrett Comiskey and JD Albert, MIT Media Lab, Cambridge, USA)
- **1997** · E Ink Corporation is founded (Jacobson, Albert, Comiskey, Jerome Rubin, Russ Wilcox, Massachusetts, USA)
- **2004** · Sony Librie: the first e-ink reader (Sony, Japan)
- **2007** · The first Kindle (Amazon, Seattle, USA)
- **2012** · Kindle Paperwhite adds a frontlight (Amazon, USA)

The full story, with 27 moments, charts, people and 29 sources: [glassbox.how/e/ereaderclear/history](https://glassbox.how/e/ereaderclear/history/). The data lives in [`history.json`](history.json).

## Privacy

This box has no accounts and no ads, and it ships its own fonts and libraries. When you run it yourself it sends nothing anywhere. On glassbox.how, the site's `/bar.js` also loads Glassbox's analytics: **Google Analytics** to count visits (it asks first in the EU, UK and Switzerland, and stays off when your browser sends Global Privacy Control or Do Not Track) and **ClickTrust** to detect bots.

It remembers a few things **in your own browser only**, and never sends them anywhere:

| Browser storage key | What it holds |
|---|---|
| `ereaderclear.v1` | Which chapters you have opened, your best quiz scores, and sound on or off. |

Exactly what each one sees is at [glassbox.how/privacy](https://glassbox.how/privacy/).

## Licences

- **Code:** [MIT](LICENSE). Use it, change it, ship it.
- **Explanations, text, images and videos** (`glassbox.json`, `glassbox/`): [CC BY 4.0](LICENSE-CONTENT.md). Credit “Glassbox, glassbox.how/e/ereaderclear”.
- **Third-party parts** keep their own licences: [three.js](https://threejs.org) (MIT), [Geist, Instrument Serif](https://openfontlicense.org) (SIL OFL 1.1).
- The Glassbox name and logo aren't covered by either licence. See the [terms](https://glassbox.how/terms/).

Found a mistake? [Open an issue](https://github.com/bdeeps/ereaderclear/issues). Corrections happen in public.
<!-- glassbox:end -->

## Run it

It's plain HTML, CSS and JavaScript. No build step and no dependencies. Run locally, it contacts no other website.

```bash
python3 -m http.server 8000
```

Three.js and the fonts ship in `vendor/` and `fonts/`, so it also works offline.

Then open http://localhost:8000.

## How it's built

| File | What |
|---|---|
| `index.html`, `css/app.css` | The page and its styles |
| `js/app.js`, `js/stage.js`, `js/ui.js`, `js/kit.js` | The shared Glassbox 3D engine: chapters, 3D stage, controls, quiz, video director |
| `js/chapters/*.js` | One file per chapter: the 3D model, controls, text, key terms, quiz and video scenes |
| `glassbox.json` | Title, question, explainer beats, key terms, browser storage and credits shown on glassbox.how |
| `reel` in each chapter | The storyboard the Glassbox studio records into short videos |
| `glassbox/` | The published video, slides, thumbnail and post copy |
| `fonts/`, `vendor/three/` | Self-hosted Geist and Instrument Serif (SIL OFL 1.1) and three.js (MIT) |
