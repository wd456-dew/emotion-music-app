<template>
  <div class="result">
    <div class="head">
      <h3>情绪识别结果</h3>
      <span v-if="result" class="badge" :style="{ background: result.emotion.color }">置信度 {{ pct }}</span>
    </div>

    <div v-if="loading" class="skeleton">
      <div class="sk-circle"></div>
      <p>本地模型推理中…</p>
    </div>

    <div v-else-if="!result" class="empty">
      <p>尚未识别</p>
      <p class="sub">上传 / 拍摄 / 选择一张人脸图片后自动识别</p>
    </div>

    <template v-else>
      <div class="emotion-main" :style="{ '--c': result.emotion.color }">
        <div class="emoji">{{ result.emotion.emoji }}</div>
        <div class="meta">
          <div class="ename">{{ result.emotion.label }}</div>
          <div class="edesc">{{ result.emotion.desc }}</div>
          <div class="style">🎧 推荐风格：{{ profile.style }}</div>
        </div>
      </div>

      <div class="bars">
        <div v-for="e in orderedExpressions" :key="e.key" class="bar-row">
          <span class="k">{{ e.emoji }} {{ e.label }}</span>
          <div class="track">
            <div class="fill" :style="{ width: (e.score * 100).toFixed(1) + '%', background: e.color }"></div>
          </div>
          <span class="v">{{ (e.score * 100).toFixed(1) }}%</span>
        </div>
      </div>

      <p class="tip">算法：TinyFaceDetector 检测 → 68 点关键点对齐 → FaceExpressionNet 7 类表情分类（浏览器本地推理）</p>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { EMOTIONS, EMOTION_PROFILE } from '../data/emotions.js'

const props = defineProps({
  result: { type: Object, default: null },
  loading: { type: Boolean, default: false }
})

const pct = computed(() => props.result ? (props.result.emotion.score * 100).toFixed(1) + '%' : '')
const profile = computed(() => EMOTION_PROFILE[props.result?.emotion?.key] || { style: '' })

const orderedExpressions = computed(() => {
  if (!props.result) return []
  const prob = props.result.probabilities || {}
  return EMOTIONS
    .map(e => ({ ...e, score: prob[e.key] || 0 }))
    .sort((a, b) => b.score - a.score)
})
</script>

<style scoped>
.result { background: #111a2e; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 18px; }
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.head h3 { font-size: 15px; color: #cfe0ff; font-weight: 600; }
.badge { color: #fff; font-size: 12px; padding: 3px 10px; border-radius: 999px; }
.skeleton { text-align: center; padding: 28px 0; color: #93a4c4; }
.sk-circle { width: 42px; height: 42px; margin: 0 auto 12px; border-radius: 50%; border: 3px solid rgba(255,255,255,.15); border-top-color: #22d3ee; animation: sp 0.8s linear infinite; }
@keyframes sp { to { transform: rotate(360deg); } }
.empty { text-align: center; padding: 28px 0; color: #8fa1c2; }
.empty .sub { font-size: 12px; color: #64748b; margin-top: 6px; }
.emotion-main { display: flex; gap: 14px; align-items: center; padding: 14px; border-radius: 14px; background: color-mix(in srgb, var(--c) 16%, transparent); border: 1px solid color-mix(in srgb, var(--c) 40%, transparent); margin-bottom: 16px; }
.emoji { font-size: 46px; line-height: 1; }
.ename { font-size: 24px; font-weight: 700; color: #fff; }
.edesc { font-size: 13px; color: #b8c6e0; margin: 2px 0 6px; }
.style { font-size: 12px; color: #9fb2d4; }
.bars { display: flex; flex-direction: column; gap: 8px; }
.bar-row { display: grid; grid-template-columns: 78px 1fr 52px; align-items: center; gap: 10px; font-size: 12px; color: #b8c6e0; }
.track { height: 8px; background: rgba(255,255,255,.08); border-radius: 999px; overflow: hidden; }
.fill { height: 100%; border-radius: 999px; transition: width .5s ease; }
.v { text-align: right; color: #8fa1c2; font-variant-numeric: tabular-nums; }
.tip { margin-top: 14px; font-size: 11px; color: #5f7292; line-height: 1.6; }
</style>
