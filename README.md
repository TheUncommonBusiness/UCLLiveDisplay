# Uncommon Leaders Live Display

Production console for the screens before and between Uncommon Leaders Live sessions. Built from the design direction in Guest_Journey_Austin and the behavior of [SessionIntroCards](https://github.com/TheUncommonBusiness/SessionIntroCards).

## Run a show

Open the [public console](https://theuncommonbusiness.github.io/UCLLiveDisplay/), choose Stage Displays, and open the windows you need. Move each window to its monitor and press F. Edit in Preview and use Launch to Stage to update the selected feed without leaving full screen.

The default Main stage plays a 4K logo film. Supporting displays share an Austin slide loop. Add feeds for independent programs, or assign multiple displays to one feed to mirror it.

[Production guide](https://theuncommonbusiness.github.io/UCLLiveDisplay/production-guide.html)

## Control across computers

Choose **Live session → Create live session**. The service shares the current show and uploaded media. Copy a display link to each stage laptop, then press F there. Copy the control link to another production computer to control that same session.

Edits remain in Preview until Launch. Displays check for new cues about once per second, use a shared server clock, and keep their last launched program if the connection drops. A running countdown can still reach its end screen offline. Remote changes resume when the connection returns. Control links can publish changes, while display links can only receive them. End session revokes its links.

Sessions expire after 30 days. Uploaded media supports 250 MiB per file, 50 files, and 1 GiB per session. Shared files transfer in chunks and cache locally on receiving laptops. The controller waits for an upload to finish before publishing the show.

The isolated session service is [hosted here](https://ucl-live-sessions.the-uncommon-6173.chatgpt.site). It uses durable state, revision checks to prevent stale controllers overwriting a newer cue, and authenticated media access. Session credentials stay in link fragments. The backend source checkout is in remote-service and has its own deployment repository.

## Screens and daily agendas

The web library is organized into Titles, Agendas, Holds, Event app, and Countdowns. Titles use Modern Editorial, Big Type, Night Rodeo, and the session introduction. The broader content layouts remain in the 45-slide PowerPoint kit in the For Production Team handoff, with small animated character accents in the bottom-right content and agenda footers.

Choose a screen, edit the preview, then Launch to Stage. Text appears first in the editor. Branding and motion controls sit under More options, and countdown end screens appear only when a timer is in use. Import, export, the guide, and PowerPoint are under More in the top bar. Icons keep the controls recognizable alongside their labels.

Two daily-agenda designs share an editable schedule: a light timetable and a forest Night Rodeo layout. Use Edit daily agendas to enter up to seven days, each with up to 30 sessions, optional dates, times, titles, and speakers. Choose the day and highlighted session in Preview, then Launch. The operator controls the highlight. Next session and Full agenda in the On stage panel update the running display immediately.

The overview shows six sessions per page and rotates every 15 seconds. Choosing a current session keeps its page in view and labels the next session. Saved agenda copies and their days survive show exports and can be added to loops. Changing the agenda design preserves the entered schedule.

[Editing notes](presentation-system/readme.md)

## Included

- Editable Austin templates, saved copies, uploaded images/video, and show export/import with media.
- Clock-based countdowns that switch to a chosen hold at zero.
- Slide loops with per-slide timing and Snap, Fade, Slide, Soft zoom, or Smart Morph transitions.
- Fit, Fill, Stretch, margin, and monitor placement per output.
- Fourteen finished 3840 × 2160, 30fps, silent looping films matching the production PowerPoint: ten holds and four event-app callouts. The hold films have ten-second cycles with visible stars and occasional character gestures.
- Offline caching of application files and built-in media after the first complete load.

## Local use

Download the repository and run `python3 -m http.server 8787 --bind 127.0.0.1` from this folder. Open `http://127.0.0.1:8787/`. The app uses JavaScript modules, so opening index.html directly as a file will not work.

Local mode connects windows in the same browser profile on one computer. Live session mode connects computers through the session service. Each session has its own browser storage and message channel. Leaving a session restores the previous local show. Export show remains available for a portable backup.

## Development

No build step or runtime dependencies are required. `npm test` runs the timer, loop, and state tests. Browser tests are in `tests/browser.mjs` and need Playwright plus Chrome. Run the local server first.

After editing published files, run `node tools/build-cache.mjs` to update the service worker cache manifest. Deploy the main branch through GitHub Pages. A new worker activates after its complete cache is ready. Existing documents keep running. Refresh the console to load an updated interface, without reloading stage windows.

Animation source lives in tools/*-film. The PowerPoint generator and backup files live in tools and backups. Videos are embedded in the decks. See backups/readme.md for font and playback notes.

## Production limits

Browser security requires user interaction for full screen, and some browsers block multiple pop-ups until allowed. Monitor detection is available only in browsers that support the Window Management API. Manual placement works without it. An Open as browser tab fallback is available if a browser refuses full screen in a pop-up.

The software has browser and media validation, but the venue’s display hardware and the production laptop still need a rehearsal. Local playback uses the computer clock. Live sessions calibrate against the server clock. Remote updates require internet and are not frame-locked broadcast video.
