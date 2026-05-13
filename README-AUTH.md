# Authentication Setup Guide

## Overview
This document provides complete setup and verification steps for JWT authentication in ProjectFlow.

---

## Backend Configuration

### 1. Environment Variables (.env)

Create a `.env` file in the `backend/` directory with:

```env
# Server Configuration
SERVER_PORT=9001
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/project_management
MONGODB_PATH=mongodb://localhost:27017/project_management

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 2. Required Dependencies

All dependencies are already in `package.json`. Ensure you have:
- `jsonwebtoken` - JWT signing and verification
- `bcryptjs` - Password hashing
- `cors` - CORS handling
- `express` - Web framework
- `mongoose` - MongoDB driver

Install with: `npm install`

### 3. How JWT Authentication Works (Backend)

#### Request Flow:
1. Client sends `Authorization: Bearer <token>` header
2. `authenticateToken` middleware extracts token from header
3. `jwt.verify()` validates token using `JWT_SECRET`
4. If valid, `req.user` is set with decoded token data
5. If invalid/expired, returns 401 or 403

#### Middleware Implementation:
```javascript
// From routes/index.js
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7)  // Remove "Bearer " prefix
        : null

    if (!token) {
        return res.status(401).json({ 
            message: 'Access token required',
            code: 'NO_TOKEN'
        })
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                })
            }
            return res.status(403).json({ 
                message: 'Invalid or malformed token',
                code: 'INVALID_TOKEN'
            })
        }
        req.user = user
        next()
    })
}
```

#### Protected Routes:
```javascript
// Public routes (no authentication required)
api.post('/auth/login',    validate(schemas.login),  login)
api.post('/auth/signup',   validate(schemas.signup), signup)
api.get('/projects',       getAllProjects)

// Protected routes (authentication required)
api.get('/auth/profile',   authenticateToken, getProfile)
api.post('/project',       authenticateToken, validate(schemas.project), createProject)
api.put('/project/:id',    authenticateToken, validate(schemas.projectUpdate), updateProject)
api.delete('/project/:id', authenticateToken, deleteProject)
```

---

## Frontend Configuration

### 1. Environment Variables (.env)

Create a `.env` file in the `frontend/` directory with:

```env
REACT_APP_API_URL=http://localhost:9001
```

### 2. API Instance Setup (src/api/axios.js)

This file provides:
- **Automatic token injection**: Attaches `Authorization: Bearer <token>` to all requests
- **Request interceptors**: Adds token from localStorage to every request
- **Response interceptors**: Handles 401/403 errors and logs out user on token expiration
- **Error handling**: Provides detailed error codes and messages

Key features:
```javascript
// Request Interceptor - Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response Interceptor - Handle auth failures
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !isAuthEndpoint) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            onAuthFailure(error)  // Trigger logout
        }
        return Promise.reject(error)
    }
)
```

### 3. Auth Context (src/contexts/AuthContext.js)

Manages:
- User authentication state
- Token storage in localStorage
- Login/logout operations
- Auth failure handling

Available methods:
```javascript
const { 
    isAuthenticated,      // boolean
    user,                 // { id, name, email, role }
    login,                // (userData, token) => void
    logout,               // () => void
    handleAuthFailure     // (error) => void
} = useAuth()
```

### 4. Components

#### Login (src/components/Login.js)
- Sends email/password to `/auth/login`
- Stores token and user in localStorage via `login()`
- Redirects to dashboard or admin based on role

#### Signup (src/components/Signup.js)
- Sends user data to `/auth/signup`
- Returns token automatically (no need to login again)
- Stores credentials and redirects

#### Header (src/components/Header.js)
- Displays logged-in user info
- Includes logout button
- Shows user role badge

---

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User submits email/password in Login component        │
│                    ↓                                       │
│  2. axios sends POST /auth/login with credentials         │
│                    ↓                                       │
│  3. Backend validates password with bcrypt.compare()      │
│                    ↓                                       │
│  4. Backend creates JWT token: jwt.sign({id, name, ...})  │
│                    ↓                                       │
│  5. Backend returns { user, token } to frontend           │
│                    ↓                                       │
│  6. Frontend stores token in localStorage                 │
│                    ↓                                       │
│  7. User navigated to dashboard/admin                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    API REQUEST FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Component calls: api.post('/projects', data)           │
│                    ↓                                       │
│  2. Request interceptor attaches token from localStorage   │
│     Headers: { Authorization: 'Bearer <token>' }           │
│                    ↓                                       │
│  3. Backend receives request with Authorization header     │
│                    ↓                                       │
│  4. authenticateToken middleware:                         │
│     - Extracts token from header                           │
│     - Calls jwt.verify(token, JWT_SECRET)                 │
│     - If valid: sets req.user and calls next()            │
│     - If expired: returns 401                              │
│     - If invalid: returns 403                              │
│                    ↓                                       │
│  5. Route handler processes request with req.user set      │
│                    ↓                                       │
│  6. Response sent to frontend                              │
│                    ↓                                       │
│  7. If 401/403: Response interceptor logs out user         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    TOKEN EXPIRATION FLOW                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User makes API request with expired token             │
│                    ↓                                       │
│  2. Backend jwt.verify() fails with TokenExpiredError      │
│                    ↓                                       │
│  3. Backend returns 401 with code: 'TOKEN_EXPIRED'        │
│                    ↓                                       │
│  4. Frontend response interceptor detects 401              │
│                    ↓                                       │
│  5. Clears localStorage (token, user)                      │
│                    ↓                                       │
│  6. Calls handleAuthFailure() from AuthContext             │
│                    ↓                                       │
│  7. Opens auth modal prompting to log in again             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Codes Reference

### Backend Status Codes

| Status | Code | Meaning |
|--------|------|---------|
| 401 | NO_TOKEN | Authorization header missing or malformed |
| 401 | TOKEN_EXPIRED | JWT token has expired |
| 403 | INVALID_TOKEN | JWT token is invalid or corrupted |
| 409 | - | Email already registered (signup) |
| 422 | VALIDATION_ERROR | Request body validation failed |

### Frontend Error Handling

The API interceptor provides these error codes:

```javascript
// Structured error object:
{
    message: 'Session expired. Please log in again.',
    code: 'AUTH_FAILED',      // 'AUTH_FAILED', 'FORBIDDEN', 'VALIDATION_ERROR', 'NETWORK_ERROR'
    response: { ... }         // Original Axios error response
}
```

---

## Testing Authentication

### 1. Test Login Flow

```bash
# Terminal 1: Start backend
cd backend
npm run serve

