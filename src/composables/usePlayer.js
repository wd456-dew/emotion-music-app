// ============================================================
// 全局音频播放器（单例），统一播放本地 / 在线歌曲
// ============================================================
import { reactive } from 'vue'

const audio = new Audio()
audio.preload = 'auto'

export const player = reactive({
  song: null,
  playing: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  queue: [],
  index: -1,
  error: ''
})

audio.volume = player.volume

audio.addEventListener('timeupdate', () => { player.currentTime = audio.currentTime || 0 })
audio.addEventListener('loadedmetadata', () => { player.duration = audio.duration || 0 })
audio.addEventListener('durationchange', () => { player.duration = audio.duration || 0 })
audio.addEventListener('play', () => { player.playing = true })
audio.addEventListener('pause', () => { player.playing = false })
audio.addEventListener('ended', () => next())
audio.addEventListener('error', () => {
  player.error = '音频加载失败，可能是不支持或已失效的音源'
})

function load(song) {
  player.song = song
  player.error = ''
  audio.src = song.url || song.file
  player.currentTime = 0
}

export async function playFromList(list, index) {
  player.queue = list || []
  player.index = index
  load(list[index])
  try { await audio.play() } catch (e) { /* 用户手势不足时静默 */ }
}

export async function togglePlay() {
  if (!player.song) return
  if (audio.paused) { try { await audio.play() } catch (e) {} }
  else audio.pause()
}

export function next() {
  if (player.index < player.queue.length - 1) {
    playFromList(player.queue, player.index + 1)
  } else {
    player.playing = false
  }
}

export function prev() {
  if (player.index > 0) playFromList(player.queue, player.index - 1)
}

export function seek(t) {
  if (!player.duration) return
  audio.currentTime = Math.max(0, Math.min(t, player.duration))
  player.currentTime = audio.currentTime
}

export function setVolume(v) {
  player.volume = Math.max(0, Math.min(1, v))
  audio.volume = player.volume
}

export function stop() {
  audio.pause()
  audio.currentTime = 0
  player.playing = false
}
