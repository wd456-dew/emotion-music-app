# 部署指南

本项目已做「相对路径」改造（`vite.config.js` 中 `base: './'`），
因此**既能部署到根路径（Surge），也能部署到子路径（GitHub Pages `/repo/`）**，无需改代码。

---

## ✅ 当前线上状态（已完成）

| 项目 | 地址 | 状态 |
| --- | --- | --- |
| GitHub 仓库 | https://github.com/wd456-dew/emotion-music-app | 公开 |
| GitHub Pages | https://wd456-dew.github.io/emotion-music-app/ | 已上线，Actions 自动部署 |

发布方式：仓库 **Settings → Pages → Build and deployment → Source** = **GitHub Actions**，
之后每次 `git push origin main` 都会自动 `npm ci && npm run build` 并发布 `dist/`。

验证记录（真实 Chrome，对线上地址跑完整链路）：
- 模型 / 演示图 / 音频全部 `200`，音频为 `206` 分段流式播放
- 识别 → 推荐 → 播放连通，7 张演示图中 6 张精准命中（详见 README「验证结果」）

---

## 方案 A：Surge（最快，1 分钟）

```bash
# 首次会提示注册/登录（输入邮箱 + 密码即可，自动创建账号）
npx surge ./dist
# 也可指定域名（需唯一）
npx surge ./dist https://emotion-music.surge.sh
```

或使用 package.json 里的脚本（自动先构建）：

```bash
npm run deploy:surge
```

> 若在 CI 中免交互部署，设置环境变量 `SURGE_LOGIN` 与 `SURGE_TOKEN`
> （`npx surge token` 可生成 token）。

---

## 方案 B：GitHub Pages（自动 Action）

已内置 `.github/workflows/deploy.yml`。

1. 在 GitHub 新建仓库并推送：
   ```bash
   git init
   git add .
   git commit -m "feat: emotion music recommender"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```
2. 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。
3. 之后再 push 到 `main` 会自动构建发布，地址形如
   `https://<用户名>.github.io/<仓库名>/`。

> 因为 `base: './'`，子路径 `/仓库名/` 下模型、歌曲、演示图、face-api 均能正确加载（已本地模拟验证）。

---

## 方案 C：手动 gh CLI（可选）

```bash
gh auth login
gh repo create emotion-music-app --public --source=. --push
# 再按方案 B 第 2 步开启 Pages
```

---

## 说明

- 摄像头功能需 HTTPS 或 localhost；Surge / GitHub Pages 均默认 HTTPS。
- 本地歌曲与演示图随 `dist/` 一起发布（约 29MB，其中歌曲 26MB 按需流式加载，演示图已压缩至 1.3MB）。
- 在线音源走 iTunes 官方接口（浏览器直连、CORS 开放），无需后端。
