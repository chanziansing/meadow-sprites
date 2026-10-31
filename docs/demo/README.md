# Recording the demo GIFs

`demo.html` is a mock Claude window that draws with the mod's real code. Three background tasks start, then land one by one. `record.mjs` films it in headless Chrome and encodes a GIF with ffmpeg.

You need Node 20+, Chrome or Edge, and ffmpeg.

```bash
cd docs/demo
npm i --no-save puppeteer-core@23.11.1 typescript@5.9.2
node build.mjs                                   # transpiles ../../hooks into ./lib
node record.mjs "/path/to/chrome" ffmpeg ../demo.gif dark 12.5
node record.mjs "/path/to/chrome" ffmpeg ../day.gif light 12.5
```

The script serves this folder on a random port on `127.0.0.1` only while it records.
