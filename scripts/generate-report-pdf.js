const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const puppeteer = require('puppeteer-core')

const REPORT_DIR = path.join(__dirname, '..', 'cypress', 'reports')
const REPORT_HTML = path.join(REPORT_DIR, 'index.html')
// Pasta dedicada de evidências, na raiz do projeto (fora de cypress/reports,
// que é volátil e regenerado a cada execução)
const EVIDENCE_DIR = path.join(__dirname, '..', 'evidencias')

const CHROME_CANDIDATES = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
]

function resolveChromePath() {
  const found = CHROME_CANDIDATES.find((candidate) => candidate && fs.existsSync(candidate))

  if (!found) {
    throw new Error(
      'Chrome não encontrado para gerar o PDF. Instale o Google Chrome ou defina ' +
        'PUPPETEER_EXECUTABLE_PATH apontando para o executável.',
    )
  }

  return found
}

/**
 * Nome de arquivo profissional e ordenável:
 *   ServeRest_Evidencia-<Escopo>_<AAAA-MM-DD>_<HH-MM-SS>.pdf
 * O escopo (API, Frontend, Suite-Completa, ...) vem de EVIDENCE_SCOPE,
 * definido por cada script npm; o padrão é "Relatorio".
 */
function evidenceFilename() {
  const scope = (process.env.EVIDENCE_SCOPE || 'Relatorio').replace(/[^a-zA-Z0-9-]/g, '')

  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`

  return `ServeRest_Evidencia-${scope}_${date}_${time}.pdf`
}

async function main() {
  if (!fs.existsSync(REPORT_HTML)) {
    console.warn(`Nenhum relatório HTML encontrado em ${REPORT_HTML} — nada para converter em PDF.`)
    return
  }

  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })

  const executablePath = resolveChromePath()
  const outputPath = path.join(EVIDENCE_DIR, evidenceFilename())

  const browser = await puppeteer.launch({ executablePath, headless: 'new' })

  try {
    const page = await browser.newPage()
    await page.goto(pathToFileURL(REPORT_HTML).href, { waitUntil: 'networkidle0' })
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '16px', bottom: '16px', left: '16px', right: '16px' },
    })
  } finally {
    await browser.close()
  }

  console.log(`Evidência em PDF gerada em ${outputPath}`)
}

main().catch((err) => {
  console.error('Falha ao gerar o PDF de evidência do relatório:', err.message)
  process.exitCode = 1
})
