# JWT Authentication Verification Checklist

Use this checklist to verify that your authentication system is working correctly.

---

## ✅ Pre-Flight Checks

### Backend Setup
- [ ] .env file created in backend/
- [ ] JWT_SECRET is set (and NOT empty)
- [ ] MONGODB_URI or MONGODB_PATH is configured
- [ ] CORS_ORIGIN=http://localhost:3000 (or your frontend URL)
- [ ] MongoDB is running and accessible
- [ ] Backend runs on port 9001: `npm run serve`

### Frontend Setup
- [ ] .env file created in frontend/
- [ ] REACT_APP_API_URL=http://localhost:9001
- [ ] Frontend runs on port 3000: `npm start`
- [ ] Both services are running simultaneously

---

## 🔐 Login Flow Verification

### Step 1: Access Login Page
- [ ] Navigate to http://localhost:3000/login
- [ ] Login form displays correctly
- [ ] Page loads without console errors

### Step 2: Perform Login
- [ ] Enter valid test credentials
- [ ] Click Login button
- [ ] Toast shows "Login successful!"
- [ ] Page redirects to dashboard or admin (depending on role)
- [ ] No errors in browser console

### Step 3: Verify Token Storage
Open DevTools (F12) and navigate to: **Application > Local Storage > http://localhost:3000**
- [ ] Key `token` exists and contains a JWT (long string starting with `eyJ`)
- [ ] Key `user` exists and contains: `{"id":"...","name":"...","email":"...","role":"..."}`

Example token format:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZjI0M2NkOWU2ZDAwMDAwMDAwMDAwMCIsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjk0NTM2ODAwLCJleHAiOjE2OTQ2MjMyMDB9.xyz...
```

---

## 📡 API Request Verification

### Step 1: Make an API Request
- [ ] Perform an action that requires authentication (e.g., create project)
- [ ] Action completes successfully
- [ ] Response is received from backend
- [ ] No 403 Forbidden errors

### Step 2: Verify Authorization Header
Open DevTools → **Network tab** → click on any API request (e.g., POST /project)

**Request Headers section should show:**
```
Authorization: Bearer <long_jwt_token>
Content-Type: application/json
```

- [ ] Authorization header is present
- [ ] Format is: `Bearer <token>` (NOT just `<token>`)
- [ ] Token matches the one in localStorage

### Step 3: Check Response
- [ ] Status code is 2xx (200, 201, etc.)
- [ ] Response body contains expected data
- [ ] No 401/403 errors
- [ ] Backend logs show successful request

---

## 🚪 Logout Verification

### Step 1: Logout
- [ ] Logout button visible in header (top right)
- [ ] User name and role displayed next to logout button
- [ ] Click Logout button
- [ ] Toast shows "Logged out successfully"

### Step 2: Verify Cleanup
Open DevTools → **Application > Local Storage**
- [ ] Key `token` is removed
- [ ] Key `user` is removed
- [ ] localStorage is empty (or only has non-auth keys)

### Step 3: Verify Redirect
- [ ] Page automatically redirects to /login
- [ ] Login form displays
- [ ] All previous data is cleared

---

## ⏰ Token Expiration Verification

### Step 1: Create an Expired Token
- [ ] Login and get a valid token
- [ ] Open backend .env and change JWT_SECRET to a different value
- [ ] Restart backend server: `npm run serve`

### Step 2: Make API Request with Expired Token
- [ ] Click any API action (e.g., create project)
- [ ] Backend returns 401 Unauthorized
- [ ] Console shows: "Unauthorized (401) - Token invalid or expired"

### Step 3: Verify Automatic Logout
- [ ] localStorage is cleared
- [ ] Auth modal appears
- [ ] User sees login prompt

### Step 4: Restore Original JWT_SECRET
- [ ] Change JWT_SECRET back to original value
- [ ] Restart backend
- [ ] Login again with credentials

---

## 🛡️ Error Handling Verification

### Test 401 - Missing Token
**Action**: Open browser console and run:
```javascript
fetch('http://localhost:9001/auth/profile')
  .then(r => r.json())
  .then(d => console.log(d))
