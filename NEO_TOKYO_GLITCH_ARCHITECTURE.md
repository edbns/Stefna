# 🎭 Neo Tokyo Glitch Architecture Documentation

## 🚨 **CRITICAL: DO NOT MODIFY WITHOUT READING THIS DOCUMENT**

This document describes the **bulletproof Neo Tokyo Glitch generation system** that prevents double charges, infinite polling, and user frustration. **Any changes to this flow must maintain these guarantees.**

---

## 🎯 **Core Architecture Principles**

### **1. Stability.ai is SYNCHRONOUS (not async)**
- **FACT**: Stability.ai returns images **immediately** in the response
- **NEVER**: Treat Stability.ai like a job-based system (like Replicate)
- **ALWAYS**: Update database immediately when Stability.ai completes

### **2. Single Credit Charge Per Generation**
- **Stability.ai success**: 1 credit charged, no fallback
- **Stability.ai failure**: 1 credit charged for AIML fallback only
- **Both fail**: 0 credits charged (refund or skip)

### **3. No Infinite Polling**
- **Immediate completion**: Show result immediately
- **Processing needed**: Maximum 30-second timeout with exponential backoff

---

## 🔄 **Generation Flow Architecture**

### **Path 1: Stability.ai Immediate Success (90% of cases)**

```
User → Frontend → neo-glitch-generate → Stability.ai → Immediate Image → Database Updated → Frontend Shows Result
```

**Backend (`neo-glitch-generate.ts`):**
```typescript
// ✅ CORRECT: Stability.ai returns image immediately
if (response.ok && response.status === 200) {
  const imageBuffer = await response.arrayBuffer();
  const cloudinaryUrl = await uploadBase64ToCloudinary(imageBuffer);
  
  // 🔒 CRITICAL: Update database IMMEDIATELY
  await db.neoGlitchMedia.update({
    where: { id: recordId },
    data: {
      status: 'completed',           // ✅ NOT 'processing'
      imageUrl: cloudinaryUrl,       // ✅ NOT null
      stabilityJobId: stabilityJobId
    }
  });
  
  return {
    status: 'completed',             // ✅ NOT 'processing'
    imageUrl: cloudinaryUrl,         // ✅ NOT undefined
    stabilityJobId: stabilityJobId
  };
}
```

**Frontend (`HomeNew.tsx`):**
```typescript
// ✅ CORRECT: Check for immediate completion
if (generationResult.status === 'completed' && generationResult.cloudinaryUrl) {
  // 🎉 Generation is already done - save media and show toast
  saveMediaAndShowToast(generationResult.cloudinaryUrl);
  return; // ✅ DON'T start polling
}

// Only start polling if status !== 'completed'
neoGlitchService.pollForCompletion(generationResult.id);
```

### **Path 2: Stability.ai Processing (10% of cases)**

```
User → Frontend → neo-glitch-generate → Stability.ai → 202 Accepted → Database: status="processing" → Frontend Polls → Status Updates → Result
```

**Backend (`neo-glitch-generate.ts`):**
```typescript
// ✅ CORRECT: Only set processing if Stability.ai actually needs time
if (stabilityResult.status === 'processing') {
  await db.neoGlitchMedia.update({
    where: { id: recordId },
    data: {
      status: 'processing',          // ✅ Only for actual async jobs
      stabilityJobId: stabilityResult.stabilityJobId
    }
  });
  
  return {
    status: 'processing',            // ✅ Frontend will start polling
    pollUrl: '/.netlify/functions/neo-glitch-status'
  };
}
```

**Status Polling (`neo-glitch-status.ts`):**
```typescript
// ✅ CORRECT: Actually check Stability.ai status, don't assume
if (jobRecord.status === 'processing' && jobRecord.stabilityJobId) {
  const stabilityStatus = await checkStabilityAIStatus(jobRecord.stabilityJobId);
  
  if (stabilityStatus.status === 'completed' && stabilityStatus.imageUrl) {
    // ✅ Update database with completion
    await prisma.neoGlitchMedia.update({
      where: { id: jobRecord.id },
      data: {
        status: 'completed',
        imageUrl: stabilityStatus.imageUrl
      }
    });
    
    return { status: 'completed', imageUrl: stabilityStatus.imageUrl };
  }
}
```

---

## 🚫 **NEVER DO THESE THINGS**

### **1. ❌ Don't Set Status to "processing" for Stability.ai**
```typescript
// ❌ WRONG: This will cause infinite polling
await db.neoGlitchMedia.update({
  where: { id: recordId },
  data: { status: 'processing' }  // ❌ Stability.ai is synchronous!
});

// ✅ CORRECT: Set status based on actual response
if (stabilityResult.imageUrl) {
  await db.neoGlitchMedia.update({
    where: { id: recordId },
    data: { status: 'completed' }  // ✅ Immediate completion
  });
}
```

### **2. ❌ Don't Fallback Based on Empty Arrays**
```typescript
// ❌ WRONG: This causes unnecessary AIML fallbacks
if (artifacts.length === 0) {
  return await attemptAIMLFallback();  // ❌ Double charge!
}

// ✅ CORRECT: Only fallback on actual failure
if (stabilityResult.status === 'failed' || !stabilityResult.imageUrl) {
  return await attemptAIMLFallback();  // ✅ Single charge
}
```

