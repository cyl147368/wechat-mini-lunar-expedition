# WeChat Mini Lunar Expedition QA Report

Generated: 2026-06-12T11:52:58.880Z

## Deliverables

- Release project: `/Users/chenyulin/Documents/Codex/2026-06-11/hi-2/outputs/wechat-mini-lunar-expedition-release`
- Release zip: `/Users/chenyulin/Documents/Codex/2026-06-11/hi-2/outputs/wechat-mini-lunar-expedition-release.zip` (12.5 KB)
- Full project zip: `/Users/chenyulin/Documents/Codex/2026-06-11/hi-2/outputs/wechat-mini-lunar-expedition.zip` (24.6 KB)

## Checksums

- `wechat-mini-lunar-expedition-release.zip`: `35d2fef5b2d53db5980d3a92a0bed0baba5042418dd41444dd51f11c4c7914d0`
- `wechat-mini-lunar-expedition.zip`: `3f29c178baac4d0f2bcb03a9557fc8b6081fb71b79f5ba2c763fe0a9df65e5e2`

## Release File List

- `game.js`
- `game.json`
- `js/logic.js`
- `project.config.json`

## Verification Commands

```bash
npm test
npm run doctor
npm run verify:release
npm run qa:report
unzip -t ../wechat-mini-lunar-expedition-release.zip
unzip -t ../wechat-mini-lunar-expedition.zip
```

## Scope

- Native WeChat Mini Game Canvas runtime.
- Complete turn-based exploration and survival management game: 月面远征.
- Different from the previous arcade collection, garden match-3, and tower defense in theme, loop, controls, progression, and systems.
- More complex than the previous three: procedural terrain, fog of war, action points, resource economy, deposits, buildings, tech tree, random events, anomaly AI, repairs, stabilization, and multi-condition victory.
- No npm runtime dependency, no CDN, no remote assets.
- Minimal release package contains only WeChat Mini Game runtime files.

## WeChat DevTools

- WeChat DevTools CLI launched the IDE HTTP service at `http://127.0.0.1:9420`.
- The release project was opened by CLI successfully and returned `✔ open`.

Open command:

```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli open --project /Users/chenyulin/Documents/Codex/2026-06-11/hi-2/outputs/wechat-mini-lunar-expedition-release --port 9420 --lang zh
```
