/**
 * Page Object Model — Home do Administrador
 */
class AdminHomePage {
  elements = {
    welcomeHeading: () => cy.get('h1'),
    logoutButton: () => cy.get('[data-testid="logout"]'),
    registerProductsCard: () => cy.get('[data-testid="cadastrarProdutos"]'),
  }

  assertIsVisibleFor(userName) {
    cy.url().should('include', '/admin/home')
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
