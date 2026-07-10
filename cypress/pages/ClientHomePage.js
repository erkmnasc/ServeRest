/**
 * Page Object Model — Home do Usuário Comum (vitrine de compras)
 */
class ClientHomePage {
  elements = {
    searchInput: () => cy.get('[data-testid="pesquisar"]'),
    searchButton: () => cy.get('[data-testid="botaoPesquisar"]'),
    logoutButton: () => cy.get('[data-testid="logout"]'),
  }

  assertIsVisible() {
    // Regex ancorada no fim: diferencia "/home" (cliente) de "/admin/home" (admin)
    cy.url().should('match', /\/home$/)
    this.elements.searchInput().should('be.visible')
    this.elements.searchButton().should('be.visible')
    return this
  }
}

export default new ClientHomePage()
