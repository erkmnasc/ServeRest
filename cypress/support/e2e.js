import 'cypress-mochawesome-reporter/register'
import './commands'

// O frontend público da ServeRest possui uma promise sem tratamento em
// services/validateUser.js que estoura quando a API responde com erro
// (ex.: instabilidade do serviço) — defeito conhecido da aplicação sob teste.
// Ignoramos apenas essa mensagem específica para não mascarar outras exceções reais.
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes("Cannot read properties of undefined (reading 'data')")) {
    return false
  }
})
