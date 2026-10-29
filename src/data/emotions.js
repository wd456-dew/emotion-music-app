// ============================================================
// 情绪定义 + 情绪 → 音乐推荐特征映射
// 这是"歌曲推荐算法"的核心配置：把识别到的 7 类情绪
// 映射为"音乐标签权重"（本地打分用）与"搜索关键词"（在线 API 用）
// ============================================================

// face-api.js 输出的 7 种表情（英文键名与模型一致）
export const EMOTIONS = [
  { key: 'happy',     label: '开心',   emoji: '😄', color: '#f59e0b', desc: '愉悦、兴奋、充满能量' },
  { key: 'sad',       label: '悲伤',   emoji: '😢', color: '#3b82f6', desc: '低落、安静、需要抚慰' },
  { key: 'angry',     label: '愤怒',   emoji: '😠', color: '#ef4444', desc: '激动、有张力、需要宣泄' },
  { key: 'fearful',   label: '恐惧',   emoji: '😨', color: '#8b5cf6', desc: '紧张、不安、需要安全感' },
  { key: 'disgusted', label: '厌恶',   emoji: '🤢', color: '#10b981', desc: '抵触、想抽离、需要清新' },
  { key: 'surprised', label: '惊讶',   emoji: '😲', color: '#ec4899', desc: '新鲜、强烈刺激、需要动感' },
  { key: 'neutral',   label: '平静',   emoji: '😐', color: '#6b7280', desc: '中性、放松、随意聆听' }
]

export const EMOTION_MAP = Object.fromEntries(EMOTIONS.map(e => [e.key, e]))

// 顺序：用于把模型输出的概率对象稳定排序
export const EMOTION_ORDER = EMOTIONS.map(e => e.key)

// ------------------------------------------------------------
// 情绪 → 音乐风格画像
//  tagWeights : 本地歌曲打分用的"标签权重矩阵"
//  keywords   : 在线 API 搜索用的中文关键词（取第一个作为主搜索词）
//  style      : 给用户的文字化风格描述
// ------------------------------------------------------------
export const EMOTION_PROFILE = {
  happy: {
    style: '欢快明朗、节奏轻快、充满正能量的流行/电子乐',
    keywords: ['快乐', '欢快', '正能量'],
    tagWeights: { 欢快: 3, 流行: 2, 电子: 2, 舞曲: 2, 正能量: 3, 轻快: 2, 摇滚: 1, 燃: 1 }
  },
  sad: {
    style: '舒缓伤感、低沉抒情的慢歌与钢琴/民谣',
    keywords: ['伤感', '悲伤', '安静'],
    tagWeights: { 伤感: 3, 悲伤: 3, 安静: 2, 民谣: 2, 慢歌: 2, 钢琴: 2, 抒情: 2, 治愈: 1 }
  },
  angry: {
    style: '高张力、强节奏的摇滚/说唱，帮助情绪宣泄',
    keywords: ['摇滚', '燃', '激情'],
    tagWeights: { 摇滚: 3, 金属: 3, 燃: 2, 说唱: 2, 电子: 1, 节奏: 2, 激情: 3 }
  },
  fearful: {
    style: '温柔治愈、舒缓的轻音乐与纯钢琴，给予安全感',
    keywords: ['治愈', '舒缓', '轻音乐'],
    tagWeights: { 治愈: 3, 轻音乐: 3, 舒缓: 3, 钢琴: 2, 纯音乐: 2, 安静: 2 }
  },
  disgusted: {
    style: '清新放松的独立/民谣，帮助抽离与呼吸',
    keywords: ['清新', '放松', '民谣'],
    tagWeights: { 清新: 3, 独立: 2, 放松: 3, 民谣: 2, 轻音乐: 2, 爵士: 2 }
  },
  surprised: {
    style: '强烈动感、带冲击力的电子/舞曲',
    keywords: ['动感', '电子', '燃'],
    tagWeights: { 动感: 3, 电子: 3, 舞曲: 3, 流行: 2, 燃: 2, 节奏: 2 }
  },
  neutral: {
    style: '轻松百搭的流行/轻音乐，适合随意聆听',
    keywords: ['流行', '轻音乐', '推荐'],
    tagWeights: { 流行: 2, 轻音乐: 2, 抒情: 2, 民谣: 1, 钢琴: 1, 综合: 2 }
  }
}

// ------------------------------------------------------------
// 在线 API（iTunes Search）检索词：把情绪映射为英文音乐检索短语
// 选择英文短语是因为 iTunes 对英文流派词召回更稳定
// ------------------------------------------------------------
export const ONLINE_TERMS = {
  happy: 'happy upbeat pop',
  sad: 'sad acoustic piano',
  angry: 'rock aggressive energy',
  fearful: 'calm healing piano ambient',
  disgusted: 'chill indie acoustic',
  surprised: 'energetic dance electronic',
  neutral: 'pop acoustic relax'
}

// 本地歌曲打分时使用的全部候选标签（用于 UI 展示 / 兜底）
export const ALL_TAGS = [
  '欢快', '流行', '电子', '舞曲', '正能量', '轻快', '摇滚', '燃',
  '伤感', '悲伤', '安静', '民谣', '慢歌', '钢琴', '抒情', '治愈',
  '金属', '说唱', '节奏', '激情', '轻音乐', '舒缓', '纯音乐',
  '清新', '独立', '放松', '爵士', '动感', '综合'
]
