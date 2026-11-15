#!/usr/bin/env python3
"""Composite the approved character motion over the native 4K brand scene."""
from pathlib import Path
import os
import hashlib
import json
import subprocess
import numpy as np

PROJECT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')
FFPROBE = os.environ.get('FFPROBE', 'ffprobe')
SOURCE = PROJECT / 'assets/media/character-hat-tip-test.mp4'
BACKGROUND = HERE / 'qa/hero-background.mp4'
OUTPUT = PROJECT / 'assets/media/character-hat-tip-4k.mp4'

def probe(path):
    return json.loads(subprocess.check_output([FFPROBE, '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]))

if not BACKGROUND.exists():
    raise SystemExit('Render hero-source with HyperFrames to tools/character-motion/qa/hero-background.mp4 first. See creative-brief.md.')

info = probe(SOURCE)['streams'][0]
width, height = info['width'], info['height']
source_fps = float(info['r_frame_rate'].split('/')[0]) / float(info['r_frame_rate'].split('/')[1])
decoded = subprocess.check_output([FFMPEG, '-v', 'error', '-i', str(SOURCE), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'])
rgb = np.frombuffer(decoded, np.uint8).reshape(-1, height, width, 3)
# Crop the source's bottom rule and stray corner flecks, retaining the raised hand.
crop = rgb[:, 60:1060, :750, :]
# The reference is cream engraving against green. Recover ink coverage from its
# green channel, then recolor that coverage to the event's exact cream ink.
alpha = np.clip((crop[:, :, :, 1].astype(np.float32) - 65) / 120, 0, 1)
alpha = np.rint(alpha * 255 * .68).astype(np.uint8)
del decoded, rgb, crop
ink = np.empty((1000, 750, 4), dtype=np.uint8)
ink[:, :, :3] = [253, 255, 242]

command = [
    FFMPEG, '-y', '-hide_banner', '-loglevel', 'warning', '-i', str(BACKGROUND),
    '-f', 'rawvideo', '-pixel_format', 'rgba', '-video_size', '750x1000',
    '-framerate', '30', '-i', 'pipe:0',
    '-filter_complex',
    '[1:v]scale=1110:1480:flags=lanczos,format=rgba[character];'
    '[0:v][character]overlay=285:315:format=auto,format=yuv420p[final]',
    '-map', '[final]', '-an', '-frames:v', '450', '-r', '30',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14',
    '-movflags', '+faststart', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-colorspace', 'bt709', str(OUTPUT),
]
encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
first_hash = last_hash = None
quiet_hashes = set()
try:
    for frame in range(450):
        if frame < 270:
            matte = alpha[0]
        elif frame < 420:
            source_frame = min(round((frame - 270) * source_fps / 30), len(alpha) - 1)
            matte = alpha[source_frame]
        else:
            t = (frame - 420) / 29
            eased = t * t * (3 - 2 * t)
            matte = np.rint(alpha[-1].astype(np.float32) * (1 - eased) + alpha[0].astype(np.float32) * eased).astype(np.uint8)
        ink[:, :, 3] = matte
        data = ink.tobytes()
        if frame < 270:
            quiet_hashes.add(hashlib.sha256(data).hexdigest())
        if frame == 0:
            first_hash = hashlib.sha256(data).hexdigest()
        if frame == 449:
            last_hash = hashlib.sha256(data).hexdigest()
        encoder.stdin.write(data)
finally:
    encoder.stdin.close()
if encoder.wait():
    raise SystemExit('4K composite encode failed')
subprocess.run([FFMPEG, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(OUTPUT), '-frames:v', '1', '-q:v', '2', str(OUTPUT.with_suffix('.jpg'))], check=True)
output_info = probe(OUTPUT)
report = {
    'output': str(OUTPUT.relative_to(PROJECT)),
    'video': {k: output_info['streams'][0].get(k) for k in ['width', 'height', 'codec_name', 'pix_fmt', 'r_frame_rate', 'nb_frames', 'duration']},
    'bytes': OUTPUT.stat().st_size,
    'audioStreams': sum(s['codec_type'] == 'audio' for s in output_info['streams']),
    'schedule': {'quietSeconds': [0, 9], 'hatTipSeconds': [9, 14], 'returnToStillSeconds': [14, 15], 'repeatEverySeconds': 15},
    'characterFirstAndLastSourceFrameIdentical': first_hash == last_hash,
    'quietSegmentUniqueCharacterSourceFrames': len(quiet_hashes),
    'sourceCharacterResolution': [width, height],
    'characterCrop': [0, 60, 750, 1000],
    'characterPlacement4K': [285, 315, 1110, 1480],
    'qualityNote': 'The composition, vector branding, footer, and stars are rendered at native 4K. Approved AI character footage is cropped, isolated, and scaled from 806x1150.',
}
(HERE / 'hero-verification.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
