# kankan-token-keeper

A Tampermonkey userscript for the TV live page on 看看新闻 (Kankan News), [`live.kankanews.com/huikan`](https://live.kankanews.com/huikan). It renews the signed stream URL before it expires, so the stream doesn't stop every 10 minutes.

## The problem

The page's HLS stream URL carries a signature (`token` / `volcSecret` / `volcTime`). `volcTime` is the expiry time, roughly 10 minutes after the URL is issued. Once it passes, requests for `index.m3u8` return 403 and playback stops. The page doesn't renew the URL on its own. The server only issues a new signed URL when the page loads or the channel changes.

## How it works

1. Every 15 seconds, the script reads the player's current URL (`player.config.url`) and checks how long `volcTime` has left.
2. When less than 120 seconds are left, it loads the same page in a hidden, muted iframe. If the iframe opens on a different channel, the script calls the page's own `changeChannel` to switch it to the channel you're watching.
3. Once the iframe's player has a newer signed URL for the same stream path, the script takes that URL and removes the iframe.
4. It calls xgplayer's `switchURL()` to switch the main player to the new URL. Playback may skip or pause for about a second during the switch.

## Install

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension.
   - **One-click install:** with Tampermonkey installed, open [kankan-token-keeper.user.js (raw)](https://raw.githubusercontent.com/iamlipan/kankan-token-keeper/main/kankan-token-keeper.user.js) and click "Install". Otherwise, follow steps 2–3 below.
2. Click the Tampermonkey icon and choose "Create a new script".
3. Paste in all of [`kankan-token-keeper.user.js`](./kankan-token-keeper.user.js) and save.
4. Open or refresh https://live.kankanews.com/huikan.

## Check that it's working

Open DevTools (F12) and look in the Console:

- `[token-keeper] 已启动` means the script started.
- `[token-keeper] 签名还剩 XXs，开始续期…` means a renewal has started.
- `[token-keeper] 续期成功，新过期时间 HH:MM:SS` means the renewal worked.

## Settings

At the top of the script:

- `LEAD`: how many seconds before expiry to start renewing (default 120).
- `TICK`: how often to check, in milliseconds (default 15000).

## Notes

- It only works on `live.kankanews.com/huikan*`, and it depends on the page's current internal structure (the Nuxt/Vue component `HuikanIndex` and xgplayer). If the site is updated, the script may need changes.
- It doesn't crack or forge any signature. It only uses the page's own flow to get the new URL that the site would normally give you.
- For personal learning and viewing convenience only.

## License

MIT
