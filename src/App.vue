<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <div class="logo">🎵</div>
        <div>
          <h1>情绪识歌</h1>
          <p>人脸情绪识别 · 智能歌曲推荐系统</p>
        </div>
      </div>
      <div class="status">
        <span class="dot" :class="modelsReady ? 'ok' : 'wait'"></span>
        <span>{{ statusText }}</span>
      </div>
    </header>

    <section class="tabs">
      <button
        v-for="m in modes"
        :key="m.key"
        class="tab"
        :class="{ active: mode === m.key }"
        @click="mode = m.key"
      >{{ m.label }}</button>
      <span class="tabs-note">4 种人脸获取方式 · 另有演示图库</span>
    </section>

    <main class="main">
      <div class="col left">
        <CapturePanel
          ref="captureRef"
          :mode="mode"
          :analyzing="detecting"
          :detection="detection"
          @media="onMedia"
          @analyze="onAnalyze"
          @clear="onClear"
          @camera-state="onCameraState"
        />
        <DemoGallery @pick="onDemoPick" />
      </div>

      <div class="col right">
        <EmotionResult :result="detection" :loading="detecting" />
        <SongList
          :local-songs="localRecs"
          :online-songs="onlineRecs"
          :loading-online="loadingOnline"
          :online-error="onlineError"
          :emotion-label="emotionLabel"
        />
      </div>
    </main>

    <PlayerBar />
    <transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CapturePanel from './components/CapturePanel.vue'
import EmotionResult from './components/EmotionResult.vue'
import SongList from './components/SongList.vue'
import DemoGallery from './components/DemoGallery.vue'
import PlayerBar from './components/PlayerBar.vue'
import { loadModels, detectEmotion } from './composables/useFaceApi.js'
import { recommendLocal } from './data/recommendation.js'
import { searchOnlineByEmotion } from './data/onlineApi.js'
import { LOCAL_SONGS } from './data/localSongs.js'

const modes = [
  { key: 'upload', label: '📁 上传图片' },
  { key: 'video', label: '🎬 打开视频' },
  { key: 'camera', label: '📷 实时摄像头' },
  { key: 'photo', label: '📸 拍照' }
]

const mode = ref('upload')
const captureRef = ref(null)
const modelsReady = ref(false)
const modelsError = ref('')
const detecting = ref(false)
const detection = ref(null)
const localRecs = ref([])
const onlineRecs = ref([])
const loadingOnline = ref(false)
const onlineError = ref('')
const toast = ref('')
let toastTimer = null

const statusText = computed(() => {
  if (modelsError.value) return '模型加载失败：' + modelsError.value
  return modelsReady.value ? '本地模型就绪 · 纯浏览器端推理' : '模型加载中…'
})
const emotionLabel = computed(() => detection.value?.emotion?.label || '')

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 3000)
}

onMounted(async () => {
  try {
    await loadModels()
    modelsReady.value = true
  } catch (e) {
    modelsError.value = e.message || String(e)
    console.error(e)
  }
})

async function onMedia({ element, auto }) {
  if (auto) await analyze(element)
}
async function onAnalyze(element) {
  await analyze(element)
}

async function analyze(element) {
  if (!element) return
  detecting.value = true
  try {
    const res = await detectEmotion(element)
    if (!res) {
      detection.value = null
      showToast('未检测到人脸，请换一张清晰的正面照')
      return
    }
    detection.value = res
    const key = res.emotion.key
    localRecs.value = recommendLocal(key, LOCAL_SONGS, 6)
    fetchOnline(key)
  } catch (e) {
    console.error(e)
    showToast('识别失败：' + (e.message || e))
  } finally {
    detecting.value = false
  }
}

async function fetchOnline(key) {
  loadingOnline.value = true
  onlineError.value = ''
  onlineRecs.value = []
  try {
    onlineRecs.value = await searchOnlineByEmotion(key, 8)
    if (!onlineRecs.value.length) onlineError.value = '在线接口暂无结果，已使用本地曲库'
  } catch (e) {
    onlineError.value = '在线接口暂不可用，已使用本地曲库'
  } finally {
    loadingOnline.value = false
  }
}

function onDemoPick({ url }) {
  captureRef.value?.loadExternalImage(url, 'demo')
}

function onClear() {
  detection.value = null
  localRecs.value = []
  onlineRecs.value = []
  onlineError.value = ''
  mode.value = 'upload'
}

function onCameraState(on) {
  if (on) showToast('摄像头已开启，点击「识别当前画面」或「拍照」')
}
</script>

<style scoped>
.app { min-height: 100vh; padding: 22px clamp(16px, 4vw, 40px) 110px; max-width: 1440px; margin: 0 auto; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.brand { display: flex; align-items: center; gap: 14px; }
.logo { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; background: linear-gradient(135deg,#6366f1,#22d3ee); box-shadow: 0 8px 24px rgba(99,102,241,.35); }
.brand h1 { font-size: 24px; color: #f1f6ff; letter-spacing: .5px; }
.brand p { font-size: 13px; color: #8b9cbb; margin-top: 2px; }
.status { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #b8c6e0; background: rgba(255,255,255,.04); padding: 8px 14px; border-radius: 99px; border: 1px solid rgba(255,255,255,.08); }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.ok { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
.dot.wait { background: #f59e0b; animation: pulse 1.2s infinite; }
@keyframes pulse { 50% { opacity: .35; } }
.tabs { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
.tab { border: 1px solid rgba(255,255,255,.1); background: #131c30; color: #b8c6e0; padding: 9px 16px; border-radius: 11px; cursor: pointer; font-size: 14px; transition: all .2s; }
.tab:hover { border-color: rgba(99,102,241,.6); }
.tab.active { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; border-color: transparent; box-shadow: 0 6px 18px rgba(99,102,241,.3); }
.tabs-note { font-size: 12px; color: #5f7292; margin-left: auto; }
.main { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 20px; align-items: start; }
@media (max-width: 1000px) { .main { grid-template-columns: 1fr; } }
.col { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.toast { position: fixed; left: 50%; bottom: 104px; transform: translateX(-50%); background: rgba(20,28,48,.96); color: #e6edf7; padding: 11px 20px; border-radius: 12px; font-size: 13px; border: 1px solid rgba(255,255,255,.12); z-index: 60; box-shadow: 0 10px 30px rgba(0,0,0,.4); }
.fade-enter-active, .fade-leave-active { transition: opacity .3s, transform .3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
</style>
