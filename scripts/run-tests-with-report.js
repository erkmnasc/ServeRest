const { spawnSync } = require('child_process')
const path = require('path')

// Roda a suíte e, independentemente do resultado (inclusive com cenários falhando),
// gera a evidência em PDF do relatório antes de propagar o código de saída real do
// Cypress — assim uma falha nos testes segue derrubando o build/CI normalmente,
// mas a evidência do que aconteceu nunca deixa de ser salva.
const cypressArgs = process.argv.slice(2)

const testRun = spawnSync('npx', ['cypress', 'run', ...cypressArgs], {
  stdio: 'inherit',
  shell: true,
})

// Chama o gerador com o binário do Node atual (process.execPath) e SEM shell:
// com shell: true, um caminho contendo espaços (ex.: "C:\Users\Erick Nascimento")
// seria quebrado pelo shell, fazendo o Node tentar carregar o módulo errado.
const reportRun = spawnSync(process.execPath, [path.join(__dirname, 'generate-report-pdf.js')], {
  stdio: 'inherit',
})

if (reportRun.status !== 0) {
  console.error('Aviso: falha ao gerar a evidência em PDF (ver saída acima).')
}

process.exit(testRun.status ?? 1)
