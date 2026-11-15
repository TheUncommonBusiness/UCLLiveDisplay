# Austin pattern background

Native 3840 × 2160, 30 fps, 20 seconds. The MP4 is silent and loops continuously. The artwork, event logo, and footer are part of the video. Add the title and subtitle as editable text above it.

Text placement and brand colors are in `background-spec.json`, using a 1920 × 1080 logical canvas. Double those coordinates for a 4K browser composition.

The source uses a deterministic GSAP timeline. `window.seekHold(seconds)` seeks the composition. Frame 0 and frame 20 were compared pixel for pixel and match.

The transparent `assets/pattern-matched.png` uses the same green palette as the film and retains the original artwork’s resolution.
