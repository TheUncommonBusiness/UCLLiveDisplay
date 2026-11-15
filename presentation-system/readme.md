# Matched presentation kit

The production deck follows the selected direction: **Modern Editorial** for content, **Big Type** for big ideas, and **Night Rodeo** for section breaks. It uses the same scene geometry and text styles as the live display system.

Open **../backups/ucl-matched-presentation-kit.pptx** in PowerPoint. The adjacent preview PDF shows every slide. Earlier hold-screen decks and the 44-slide design exploration remain available separately.

| Slides | Use |
|---|---|
| 1 | Start here |
| 2–27 | Matching editable scenes and content templates |
| 28–32 | Five original animated holds |
| 33 | Reusable typography, labels, numbered steps, and colors |
| 34 | Twelve separate full-resolution design elements |

Save a copy before building your talk. Duplicate the slides you need, edit the native text boxes, and remove unused templates. Replace bracketed copy and any example chart values. Right-click a chart and choose **Edit Data** to update its embedded workbook. The text, diagrams, simple shapes, chart data, and foreground logos remain editable or individually selectable. Illustrations inside an animated film are part of that video.

Each of the 26 matching scenes has a silent 4K movie behind its editable content. These subtle 15-second backgrounds start automatically in Slide Show and repeat until you advance. The original hat-tip hold runs 15 seconds; its enlarged character footage sits inside a native 4K composition. The four other original holds run 20 seconds. Use the **Selection Pane** to select text or the background movie.

Install **Season Mix-TRIAL** and **Inter UCL** from **../backups/fonts** on another computer before opening the deck. The fonts are installed on the creation Mac and bundled separately for handoff. They are not embedded in the PowerPoint file.

PowerPoint displays one slide show on its selected output. The live display console handles separate stage feeds, remote controls, live timers, and automatic end screens.

The canonical scenes are in **../assets/presentation-system/scenes.json**. **build-matched.mjs** maps those exact coordinates into native PowerPoint objects. Run it with Node and PptxGenJS available; `PPTX_NODE_MODULES`, `PYTHON`, and `FFMPEG` can select local dependencies. The finishing script deduplicates embedded media and applies native PowerPoint autoplay/loop settings.
