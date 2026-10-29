<template>
  <div class="player" :class="{ idle: !player.song }">
    <div class="left">
      <div class="cov" :style="coverStyle">
        <img v-if="player.song?.cover" :src="player.song.cover" alt="" />
        <span v-else-if="player.song?.color" class="note">♪</span>
        <span v-else class="note">🎧</span>
      </div>
      <div class="meta">
        <div class="t">{{ player.song?.title || '未在播放' }}</div>
        <div class="a">{{ player.song ? player.song.artist + (player.song.preview ? ' · 在线试听' : ' · 本地') : '从右侧选一首开始' }}</div>
        <div v-if="player.error" class="err">{{ player.error }}</div>
      </div>
    </div>

    <div class="center">
      <div class="btns">
        <button class="cbtn" :disabled="!player.song" @click="prev" title="上一首">⏮</button>
        <button class="cbtn play" :disabled="!player.song" @click="togglePlay" :title="player.playing ? '暂停' : '播放'">
          {{ player.playing ? '❚❚' : '▶' }}
        </button>
        <button class="cbtn" :disabled="!player.song" @click="next" title="下一首">⏭</button>
      </div>
      <div class="seek">
        <span class="tm">{{ fmt(player.currentTime) }}</span>
        <input type="range" min="0" :max="player.duration || 0" step="0.1" :value="player.currentTime" @input="onSeek" />
        <span class="tm">{{ fmt(player.duration) }}</span>
      </div>
    </div>

    <div class="right">
      <span class="vol-ico" @click="muteToggle">{{ player.volume === 0 ? '🔇' : '🔊' }}</span>
      <input class="vol" type="range" min="0" max="1" step="0.01" :value="player.volume" @input="onVol" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { player, togglePlay, next, prev, seek, setVolume } from '../composables/usePlayer.js'

const coverStyle = computed(() => {
  const c = player.song?.color
  return c ? { background: `linear-gradient(135deg,${c[0]},${c[1]})` } : {}
})

function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return m + ':' + String(sec).padStart(2, '0')
}
function onSeek(e) { seek(parseFloat(e.target.value)) }
function onVol(e) { setVolume(parseFloat(e.target.value)) }
function muteToggle() { setVolume(player.volume === 0 ? 0.8 : 0) }
</script>

<style scoped>
.player {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
  display: grid; grid-template-columns: 300px 1fr 180px; align-items: center; gap: 18px;
  padding: 12px 22px;
  background: rgba(10,15,30,.92); backdrop-filter: blur(14px);
  border-top: 1px solid rgba(255,255,255,.1);
}
.left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.cov { width: 48px; height: 48px; border-radius: 10px; background: #1a2238; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
.cov img { width: 100%; height: 100%; object-fit: cover; }
.note { font-size: 20px; color: #cfe0ff; }
.meta { min-width: 0; }
.t { font-size: 14px; color: #eaf1ff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.a { font-size: 12px; color: #8b9cbb; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.err { font-size: 11px; color: #fca5a5; }
.center { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.btns { display: flex; align-items: center; gap: 10px; }
.cbtn { background: transparent; border: none; color: #cfe0ff; font-size: 16px; cursor: pointer; padding: 4px 8px; border-radius: 8px; }
.cbtn:hover:not(:disabled) { background: rgba(255,255,255,.08); }
.cbtn:disabled { opacity: .35; cursor: not-allowed; }
.cbtn.play { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg,#06b6d4,#6366f1); color: #fff; font-size: 14px; }
.seek { display: flex; align-items: center; gap: 10px; width: 100%; max-width: 620px; }
.tm { font-size: 11px; color: #8b9cbb; font-variant-numeric: tabular-nums; width: 34px; text-align: center; }
input[type=range] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 99px; background: rgba(255,255,255,.15); outline: none; }
.seek input { flex: 1; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%; background: #22d3ee; cursor: pointer; box-shadow: 0 0 0 3px rgba(34,211,238,.2); }
.right { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
.vol-ico { cursor: pointer; font-size: 15px; }
.vol { width: 100px; }
@media (max-width: 900px) {
  .player { grid-template-columns: 1fr; gap: 8px; padding: 10px 14px; }
  .right { display: none; }
}
</style>
