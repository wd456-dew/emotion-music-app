// 资源路径工具：兼容根路径托管（Surge 等）与子路径托管（GitHub Pages /repo/）
// import.meta.env.BASE_URL 由 Vite 根据 base 注入：
//   开发时 = '/'；构建且 base='./' 时 = './'
export function asset(p) {
  const base = import.meta.env.BASE_URL || './'
  const clean = String(p || '').replace(/^\/+/, '')
  const prefix = base.endsWith('/') ? base : base + '/'
  return prefix + clean
}
