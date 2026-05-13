# Quick Setup Guide - JWT Authentication Fix

## ✅ What Was Changed

### Backend Files Modified

1. **server.js** - CORS Configuration
   - Changed from `app.use(cors())` to proper CORS with credentials and allowed headers
   - Added specific origin, methods, and allowedHeaders configuration

2. **routes/index.js** - Auth Middleware Enhancement
   - Improved Bearer token extraction (now handles "Bearer " prefix correctly)
   - Better error codes: NO_TOKEN, TOKEN_EXPIRED, INVALID_TOKEN
   - Added support for TokenExpiredError detection
   - Protected getTaskById route (was public)

### Frontend Files Modified

1. **src/api/axios.js** (NEW) - Centralized API Instance
   - Created dedicated file for Axios configuration
   - Request interceptor: Automatically attaches "Bearer {token}" to all requests
   - Response interceptor: Handles 401/403 errors with proper cleanup
   - Debug logging for troubleshooting
   - Timeout configuration (10s)

2. **src/api/index.js** (NEW) - API Module Export
   - Exports centralized api instance
   - Exports setAuthFailureHandler function

3. **src/api.js** - Updated to Re-export
   - Now imports and re-exports from src/api/axios.js
   - Maintains backward compatibility with existing imports

4. **src/components/Header.js** - Added Logout Feature
   - Displays logged-in user name and role
   - Added red "Logout" button
   - Shows user information in header
   - Handles logout with toast notification and redirect

### New Configuration Files

1. **backend/.env.example** - Backend environment template
   - SERVER_PORT=9001
   - JWT_SECRET (with generation instructions)
   - MONGODB_URI or MONGODB_PATH
   - CORS_ORIGIN=http://localhost:3000

2. **frontend/.env.example** - Frontend environment template
   - REACT_APP_API_URL=http://localhost:9001

3. **README-AUTH.md** - Comprehensive authentication guide
   - Complete setup instructions
   - Flow diagrams
   - Error code reference
   - Testing procedures
   - Security best practices
   - Troubleshooting guide

---

## 🚀 Quick Start

### Step 1: Create Environment Files

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env and set:
# - JWT_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - MONGODB_URI or MONGODB_PATH
# - CORS_ORIGIN=http://localhost:3000
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# No changes needed if running on default ports
```

### Step 2: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run serve
# Should show: Server running at http://localhost:9001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm start
# Should open http://localhost:3000
```

### Step 3: Test Authentication Flow

1. Go to http://localhost:3000/login
2. Sign up or login with credentials
3. Verify token is stored:
   - Open DevTools (F12)
   - Go to Application > Local Storage > http://localhost:3000
   - Should see: `token` and `user` keys

4. Check API requests include token:
   - Open DevTools Network tab
   - Make any API call (create project, etc.)
   - Click on request
   - Look for `Authorization: Bearer <token>` in request headers

5. Test logout:
   - Click "Logout" button in header
   - Should be redirected to login page
   - localStorage should be cleared

---

## 📋 Files Changed Summary

### Backend
```
backend/
├── .env.example (NEW)
├── server.js (MODIFIED - CORS config)
└── routes/index.js (MODIFIED - Auth middleware)
```

### Frontend
```
frontend/
├── .env.example (NEW)
└── src/
    ├── api.js (MODIFIED - Re-export from api/axios.js)
    ├── api/ (NEW DIRECTORY)
    │   ├── axios.js (NEW - Centralized API instance)
    │   └── index.js (NEW - Module export)
    └── components/
        └── Header.js (MODIFIED - Added logout button)
```

### Root
```
└── README-AUTH.md (NEW - Complete authentication guide)
```

---

## 🔍 How It Works Now

### Authentication Flow
```
1. User logs in → api.post('/auth/login')
2. Backend verifies password and returns { user, token }
3. Frontend stores token in localStorage
4. Frontend redirects based on user role

5. User makes API request → api.post('/project')
6. Request interceptor adds: Authorization: Bearer <token>
7. Backend middleware verifies token with jwt.verify()
8. If valid: executes route handler
9. If invalid/expired: returns 401/403
10. Response interceptor logs out user and shows login modal
```

### Token Injection
```
Every API request automatically includes:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Error Handling
```
- 401: Token missing or expired → Log out and show login
- 403: Token invalid → Log out and show login
- 422: Validation error → Show error details
- Network error → Show connection error
```

---

## ⚙️ Environment Variables You MUST Set

### Backend (.env)
```env
JWT_SECRET=your_random_secret_here
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:3000
SERVER_PORT=9001
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:9001
```

---

## ✨ Key Improvements

✅ **Centralized API Configuration** - Single source of truth for all API calls
✅ **Automatic Token Injection** - No need to manually add token to each request
✅ **Better Error Handling** - Structured error codes and messages
✅ **Debug Logging** - Console logs for troubleshooting
✅ **Logout Functionality** - Clear UI button in header
✅ **CORS Fixed** - Properly configured instead of wildcard
✅ **Improved Middleware** - Better token extraction and error codes
✅ **TypeScript Ready** - All error codes are well-defined

---

## 🆘 Common Issues

### Issue: 403 Forbidden
**Fix**: Check Authorization header format in Network tab
- Should be: `Authorization: Bearer <token>`
- NOT just: `Authorization: <token>`

### Issue: Token not in localStorage
**Fix**: Ensure login response includes token
```javascript
// Backend response should be:
{ user: {...}, token: "jwt_token_here" }
```

### Issue: CORS errors
**Fix**: Verify CORS_ORIGIN in .env matches frontend URL
```env
CORS_ORIGIN=http://localhost:3000  # Exact match required
```

### Issue: "Invalid token" after code change
**Fix**: JWT_SECRET must be same for both encoding and decoding
- Don't change JWT_SECRET unless you want all tokens to be invalid

---

## 📚 Documentation

Full detailed guide available in: **README-AUTH.md**

Includes:
- Complete setup instructions
- Architecture diagrams
- Security best practices
- Testing procedures
- Troubleshooting guide
- Code examples

---

## 🎯 Next Steps

1. ✅ Create .env files with your values
2. ✅ Restart backend: `npm run serve`
3. ✅ Restart frontend: `npm start`
4. ✅ Test login flow
5. ✅ Test API requests (check Authorization header)
6. ✅ Test logout
7. ✅ Test token expiration (change JWT_SECRET and restart)

That's it! Your authentication is now properly configured. 🚀
