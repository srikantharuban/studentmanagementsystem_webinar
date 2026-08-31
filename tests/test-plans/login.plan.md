# Login Feature Test Plan

## Application Overview

The Student Management System (SMS) login page is a vanilla-JS single-page form served at /ui/login.html. It authenticates against four hardcoded accounts defined in-page. On success it writes four sessionStorage keys and redirects to /ui/. On failure it reveals an inline error banner and clears the password field. There is no server-side auth call — all credential validation is client-side. Browser: Chrome (Chromium) only.

## Test Scenarios

### 1. Login

**Seed:** `tests/seed.spec.ts`

#### 1.1. TC_LOGIN_P01 — Successful authentication for admin user

**File:** `tests/login/TC_LOGIN_P01.spec.js`

**Steps:**
  1. Open a fresh browser context (no prior sessionStorage) and navigate to http://localhost:8000/ui/login.html
    - expect: The login page loads — the login card with the 'Student Management System' heading is visible
    - expect: The URL remains http://localhost:8000/ui/login.html (no redirect, because sms_auth is not set)
  2. Locate the Username input using getByLabel('Username') — maps to selector #username (type=text, placeholder='Enter username')
    - expect: The input is present, visible, and focused by default (autofocus attribute)
  3. Type 'admin' into the Username input (getByLabel('Username'))
    - expect: The field value reads 'admin'
  4. Locate the Password input using getByLabel('Password') — maps to selector #password (type=password, placeholder='Enter password'). Type 'admin123' into it.
    - expect: The field is filled; characters are masked
  5. Click the submit button located using getByRole('button', { name: 'Sign In' }) — maps to selector button.login-btn[type='submit']
    - expect: The form is submitted
    - expect: No error banner is shown (element #login-error retains class 'hidden')
  6. Wait for navigation to complete and observe the new URL
    - expect: The browser is redirected to http://localhost:8000/ui/ (window.location.replace('/ui/') is called on success)
  7. Read all four sessionStorage keys: sessionStorage.getItem('sms_auth'), sessionStorage.getItem('sms_user'), sessionStorage.getItem('sms_role'), sessionStorage.getItem('sms_label')
    - expect: sms_auth === 'true'
    - expect: sms_user === 'admin'
    - expect: sms_role === 'admin'
    - expect: sms_label === 'Administrator'

#### 1.2. TC_LOGIN_N01 — Invalid username/password shows error, no redirect

**File:** `tests/login/TC_LOGIN_N01.spec.js`

**Steps:**
  1. Open a fresh browser context (no prior sessionStorage) and navigate to http://localhost:8000/ui/login.html
    - expect: The login page loads and the error banner #login-error is hidden (class 'login-error hidden')
    - expect: The URL remains http://localhost:8000/ui/login.html
  2. Locate the Username input using getByLabel('Username') (#username) and type 'wronguser'
    - expect: The field value reads 'wronguser'
  3. Locate the Password input using getByLabel('Password') (#password) and type 'badpassword'
    - expect: The field is filled
  4. Click the submit button using getByRole('button', { name: 'Sign In' })
    - expect: The form submission is intercepted by handleLogin(event) — event.preventDefault() fires
    - expect: No navigation occurs; the URL stays at http://localhost:8000/ui/login.html
  5. Inspect the error banner element #login-error for its visibility and text content
    - expect: The element #login-error no longer has the 'hidden' class — it is now visible
    - expect: The banner text reads: '⚠ Invalid username or password. Please try again.'
    - expect: The password field (#password) has been cleared (value === '')
    - expect: Focus has moved to the password field
  6. Read sessionStorage to verify no auth keys were written
    - expect: sessionStorage.getItem('sms_auth') is null (not 'true')
    - expect: sessionStorage.getItem('sms_user') is null
    - expect: sessionStorage.getItem('sms_role') is null
    - expect: sessionStorage.getItem('sms_label') is null
