// @ts-check
'use strict';

// spec: TC_LOGIN_P01 — Successful authentication for admin user
// type: Positive

const { test, expect } = require('../fixtures/auth');
const { LoginPage }    = require('../pages/LoginPage');
const testData         = require('../test-data/login.json');

test.describe('Login Feature', () => {
  test('TC_LOGIN_P01 — Successful authentication for admin user', async ({ freshPage }) => {
    const loginPage = new LoginPage(freshPage);

    // 1. Navigate to http://localhost:8000/ui/login.html with clean sessionStorage
    //    (handled by the freshPage fixture)

    // 2. Fill username and password with valid admin credentials
    await loginPage.login(
      testData.validAdmin.username,
      testData.validAdmin.password,
    );

    // 3. Click Sign In (called inside login())

    // 4. Assert redirect to http://localhost:8000/ui/
    await expect(freshPage).toHaveURL('http://localhost:8000/ui/');

    // 5. Assert sessionStorage keys are set correctly
    const session = await loginPage.getSessionStorageAuth();
    const expected = testData.expectedSession.admin;

    expect(session.sms_auth).toBe(expected.sms_auth);
    expect(session.sms_user).toBe(expected.sms_user);
    expect(session.sms_role).toBe(expected.sms_role);
    expect(session.sms_label).toBe(expected.sms_label);
  });
});
