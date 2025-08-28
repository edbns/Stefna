# 🚀 Prisma "No Drama Mama" System

## 🎯 Overview

This system prevents Prisma schema mismatches and field validation errors by implementing a systematic approach to schema management.

## 📋 The 5-Step Prisma Stability Routine

### 1. Single Source of Truth = `schema.prisma`
- **Never guess fields** in your backend code
- **Always trust** `schema.prisma` as the law
- **Update this file first** before any code changes

### 2. Use IntelliSense Instead of Hardcoding
```typescript
// ❌ DON'T DO THIS (risky)
select: {
  id: true,
  userId: true,
  preset: true, // ← risky if renamed
}

// ✅ DO THIS (safe with autocomplete)
import { Prisma } from '@prisma/client';

const mediaSelect: Prisma.CustomPromptMediaSelect = {
  id: true,
  userId: true,
  presetKey: true, // autocomplete + safe
};

await prisma.customPromptMedia.findMany({
  where: { status: 'completed' },
  select: mediaSelect
});
```

### 3. After Every Schema Update, Run This Chain
```bash
npx prisma format         # cleans and formats schema
npx prisma generate       # sync types
npx prisma validate       # confirms schema is OK
npx prisma db push        # sync with database
```

### 4. Run Safety Checks
```bash
# Test all fields locally
ts-node scripts/checkFields.ts

# Scan for potential field issues
ts-node scripts/fieldGuard.ts
```

### 5. Maintain Field Change Log
- **Always update** `prisma/schema-fields.md`
- **Document** what changed and when
- **Track** field renames and removals

## 🛠️ Available Scripts

### `scripts/checkFields.ts`
- **Purpose**: Validates all field names exist in current schema
- **Usage**: `ts-node scripts/checkFields.ts`
- **When**: After schema changes, before deployment

### `scripts/fieldGuard.ts`
- **Purpose**: Scans codebase for potentially invalid field names
- **Usage**: `ts-node scripts/fieldGuard.ts`
- **When**: Before commits, after schema changes

## 📊 Field Change Log

See `prisma/schema-fields.md` for complete history of:
- ❌ Removed fields
- ✅ Added fields  
- 🔄 Field type changes
- 📊 Index updates

## 🚨 Emergency Procedures

### If You Get Field Validation Errors:
1. **Check the error message** - it tells you exactly what's wrong
2. **Update schema.prisma** with the missing field
3. **Run the update chain**: `format → generate → validate → push`
4. **Test locally** with `ts-node scripts/checkFields.ts`
5. **Only deploy** after local tests pass

### If Database Schema Drifts:
1. **Pull current DB structure**: `npx prisma db pull`
2. **Compare** with your `schema.prisma`
3. **Reconcile differences** in schema file
4. **Push changes**: `npx prisma db push`
5. **Regenerate client**: `npx prisma generate`

## 💡 Best Practices

### Code Organization
- **Use typed selects** with `Prisma.ModelSelect`
- **Avoid hardcoded strings** for field names
- **Import Prisma types** for compile-time safety

### Schema Management
- **One change at a time** - don't batch multiple field changes
- **Test immediately** after each change
- **Document everything** in the field log
- **Use descriptive field names** that won't conflict

### Deployment Safety
- **Never deploy** without running safety checks
- **Test locally** with real database queries
- **Have rollback plan** if issues arise
- **Monitor logs** after deployment

## 🔍 Troubleshooting

### Common Issues

#### "Unknown field X for select statement"
- **Cause**: Field doesn't exist in current schema
- **Fix**: Add field to `schema.prisma` and regenerate

#### "Column X does not exist in current database"
- **Cause**: Database schema drifted from Prisma schema
- **Fix**: Run `npx prisma db push` to sync

#### "PrismaClientValidationError"
- **Cause**: Using old field names in code
- **Fix**: Update code to use new field names

### Debug Commands
```bash
# Check current database structure
npx prisma db pull

# Validate schema syntax
npx prisma validate

# Generate fresh client
npx prisma generate

# Reset database (⚠️ DESTRUCTIVE)
npx prisma db push --force-reset
```

## 🎉 Success Metrics

You're using the system correctly when:
- ✅ **No field validation errors** in production
- ✅ **Feed loads** without Prisma crashes
- ✅ **Generation functions** work end-to-end
- ✅ **Schema changes** are predictable and safe
- ✅ **Field issues** are caught locally before deploy

## 📞 Support

If you encounter issues:
1. **Check the field log** first
2. **Run safety scripts** to identify problems
3. **Compare schema** with database structure
4. **Test locally** before asking for help

---

**Remember: Prisma drama is preventable with systematic approach! 🚀**
