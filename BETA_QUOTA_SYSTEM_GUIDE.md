# Beta Quota System - Complete Management Guide

## 📋 Overview

The Beta Quota System controls how many users can sign up for your Stefna AI photo transformation service. It's designed to limit access during your beta period to 45 users (40 + your 5 content accounts).

---

## 🎯 How It Works

### **User Flow:**
1. **Under 45 users:** New users can sign up normally via OTP
2. **At 45 users:** New signups are blocked with quota error message
3. **Existing users:** Can always login (not affected by quota)
4. **Waitlist:** Blocked users can join waitlist for next batch

### **Visual Indicators:**
- **Header button:** Shows "Login" when quota available, "Join Waitlist" when quota reached
- **Auth error:** "Beta quota reached. Please join our waitlist for the next batch"
- **Admin dashboard:** Shows current quota status and remaining slots

---

## 🛠️ Management Commands

### **Check Current Status**
```bash
node scripts/run-quota-migration.js
```
This will show:
- Current user count
- Quota limit
- Remaining slots
- System status

### **Set Production Quota (45 users)**
```bash
node scripts/set-production-quota.js
```
- Sets quota to 45 users
- Enables quota system
- Shows current status

### **Set Test Quota (10 users)**
```bash
node scripts/test-quota-system.js
```
- Sets quota to 10 users for testing
- Useful for testing quota behavior

### **Disable Quota System**
```bash
node scripts/disable-quota.js
```
- Disables quota completely
- Allows unlimited signups
- Use for full launch or emergencies

---

## 📊 Admin Dashboard Monitoring

### **Location:**
- Go to: `https://stefna.xyz/dashboard/management/control`
- Click: **User Management** tab
- Look for: **Beta Quota Status** section

### **What You'll See:**
- **Current Users/Quota Limit** (e.g., "4/45")
- **Slots Remaining** (e.g., "41")
- **System Status** (Active/Disabled)
- **Visual Alert** (red when quota reached)

---

## 🔧 Database Configuration

### **Configuration Table:**
The quota settings are stored in the `app_config` table:

```sql
-- Quota limit (default: 45)
app_config.key = 'beta_quota_limit'
app_config.value = '45'

-- Quota enabled/disabled (default: true)
app_config.key = 'beta_quota_enabled'
app_config.value = 'true'
```

### **Database Functions:**
- `get_quota_status()` - Returns current quota information
- `is_quota_reached()` - Returns true if quota limit reached
- `update_quota_settings()` - Updates quota configuration

---

## 🚀 Deployment Status

### **What's Deployed:**
✅ **Database migration** - Quota configuration tables and functions
✅ **API endpoints** - `/netlify/functions/check-quota`
✅ **Frontend integration** - Auth flow and admin dashboard
✅ **Management scripts** - All control scripts ready

### **What Needs Database Connection:**
- Quota status display in admin dashboard
- Quota checking during user signup
- Waitlist functionality

---

## 📈 Scaling Your Beta

### **Current Setup:**
- **Quota Limit:** 45 users
- **Your Accounts:** 5 (for content creation)
- **Available Slots:** 40 for beta users

### **To Increase Quota:**
1. **Edit the script:** Modify `scripts/set-production-quota.js`
2. **Change the number:** Update `productionQuota = 45` to your desired limit
3. **Run the script:** `node scripts/set-production-quota.js`

### **Example - Increase to 100 users:**
```javascript
// In scripts/set-production-quota.js
const productionQuota = 100; // Changed from 45
```

---

## 🔄 Launch Workflow

### **Phase 1: Beta Launch (Current)**
- Quota: 45 users
- Status: Active
- New signups: Blocked when quota reached

### **Phase 2: Next Batch**
- Increase quota to next batch size (e.g., 100 users)
- Run: `node scripts/set-production-quota.js` with new limit
- Notify waitlist users via admin dashboard

### **Phase 3: Full Launch**
- Disable quota system completely
- Run: `node scripts/disable-quota.js`
- Remove quota restrictions

---

## 🚨 Emergency Procedures

### **If Quota System Breaks:**
1. **Disable immediately:** `node scripts/disable-quota.js`
2. **Check database:** `node scripts/run-quota-migration.js`
3. **Restart if needed:** `node scripts/set-production-quota.js`

### **If Database Connection Fails:**
- Quota system will not work
- Users will see "Quota Status Not Loaded" error
- Fix database connection first, then quota will work

---

## 📱 User Experience

### **For New Users (Under Quota):**
1. Enter email → Get OTP → Sign up successfully
2. Header shows "Login" button
3. Full access to AI features

### **For New Users (Quota Reached):**
1. Enter email → "Beta quota reached" error
2. Click "Join Waitlist" → Enter email for next batch
3. Header shows "Join Waitlist" button

### **For Existing Users:**
- Always can login regardless of quota status
- No restrictions on their access

---

## 🔍 Troubleshooting

### **Quota Not Showing in Admin:**
- Check database connection
- Verify quota functions exist
- Check console for quota loading errors

### **Quota Not Blocking Signups:**
- Verify quota is enabled: `app_config.beta_quota_enabled = 'true'`
- Check quota limit: `app_config.beta_quota_limit`
- Verify user count vs limit

### **Database Connection Issues:**
- Quota system requires database connection
- Functions return HTML instead of JSON when database fails
- Fix database connection first

---

## 📞 Support

### **Quick Commands:**
```bash
# Check status
node scripts/run-quota-migration.js

# Set to 45 users
node scripts/set-production-quota.js

# Set to 10 users (testing)
node scripts/test-quota-system.js

# Disable completely
node scripts/disable-quota.js
```

### **Admin Dashboard:**
- URL: `https://stefna.xyz/dashboard/management/control`
- Tab: User Management
- Section: Beta Quota Status

---

## ✅ System Status

**Current Configuration:**
- ✅ Quota Limit: 45 users
- ✅ Quota Enabled: Yes
- ✅ Current Users: 4
- ✅ Remaining Slots: 41
- ✅ System Status: Active and Ready

**Your beta quota system is fully operational and ready for launch!** 🚀
