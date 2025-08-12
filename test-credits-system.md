# Test Credits System

## Setup
1. Run `deploy-credits-ledger.sql` in your Supabase SQL Editor
2. Deploy the updated functions to Netlify

## Test Steps

### 1. Check Initial Quota
- Call `/.netlify/functions/getQuota` 
- Should show `daily_used: 0, daily_limit: 50`

### 2. Generate an Image
- Upload an image and use any preset
- Check console logs for credit charging messages

### 3. Verify Credit Deduction
- Call `/.netlify/functions/getQuota` again
- Should show `daily_used: 1, daily_limit: 50`

### 4. Check Database
Run in Supabase SQL Editor:
```sql
select user_id, env, amount, reason, created_at
from credits_ledger
order by created_at desc
limit 10;
```

Should see a new row with:
- `amount: 1`
- `reason: 'i2i_generate'`
- `env: 'prod'` (or 'dev' if testing locally)

### 5. Test Idempotency
- Try the same generation again (should not charge twice)
- Check logs for "credits already charged" message

## Expected Results
- ✅ Credits are deducted after successful generation
- ✅ getQuota shows correct daily usage
- ✅ No double-charging on retries
- ✅ Environment detection works correctly
- ✅ Users can see their own credit history

## Troubleshooting
If credits aren't being charged:
1. Check Supabase logs for errors
2. Verify `credits_ledger` table exists
3. Check environment variables in Netlify
4. Ensure JWT contains valid user ID
