<template>
  <div class="songs">
    <div class="sec">
      <div class="sec-head">
        <h3>🎵 本地曲库推荐</h3>
        <span class="hint">{{ emotionLabel ? '为「' + emotionLabel + '」匹配' : '按当前情绪匹配' }}</span>
      </div>
      <div v-if="!localSongs.length" class="empty">识别情绪后展示本地推荐</div>
      <ul v-else class="list">
        <li v-for="(s, i) in localSongs" :key="s.id" :class="{ active: isActive(s) }" @dblclick="play(localSongs, i)">
          <button class="cover" :style="{ background: 'linear-gradient(135deg,' + s.color[0] + ',' + s.color[1] + ')' }" @click="play(localSongs, i)">
            <span v-if="!isActive(s)" class="ico">▶</span>
            <span v-else class="ico">{{ player.playing ? '❚❚' : '▶' }}</span>
          </button>
          <div class="info">
            <div class="t">{{ s.title }} <span class="tag">本地</span></div>
            <div class="a">{{ s.artist }}</div>
            <div class="tags"><span v-for="t in s.tags" :key="t">{{ t }}</span></div>
          </div>
          <div class="match">
            <div class="mtrack"><div class="mfill" :style="{ width: s.matchPct + '%' }"></div></div>
            <span class="mp">{{ s.matchPct }}%</span>
          </div>
        </li>
      </ul>
    </div>

    <div class="sec">
      <div class="sec-head">
        <h3>🌐 在线推荐 <span class="src">iTunes</span></h3>
        <span class="hint">30 秒在线试听</span>
      </div>
      <div v-if="loadingOnline" class="empty">正在请求在线歌单…</div>
      <div v-else-if="onlineError" class="empty err">{{ onlineError }}</div>
      <div v-else-if="!onlineSongs.length" class="empty">暂无在线结果（可仅用本地曲库）</div>
      <ul v-else class="list">
        <li v-for="(s, i) in onlineSongs" :key="s.id" :class="{ active: isActive(s) }" @dblclick="play(onlineSongs, i)">
          <button class="cover imgcover" @click="play(onlineSongs, i)">
            <img v-if="s.cover" :src="s.cover" alt="" />
            <span v-if="!isActive(s)" class="ico">▶</span>
            <span v-else class="ico">{{ player.playing ? '❚❚' : '▶' }}</span>
          </button>
          <div class="info">
            <div class="t">{{ s.title }} <span class="tag online">在线</span></div>
            <div class="a">{{ s.artist }}</div>
            <div class="alb">{{ s.album }}</div>
          </div>
          <div class="match"><span class="preview">试听</span></div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { player, playFromList } from '../composables/usePlayer.js'

const props = defineProps({
  localSongs: { type: Array, default: () => [] },
  onlineSongs: { type: Array, default: () => [] },
  loadingOnline: { type: Boolean, default: false },
  onlineError: { type: String, default: '' },
  emotionLabel: { type: String, default: '' }
})

function isActive(s) { return player.song && player.song.id === s.id }

function play(list, i) {
  if (isActive(list[i])) return playFromList(list, i) // 重新播放
  playFromList(list, i)
}
</script>

<style scoped>
.songs { display: flex; flex-direction: column; gap: 18px; }
.sec { background: #111a2e; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 16px; }
.sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.sec-head h3 { font-size: 15px; color: #cfe0ff; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.src { font-size: 10px; background: #1f2b45; color: #7dd3fc; padding: 2px 6px; border-radius: 6px; font-weight: 400; }
.hint { font-size: 12px; color: #64748b; }
.empty { text-align: center; color: #64748b; font-size: 13px; padding: 18px 0; }
.empty.err { color: #fca5a5; }
.list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.list li { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 12px; transition: background .2s; cursor: pointer; }
.list li:hover { background: rgba(255,255,255,.05); }
.list li.active { background: rgba(34,211,238,.1); outline: 1px solid rgba(34,211,238,.3); }
.cover { width: 46px; height: 46px; border-radius: 10px; border: none; cursor: pointer; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; overflow: hidden; }
.imgcover { background: #0b1020; }
.imgcover img { width: 100%; height: 100%; object-fit: cover; }
.ico { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; background: rgba(0,0,0,.35); opacity: 0; transition: opacity .2s; }
.cover:hover .ico, .active .ico { opacity: 1; }
.info { flex: 1; min-width: 0; }
.t { font-size: 14px; color: #eaf1ff; font-weight: 500; display: flex; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tag { font-size: 10px; color: #9fb2d4; background: rgba(255,255,255,.08); padding: 1px 5px; border-radius: 5px; }
.tag.online { color: #7dd3fc; background: rgba(125,211,252,.12); }
.a { font-size: 12px; color: #8b9cbb; margin-top: 2px; }
.alb { font-size: 11px; color: #5f7292; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tags { display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; }
.tags span { font-size: 10px; color: #93a4c4; background: rgba(255,255,255,.05); padding: 1px 5px; border-radius: 5px; }
.match { width: 96px; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.mtrack { width: 100%; height: 5px; background: rgba(255,255,255,.08); border-radius: 99px; overflow: hidden; }
.mfill { height: 100%; background: linear-gradient(90deg,#22d3ee,#6366f1); border-radius: 99px; }
.mp { font-size: 11px; color: #7dd3fc; font-variant-numeric: tabular-nums; }
.preview { font-size: 11px; color: #93a4c4; border: 1px solid rgba(255,255,255,.12); padding: 2px 8px; border-radius: 99px; }
</style>
