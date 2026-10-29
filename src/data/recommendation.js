// ============================================================
// 歌曲推荐算法（本地库）
// ------------------------------------------------------------
// 1) 每种情绪在 EMOTION_PROFILE.tagWeights 中定义"音乐标签权重矩阵"
//    例：happy -> { 欢快:3, 流行:2, 舞曲:2, 正能量:3, ... }
// 2) 单曲匹配分  score(song, e) = Σ weight[tag] ，tag ∈ song.tags
// 3) 对全库打分后降序，取 Top-N；若命中项不足则用未命中项补齐
// 4) matchPct = score / 该情绪下的最高分 * 100，用于 UI 展示相对匹配度
// ============================================================
import { EMOTION_PROFILE } from './emotions.js'
import { asset } from '../lib/asset.js'

export function scoreSongForEmotion(song, emotionKey) {
  const weights = EMOTION_PROFILE[emotionKey]?.tagWeights || {}
  return (song.tags || []).reduce((sum, tag) => sum + (weights[tag] || 0), 0)
}

export function recommendLocal(emotionKey, songs, topN = 6) {
  const scored = songs.map(s => ({
    ...s,
    source: 'local',
    url: s.url || asset(s.file), // 统一出播放地址，兼容子路径部署
    matchScore: scoreSongForEmotion(s, emotionKey)
  }))
  scored.sort((a, b) => b.matchScore - a.matchScore)

  const matched = scored.filter(s => s.matchScore > 0)
  const pool = matched.length >= topN ? matched : scored
  const top = pool.slice(0, topN)

  const max = top[0]?.matchScore || 1
  return top.map(s => ({
    ...s,
    matchPct: Math.round((s.matchScore / max) * 100)
  }))
}
