# JWT Authentication Setup

## Required Environment Variables

### Netlify Functions
Set these in Netlify Dashboard → Site Settings → Environment Variables:

```
JWT_SECRET=your_secret_key_here
```

**CRITICAL:** This must match the secret used to sign JWTs in your frontend auth service.

### Frontend (.env)
```
VITE_JWT_SECRET=your_secret_key_here  # If needed for client-side verification
```

## Testing JWT Authentication

### 1. Check Token in Browser
```javascript
// In browser console
console.log('Token:', localStorage.getItem('auth_token'));
```

### 2. Verify Token Structure
```javascript
// JWT should have 3 parts: header.payload.signature
const token = localStorage.getItem('auth_token');
const parts = token?.split('.');
console.log('JWT parts:', parts?.length); // Should be 3
```

### 3. Decode Payload (for debugging)
```javascript
const token = localStorage.getItem('auth_token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('JWT payload:', payload);
  console.log('User ID (sub):', payload.sub);
  console.log('Expires:', new Date(payload.exp * 1000));
}
```

## Common Issues

### 401 Errors
- Check JWT_SECRET matches between frontend and Netlify
- Verify token exists in localStorage
- Check token hasn't expired
- Ensure Authorization header is sent

### 500 Errors
- Usually means JWT verification threw an exception
- Check Netlify function logs for specific error
- Verify JWT_SECRET is set in Netlify environment

## Debugging Steps

1. **Check browser network tab** for Authorization header
2. **Check Netlify function logs** for auth success/failure messages
3. **Verify JWT_SECRET** is deployed to Netlify
4. **Test token manually** using jwt.io to decode
