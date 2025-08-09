# 🧪 Stefna Beta Testing Guide

## 🎯 **Testing Access**

### **Live Domain Testing**
To test the app on the live domain, add `?test=true` to the URL:

```
https://stefna.xyz?test=true
https://stefna.netlify.app?test=true
```

### **Local Development Testing**
For local testing, simply run:
```bash
npm run dev
```
Then visit: `http://localhost:5173`

---

## 📋 **Testing Checklist**

### ✅ **Authentication System**
- [ ] **OTP Request**: Request login code with email
- [ ] **OTP Verification**: Enter code and login successfully
- [ ] **Session Persistence**: Refresh page, stay logged in
- [ ] **Logout**: Logout and clear session
- [ ] **Guest Mode**: Test without authentication

### ✅ **AI Generation System**
- [ ] **Photo Generation**: Generate HD photos with prompts
- [ ] **Video Generation**: Generate HD videos with prompts
- [ ] **Token Deduction**: Verify tokens are deducted correctly
- [ ] **Rate Limiting**: Test 30-second cooldown between generations
- [ ] **Error Handling**: Test with invalid prompts

### ✅ **Token System**
- [ ] **Daily Limits**: Verify daily token limits per tier
- [ ] **Token Display**: Check token counter accuracy
- [ ] **Token Reset**: Verify daily reset at midnight UTC
- [ ] **Tier Upgrades**: Test different user tiers
- [ ] **Bonus Tokens**: Test referral system

### ✅ **User Interface**
- [ ] **Responsive Design**: Test on mobile, tablet, desktop
- [ ] **Navigation**: Test all routes and navigation
- [ ] **Animations**: Verify smooth transitions
- [ ] **Loading States**: Test loading indicators
- [ ] **Error Messages**: Test error handling UI

### ✅ **Media Management**
- [ ] **Upload Media**: Test file upload functionality
- [ ] **Media Viewer**: Test full-screen media viewer
- [ ] **Like/Remix**: Test like and remix functionality
- [ ] **Download**: Test media download
- [ ] **Delete**: Test media deletion

### ✅ **Email System**
- [ ] **Welcome Email**: Test new user welcome email
- [ ] **OTP Email**: Test login code emails
- [ ] **Invite Email**: Test referral emails
- [ ] **Email Templates**: Verify email branding

### ✅ **Database Integration**
- [ ] **User Profiles**: Test user data persistence
- [ ] **Media Storage**: Test media metadata storage
- [ ] **Usage Tracking**: Test usage statistics
- [ ] **Referral System**: Test referral tracking

---

## 🔧 **Testing Scenarios**

### **Scenario 1: New User Journey**
1. Visit app with `?test=true`
2. Request OTP with email
3. Enter OTP and create account
4. Generate first AI image
5. Check token balance
6. Test like/remix functionality
7. Logout and verify session cleared

### **Scenario 2: Existing User Journey**
1. Login with existing account
2. Check token balance and usage
3. Generate multiple images/videos
4. Test rate limiting
5. Check media history
6. Test profile features

### **Scenario 3: Guest User Journey**
1. Visit app without authentication
2. Test demo mode functionality
3. Verify authentication prompts
4. Test limited features

### **Scenario 4: Error Handling**
1. Test invalid OTP codes
2. Test expired OTP codes
3. Test rate limiting
4. Test token exhaustion
5. Test network errors

---

## 🐛 **Common Issues to Check**

### **Authentication Issues**
- [ ] OTP emails not sending
- [ ] OTP verification failing
- [ ] Session not persisting
- [ ] Logout not working

### **AI Generation Issues**
- [ ] Generation failing
- [ ] Tokens not deducting
- [ ] Rate limiting not working
- [ ] Error messages unclear

### **UI/UX Issues**
- [ ] Mobile responsiveness
- [ ] Loading states
- [ ] Error messages
- [ ] Navigation issues

### **Performance Issues**
- [ ] Slow loading times
- [ ] Large bundle size
- [ ] Memory leaks
- [ ] Network requests

---

## 📊 **Testing Metrics**

### **Performance Metrics**
- Page load time: < 3 seconds
- AI generation time: < 30 seconds
- Bundle size: < 150KB gzipped
- Mobile performance: Smooth scrolling

### **User Experience Metrics**
- Authentication success rate: > 95%
- AI generation success rate: > 90%
- Error rate: < 5%
- User satisfaction: > 4/5

### **Technical Metrics**
- API response time: < 2 seconds
- Database query time: < 1 second
- Email delivery rate: > 98%
- Uptime: > 99.9%

---

## 🚀 **Post-Testing Actions**

### **If Testing Successful**
1. Remove coming-soon redirect
2. Deploy to production
3. Monitor performance
4. Collect user feedback

### **If Issues Found**
1. Document issues
2. Prioritize fixes
3. Re-test after fixes
4. Update testing guide

---

## 📞 **Support**

If you encounter issues during testing:
1. Check browser console for errors
2. Verify environment variables
3. Test on different devices
4. Contact development team

---

**Happy Testing! 🎨**
