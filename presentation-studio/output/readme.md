# Uncommon Leaders · Presentation Design Studio

This is a separate, editable working deck for choosing a visual direction and building your own presentation. It does not replace the live display app or the production hold-screen decks.

Open **ucl-presentation-design-studio.pptx** in PowerPoint. Use the PDF for a quick visual review; video and editing work in the PowerPoint file.

## What is inside

| Slides | Contents |
|---|---|
| 1 | How to use the studio |
| 2–15 | Seven visual directions, each with an opening slide and a content slide |
| 16–37 | 22 reusable content layouts |
| 38–42 | Five embedded 4K animated holds |
| 43 | Copyable type styles, labels, numbers, rules, and colors |
| 44 | Twelve separate full-resolution design assets |

The content layouts cover sections, agenda, big idea, quote, two-column text, text with image, pillars, comparison, before/after, three- and five-step processes, timeline, matrix, framework, one and three metrics, bar and line charts, case study, exercise, FAQ, and closing.

## Build a presentation

1. Choose a visual direction from slides 2–15.
2. Save a copy, then duplicate the layouts you need. Remove the unused review and source slides from your presentation.
3. Replace bracketed copy. The two chart examples use illustrative values: right-click a chart and choose **Edit Data** to supply your own labels and numbers.
4. Use the **Selection Pane** to pick text, artwork, or a video background. The text, simple shapes, diagrams, and charts are native editable PowerPoint objects. Illustrations are individual image objects.
5. On another computer, install the fonts in the adjacent **fonts** folder before opening the deck. Use **Season Mix-TRIAL** for display text and **Inter UCL** for supporting text. Inter UCL is the static Regular instance of the supplied Inter brand font.

Each slide has a short usage instruction in speaker notes. All studio slides are visible so they can be reviewed and copied.

## Animated holds

Five silent H.264 films are embedded at 3840×2160. They start automatically in Slide Show and repeat until you advance. The hat-tip film runs 15seconds: nine seconds quiet, five seconds of motion, and one second returning to rest. Its character footage is enlarged within a native 4K composition. The other films run 20seconds.

The logo and hat-tip holds are finished films with the logo included. Quiet Range, Austin Intermission, and Austin Pattern keep the message in separate editable text boxes over a looping video background.

PowerPoint runs one slide show on a selected output. Use the web display console for independent stage feeds, live timers, and automatic timer end screens.

## Elements and source

Slide 44 contains the logo, original cowgirl, horse, badge, Austin pattern, Capitol, company wordmark, star, grass, and three new character concepts. SVGs remain vector. PNGs retain their source pixels. Individual asset files are also included in **elements**; resize those objects without taking screenshots of the slide.

The generator lives in **../build-toolkit.mjs**, with content geometry in **../toolkit-content.json** and the seven direction definitions in **../designs/slides.json**. Run the generator with Node and PptxGenJS available; optional `PPTX_NODE_MODULES` selects a module directory. `PYTHON` can select a Python runtime with defusedxml. The finishing script applies native PowerPoint movie playback settings.
