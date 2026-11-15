# Cowgirl motion brief

Animate the supplied vintage western cowgirl-on-horse engraving as a restrained five-second 2D hand-inked character animation. Preserve the exact original character, face, hat, horse, crop, two-color cream ink lines and flat deep forest-green background. Static locked camera and fixed scale throughout. The cowgirl performs one small, anatomically clear friendly hat-tip: her hand that begins on her hip lifts with natural elbow and wrist articulation, touches the front brim, tips it a little, and returns to the same hand-on-hip pose. Her other hand keeps holding the reins. The horse makes one slight natural head nod and ear flick while its body stays in place. The drawing must articulate at joints, not merely wobble, scale, or translate as a flat cutout. Preserve the crisp sparse woodcut/engraving line language throughout, no photorealism, no 3D shading, no new colors, no scenery, no captions or lettering, no added people or limbs. Begin and end exactly in the reference pose for a calm loop. Allow a brief still moment at beginning and end.

The approved 5-second Seedance 2.5 source is included as `assets/media/character-hat-tip-test.mp4`. The production build uses one hat-tip in each 15-second cycle. Run `build-hero.py` to reconstruct the 4K composition.

## Rebuild

Install HyperFrames, FFmpeg, Python, and NumPy. From the repository root:

```sh
hyperframes render tools/character-motion/hero-source --output tools/character-motion/qa/hero-background.mp4 --resolution 4k --fps 30 --crf 14 --workers 1 --strict
python3 tools/character-motion/build-hero.py
```

The generated character footage is scaled within the composition. The logo, footer, and star graphics are rendered at native 4K.
