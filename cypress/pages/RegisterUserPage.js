/**
 * Page Object Model — Cadastro de Usuário (tela pública)
 */
class RegisterUserPage {
  elements = {
    nameInput: () => cy.get('[data-testid="nome"]'),
    emailInput: () => cy.get('[data-testid="email"]'),
    passwordInput: () => cy.get('[data-testid="password"]'),
    adminCheckbox: () => cy.get('[data-testid="checkbox"]'),
    submitButton: () => cy.get('[data-testid="cadastrar"]'),
    errorAlert: () => cy.get('.alert'),
  }

  visit() {
    cy.visit('/cadastrarusuarios')
    return this
  }

  fillForm({ nome, email, password, administrador }) {
    this.elements.nameInput().clear().type(nome)
    this.elements.emailInput().clear().type(email)
    this.elements.passwordInput().clear().type(password, { log: false })
    if (administrador === 'true') {
      this.elements.adminCheckbox().check()
    }
    return this
  }

  submit() {
    this.elements.submitButton().click()
    return this
  }

  assertRegisterError(message) {
    this.elements.errorAlert().should('be.visible').and('contain.text', message)
    return this
  }
}

export default new RegisterUserPage()
