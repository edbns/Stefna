# Database Migration Steps for Stefna

## **Step 1: Run the Simple Test**
Execute this in **Supabase SQL Editor**:

```sql
-- Copy and paste the contents of database-simple-test.sql
```

**Expected Output:**
- Database connection successful
- List of existing tables
- Assets table status (likely "does not exist")
- Any existing media-related tables

## **Step 2: Run the Safe Migration**
After seeing the test results, execute this:

```sql
-- Copy and paste the contents of database-safe-assets-migration.sql
```

**What This Does:**
- Creates the `assets` table if it doesn't exist
- Adds all missing columns (including `prompt`)
- Sets up RLS policies and triggers
- Creates the `public_feed` view

## **Step 3: Verify the Migration**
The migration script will automatically show:
- "Migration completed successfully"
- Column count for the assets table
- Item count in the public feed

## **Step 4: Test the Feed**
1. Navigate to your Home page in the app
2. Check browser console for feed loading messages
3. Look for either feed items or "No public media found yet" message

## **Troubleshooting**

### **If You Get Syntax Errors:**
- Make sure you're copying the entire SQL content
- Don't include the filename or comments at the top
- Run one script at a time

### **If the Migration Fails:**
- Check the error message
- Make sure you have admin access to the database
- Try running the diagnostic test first

### **If the Feed Still Shows 0 Items:**
- Check browser console for error messages
- Verify the `public_feed` view was created
- Run: `SELECT count(*) FROM public.public_feed;`

## **Expected Final State**

After successful migration:
- ✅ `assets` table exists with all required columns
- ✅ `public_feed` view exists and is accessible
- ✅ RLS policies are in place
- ✅ Triggers are working
- ✅ Feed can load (even if empty initially)

## **Quick Verification Commands**

```sql
-- Check if assets table exists
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets');

-- Check table structure
SELECT column_name FROM information_schema.columns WHERE table_name = 'assets';

-- Check if public_feed view exists
SELECT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'public_feed');

-- Test the view
SELECT * FROM public.public_feed LIMIT 5;
```
