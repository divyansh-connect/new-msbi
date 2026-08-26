import axios from 'axios';
import prisma from '../plugins/db';

export class NotificationService {
  async sendNewReviewAlert(review: any, clinicName: string) {
    // 1. Fetch all active users who have alerts enabled
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { emailAlerts: true },
          { smsAlerts: true }
        ],
        isActive: true
      }
    });

    const crmUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reputation/reviews`;
    const ratingStars = '★'.repeat(Math.round(review.rating)) + '☆'.repeat(5 - Math.round(review.rating));

    const subject = `New ${review.rating}-Star Google Review for ${clinicName}`;
    const bodyText = `
New Google Review feedback received!

Location: ${clinicName}
Reviewer: ${review.authorName || 'Anonymous'}
Rating: ${ratingStars} (${review.rating} Stars)
Review: "${review.comment || '(No comment)'}"
Status: Unanswered

View and reply to this review in MSBI CRM:
${crmUrl}
    `;

    for (const user of users) {
      // Parse location preferences
      let alertLocationsArray: string[] = [];
      if (user.alertLocations) {
        try {
          alertLocationsArray = typeof user.alertLocations === 'string'
            ? JSON.parse(user.alertLocations)
            : (Array.isArray(user.alertLocations) ? (user.alertLocations as string[]) : []);
        } catch (e) {
          alertLocationsArray = [];
        }
      }

      // If user has alert locations preference set, and this review location is not in it, filter it out!
      if (alertLocationsArray.length > 0 && review.googleLocationId && !alertLocationsArray.includes(review.googleLocationId)) {
        console.log(`[ALERT ROUTING] Skipping alert for user ${user.email} (location ${review.googleLocationId} not in routing preference).`);
        continue;
      }

      // Send Email alert
      if (user.emailAlerts && user.email) {
        await this.sendEmail(user.email, subject, bodyText);
      }

      // Send SMS alert
      if (user.smsAlerts && user.phoneNumber) {
        await this.sendSms(user.phoneNumber, bodyText);
      }
    }
  }

  private async sendEmail(to: string, subject: string, text: string) {
    if (process.env.SENDGRID_API_KEY) {
      try {
        await axios.post(
          'https://api.sendgrid.com/v3/mail/send',
          {
            personalizations: [{ to: [{ email: to }] }],
            from: { email: process.env.EMAIL_FROM || 'alerts@msbi-spine-brain.com', name: 'MSBI CRM Alerts' },
            subject: subject,
            content: [{ type: 'text/plain', value: text }]
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`[EMAIL ALERT] Sent successfully to ${to}`);
      } catch (err: any) {
        console.error(`[EMAIL ALERT] Failed to send to ${to} via SendGrid:`, err.response?.data || err.message);
      }
    } else {
      console.log(`[EMAIL ALERT MOCK] To: ${to} | Subject: ${subject} | Length: ${text?.length || 0} chars`);
    }
  }

  private async sendSms(to: string, text: string) {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          new URLSearchParams({
            To: to,
            From: process.env.TWILIO_PHONE_NUMBER,
            Body: text
          }).toString(),
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
        console.log(`[SMS ALERT] Sent successfully to ${to}`);
      } catch (err: any) {
        console.error(`[SMS ALERT] Failed to send to ${to} via Twilio:`, err.response?.data || err.message);
      }
    } else {
      console.log(`[SMS ALERT MOCK] To: ${to} | Length: ${text?.length || 0} chars`);
    }
  }
}

export const notificationService = new NotificationService();
