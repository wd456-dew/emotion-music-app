import puppeteer from 'puppeteer-core'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const URL = process.argv[2] || 'http://localhost:5173/'
const EXPECT = ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral']
const ZH = { happy: '开心', sad: '悲伤', angry: '愤怒', fearful: '恐惧', disgusted: '厌恶', surprised: '惊讶', neutral: '平静' }

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 1100 })
const errs = []
page.on('pageerror', e => errs.push('[pageerror] ' + e.message))
page.on('console', m => { if (m.type() === 'error') errs.push('[console.error] ' + m.text()) })

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForFunction(() => document.body.innerText.includes('本地模型就绪'), { timeout: 180000 })
console.log('✅ 模型加载完成')

const rows = []
for (let i = 0; i < EXPECT.length; i++) {
  await page.evaluate(idx => {
    const cards = document.querySelectorAll('.gallery .card')
    cards[idx].click()
  }, i)
  await new Promise(r => setTimeout(r, 500))
  try {
    await page.waitForFunction(() => !document.querySelector('.scanning') && !!document.querySelector('.ename'), { timeout: 40000 })
  } catch (e) {
    rows.push({ idx: i, expect: EXPECT[i], got: 'TIMEOUT', top: '' })
    continue
  }
  await new Promise(r => setTimeout(r, 2200))
  const info = await page.evaluate(() => {
    const ename = document.querySelector('.ename')?.innerText?.trim()
    const conf = document.querySelector('.badge')?.innerText?.trim()
    const local = document.querySelectorAll('.sec')[0]
    const topSong = local?.querySelector('.list li .t')?.innerText?.trim()
    const localCount = local ? local.querySelectorAll('.list li').length : 0
    const online = document.querySelectorAll('.sec')[1]
    const onlineCount = online ? online.querySelectorAll('.list li').length : 0
    return { ename, conf, topSong, localCount, onlineCount }
  })
  rows.push({ idx: i, expect: EXPECT[i], ...info })
}

console.log('\n=== 识别矩阵（期望 -> 实际）===')
for (const r of rows) {
  const ok = r.got === undefined ? (r.ename === ZH[r.expect]) : false
  console.log(`${r.expect.padEnd(10)} 期望:${ZH[r.expect]}  实际:${r.ename || '无'} ${ok ? '✅' : '⚠️'}  | 置信:${r.conf || '-'} | 本地Top:${r.topSong || '-'}(${r.localCount}) | 在线:${r.onlineCount}`)
}

console.log('\n=== 页面错误 ===')
console.log(errs.length ? errs.join('\n') : '（无）')

await page.screenshot({ path: '.tmp/e2e.png', fullPage: true })
await browser.close()
