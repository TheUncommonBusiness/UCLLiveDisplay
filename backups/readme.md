# PowerPoint production backup

Open `ucl-live-hold-screens.pptx` for manually cued holding screens. Each screen stays up until you advance. `ucl-supporting-loop.pptx` cycles through four screens with a fade every 12 seconds, then repeats.

The main deck includes the 15-second hat-tip hero and the star-only logo hold. `ucl-live-hold-screens-preview.pdf` shows every slide, including the hidden layouts, as a static reference.

The hero holds quietly for nine seconds, plays the five-second hat tip, then settles back over one second. Its character footage is enlarged within a 3840 × 2160 composition. The logo, stars, and surrounding layout are rendered at 4K.

## Edit a template

The animated backgrounds are embedded MP4s. Messages, session titles, speakers, agenda items, and return times are separate PowerPoint text boxes.

Duplicate the slide you want, then edit its text in Normal view. Open the Selection Pane if you need to select a text box behind another object. Keep the object named **Looping video background** at the back and leave its size at the full slide. Start Slide Show to see the animation.

The logo films are finished holds. Use the other templates when you need an editable message over the moving artwork.

## Fonts

The fonts are installed and registered on Carter’s Mac. On another computer, install these files from `fonts`, then reopen PowerPoint:

- `season-regular.otf`
- `season-italic.otf`
- `inter-ucl-regular.ttf`

PowerPoint’s font menu calls the display family **Season Mix-TRIAL**. **Inter UCL** is a static Regular instance of the supplied Inter variable font, prepared for consistent PowerPoint rendering.

## Elements page

The final slide contains individual logo, cowgirl, horse, badge, pattern, capitol, wordmark, star, and grass assets. Select an object, copy it, and paste it onto another slide. It is hidden during Slide Show but remains available in Normal view.

The `elements` folder includes the separate source assets. The logo, cowgirl, star, and grass are vectors. Raster artwork retains its source resolution.

## Timing

The video backgrounds start with the slide and repeat until you advance. To change the supporting loop’s pace, select its slides and change **Transitions → Advance Slide → After**. Keep **Use Timings** enabled in Slide Show settings.

The countdown design slide is hidden because its number is editable static text. Use the web console for a running countdown, an automatic change at zero, or independent feeds on several displays. The return-time slide gives PowerPoint a simple editable alternative.

The decks are 16:9. Video backgrounds are 3840 × 2160 and silent. Choose the output monitor in PowerPoint’s Slide Show settings before the room opens.

## Rebuild

The generator is `tools/build-powerpoint.mjs` in the repository. It needs Node.js with `pptxgenjs` and `sharp`, Python with `defusedxml`, and FFmpeg on the command path. Set `PPTX_NODE_MODULES`, `PYTHON`, or `FFMPEG` when those tools live elsewhere. The static Inter font is already included. Regenerate it with `tools/build-powerpoint-fonts.py` if needed, using Python’s `fonttools` package.
