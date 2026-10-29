<template>
  <div class="gallery">
    <div class="ghead">
      <h3>🖼 演示人脸图库</h3>
      <span class="sub">点击任一情绪人脸，直接推送识别</span>
    </div>
    <div class="grid">
      <button
        v-for="e in EMOTIONS"
        :key="e.key"
        class="card"
        :class="{ picked: pickedKey === e.key }"
        :style="{ '--c': e.color }"
        @click="pick(e)"
      >
        <div class="imgwrap">
          <img :src="asset(`demo/${e.key}.png`)" :alt="e.label" loading="lazy" />
          <span class="emobadge">{{ e.emoji }} {{ e.label }}</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { EMOTIONS } from '../data/emotions.js'
import { asset } from '../lib/asset.js'

const emit = defineEmits(['pick'])
const pickedKey = ref('')

function pick(e) {
  pickedKey.value = e.key
  emit('pick', { url: asset(`demo/${e.key}.png`), key: e.key, label: e.label })
}
</script>

<style scoped>
.gallery { background: #111a2e; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 16px; }
.ghead { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; gap: 10px; }
.ghead h3 { font-size: 15px; color: #cfe0ff; font-weight: 600; }
.sub { font-size: 12px; color: #64748b; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
@media (max-width: 1100px) { .grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 600px) { .grid { grid-template-columns: repeat(2, 1fr); } }
.card { padding: 0; border: 2px solid transparent; background: #0b1020; border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform .15s, border-color .2s; }
.card:hover { transform: translateY(-3px); border-color: var(--c); }
.card.picked { border-color: var(--c); box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 30%, transparent); }
.imgwrap { position: relative; aspect-ratio: 1 / 1; }
.imgwrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
.emobadge { position: absolute; left: 6px; bottom: 6px; font-size: 11px; color: #fff; background: rgba(0,0,0,.55); padding: 2px 8px; border-radius: 99px; backdrop-filter: blur(4px); }
</style>
