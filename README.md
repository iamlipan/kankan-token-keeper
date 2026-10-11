# kankan-token-keeper

一个 Tampermonkey 用户脚本，用于[看看新闻](https://live.kankanews.com/huikan)的「看电视」直播页（`live.kankanews.com/huikan`）。它会在直播流的签名地址过期前自动续期，让直播不再每 10 分钟断一次。

## 问题

这个页面的 HLS 直播流地址带有签名参数（`token` / `volcSecret` / `volcTime`）。其中 `volcTime` 是过期时间，大约在地址发出后 10 分钟。一旦过期，请求 `index.m3u8` 就会返回 403，播放随之中断。

页面自己不会续期。服务器只在页面加载或切换频道时才会下发新的签名地址。

## 原理

1. 脚本每 15 秒读取一次播放器当前的地址（`player.config.url`），检查 `volcTime` 还剩多少时间。
2. 剩余不足 120 秒时，在隐藏、静音的 iframe 里加载同一个页面。如果 iframe 打开的是别的频道，脚本会调用页面自带的 `changeChannel`，切到你正在看的频道。
3. 等 iframe 里的播放器拿到同一路流的新签名地址后，脚本取出这个地址，然后移除 iframe。
4. 调用 xgplayer 的 `switchURL()`，把主播放器切到新地址。切换时画面可能会跳一下或停顿约 1 秒。

## 安装

1. 安装浏览器扩展 [Tampermonkey](https://www.tampermonkey.net/)。
2. **一键安装（推荐）**：装好 Tampermonkey 后，打开 [kankan-token-keeper.user.js（raw）](https://raw.githubusercontent.com/iamlipan/kankan-token-keeper/main/kankan-token-keeper.user.js)，点击「安装」。用这种方式安装，以后脚本更新时 Tampermonkey 会自动同步。
3. **手动安装**：点击 Tampermonkey 图标 →「添加新脚本」，粘贴 [`kankan-token-keeper.user.js`](./kankan-token-keeper.user.js) 的全部内容并保存。
4. 打开或刷新 https://live.kankanews.com/huikan 。

## 确认是否生效

按 F12 打开开发者工具，在 Console（控制台）里查看：

- `[token-keeper] 已启动`：脚本已启动。
- `[token-keeper] 签名还剩 XXs，开始续期…`：开始续期。
- `[token-keeper] 续期成功，新过期时间 HH:MM:SS`：续期成功。

## 配置

在脚本开头可以修改：

- `LEAD`：过期前多少秒开始续期（默认 120）。
- `TICK`：检查间隔，单位毫秒（默认 15000）。

## 说明

- 只适用于 `live.kankanews.com/huikan*`，并且依赖页面当前的内部结构（Nuxt/Vue 组件 `HuikanIndex` 和 xgplayer）。网站改版后，脚本可能需要调整。
- 脚本不破解、不伪造任何签名，只是借用页面自身的流程，拿到网站本来就会下发的新地址。
- 仅供个人学习和观看方便使用。

## 许可证

MIT
