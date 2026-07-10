/**
 * Page Object Model — Home do Usuário Comum (vitrine de compras)
 */
class ClientHomePage {
  elements = {
    initialMessage: () => cy.get('[data-testid="home-initial-message"]'),
    searchInput: () => cy.get('[data-testid="pesquisar"]'),
    logoutButton: () => cy.get('[data-testid="logout"]'),
  }

  assertIsVisible() {
    // Regex ancorada no fim: diferencia "/home" (cliente) de "/admin/home" (admin)
    cy.url().should('match', /\/home$/)
    this.elements.initialMessage().should('be.visible')
    this.elements.searchInput().should('be.visible')
    return this
  }
}

export default new ClientHomePage()
