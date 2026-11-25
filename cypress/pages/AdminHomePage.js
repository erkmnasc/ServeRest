/**
 * Page Object Model — Home do Administrador
 */
class AdminHomePage {
  elements = {
    welcomeHeading: () => cy.get('h1'),
    logoutButton: () => cy.get('[data-testid="logout"]'),
    // Card na home do admin (camelCase) — distinto do link "cadastrar-produtos" (com hífen) do navbar
    registerProductsCard: () => cy.get('[data-testid="cadastrarProdutos"]'),
  }

  assertIsVisibleFor(userName) {
    // Depois do cadastro o front mostra o alerta de sucesso e só então redireciona,
    // o que pode passar dos 4s padrão do Cypress
    cy.url({ timeout: 15000 }).should('include', '/admin/home')
    // Asserções separadas evitam fragilidade com espaçamento do texto "Bem Vindo  {nome}"
    this.elements
      .welcomeHeading()
      .should('be.visible')
      .and('contain.text', 'Bem Vindo')
      .and('contain.text', userName)
    return this
  }
}

export default new AdminHomePage()
