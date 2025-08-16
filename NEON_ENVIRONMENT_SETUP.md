# 🚀 Neon Environment Setup Guide

## 📋 **Required Environment Variables**

### **1. Neon Database Configuration**
```bash
# Production/Deploy Preview
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.neon.tech/neondb?sslmode=require"

# Alternative (Netlify specific)
NETLIFY_DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.neon.tech/neondb?sslmode=require"
```

**Important Notes:**
- Use the **pooler host** (not direct connection)
- Include `?sslmode=require` for serverless functions
- Replace `USER`, `PASSWORD`, and `ep-xxx` with your actual Neon credentials

### **2. AIML API Configuration**
```bash
AIML_API_KEY="your-actual-aiml-api-key"
AIML_API_BASE="https://api.aimlapi.com"
```

### **3. JWT Authentication**
```bash
AUTH_JWT_SECRET="your-secure-jwt-secret-key"
# Alternative
JWT_SECRET="your-secure-jwt-secret-key"
```

## 🔧 **Netlify Environment Setup**

### **Method 1: Netlify Dashboard (Recommended)**
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add each variable with the exact names above
4. Set the appropriate context (Production, Deploy preview, Branch deploy)

### **Method 2: netlify.toml (Template)**
```toml
[context.production.environment]
  DATABASE_URL = "postgresql://USER:PASSWORD@ep-xxx-pooler.neon.tech/neondb?sslmode=require"
  AIML_API_KEY = "your-aiml-api-key-here"
  AIML_API_BASE = "https://api.aimlapi.com"
  AUTH_JWT_SECRET = "your-jwt-secret-here"

[context.deploy-preview.environment]
  DATABASE_URL = "postgresql://USER:PASSWORD@ep-xxx-pooler.neon.tech/neondb?sslmode=require"
  AIML_API_KEY = "your-aiml-api-key-here"
  AIML_API_BASE = "https://api.aimlapi.com"
  AUTH_JWT_SECRET = "your-jwt-secret-here"
```

**⚠️ Security Warning:** Never commit real credentials to git!

## 🧪 **Testing Environment Configuration**

### **1. Use the env-dump function**
```bash
curl https://your-site.netlify.app/.netlify/functions/env-dump
```

**Expected Output:**
```json
{
  "context": "production",
  "summary": {
    "neon_ready": true,
    "aiml_ready": true,
    "auth_ready": true,
    "supabase_removed": true
  }
}
```

### **2. Check for Missing Variables**
If any are `false`, check your environment variables in Netlify.

## 🗄️ **Database Schema Migration**

### **1. Run the Neon Schema Migration**
```bash
# Connect to your Neon database and run:
psql "postgresql://USER:PASSWORD@ep-xxx-pooler.neon.tech/neondb?sslmode=require" -f database-neon-schema-migration.sql
```

### **2. Verify Schema**
The migration script will show you the current table structure and highlight any issues.

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **1. "Missing DATABASE_URL" Error**
- Check if `DATABASE_URL` or `NETLIFY_DATABASE_URL` is set
- Ensure you're using the pooler host, not direct connection
- Verify `sslmode=require` is included

#### **2. "JWT secret not configured" Error**
- Set `AUTH_JWT_SECRET` or `JWT_SECRET` environment variable
- Use a strong, random secret key

#### **3. "AIML API key missing" Error**
- Set `AIML_API_KEY` and `AIML_API_BASE` environment variables
- Verify the API key is valid

#### **4. Database Connection Issues**
- Ensure you're using the pooler host (`ep-xxx-pooler.neon.tech`)
- Check if your Neon database is active
- Verify the connection string format

### **Debug Commands:**
```bash
# Test database connection
curl https://your-site.netlify.app/.netlify/functions/test-db-schema

# Check environment
curl https://your-site.netlify.app/.netlify/functions/env-dump

# Test AIML API
curl -X POST https://your-site.netlify.app/.netlify/functions/aimlApi \
  -H "Content-Type: application/json" \
  -d '{"ping": true}'
```

## ✅ **Verification Checklist**

- [ ] `DATABASE_URL` points to Neon pooler host
- [ ] `AIML_API_KEY` is set and valid
- [ ] `AIML_API_BASE` is set to correct endpoint
- [ ] `AUTH_JWT_SECRET` is set and secure
- [ ] Database schema migration completed
- [ ] `env-dump` shows all green checkmarks
- [ ] No Supabase environment variables remain
- [ ] Functions deploy without errors

## 🚀 **Next Steps**

1. **Set environment variables** in Netlify dashboard
2. **Run database migration** on your Neon database
3. **Deploy and test** the functions
4. **Verify MoodMorph** works end-to-end
5. **Check error logs** for any remaining issues

---

**Need Help?** Check the function logs in Netlify dashboard for detailed error messages.
