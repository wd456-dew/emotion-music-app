import puppeteer from 'puppeteer-core'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.setViewport({ width: 1460, height: 1200, deviceScaleFactor: 1 })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 60000 })
await page.waitForFunction(() => document.body.innerText.includes('本地模型就绪'), { timeout: 90000 })
await page.evaluate(() => document.querySelectorAll('.gallery .card')[0].click())
await page.waitForFunction(() => !!document.querySelector('.ename'), { timeout: 40000 })
await new Promise(r => setTimeout(r, 2500))
await page.screenshot({ path: '.tmp/preview.png', fullPage: true })
const txt = await page.evaluate(() => ({
  emotion: document.querySelector('.ename')?.innerText,
  top: document.querySelectorAll('.sec')[0]?.querySelector('.list li .t')?.innerText
}))
console.log('shot ok', JSON.stringify(txt))
await browser.close()
