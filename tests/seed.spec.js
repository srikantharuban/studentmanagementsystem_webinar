// @ts-check
'use strict';
const { test } = require('@playwright/test');

test.describe('Seed', () => {
  test('seed', async ({ page }) => {
    await page.goto('http://localhost:8000/ui/login.html');
  });
});
