<template>
  <div class="capture">
    <div ref="stageEl" class="stage" :class="{ 'has-media': hasMedia }">
      <!-- 实时摄像头 / 视频文件 -->
      <video
        v-show="showVideo"
        ref="videoEl"
        class="media"
        :autoplay="cameraOn"
        :muted="true"
        playsinline
        @loadedmetadata="onVideoMeta"
      ></video>

      <!-- 上传的图片 / 拍下的照片 -->
      <img v-if="imageSrc && !showVideo" ref="imgEl" class="media" :src="imageSrc" alt="人脸" />

      <!-- 检测框叠加层 -->
      <canvas
        v-if="hasMedia"
        ref="overlayEl"
        class="overlay"
      ></canvas>

      <!-- 空状态提示 -->
      <div v-if="!hasMedia" class="placeholder">
        <div class="ph-icon">🤳</div>
        <p>选择左侧任一方式获取人脸</p>
        <p class="ph-sub">上传图片 · 打开视频 · 开启摄像头 · 拍照 · 或直接用演示图库</p>
      </div>

      <div v-if="analyzing" class="scanning">
        <div class="spinner"></div>
        <span>正在识别情绪…</span>
      </div>
    </div>

    <div class="controls">
      <template v-if="mode === 'camera' || mode === 'photo'">
        <button v-if="!cameraOn" class="btn primary" @click="startCamera">开启摄像头</button>
        <button v-else class="btn warn" @click="stopCamera">关闭摄像头</button>
        <button class="btn" :disabled="!cameraOn || analyzing" @click="capture">📸 拍照</button>
        <button class="btn accent" :disabled="!cameraOn || analyzing" @click="emitAnalyze">识别当前画面</button>
      </template>

      <template v-else-if="mode === 'video'">
        <label class="btn primary">
          打开视频文件
          <input ref="videoFile" type="file" accept="video/*" hidden @change="onVideoFile" />
        </label>
        <button class="btn accent" :disabled="!hasVideoMedia || analyzing" @click="emitAnalyze">识别当前帧</button>
      </template>

      <template v-else-if="mode === 'upload'">
        <label class="btn primary">
          上传人脸图片
          <input ref="imgFile" type="file" accept="image/*" hidden @change="onImageFile" />
        </label>
      </template>

      <button class="btn ghost" :disabled="!hasMedia || analyzing" @click="clearAll">清除</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  mode: { type: String, default: 'upload' },
  analyzing: { type: Boolean, default: false },
  detection: { type: Object, default: null }
})

const emit = defineEmits(['media', 'analyze', 'clear', 'camera-state'])

const stageEl = ref(null)
const videoEl = ref(null)
const imgEl = ref(null)
const overlayEl = ref(null)
const imageSrc = ref('')
const cameraOn = ref(false)
const videoFromFile = ref(false)
let stream = null
let currentElement = null

const showVideo = computed(() => cameraOn.value || videoFromFile.value)
const hasVideoMedia = computed(() => showVideo.value && videoEl.value && videoEl.value.readyState >= 2)
const hasMedia = computed(() => showVideo.value || !!imageSrc.value)

function onVideoMeta() {
  resizeOverlay()
  drawBox()
}

// 让叠加画布的内部像素尺寸 = 舞台显示尺寸（CSS 像素）
function resizeOverlay() {
  const c = overlayEl.value
  const s = stageEl.value
  if (!c || !s) return
  c.width = s.clientWidth
  c.height = s.clientHeight
}

// 将人脸框（相对原始媒体像素）按 object-fit: contain 映射到画布坐标
function drawBox() {
  const c = overlayEl.value
  if (!c) return
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, c.width, c.height)
  const d = props.detection
  if (!d || !d.box) return
  const el = showVideo.value ? videoEl.value : imgEl.value
  if (!el) return
  const nw = el.videoWidth || el.naturalWidth || el.width
  const nh = el.videoHeight || el.naturalHeight || el.height
  if (!nw || !nh) return

  const scale = Math.min(c.width / nw, c.height / nh)
  const dw = nw * scale
  const dh = nh * scale
  const ox = (c.width - dw) / 2
  const oy = (c.height - dh) / 2

  const { x, y, width, height } = d.box
  const sx = ox + x * scale
  const sy = oy + y * scale
  const sw = width * scale
  const sh = height * scale

  const color = d.emotion?.color || '#22d3ee'
  ctx.lineWidth = Math.max(2, c.width / 220)
  ctx.strokeStyle = color
  ctx.strokeRect(sx, sy, sw, sh)

  const label = `${d.emotion?.emoji || ''} ${d.emotion?.label || ''} ${(d.emotion?.score * 100).toFixed(0)}%`
  const fs = Math.max(13, c.width / 34)
  ctx.font = `${fs}px sans-serif`
  const tw = ctx.measureText(label).width
  const lh = fs + 12
  const ly = sy - lh < 0 ? sy : sy - lh
  ctx.fillStyle = color
  ctx.fillRect(sx, ly, tw + 16, lh)
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, sx + 8, ly + lh / 2)
}

