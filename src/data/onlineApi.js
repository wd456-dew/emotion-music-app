// ============================================================
// 在线歌曲 API（iTunes Search API）
// ------------------------------------------------------------
// 选择理由：官方公开、无需密钥、返回 Access-Control-Allow-Origin: *
//（浏览器可直接请求），每条结果含 30s 可直接播放的 previewUrl 与封面图。
// 情绪 -> 英文检索短语 的映射见 emotions.js / ONLINE_TERMS。
// ============================================================
import { ONLINE_TERMS } from './emotions.js'

const ITUNES_URL = 'https://itunes.apple.com/search'

export async function searchOnlineByEmotion(emotionKey, limit = 8) {
  const term = ONLINE_TERMS[emotionKey] || 'pop'
  const params = new URLSearchParams({
    term,
    media: 'music',
    limit: String(limit),
    country: 'us',
    entity: 'song'
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(`${ITUNES_URL}?${params.toString()}`, { signal: controller.signal })
    if (!res.ok) throw new Error('在线音乐接口返回 ' + res.status)
    const data = await res.json()
    return (data.results || [])
      .filter(r => r.previewUrl)
      .map(r => ({
        id: 'itunes-' + r.trackId,
        title: r.trackName,
        artist: r.artistName,
        album: r.collectionName || '',
        cover: (r.artworkUrl100 || '').replace('100x100', '300x300'),
        url: r.previewUrl,
        duration: 30,
        source: 'online',
        preview: true,
        matchPct: 100,
        matchScore: 0
      }))
  } finally {
    clearTimeout(timer)
  }
}
