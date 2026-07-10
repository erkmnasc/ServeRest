/**
 * Page Object Model — Tela de Login
 * Seletores baseados em data-testid (estáveis e desacoplados de CSS/layout),
 * verificados no código-fonte do frontend da ServeRest.
 */
class LoginPage {
  elements = {
    emailInput: () => cy.get('[data-testid="email"]'),
    passwordInput: () => cy.get('[data-testid="senha"]'),
    submitButton: () => cy.get('[data-testid="entrar"]'),
    registerLink: () => cy.get('[data-testid="cadastrar"]'),
    errorAlert: () => cy.get('.alert'),
  }

  visit() {
    cy.visit('/login')
    return this
  }

  fillEmail(email) {
    this.elements.emailInput().clear().type(email)
    return this
  }

  fillPassword(password) {
    this.elements.passwordInput().clear().type(password, { log: false })
    return this
  }

  submit() {
    this.elements.submitButton().click()
    return this
  }

  loginWith({ email, password }) {
    this.fillEmail(email)
    this.fillPassword(password)
    this.submit()
    return this
  }

  assertLoginError(message) {
    this.elements.errorAlert().should('be.visible').and('contain.text', message)
    cy.url().should('include', '/login')
    return this
  }
}

export default new LoginPage()
