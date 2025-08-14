# 🧪 Smoke Test Checklist - Pipeline Hardening

## Manual Testing for Edge Cases and Weird User Behavior

### ✅ **Double-Click Spam Protection**

**Test**: Double-click spam on any card/button
- [ ] Click preset button rapidly 5+ times
- [ ] Click Time Machine option rapidly 5+ times  
- [ ] Click Story Mode button rapidly 5+ times
- **Expected**: Exactly 1 request fires; UI never stays busy
- **Check logs**: Should see "Duplicate operation prevented" warnings
- **Check network**: Only 1 API call in DevTools Network tab

### ✅ **Navigation Cleanup**

**Test**: Navigate away mid-upload
- [ ] Start file upload (large file recommended)
- [ ] Navigate to different route before upload completes
- [ ] Check browser console for errors
- **Expected**: No setState warnings; busy state clears automatically
- **Check logs**: Should see "Route change - aborting active runs"
- **Check**: No memory leaks or hanging promises

### ✅ **Authentication Edge Cases**

**Test**: Kill token mid-run (force 401)
- [ ] Start generation process
- [ ] Open DevTools → Application → Local Storage
- [ ] Delete auth token during generation
- [ ] Let generation attempt to complete
- **Expected**: Auth wrapper retries once, then shows clean error
- **Check logs**: Should see "Auth token expired, attempting refresh"
- **Check UI**: Clean error message, not stuck in loading state

### ✅ **Network Resilience**

**Test**: Unplug network between upload and API call
- [ ] Start generation with file upload
- [ ] Disconnect network after upload starts but before API call
- [ ] Wait for timeout
- **Expected**: aimlApi never called; UI recovers gracefully
- **Check logs**: Should see "Operation requires network connection"
- **Check UI**: Shows offline message, not stuck loading

### ✅ **Mapping Validation**

**Test**: Story/Time Machine with 0 valid presets
- [ ] Temporarily break preset mappings (comment out presets)
- [ ] Try to access Story Mode
- [ ] Try to access Time Machine options
- **Expected**: Buttons disabled, toast shows once (not spam)
- **Check logs**: Should see "Missing preset mappings" warnings
- **Check UI**: Options are visually disabled/grayed out

### ✅ **Memory Leak Prevention**

**Test**: Long session with many operations
- [ ] Perform 20+ generations in a row
- [ ] Switch between modes frequently
- [ ] Leave tab open for 30+ minutes
- **Expected**: No memory growth, no performance degradation
- **Check**: DevTools → Performance → Memory tab
- **Check logs**: Should see periodic "Cleaned up stale runs"

### ✅ **Error Recovery**

**Test**: Various error scenarios
- [ ] Invalid file type upload
- [ ] Corrupted image file
- [ ] Server returns 500 error
- [ ] Network timeout during API call
- **Expected**: Clean error messages, UI always recovers
- **Check**: No stuck loading states, buttons re-enabled

### ✅ **Toast Deduplication**

**Test**: Spam identical errors
- [ ] Trigger same error multiple times quickly
- [ ] Try uploading invalid file type 5+ times rapidly
- **Expected**: Only one toast per error type within 3 seconds
- **Check logs**: Should see "Suppressed duplicate toast" messages

### ✅ **Cancellation Robustness**

**Test**: Cancel operations at different stages
- [ ] Cancel during file upload
- [ ] Cancel during API call
- [ ] Cancel during result processing
- [ ] Switch tabs during generation
- **Expected**: Clean cancellation, no orphaned requests
- **Check logs**: Should see "Generation cancelled by user"
- **Check network**: Aborted requests in DevTools

### ✅ **Type Safety Validation**

**Test**: Compile-time guarantees
- [ ] Try to add new Time Machine option without mapping
- [ ] Try to add new Story preset without including in array
- **Expected**: TypeScript compilation errors
- **Check**: `npm run build` should fail with clear error messages

---

## 🔧 **Automated Checks**

### **CI Validation Test**
```javascript
// Add to your test suite
describe('Mapping Validation', () => {
  it('should have zero missing mappings in production', async () => {
    await validateMappings()
    const state = validationStore.getState()
    
    expect(state.unavailableTimeMachineOptions.size).toBe(0)
    expect(state.unavailableRestoreOptions.size).toBe(0)
    expect(state.storyDisabled).toBe(false)
  })
})
```

### **Performance Monitoring**
```javascript
// Add performance assertions
describe('Performance', () => {
  it('should not leak memory during multiple generations', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0
    
    // Simulate 10 generations
    for (let i = 0; i < 10; i++) {
      // ... trigger generation
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0
    const memoryGrowth = finalMemory - initialMemory
    
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // 50MB limit
  })
})
```

---

## 🚨 **Red Flags to Watch For**

### **UI State Issues**
- ❌ Buttons stay disabled after error
- ❌ Loading spinners never stop
- ❌ Multiple toast notifications for same error
- ❌ UI becomes unresponsive after network issues

### **Memory/Performance Issues**
- ❌ Browser tab memory usage keeps growing
- ❌ Slow response after many operations
- ❌ Console warnings about memory leaks
- ❌ Timers/intervals not cleaned up

### **Network/API Issues**
- ❌ Multiple identical API calls
- ❌ Requests not cancelled on navigation
- ❌ Auth tokens not refreshed properly
- ❌ Offline state not handled gracefully

### **Type Safety Issues**
- ❌ Runtime errors for missing mappings
- ❌ Undefined preset references
- ❌ TypeScript compilation warnings

---

## 📊 **Success Criteria**

All tests should pass with:
- ✅ **Zero** stuck UI states
- ✅ **Zero** memory leaks
- ✅ **Zero** duplicate API calls
- ✅ **Zero** unhandled promise rejections
- ✅ **Zero** console errors during normal operation
- ✅ **Graceful** error recovery in all scenarios
- ✅ **Clean** cancellation of all operations
- ✅ **Proper** logging for debugging

---

## 🔄 **Testing Schedule**

### **Before Each Release**
- [ ] Run full smoke test checklist
- [ ] Check CI validation tests pass
- [ ] Monitor memory usage during extended session
- [ ] Test on slow network connection
- [ ] Test with ad blockers enabled

### **Weekly Regression**
- [ ] Test all error scenarios
- [ ] Verify mapping validation works
- [ ] Check performance hasn't degraded
- [ ] Test cancellation edge cases

The pipeline should be **bulletproof** under all these conditions! 🛡️
