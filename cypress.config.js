const { defineConfig } = require('cypress')

module.exports = defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    reportPageTitle: 'ServeRest | Relatório de Testes',
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
  },
  e2e: {
    baseUrl: 'https://front.serverest.dev',
    specPattern: 'cypress/e2e/**/*.cy.js',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    retries: {
      // Mitiga flakiness de rede em CI sem mascarar falhas no desenvolvimento local
      runMode: 1,
      openMode: 0,
    },
    expose: {
      // Specs de frontend dependem do front público, que chama https://serverest.dev
      // internamente (URL fixa no código deles), por isso o padrão aqui é o mesmo host.
      // Os specs de API podem apontar para outro backend com API_URL=http://localhost:3000
      // (ver scripts "*:local" no package.json) sem afetar os specs de frontend.
      apiUrl: process.env.API_URL || 'https://serverest.dev',
    },
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on)
      return config
    },
  },
})
