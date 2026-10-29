// ============================================================
// 人脸情绪识别模块（纯浏览器本地推理，基于 face-api.js / TensorFlow.js）
// ------------------------------------------------------------
// 说明：face-api.js 以 UMD 形式在 index.html 中通过
//   <script src="/vendor/face-api.min.js"> 加载（自带 tfjs 后端注册），
//   避免 Vite ESM 打包缺失 backend 的问题。此处使用全局 window.faceapi。
//
// 算法流程（本地、离线可跑）：
//   1) TinyFaceDetector  —— 轻量级人脸检测，定位人脸框
//   2) FaceLandmark68Net —— 68 点人脸关键点，归一化姿态
//   3) FaceExpressionNet —— 对裁剪人脸做 7 类表情分类
//      输出 7 概率：neutral/happy/sad/angry/fearful/disgusted/surprised
//   4) 取概率最大者作为"当前情绪"，保留完整概率分布供展示
// ============================================================
import { EMOTION_MAP, EMOTION_ORDER } from '../data/emotions.js'
import { asset } from '../lib/asset.js'

const MODEL_URL = asset('models')
let modelsLoaded = false
let loadingPromise = null

function getFaceApi() {
  const f = window.faceapi
  if (!f) throw new Error('face-api 库未加载，请检查 /vendor/face-api.min.js')
  return f
}

export async function loadModels() {
  if (modelsLoaded) return
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    const faceapi = getFaceApi()

    // 选择计算后端：优先 WebGL（GPU 加速），失败回退 CPU
    try {
      if (faceapi.tf?.setBackend) {
        try {
          await faceapi.tf.setBackend('webgl')
        } catch {
          await faceapi.tf.setBackend('cpu')
        }
        await faceapi.tf.ready()
      }
    } catch (e) {
      console.warn('后端设置告警：', e)
    }

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    ])
    modelsLoaded = true
  })()

  return loadingPromise
}

/**
 * 对输入媒体做情绪识别
 * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input
 */
export async function detectEmotion(input) {
  await loadModels()
  const faceapi = getFaceApi()

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,
    scoreThreshold: 0.5
  })

  const detection = await faceapi
    .detectSingleFace(input, options)
    .withFaceLandmarks()
    .withFaceExpressions()

  if (!detection) return null

  const expressions = detection.expressions
  const probabilities = {}
  EMOTION_ORDER.forEach(k => { probabilities[k] = +(expressions[k] || 0).toFixed(4) })

  let bestKey = EMOTION_ORDER[0]
  let bestVal = -1
  EMOTION_ORDER.forEach(k => {
    if (probabilities[k] > bestVal) { bestVal = probabilities[k]; bestKey = k }
  })

  const box = detection.detection.box
  return {
    emotion: { ...EMOTION_MAP[bestKey], score: bestVal },
    probabilities,
    box: { x: box.x, y: box.y, width: box.width, height: box.height },
    expressions: EMOTION_ORDER.map(k => ({ ...EMOTION_MAP[k], score: probabilities[k] }))
      .sort((a, b) => b.score - a.score),
    faceCount: 1
  }
}
