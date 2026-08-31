// @ts-check
'use strict';

class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.errorBanner = page.locator('#login-error');
  }

  async fillUsername(username) {
    await this.usernameInput.fill(username);
  }

  async fillPassword(password) {
    await this.passwordInput.fill(password);
  }

  async clickSignIn() {
    await this.signInButton.click();
  }

  async login(username, password) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickSignIn();
  }

  getErrorBanner() {
    return this.errorBanner;
  }

  /**
   * Reads all four SMS sessionStorage keys and returns them as an object.
   * @returns {Promise<{ sms_auth: string|null, sms_user: string|null, sms_role: string|null, sms_label: string|null }>}
   */
  async getSessionStorageAuth() {
    return this.page.evaluate(() => ({
      sms_auth:  sessionStorage.getItem('sms_auth'),
      sms_user:  sessionStorage.getItem('sms_user'),
      sms_role:  sessionStorage.getItem('sms_role'),
      sms_label: sessionStorage.getItem('sms_label'),
    }));
  }
}

module.exports = { LoginPage };
