# Selected presentation system

Modern Editorial carries the content layouts, Big Type carries the main ideas, and Night Rodeo marks section breaks. The same 26 scene definitions drive the live stage renderer and the editable PowerPoint.

`scenes.json` is the canonical source. `scenes.js` exports the same data as `PRESENTATION_SCENES`, `PRESENTATION_SCENE_MAP`, `getPresentationScene(id)`, and `presentationFields(sceneOrId)`. The source generator is `tools/system-film/build-scenes.py`.

Each scene uses a 1920 × 1080 canvas and native `text`, `rect`, `line`, `ellipse`, `image`, or `chart` elements. Every text element has a stable key and matching editable-field metadata. Presets store `layout: 'presentation'`, `sceneId`, `fields`, and `motion: 'normal'` or `'still'`. Chart fields store `{labels: [], series: [{name, values: []}]}` with up to 12 labels and three series.

The four background films live under `assets/media/system-*.mp4`. Each is a silent, 15-second, 3840 × 2160, 30 fps H.264 loop. The film contains only background color, illustration and small star accents. Text, logos, rules and charts remain separate editable objects. Still mode uses the matching full-resolution poster. No illustration appears twice as both video and foreground art.

Season is the display face. The exact static PowerPoint body font is included at `fonts/inter-ucl-regular.ttf`; the browser uses it through the `UCLInter` family. Default font sizes have been checked in the shared renderer, so default browser layouts do not require additional shrinking.

Open `preview.html` through the local app server to review all 26 layouts. The `previews` folder holds 4K JPEGs exported from the same renderer. Motion sources and verification reports are in `tools/system-film`. The source composition at 0 and 15 seconds is pixel-identical for all four films.
