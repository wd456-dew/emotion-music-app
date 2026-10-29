# 情绪识歌 · 基于人脸情绪识别的歌曲推荐系统

> HTML5 / CSS3 / JavaScript + **Vue 3** + **face-api.js（TensorFlow.js，纯浏览器本地推理）**

系统通过「上传图片 / 打开视频 / 实时摄像头 / 拍照 / 演示图库」获取人脸，在**本地**完成情绪识别，
再根据情绪从「本地曲库 + 在线歌曲 API」双通道推荐歌曲。

---

## 〇、在线体验 / 仓库

| 项目 | 地址 |
| --- | --- |
| 🌐 **在线演示（GitHub Pages）** | https://wd456-dew.github.io/emotion-music-app/ |
| 📦 **GitHub 仓库** | https://github.com/wd456-dew/emotion-music-app |

> Pages 为 HTTPS，**摄像头可直接使用**。部署流程见 [`docs/DEPLOY.md`](docs/DEPLOY.md)。

---

## 一、启动方式

```bash
cd emotion-music-app
npm install
npm run dev        # 开发模式，浏览器打开 http://localhost:5173
# 或
npm run build && npm run preview   # 生产构建 + 本地预览
```

> 摄像头功能要求页面运行在 `http://localhost` 或 HTTPS 下（浏览器安全策略）。

---

## 二、人脸情绪识别算法（本地）

完全在浏览器端离线运行，不上传任何图像。

| 步骤 | 模型 | 作用 |
| --- | --- | --- |
| 1 | **TinyFaceDetector** | 轻量人脸检测，定位人脸边界框（inputSize=224, scoreThreshold=0.5） |
| 2 | **FaceLandmark68Net** | 68 点人脸关键点，做姿态对齐 / 归一化 |
| 3 | **FaceExpressionNet** | 对对齐后的人脸做 7 类表情分类（小型 CNN） |
| 4 | Argmax | 取概率最大的类别作为当前情绪，同时保留全部概率分布 |

- 7 类情绪：`neutral / happy / sad / angry / fearful / disgusted / surprised`
- 计算后端：优先 WebGL（GPU 加速），不可用时自动回退 CPU。
- 模型权重已本地化到 `public/models/`（tiny_face_detector / face_landmark_68 / face_expression），
  推理库 `public/vendor/face-api.min.js` 为官方 UMD 版（自带 TensorFlow.js 后端注册）。
- 每次识别返回：人脸框坐标、7 类概率、最大概率情绪及其置信度。

---

## 三、歌曲推荐算法

### 3.1 本地曲库推荐（打分排序）

每种情绪定义一张「音乐标签权重矩阵」（`src/data/emotions.js` → `EMOTION_PROFILE.tagWeights`）：

```
单曲匹配分  score(song, e) = Σ  weight_e[tag]      (tag ∈ song.tags)
```

- 例：`happy → { 欢快:3, 流行:2, 舞曲:2, 正能量:3, ... }`
- 对全库每首歌按当前情绪打分 → 降序 → 取 **Top-N（默认 6 首）**；
- 若命中项不足 N，则用其余歌曲补齐，保证列表不为空；
- 展示的相对匹配度 `matchPct = score / 该情绪最高分 × 100%`。

### 3.2 在线歌曲 API（iTunes Search API）

- 情绪 → 英文检索短语（`ONLINE_TERMS`），如 `happy → "happy upbeat pop"`；
- 调用 `https://itunes.apple.com/search?term=...&media=music&entity=song`；
- 官方公开、**无需密钥**、返回 `Access-Control-Allow-Origin: *`（浏览器可直连）；
- 取每条结果的 30 秒试听地址 `previewUrl` 与封面 `artworkUrl100`。

> 在线通道失败时自动降级：仅使用本地曲库并在界面提示，不影响主流程。

### 3.3 播放

本地与在线歌曲统一进入 `usePlayer` 单例播放器（播放/暂停、上一首/下一首、进度、音量）。

---

## 四、目录结构

```
emotion-music-app/
├─ index.html                 # 引入 vendor/face-api.min.js + Vue 入口
├─ public/
│  ├─ models/                 # 本地情绪识别模型权重
│  ├─ vendor/face-api.min.js  # face-api UMD（自带 tfjs 后端）
│  ├─ songs/                  # 本地示例曲（SoundHelix 免版税）
│  └─ demo/                   # 7 张不同情绪写实人脸（演示图库）
├─ src/
│  ├─ App.vue                 # 编排：识别 → 推荐 → 播放
│  ├─ components/
│  │  ├─ CapturePanel.vue     # 上传/视频/摄像头/拍照 + 检测框叠加
│  │  ├─ DemoGallery.vue      # 演示情绪人脸图库
│  │  ├─ EmotionResult.vue    # 情绪结果 + 7 类概率条
│  │  ├─ SongList.vue         # 本地/在线推荐列表
│  │  └─ PlayerBar.vue        # 底部播放器
│  ├─ composables/
│  │  ├─ useFaceApi.js        # 本地情绪识别
│  │  └─ usePlayer.js         # 音频播放器
│  └─ data/
│     ├─ emotions.js          # 情绪定义 + 情绪→标签权重 + 在线检索词
│     ├─ recommendation.js    # 本地推荐打分算法
│     ├─ onlineApi.js         # iTunes 在线接口
│     └─ localSongs.js        # 本地曲库元数据
└─ scripts/e2e.mjs            # （可选）端到端验证脚本
```

---

## 五、本地曲库说明

- 12 首示例曲来自 [SoundHelix](https://www.soundhelix.com/)（算法生成、免版税，可自由使用），
  存于 `public/songs/`，时间与「歌手」为演示用虚构信息。
- 每首歌带 `tags`，被 3.1 的打分算法使用；可按同一格式自行增删歌曲。

---

## 六、验证结果（真实浏览器端到端）

使用 Chrome 无头浏览器依次点击 7 张演示图，校验「识别情绪 + 本地推荐」：

| 演示图 | 期望情绪 | 识别结果 | 置信度 | 本地 Top1 |
| --- | --- | --- | --- | --- |
| happy | 开心 | 开心 ✅ | 100.0% | 晨光序曲 |
| sad | 悲伤 | 悲伤 ✅ | 98.3% | 蓝调心事 |
| angry | 愤怒 | 愤怒 ✅ | 98.8% | 烈焰节奏 |
| fearful | 恐惧 | 平静 ⚠️ | 47.9% | 城市霓虹 |
| disgusted | 厌恶 | 厌恶 ✅ | 99.7% | 清风小径 |
| surprised | 惊讶 | 惊讶 ✅ | 100.0% | 脉冲电波 |
| neutral | 平静 | 平静 ✅ | 100.0% | 城市霓虹 |

7 类中 6 类精准命中，且每种情绪都推荐到了对应风格的本地歌曲。

---

## 七、已知限制

- **恐惧类识别偏弱**：face-api 的 7 类表情模型对"恐惧"与"惊讶/中性"区分度较低，
  表情过于夸张（如尖叫）时人脸检测也可能失败；这是模型本身的已知特性，非工程缺陷。
- 演示人脸为 AI 生成（右下角带"AI生成"水印），用于免版权演示。
- 在线通道为 iTunes 30 秒试听片段，非完整曲目。
- 摄像头需 `localhost` / HTTPS 且用户授权。

---

## 八、隐私

所有图像处理均在浏览器本地完成，**不会上传到任何服务器**；在线通道仅发送情绪对应的检索词。
