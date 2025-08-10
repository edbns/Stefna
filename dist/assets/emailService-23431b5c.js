var s=Object.defineProperty;var a=(o,e,t)=>e in o?s(o,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[e]=t;var n=(o,e,t)=>(a(o,typeof e!="symbol"?e+"":e,t),t);class c{constructor(){n(this,"baseUrl");this.baseUrl="/api/send-otp-email"}async sendOTPEmail(e,t){try{const r=await fetch(this.baseUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:e,otp:t})}),i=await r.json();return r.ok?{success:!0,data:i}:(console.error("Email service error:",i),{success:!1,error:i.error||"Failed to send email"})}catch(r){return console.error("Email service error:",r),{success:!1,error:"Network error while sending email"}}}async sendReferralEmail(e){try{const t=await fetch("/.netlify/functions/sendEmail",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:e.friendEmail,subject:`${e.referrerName||"A friend"} invited you to Stefna! 🎨`,html:this.generateReferralEmailHTML(e)})}),r=await t.json();return t.ok?{success:!0,data:r}:(console.error("Referral email service error:",r),{success:!1,error:r.error||"Failed to send referral email"})}catch(t){return console.error("Referral email service error:",t),{success:!1,error:"Network error while sending referral email"}}}generateReferralEmailHTML(e){const t=e.referrerName||"A friend",r=e.referralCode?`https://stefna.xyz/auth?ref=${e.referralCode}`:"https://stefna.xyz/auth";return`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
        <div style="text-align: center; padding: 40px 20px;">
          <!-- Logo -->
          <img src="https://stefna.xyz/logo.png" alt="Stefna" style="width: 80px; height: 80px; margin-bottom: 30px;">
          
          <!-- Main content -->
          <div style="background-color: #1a1a1a; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 10px;">You've been invited!</h1>
            <p style="color: #cccccc; font-size: 16px; margin-bottom: 30px;">Join Stefna and start creating with AI</p>
            
            <p style="color: #cccccc; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
              <strong>${t}</strong> thinks you'd love Stefna - the AI-powered creative platform where you can transform photos and videos with just a prompt.
            </p>
            
            <p style="color: #cccccc; font-size: 14px; line-height: 1.5; margin-bottom: 30px;">
              Create stunning AI art, remix existing content, and explore endless creative possibilities.
            </p>
            
            <div style="background-color: #1a1a1a; padding: 20px; border-radius: 10px; margin: 30px 0; border: 1px solid #333333;">
              <p style="color: #888888; font-size: 12px; text-transform: uppercase; margin-bottom: 10px;">Special Bonus</p>
              <p style="color: #ffffff; font-size: 14px; margin: 0;">
                Sign up with this invite and get <strong>10 bonus tokens</strong> to start creating immediately!
              </p>
            </div>
            
            <a href="${r}" 
               style="display: inline-block; background-color: #ffffff; color: #000000; text-decoration: none; padding: 15px 30px; border-radius: 10px; font-weight: bold; font-size: 16px; margin: 20px 0;">
              Join Stefna Now
            </a>
            
            <p style="color: #888888; font-size: 14px; margin-top: 20px;">
              No credit card required • Start creating in seconds
            </p>
          </div>
          
          <!-- Features -->
          <div style="background-color: #1a1a1a; padding: 30px; border-radius: 15px; margin-bottom: 30px;">
            <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 20px;">What you can do with Stefna:</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: left;">
              <div>
                <h3 style="color: #ffffff; font-size: 16px; margin-bottom: 8px;">AI Art Generation</h3>
                <p style="color: #cccccc; font-size: 14px;">Create stunning images from text prompts</p>
              </div>
              <div>
                <h3 style="color: #ffffff; font-size: 16px; margin-bottom: 8px;">Video Transformation</h3>
                <p style="color: #cccccc; font-size: 14px;">Transform videos with AI-powered effects</p>
              </div>
              <div>
                <h3 style="color: #ffffff; font-size: 16px; margin-bottom: 8px;">Content Remixing</h3>
                <p style="color: #cccccc; font-size: 14px;">Remix and enhance existing media</p>
              </div>
              <div>
                <h3 style="color: #ffffff; font-size: 16px; margin-bottom: 8px;">Instant Results</h3>
                <p style="color: #cccccc; font-size: 14px;">Get results in seconds, not hours</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="border-top: 1px solid #333333; padding: 30px 20px; text-align: center;">
          <p style="color: #ffffff; font-size: 14px; margin-bottom: 5px;">Stefna - Turn Moments into Masterpieces—No Limits</p>
          <p style="color: #888888; font-size: 12px; margin-bottom: 5px;">This email was sent to ${e.friendEmail}</p>
          <p style="color: #888888; font-size: 12px;">If you have any questions, contact us at hello@stefna.xyz</p>
        </div>
      </div>
    `}generateOTP(){return Math.floor(1e5+Math.random()*9e5).toString()}async sendOTP(e){const t=this.generateOTP();return this.sendOTPEmail(e,t)}}const l=new c;export{l as default};
