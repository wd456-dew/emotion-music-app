import puppeteer from 'puppeteer-core'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.argv[2] || 'http://localhost:4173/'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
const net = []
page.on('response', r => { const u = r.url(); if (/\.(mp3|png|json)/.test(u) && !u.includes('itunes') && !u.includes('mzstatic')) net.push(r.status() + '  ' + u.replace(BASE, '')) })
page.on('requestfailed', r => net.push('FAIL  ' + r.url().replace(BASE, '')))

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForFunction(() => document.body.innerText.includes('本地模型就绪'), { timeout: 180000 })
console.log('✅ 模型就绪 @', BASE)

await page.evaluate(() => document.querySelectorAll('.gallery .card')[0].click())
await page.waitForFunction(() => !!document.querySelector('.ename'), { timeout: 40000 })
const emo = await page.evaluate(() => document.querySelector('.ename')?.innerText)
console.log('✅ 识别结果:', emo)

// 点击第一条本地歌曲播放
await page.evaluate(() => { const b = document.querySelector('.songs .sec .list li .cover'); if (b) b.click() })
await new Promise(r => setTimeout(r, 3000))
const st = await page.evaluate(() => ({
  nowPlaying: document.querySelector('.player .t')?.innerText || '',
  err: document.querySelector('.player .err')?.innerText || '',
  localCount: document.querySelectorAll('.songs .sec')[0]?.querySelectorAll('.list li').length || 0
}))
console.log('✅ 播放器:', JSON.stringify(st))

console.log('\n=== 关键静态资源请求 ===')
console.log(net.filter(x => /mp3|models|demo/.test(x)).slice(0, 20).join('\n'))
await browser.close()
