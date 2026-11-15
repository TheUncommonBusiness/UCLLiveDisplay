# Uncommon Leaders Live Display

Production console for the screens before and between Uncommon Leaders Live sessions. Built from the design direction in Guest_Journey_Austin and the behavior of [SessionIntroCards](https://github.com/TheUncommonBusiness/SessionIntroCards).

## Run a show

Open the [public console](https://theuncommonbusiness.github.io/UCLLiveDisplay/), choose Stage Displays, and open the windows you need. Move each window to its monitor and press F. Edit in Preview and use Launch to Stage to update the selected feed without leaving full screen.

The default Main stage plays a 4K logo film. Supporting displays share an Austin slide loop. Add feeds for independent programs, or assign multiple displays to one feed to mirror it.

[Production guide](https://theuncommonbusiness.github.io/UCLLiveDisplay/production-guide.html)

## Included

- Editable Austin templates, saved copies, uploaded images/video, and show export/import with media.
- Clock-based countdowns that switch to a chosen hold at zero.
- Slide loops with per-slide timing and Snap, Fade, Slide, Soft zoom, or Smart Morph transitions.
- Fit, Fill, Stretch, margin, and monitor placement per output.
- Native 3840 × 2160, 30fps, silent 20-second ambient films and PowerPoint backups. A separate 15-second cowgirl hold composites generated character footage into a 4K master.
- Offline caching of application files and built-in media after the first complete load.

## Local use

Download the repository and run `python3 -m http.server 8787 --bind 127.0.0.1` from this folder. Open `http://127.0.0.1:8787/`. The app uses JavaScript modules, so opening index.html directly as a file will not work.

All operator and output windows must use the same origin, browser profile, and computer. Export a show to move it to a different machine. Shared built-in templates are in the repository. Personal edits stay in browser storage until exported.

## Development

No build step or runtime dependencies are required. `npm test` runs the timer, loop, and state tests. Browser tests are in `tests/browser.mjs` and need Playwright plus Chrome. Run the local server first.

After editing published files, run `node tools/build-cache.mjs` to update the service worker cache manifest. Deploy the main branch through GitHub Pages. An updated worker waits until existing application windows close, so a deployment does not replace files in the middle of a show.

Animation source lives in tools/*-film. The PowerPoint generator and backup files live in tools and backups. Videos are embedded in the decks. See backups/readme.md for font and playback notes.

## Production limits

Browser security requires user interaction for full screen, and some browsers block multiple pop-ups until allowed. Monitor detection is available only in browsers that support the Window Management API. Manual placement works without it. An Open as browser tab fallback is available if a browser refuses full screen in a pop-up.

The software has browser and media validation, but the venue’s display hardware and the production laptop still need a rehearsal. Playback timing is coordinated by the computer clock. It is not frame-locked broadcast video hardware.