```

- [ ] Response: `{ message: 'Access token required', code: 'NO_TOKEN' }`
- [ ] Status: 401

### Test 403 - Invalid Token
**Action**: Open browser console and run:
```javascript
fetch('http://localhost:9001/auth/profile', {
  headers: { 'Authorization': 'Bearer invalid_token_here' }
}).then(r => r.json()).then(d => console.log(d))
```

- [ ] Response: `{ message: 'Invalid or malformed token', code: 'INVALID_TOKEN' }`
- [ ] Status: 403

### Test 409 - Duplicate Email (Signup)
- [ ] Try to signup with existing email
- [ ] Response: `{ message: 'Email already registered' }`
- [ ] Status: 409

### Test 422 - Validation Error
- [ ] Submit login form with invalid email
- [ ] Response contains validation errors
- [ ] Status: 422

---

## 🔗 CORS Verification

### Test 1: Verify CORS Headers
Open DevTools → **Network tab** → click any API request
- [ ] Response Headers section should show:
  ```
  access-control-allow-origin: http://localhost:3000
  access-control-allow-methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
  access-control-allow-headers: Content-Type, Authorization
  ```

### Test 2: No CORS Errors
- [ ] Browser console shows no CORS errors
- [ ] API requests succeed (2xx responses)
- [ ] No "Access-Control-Allow-Origin" error messages

---

## 🔄 End-to-End Flow Test

Complete this full flow without errors:

1. [ ] Start fresh (clear localStorage)
   ```javascript
   localStorage.clear()
   location.reload()
   ```

2. [ ] Navigate to login page

3. [ ] Create a new account (signup)
   - [ ] Fill form with new email and password
   - [ ] Submit signup
   - [ ] Automatically logged in
   - [ ] Token stored in localStorage

4. [ ] Perform authenticated action
   - [ ] Create a project / task
   - [ ] Verify Authorization header in Network tab
   - [ ] Successful response (2xx)

5. [ ] Refresh page
   - [ ] Still logged in (token persisted)
   - [ ] App loads without requiring re-login

6. [ ] Logout
   - [ ] Click logout button
   - [ ] Redirected to login
   - [ ] localStorage cleared

7. [ ] Try accessing protected route
   - [ ] Navigate to http://localhost:3000/dashboard
   - [ ] Redirected to login (since not authenticated)

---

## 📊 Debug Information

If something isn't working, collect this information:

### Browser Console
- [ ] Any errors? (Take screenshot)
- [ ] Any warnings? (Take screenshot)
- [ ] Run: `localStorage.getItem('token')` - shows token or null?
- [ ] Run: `localStorage.getItem('user')` - shows user or null?

### Network Tab
- [ ] What's the status code of failed request? (401, 403, etc.)
- [ ] What's in the Authorization header?
- [ ] What's the response body/error message?

### Backend Console
- [ ] Any error messages?
- [ ] Server running on port 9001?
- [ ] Database connection successful?

### .env Files
- [ ] JWT_SECRET is set? (echo $JWT_SECRET)
- [ ] CORS_ORIGIN matches frontend? (CORS_ORIGIN=http://localhost:3000)
- [ ] REACT_APP_API_URL correct? (REACT_APP_API_URL=http://localhost:9001)

---

## 🆘 Common Issues & Fixes

### Issue: 403 Forbidden on all API requests

**Checklist:**
- [ ] Token exists in localStorage?
- [ ] Authorization header shows `Bearer <token>`?
- [ ] JWT_SECRET in backend is same as when token was created?
- [ ] Try logout and login again?

**Fix:**
```bash
# 1. Clear token
localStorage.clear()

# 2. Login again to get fresh token
# Navigate to login and sign in

# 3. Check if new token works
# Make API request and verify Authorization header
```

### Issue: CORS errors

**Checklist:**
- [ ] CORS_ORIGIN in .env matches frontend URL?
- [ ] Frontend URL: http://localhost:3000
- [ ] Backend CORS_ORIGIN: http://localhost:3000 (exact match)
- [ ] Both running on correct ports?

**Fix:**
```env
# backend/.env
CORS_ORIGIN=http://localhost:3000  # Must be exact match
```

### Issue: "Invalid token" immediately after login

**Checklist:**
- [ ] Backend .env JWT_SECRET is non-empty?
- [ ] JWT_SECRET changed after signup? (would invalidate token)
- [ ] Check browser console for token format?

**Fix:**
```bash
# 1. Verify JWT_SECRET in backend/.env is set correctly
grep JWT_SECRET backend/.env

# 2. If changed, restart backend
npm run serve

# 3. Logout and login again
```

### Issue: Token not stored in localStorage

**Checklist:**
- [ ] Login response includes `token` field?
- [ ] `login()` function called after successful response?
- [ ] localStorage not disabled in browser?

**Fix:**
```javascript
// In browser console, check login response:
fetch('http://localhost:9001/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'password' })
})
.then(r => r.json())
.then(d => console.log(d))  // Should show { user: {...}, token: '...' }
```

---

## ✨ Success Indicators

You'll know everything is working correctly when:

✅ Can login with valid credentials
✅ Token appears in localStorage
✅ Token attached to API requests (Authorization: Bearer xxx)
✅ API requests return 200/201 (not 401/403)
✅ Can create/edit/delete projects and tasks
✅ Logout clears localStorage and redirects to login
✅ Page refresh keeps user logged in (token persists)
✅ Expired token triggers auto-logout with login prompt
✅ No console errors or CORS warnings
✅ Header shows user name and logout button when logged in

---

## 📞 Still Having Issues?

Check in this order:

1. **Backend**: Is it running? `npm run serve` showing "Server running at http://localhost:9001"?
2. **Frontend**: Is it running? `npm start` showing "webpack compiled successfully"?
3. **.env files**: Are they created and filled in correctly?
4. **Browser console**: What errors do you see? (F12)
5. **Network tab**: What status codes do failed requests show? (F12 → Network)
6. **Backend logs**: What error messages do you see?
7. **Database**: Is MongoDB running and accessible?

Once you've verified all these items, your authentication should be working perfectly! 🚀
