// 将演示图 PNG 转为高质量 JPG（显著减小体积，加快首屏）
import sharp from 'sharp'
import { readdir, stat, unlink } from 'node:fs/promises'
import path from 'node:path'

const DIR = 'public/demo'
const files = (await readdir(DIR)).filter(f => f.endsWith('.png'))
const kb = n => (n / 1024).toFixed(0) + ' KB'
let before = 0, after = 0

for (const f of files) {
  const src = path.join(DIR, f)
  const out = path.join(DIR, f.replace(/\.png$/, '.jpg'))
  const s0 = await stat(src)
  await sharp(src).jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(out)
  const s1 = await stat(out)
  before += s0.size; after += s1.size
  console.log(`${f.padEnd(18)} ${kb(s0.size).padStart(9)} -> ${kb(s1.size).padStart(8)}`)
  await unlink(src)
}
console.log(`\n总计 ${kb(before)} -> ${kb(after)}  (省 ${(100 * (1 - after / before)).toFixed(1)}%)`)
