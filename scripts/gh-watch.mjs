// 轮询 GitHub Actions 运行状态，直到完成或超时
const TOKEN = process.env.GH_TOKEN_LOCAL
const REPO = 'wd456-dew/emotion-music-app'
const RUN_ID = process.argv[2] || 'latest'

const H = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
}

async function api(path) {
  const r = await fetch(`https://api.github.com${path}`, { headers: H })
  if (!r.ok) throw new Error(`${path} -> ${r.status}`)
  return r.json()
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  let id = RUN_ID
  if (id === 'latest') {
    const d = await api(`/repos/${REPO}/actions/runs?per_page=1`)
    id = d.workflow_runs[0].id
  }
  console.log('run id:', id)
  const deadline = Date.now() + 8 * 60 * 1000
  while (Date.now() < deadline) {
    const run = await api(`/repos/${REPO}/actions/runs/${id}`)
    console.log(`[${new Date().toLocaleTimeString()}] status=${run.status} conclusion=${run.conclusion || '-'}`)
    if (run.status === 'completed') {
      const jobs = await api(`/repos/${REPO}/actions/runs/${id}/jobs`)
      for (const j of jobs.jobs) {
        console.log(`  job: ${j.name} -> ${j.status}/${j.conclusion || '-'}`)
        for (const s of j.steps) {
          console.log(`    step: ${s.name} -> ${s.status}/${s.conclusion || '-'}`)
        }
      }
      console.log('DONE conclusion=' + run.conclusion)
      process.exit(run.conclusion === 'success' ? 0 : 1)
    }
    await sleep(12000)
  }
  console.log('TIMEOUT waiting for run')
  process.exit(2)
}

main().catch(e => { console.error('ERR', e.message); process.exit(3) })