# Terminal 2: Start frontend
cd frontend
npm start
```

Then:
1. Navigate to http://localhost:3000/login
2. Enter credentials
3. Check browser DevTools:
   - Application > Local Storage: Should see `token` and `user`
   - Network tab: Authorization header should be `Bearer <token>`

### 2. Test Logout

1. Click "Logout" button in Header
2. Check Local Storage: `token` should be cleared
3. User should be redirected to login

### 3. Test Token Expiration

1. Login to get a token
2. Modify JWT_SECRET in backend .env
3. Restart backend
4. Make any API request
5. Should receive 403 and be logged out

### 4. Test Protected Route

```bash
# Without token (should fail)
curl http://localhost:9001/auth/profile

# With token (should succeed)
curl -H "Authorization: Bearer <token_here>" http://localhost:9001/auth/profile
```

---

## Security Best Practices

### ✅ Already Implemented

1. **Password Hashing**: Uses bcryptjs with salt rounds
2. **JWT Secret**: Stored in environment variables (not in code)
3. **Token Expiration**: Tokens expire in 24 hours
4. **CORS Protection**: Configured with specific origin
5. **Bearer Token Format**: Uses industry-standard Bearer scheme
6. **Secure localStorage**: Token stored client-side with automatic attachment

### 🔒 Additional Recommendations

1. **HTTPS in Production**
   ```env
   # In production, only send token over HTTPS
   CORS_ORIGIN=https://yourdomain.com
   ```

2. **HttpOnly Cookies** (Alternative to localStorage)
   ```javascript
   // More secure than localStorage but requires server-side cookie handling
   res.cookie('token', token, {
       httpOnly: true,
       secure: true,  // Only over HTTPS
       sameSite: 'strict'
   })
   ```

3. **Refresh Tokens**
   ```javascript
   // Implement separate refresh tokens for extended sessions
   const refreshToken = jwt.sign({...}, REFRESH_SECRET, { expiresIn: '7d' })
   ```

4. **Rate Limiting on Auth Endpoints**
   ```javascript
   // Already implemented with express-rate-limit
   // Limits to 100 requests per 15 minutes per IP
   ```

5. **Validation and Input Sanitization**
   ```javascript
   // Already using Joi for request validation
   // Prevents injection attacks
   ```

---

## Troubleshooting

### Issue: 403 Forbidden on API requests
**Solution**: Check Authorization header format
```javascript
// ❌ Wrong
Authorization: token_here

// ✅ Correct
Authorization: Bearer token_here
```

### Issue: localStorage.getItem('token') returns null
**Solution**: Check login response
- Ensure `/auth/login` returns `{ user, token }`
- Verify `login()` is called in component after successful response

### Issue: CORS error
**Solution**: Verify CORS_ORIGIN matches frontend URL
```env
# If frontend runs on http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### Issue: Token not attached to requests
**Solution**: Verify Axios interceptor
- Check that api instance is imported correctly
- Ensure token is in localStorage with exact key: `'token'`
- Check browser DevTools Network tab for Authorization header

### Issue: "Invalid token" after signup
**Solution**: Ensure JWT_SECRET is consistent
- Must be same value in backend for both signing and verifying
- Don't change JWT_SECRET unless you want to invalidate all existing tokens

---

## File Structure

```
project_menagment_system/
├── backend/
│   ├── .env                    # Environment variables (CREATE THIS)
│   ├── env.js                  # Loads .env
│   ├── server.js               # ✅ CORS configured
│   ├── routes/
│   │   └── index.js            # ✅ Auth middleware fixed
│   ├── controllers/
│   │   └── index.js            # Auth controllers
│   ├── models/
│   │   └── index.js            # User & Project models
│   └── package.json
│
├── frontend/
│   ├── .env                    # Environment variables (CREATE THIS)
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js        # ✅ NEW: Centralized API instance
│   │   │   └── index.js        # ✅ NEW: Exports from axios.js
│   │   ├── api.js              # ✅ Re-exports from api/axios.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js  # Auth state & handlers
│   │   ├── components/
│   │   │   ├── Login.js        # ✅ Verified working
│   │   │   ├── Signup.js       # ✅ Verified working
│   │   │   ├── Header.js       # ✅ Logout button added
│   │   │   └── AppLayout.js
│   │   └── App.js
│   └── package.json
│
└── README-AUTH.md              # This file
```

---

## Next Steps

1. **Copy .env.example to .env** and fill in your values
2. **Start backend**: `cd backend && npm run serve`
3. **Start frontend**: `cd frontend && npm start`
4. **Test the flow**: Login → Make API call → Logout
5. **Check browser console** for debug logs from interceptors
6. **Monitor Network tab** to verify Authorization header is sent

---

## Support

For issues:
1. Check browser DevTools Console for error messages
2. Check backend logs for detailed error info
3. Verify all environment variables are set
4. Ensure MongoDB is running and accessible
5. Check that both servers are running on correct ports

Good luck! 🚀
