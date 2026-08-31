// @ts-check
'use strict';

// spec: TC_LOGIN_N01 — Invalid username/password
// type: Negative
// NOTE: Step 6 contains an INTENTIONAL wrong assertion on the error message text
//       so that the Healer agent can detect and fix it.
//       Wrong value  : 'Invalid credentials'
//       Correct value: testData.errorMessage  ("⚠ Invalid username or password. Please try again.")

const { test, expect } = require('../fixtures/auth');
const { LoginPage }    = require('../pages/LoginPage');
const testData         = require('../test-data/login.json');

test.describe('Login Feature', () => {
  test('TC_LOGIN_N01 — Invalid username/password', async ({ freshPage }) => {
    const loginPage = new LoginPage(freshPage);

    // 1. Navigate to http://localhost:8000/ui/login.html with clean sessionStorage
    //    (handled by the freshPage fixture)

    // 2. Fill username and password with invalid credentials
    await loginPage.login(
      testData.invalidUser.username,
      testData.invalidUser.password,
    );

    // 3. Click Sign In (called inside login())

    // 4. Assert URL stays at the login page
    await expect(freshPage).toHaveURL(/login\.html/);

    // 5. Assert error banner is visible
    await expect(loginPage.getErrorBanner()).toBeVisible();

    // 6. Assert error text — fixed to use testData.errorMessage from login.json
    //    Actual text: "⚠ Invalid username or password. Please try again."
    await expect(loginPage.getErrorBanner()).toHaveText(testData.errorMessage);

    // 7. Assert password field is cleared
    await expect(freshPage.getByLabel('Password')).toHaveValue('');

    // 8. Assert no sessionStorage keys are set
    const session = await loginPage.getSessionStorageAuth();
    expect(session.sms_auth).toBeNull();
    expect(session.sms_user).toBeNull();
    expect(session.sms_role).toBeNull();
    expect(session.sms_label).toBeNull();
  });
});
