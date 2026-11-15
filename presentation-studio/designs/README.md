# Seven presentation directions

Each direction has an opening slide and a content slide. All fourteen layouts use the same sample message so the design choices are easy to compare.

Open `index.html` for the review gallery. Each pair links to its full-resolution board and individual 4K slides. The single-slide view supports left and right arrow keys. Links to the full editable PowerPoint toolkit and PDF preview appear at the top.

## Directions

1. **Big Type**: oversized headlines and broad color fields.
2. **Modern Editorial**: an asymmetric magazine grid with folios and annotations.
3. **Open Range Gallery**: isolated engravings, quiet space, and exhibition-style captions.
4. **Night Rodeo**: deep forest, oversized artwork, and chartreuse emphasis.
5. **The Field Guide**: measured grids, numbered callouts, and practical diagrams.
6. **Poster Wall**: layered print panels and angled typography.
7. **Across the Horizon**: horizontal bands and connected storytelling.

## Editable source

`slides.json` is the canonical design file. Every slide has `id`, `style`, `name`, `role`, `width`, `height`, `background`, `elements`, and `notes`. Coordinates use a 1920 × 1080 canvas.

Elements use native `text`, `rect`, `line`, or `image` types. Text stores its content, font, size, color, line height, and alignment separately. Image paths are relative to the display project root, and `fit` is either `contain` or `cover`. Some illustrations intentionally extend beyond the slide edge. Text remains inside the canvas.

`slides-data.js` is the browser copy of the same data. Run `python3 build-designs.py` after changing the generator. `renderer.js` draws the preview from that data without flattening text into images.

The 4K PNGs in `previews/` are review exports. The PowerPoint uses native text boxes and shapes with separate artwork.

## Reproduce previews

Serve the display project root with a local HTTP server. Then run `node presentation-studio/designs/render-previews.mjs` from the project root. The default preview server is `http://127.0.0.1:8787/`. Set `UCL_BASE_URL` to use a different address.

The renderer saves fourteen 3840 × 2160 PNGs, seven pair boards, an overview image, and `visual-qa.json` with text fit and bounds checks.