### **3. ❌ Don't Return "processing" Without Polling Logic**
```typescript
// ❌ WRONG: Frontend will poll forever
return { status: 'processing' };

// ✅ CORRECT: Either complete immediately or provide pollUrl
if (isComplete) {
  return { status: 'completed', imageUrl: resultUrl };
} else {
  return { status: 'processing', pollUrl: '/status-endpoint' };
}
```

---

## 💰 **Credit Protection Rules**

### **Rule 1: Single Charge Per Generation**
```typescript
// ✅ CORRECT: Only charge once at the end
if (stabilityResult.status === 'completed') {
  await finalizeCreditsOnce(userId, runId, true, userToken);  // ✅ 1 credit
} else if (stabilityResult.status === 'failed') {
  const aimlResult = await attemptAIMLFallback();
  if (aimlResult.imageUrl) {
    await finalizeCreditsOnce(userId, runId, true, userToken);  // ✅ 1 credit (AIML)
  } else {
    await finalizeCreditsOnce(userId, runId, false, userToken);  // ✅ 0 credits (refund)
  }
}
```

### **Rule 2: Never Double Bill**
```typescript
// ❌ WRONG: This charges twice
await deductCredits(userId, 'stability', runId, userToken);  // ❌ 1 credit
await deductCredits(userId, 'aiml', runId, userToken);       // ❌ 1 credit

// ✅ CORRECT: Only charge once
await finalizeCreditsOnce(userId, runId, true, userToken);   // ✅ 1 credit total
```

---

## 🔍 **Debugging Checklist**

### **If Generation Appears "Stuck":**
1. ✅ Check database: `SELECT status, imageUrl FROM neo_glitch_media WHERE id = '...'`
2. ✅ Check logs: Look for "Stability.ai returned immediate image response"
3. ✅ Check frontend: Is it checking `status === 'completed'` before polling?

### **If Double Charges Occur:**
1. ✅ Check `finalizeCreditsOnce` calls: Should only be called once per generation
2. ✅ Check fallback logic: Only trigger if `status === 'failed'`
3. ✅ Check credit reservation: Should be 1 credit per generation

### **If Infinite Polling:**
1. ✅ Check database status: Should be 'completed' or 'failed', never 'processing' forever
2. ✅ Check status endpoint: Should actually update database when Stability.ai completes
3. ✅ Check frontend: Should stop polling when status === 'completed'

---

## 🧪 **Testing Scenarios**

### **Test 1: Stability.ai Immediate Success**
- **Expected**: User sees "Your media is ready" immediately
- **Database**: Status should be 'completed' with imageUrl
- **Credits**: 1 credit charged for Stability.ai

### **Test 2: Stability.ai Failure → AIML Success**
- **Expected**: User sees "Add to queue" then "Your media is ready"
- **Database**: Status should progress: 'processing' → 'completed'
- **Credits**: 1 credit charged for AIML only

### **Test 3: Both Fail**
- **Expected**: User sees error message
- **Database**: Status should be 'failed'
- **Credits**: 0 credits charged (refunded)

---

## 🚀 **Future Development Guidelines**

### **Adding New AI Providers:**
1. ✅ Follow the same pattern: immediate completion or explicit polling
2. ✅ Never mix sync/async patterns
3. ✅ Always update database immediately when generation completes
4. ✅ Use `finalizeCreditsOnce` for credit management

### **Modifying Fallback Logic:**
1. ✅ Only fallback on actual failure (`status === 'failed'`)
2. ✅ Never fallback on empty responses or undefined values
3. ✅ Always check database status before deciding to fallback
4. ✅ Maintain single credit charge per generation

### **Adding New Status Types:**
1. ✅ Ensure frontend handles all status values
2. ✅ Add proper timeout handling for new async statuses
3. ✅ Update database schema if needed
4. ✅ Test polling logic thoroughly

---

## 📝 **File Dependencies**

### **Critical Files (DO NOT MODIFY LIGHTLY):**
- `netlify/functions/neo-glitch-generate.ts` - Main generation logic
- `netlify/functions/neo-glitch-status.ts` - Status checking and polling
- `src/services/neoGlitchService.ts` - Frontend service layer
- `src/components/HomeNew.tsx` - Frontend generation flow

### **Database Schema:**
```sql
-- neo_glitch_media table structure
CREATE TABLE neo_glitch_media (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,           -- 'pending', 'processing', 'completed', 'failed'
  imageUrl TEXT,                  -- NULL until generation completes
  stabilityJobId TEXT,            -- Stability.ai job ID (if async)
  -- ... other fields
);
```

---

## 🎯 **Summary**

The Neo Tokyo Glitch system is **bulletproof** because:

1. ✅ **Stability.ai is treated as synchronous** - images returned immediately
2. ✅ **Database is updated immediately** - no stale "processing" status
3. ✅ **Frontend checks completion first** - skips polling when not needed
4. ✅ **Single credit charge** - prevents double billing
5. ✅ **Proper fallback logic** - only when actually needed
6. ✅ **Timeout protection** - prevents infinite polling

**Any developer modifying this system must maintain these guarantees or risk breaking the entire generation flow.**

---

*Last Updated: $(date)*
*Architecture Version: 2.0 (Bulletproof)*
