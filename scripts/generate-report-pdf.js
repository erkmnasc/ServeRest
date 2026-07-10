const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer-core')

const REPORT_DIR = path.join(__dirname, '..', 'cypress', 'reports')
const REPORT_HTML = path.join(REPORT_DIR, 'index.html')
const PDF_DIR = path.join(REPORT_DIR, 'pdf')

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

function timestampedFilename() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `relatorio-${stamp}.pdf`
}

async function main() {
  if (!fs.existsSync(REPORT_HTML)) {
    console.warn(`Nenhum relatório HTML encontrado em ${REPORT_HTML} — nada para converter em PDF.`)
    return
  }

  fs.mkdirSync(PDF_DIR, { recursive: true })

  const executablePath = resolveChromePath()
  const outputPath = path.join(PDF_DIR, timestampedFilename())

  const browser = await puppeteer.launch({ executablePath, headless: 'new' })

  try {
    const page = await browser.newPage()
    await page.goto(`file://${REPORT_HTML}`, { waitUntil: 'networkidle0' })
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
