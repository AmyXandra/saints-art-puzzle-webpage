# saintsartpuzzle.com

Static landing page for Saints Art Puzzle: plain HTML, CSS and JS, no build step.

```
index.html        page markup (one responsive page for desktop + phone)
css/styles.css    styles; design tokens at the top, tablet/phone overrides at the bottom
js/main.js        menu, game iframe, fullscreen/sound/share, video, dates
assets/img/       images and logos
design/           original design exports (reference only, not deployed)
```

Preview: open `index.html` in a browser, or run `python3 -m http.server` and visit http://localhost:8000.

## To fill in

| What | Where |
| --- | --- |
| Game URL | `data-game-src` on `#game-frame` in `index.html`. The iframe loads when the player presses **Solve the puzzle**. |
| YouTube video | `data-youtube-id` on `.video` in `index.html` |
| App Store / Google Play links | `.store` links in the "Get the app" section |
| Footer links | About, Contact, Privacy policy, Terms, For parents |
| Ads | Elements with `data-ad-slot` (`hero-top`, `hero-bottom`, `mid`). Replace each placeholder's content with the ad tag. |

## Game ↔ page messages

The **Sound** button sends `postMessage({ type: 'sap:sound', on: true | false })` to the game iframe, and sends it again
each time the game loads. The game needs to listen for this message for the button to have any effect.

## Breakpoints

- above 1023px: desktop design (1280px artboard)
- 721–1023px: desktop layout; controls in a 2×2 grid; video and app card stacked
- 720px and below: phone design (390px artboard)
# saints-art-puzzle-webpage