watch(() => props.detection, () => { resizeOverlay(); drawBox() })
watch(() => props.mode, (m) => {
  clearAll()
  if (m === 'photo') startCamera()
})

async function onImageFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const url = URL.createObjectURL(file)
  await loadExternalImage(url, 'image')
  e.target.value = ''
}

async function loadExternalImage(url, kind = 'image') {
  stopCamera()
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    imageSrc.value = url
    videoFromFile.value = false
    currentElement = img
    emit('media', { element: img, auto: true })
  }
  img.onerror = () => { alert('图片加载失败：' + url) }
  img.src = url
}

function onVideoFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  stopCamera()
  const url = URL.createObjectURL(file)
  videoFromFile.value = true
  cameraOn.value = false
  currentElement = videoEl.value
  videoEl.value.src = url
  videoEl.value.loop = true
  videoEl.value.play()
  e.target.value = ''
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    videoFromFile.value = false
    cameraOn.value = true
    videoEl.value.srcObject = stream
    currentElement = videoEl.value
    await videoEl.value.play()
    emit('camera-state', true)
  } catch (err) {
    alert('无法访问摄像头：' + err.message + '\n请确认已授予摄像头权限，且页面通过 http(s) 或 localhost 打开。')
  }
}

function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }
  cameraOn.value = false
  if (videoEl.value) videoEl.value.srcObject = null
  emit('camera-state', false)
}

function capture() {
  if (!hasVideoMedia.value) return
  const v = videoEl.value
  const canvas = document.createElement('canvas')
  canvas.width = v.videoWidth
  canvas.height = v.videoHeight
  canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height)
  imageSrc.value = canvas.toDataURL('image/png')
  videoFromFile.value = false
  // 拍照后保留一帧画面，停止实时流以省资源
  stopCamera()
  currentElement = canvas
  emit('media', { element: canvas, auto: true })
}

function emitAnalyze() {
  if (!currentElement) return
  emit('analyze', currentElement)
}

function clearAll() {
  stopCamera()
  imageSrc.value = ''
  videoFromFile.value = false
  currentElement = null
  if (videoEl.value) { videoEl.value.removeAttribute('src'); videoEl.value.load() }
  emit('clear')
}

function onResize() { resizeOverlay(); drawBox() }
onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => {
  stopCamera()
  window.removeEventListener('resize', onResize)
})

defineExpose({ loadExternalImage, startCamera, stopCamera, clearAll })
</script>

<style scoped>
.capture { display: flex; flex-direction: column; gap: 14px; }
.stage {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #0b1020;
  border-radius: 16px;
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(255,255,255,.08);
}
.media { width: 100%; height: 100%; object-fit: contain; display: block; background: #000; }
.overlay { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.placeholder { text-align: center; color: #93a4c4; padding: 24px; }
.ph-icon { font-size: 48px; margin-bottom: 8px; }
.ph-sub { font-size: 12px; color: #6b7c9c; margin-top: 6px; }
.scanning {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px;
  background: rgba(8,12,28,.55); color: #e6edf7; font-size: 14px; backdrop-filter: blur(2px);
}
.spinner {
  width: 38px; height: 38px; border-radius: 50%;
  border: 3px solid rgba(255,255,255,.2); border-top-color: #22d3ee;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.controls { display: flex; flex-wrap: wrap; gap: 10px; }
.btn {
  border: 1px solid rgba(255,255,255,.14); background: #1a2238; color: #e6edf7;
  padding: 10px 16px; border-radius: 10px; cursor: pointer; font-size: 14px;
  transition: transform .1s ease, background .2s ease; user-select: none;
}
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn.primary { background: linear-gradient(135deg,#6366f1,#8b5cf6); border-color: transparent; }
.btn.accent { background: linear-gradient(135deg,#06b6d4,#3b82f6); border-color: transparent; }
.btn.warn { background: linear-gradient(135deg,#f59e0b,#ef4444); border-color: transparent; }
.btn.ghost { background: transparent; }
</style>
