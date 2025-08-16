# Database Stability Guide 🗄️

## **Why This Guide Exists**

Your database suffered from "many cooks" syndrome - multiple developers making changes without a single source of truth. This guide prevents that from happening again.

## **🏗️ Architecture Principles**

### **1. Single Source of Truth**
- **Prisma Schema** is the ONLY source of truth
- **NO raw SQL** in PRs or deployments
- **NO manual table creation** outside of migrations

### **2. Bulletproof Ownership**
- **Every media item MUST have an owner** (no nullable owner_id bugs)
- **JWT tokens are verified server-side** (never trust client)
- **Cascade deletes** ensure data consistency

### **3. Migration-Based Changes**
- **All schema changes** go through Prisma migrations
- **Version controlled** migrations prevent drift
- **Rollback capability** for failed deployments

## **🚀 Quick Start**

### **Initial Setup**
```bash
# 1. Install dependencies
npm install

# 2. Set up database (after connecting to Neon)
npx prisma migrate dev --name init

# 3. Generate Prisma client
npx prisma generate

# 4. Test connection
npm run db:test
```

### **Daily Development**
```bash
# Make schema changes
# Edit prisma/schema.prisma

# Create migration
npx prisma migrate dev --name descriptive_name

# Generate client
npx prisma generate

# Deploy
git add . && git commit -m "Add new feature" && git push
```

## **🔒 Security & Ownership**

### **User Authentication**
```typescript
// In your Netlify functions
function requireUser(context) {
  const u = context.clientContext?.user;
  if (!u?.sub) throw new Error('Unauthorized');
  return { id: u.sub, email: u.email };
}

// Always derive user from context, never trust client
const user = requireUser(context);
```

### **Media Ownership**
```typescript
// Every media item MUST have an owner
const media = await prisma.media.create({
  data: {
    ownerId: user.id, // Always required
    url: 'https://...', // Always HTTPS
    // ... other fields
  }
});
```

## **📋 Migration Checklist**

### **Before Committing Schema Changes**
- [ ] Schema changes are in `prisma/schema.prisma`
- [ ] Migration file is created with `npx prisma migrate dev`
- [ ] Prisma client is regenerated with `npx prisma generate`
- [ ] Tests pass locally
- [ ] No raw SQL files in commit

### **Before Deploying**
- [ ] All migrations are committed
- [ ] Prisma client is up to date
- [ ] Database connection string is correct
- [ ] Backup of production data (if needed)

## **🚨 Anti-Patterns (Never Do These)**

### **❌ Raw SQL in Functions**
```typescript
// DON'T DO THIS
const result = await sql`CREATE TABLE users (...)`; // ❌

// DO THIS INSTEAD
// Edit prisma/schema.prisma and run migration
```

### **❌ Manual Table Creation**
```typescript
// DON'T DO THIS
await sql`CREATE TABLE IF NOT EXISTS users (...)`; // ❌

// DO THIS INSTEAD
// Use Prisma migrations
```

### **❌ Nullable Owner IDs**
```typescript
// DON'T DO THIS
ownerId: String? // ❌ Nullable owner

// DO THIS INSTEAD
ownerId: String // ✅ Always required
```

## **🔍 Monitoring & Debugging**

### **Check for Schema Drift**
```bash
# Compare schema with database
npx prisma db pull

# Check migration status
npx prisma migrate status

# Reset if needed (DANGEROUS - destroys data)
npx prisma migrate reset
```

### **Common Issues**
1. **"Table doesn't exist"** → Run migrations
2. **"Column not found"** → Check schema vs database
3. **"Foreign key constraint"** → Verify relationships in schema

## **📚 Resources**

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Neon Database](https://neon.tech/docs)

## **🆘 Emergency Procedures**

### **Schema Drift Detected**
1. **STOP** all deployments
2. **Backup** current database
3. **Reset** to last known good migration
4. **Investigate** what caused the drift
5. **Fix** the root cause
6. **Resume** normal operations

### **Data Loss Prevention**
- **Always backup** before major schema changes
- **Test migrations** on staging first
- **Use transactions** for complex operations
- **Monitor** deployment logs

---

**Remember: Your database is the foundation of your app. Keep it stable, clean, and well-documented.** 🎯
