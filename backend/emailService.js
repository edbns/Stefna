// Example backend email service using Nodemailer
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendPostReminder(postData) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: postData.userEmail,
      subject: `⏰ Time to post on ${postData.platform}!`,
      html: this.generateEmailTemplate(postData)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Email reminder sent successfully');
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  generateEmailTemplate(post) {
    // Use the same template from NotificationService
    return NotificationService.generateEmailTemplate(post);
  }
}

module.exports = EmailService;