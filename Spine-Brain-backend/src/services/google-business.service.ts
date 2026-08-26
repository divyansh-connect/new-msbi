import axios from 'axios';
import prisma from '../plugins/db';
import { integrationsService } from './integrations.service';
import { googleOAuthService } from './google.service';

export class GoogleBusinessService {
  private async getClient() {
    const creds = await integrationsService.getSecureCredentials('google-business');
    if (!creds?.accessToken) {
      throw new Error('Google Business Profile authorization required (AccessToken missing)');
    }

    try {
      const config = creds.config as any;
      const { client, onTokens } = await googleOAuthService.getAuthenticatedClient(creds.accessToken, creds.refreshToken, config?.expiryDate);

      onTokens(async (tokens) => {
        if (tokens.access_token) {
          console.log('[GOOGLE BUSINESS SERVICE] Tokens updated/refreshed automatically. Saving new credentials...');
          const newRefreshToken = tokens.refresh_token || creds.refreshToken;
          const newConfig = { ...config, expiryDate: tokens.expiry_date };
          await integrationsService.saveCredentials('google-business', tokens.access_token, newRefreshToken, newConfig);
          console.log('[GOOGLE BUSINESS SERVICE] Refreshed credentials saved.');
        }
      });

      return client;
    } catch (error: any) {
      console.error('[GOOGLE BUSINESS SERVICE] Authenticated client retrieval failed:', error.message || error);
      throw new Error('Google Business Profile authorization required');
    }
  }

  private handleApiError(error: any, context: string): never {
    const endpoint = error.config?.url || 'unknown endpoint';
    const status = error.response?.status || error.response?.data?.error?.status || 'unknown status';
    const apiError = error.response?.data?.error;
    let message = apiError?.message || error.message || 'Request failed';

    console.error(`Google Business Profile API Failure during ${context} at endpoint ${endpoint} (Status ${status}):`, error.response?.data || error.message);
    
    throw new Error(
      `Google Business Profile API Error: Status ${status} on endpoint ${endpoint} - ${message}`
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.getClient();
      const tokenRes = await client.getAccessToken();
      const accessToken = tokenRes.token || client.credentials.access_token;
      if (!accessToken) return false;

      // Validate token by fetching accessible accounts
      const url = `https://mybusinessaccountmanagement.googleapis.com/v1/accounts`;
      await axios.get(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return true;
    } catch (error: any) {
      console.error('Google Business healthCheck failed:', error.response?.data || error.message);
      return false;
    }
  }

  async getAccessibleAccounts() {
    const client = await this.getClient();
    const tokenRes = await client.getAccessToken();
    const accessToken = tokenRes.token || client.credentials.access_token;
    if (!accessToken) throw new Error('Google Business Profile not connected');

    try {
      const url = `https://mybusinessaccountmanagement.googleapis.com/v1/accounts`;
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      return (response.data.accounts || []).map((acc: any) => ({
        accountId: acc.name, // e.g. accounts/12345
        accountName: acc.accountName,
        type: acc.type
      }));
    } catch (error: any) {
      this.handleApiError(error, 'getAccessibleAccounts');
    }
  }

  async getAccessibleLocations(accountId: string) {
    const client = await this.getClient();
    const tokenRes = await client.getAccessToken();
    const accessToken = tokenRes.token || client.credentials.access_token;
    if (!accessToken) throw new Error('Google Business Profile not connected');

    try {
      // Fetch locations with storefront details, phone numbers, website and metadata status
      const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations?readMask=name,title,storefrontAddress,phoneNumbers,websiteUri,metadata`;
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      return (response.data.locations || []).map((loc: any) => {
        // Address extraction
        const addressParts = [];
        if (loc.storefrontAddress) {
          if (loc.storefrontAddress.addressLines) addressParts.push(...loc.storefrontAddress.addressLines);
          if (loc.storefrontAddress.locality) addressParts.push(loc.storefrontAddress.locality);
          if (loc.storefrontAddress.administrativeArea) addressParts.push(loc.storefrontAddress.administrativeArea);
          if (loc.storefrontAddress.postalCode) addressParts.push(loc.storefrontAddress.postalCode);
        }
        const address = addressParts.join(', ') || null;

        const phone = loc.phoneNumbers?.primaryPhone || null;
        const website = loc.websiteUri || null;
        const isVerified = loc.metadata?.isVerified || false;

        return {
          googleAccountId: accountId,
          businessAccountId: accountId.replace('accounts/', ''),
          googleLocationId: loc.name, // format: accounts/123/locations/456
          name: loc.title,
          address,
          phone,
          website,
          isVerified,
        };
      });
    } catch (error: any) {
      this.handleApiError(error, 'getAccessibleLocations');
    }
  }

  async syncReviews() {
    const client = await this.getClient();
    const tokenRes = await client.getAccessToken();
    const accessToken = tokenRes.token || client.credentials.access_token;
    if (!accessToken) throw new Error('Google Business Profile not connected');

    // Get all clinics mapped to a Google Location
    const clinics = await prisma.clinic.findMany({
      where: { googleLocationId: { not: null } }
    });

    if (clinics.length === 0) {
      console.log('[GBP SYNC] No mapped clinics found.');
      return { success: true, count: 0, message: 'No mapped clinics found.' };
    }

    let syncedCount = 0;

    for (const clinic of clinics) {
      const googleLocationId = clinic.googleLocationId!;
      // Get reviews for this location
      const url = `https://mybusiness.googleapis.com/v4/${googleLocationId}/reviews`;

      try {
        console.log(`[GBP SYNC] Fetching reviews for mapped clinic: ${clinic.name} (${googleLocationId})`);
        const res = await axios.get(url, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const reviews = res.data.reviews || [];
        console.log(`[GBP SYNC] Retrieved ${reviews.length} reviews for ${clinic.name}`);

        for (const rev of reviews) {
          const externalReviewId = rev.reviewId;
          const ratingNum = rev.starRating === 'FIVE' ? 5.0 : rev.starRating === 'FOUR' ? 4.0 : rev.starRating === 'THREE' ? 3.0 : rev.starRating === 'TWO' ? 2.0 : 1.0;
          const authorName = rev.reviewer?.displayName || 'Google User';
          
          const date = new Date(rev.createTime);
          const reviewUpdatedAt = rev.updateTime ? new Date(rev.updateTime) : date;
          const comment = rev.comment || '';
          
          const replyText = rev.reviewReply?.comment || null;
          const repliedAt = rev.reviewReply?.updateTime ? new Date(rev.reviewReply.updateTime) : null;
          
          let responseTime: number | null = null;
          if (repliedAt) {
            responseTime = Math.max(0, Math.floor((repliedAt.getTime() - date.getTime()) / 1000));
          }

          const reviewUrl = rev.reviewReply?.reviewUrl || `https://search.google.com/local/reviews?placeid=&q=${encodeURIComponent(clinic.name)}`;

          const data: any = {
            platform: 'Google',
            rating: ratingNum,
            comment: comment,
            authorName: authorName,
            date: date,
            externalReviewId: externalReviewId,
            googleReviewId: externalReviewId,
            googleLocationId: googleLocationId,
            clinicId: clinic.id,
            reply: replyText,
            repliedAt: repliedAt,
            reviewUrl: reviewUrl,
            responseTime: responseTime,
            reviewUpdatedAt: reviewUpdatedAt,
          };

          const existing = await prisma.review.findUnique({
            where: {
              platform_externalReviewId: {
                platform: 'Google',
                externalReviewId: externalReviewId
              }
            }
          });

          if (existing) {
            await prisma.review.update({
              where: { id: existing.id },
              data
            });
          } else {
            await prisma.review.create({
              data
            });
          }
          syncedCount++;
        }
      } catch (err: any) {
        const endpoint = err.config?.url || 'unknown endpoint';
        const status = err.response?.status || err.response?.data?.error?.status || 'unknown status';
        const apiError = err.response?.data?.error;
        const message = apiError?.message || err.message || 'Request failed';
        const errorString = `Google Business Profile API Error: Status ${status} on endpoint ${endpoint} - ${message}`;

        await prisma.integrationCredential.updateMany({
          where: { platformName: 'google-business' },
          data: {
            lastSyncAt: new Date(),
            lastError: errorString
          }
        });

        this.handleApiError(err, `syncReviews (Location: ${googleLocationId})`);
      }
    }

    // Update integration credential sync status
    await prisma.integrationCredential.updateMany({
      where: { platformName: 'google-business' },
      data: {
        lastSyncAt: new Date(),
        lastSuccessfulSyncAt: new Date(),
        lastError: null,
        isActive: true
      }
    });

    return { success: true, count: syncedCount };
  }

  async replyToReview(reviewId: string, replyText: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review || !review.googleLocationId || !review.googleReviewId) {
      throw new Error('Review not found or does not have Google Business Profile identifier metadata');
    }

    const client = await this.getClient();
    const tokenRes = await client.getAccessToken();
    const accessToken = tokenRes.token || client.credentials.access_token;
    if (!accessToken) throw new Error('Google Business Profile not connected');

    const url = `https://mybusiness.googleapis.com/v4/${review.googleLocationId}/reviews/${review.googleReviewId}/reply`;

    try {
      const response = await axios.put(url, {
        comment: replyText
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const repliedAt = new Date();
      let responseTime: number | null = null;
      if (review.date) {
        responseTime = Math.max(0, Math.floor((repliedAt.getTime() - new Date(review.date).getTime()) / 1000));
      }

      await prisma.review.update({
        where: { id: reviewId },
        data: {
          reply: replyText,
          repliedAt,
          responseTime
        }
      });

      return { success: true, reply: replyText, repliedAt };
    } catch (error: any) {
      this.handleApiError(error, 'replyToReview');
    }
  }

  async fetchAndSaveSingleReview(reviewName: string) {
    // reviewName format: accounts/{accountId}/locations/{locationId}/reviews/{reviewId}
    const parts = reviewName.split('/');
    if (parts.length < 6) throw new Error('Invalid review resource name format');

    const googleLocationId = parts[0] + '/' + parts[1] + '/' + parts[2] + '/' + parts[3];

    // Find mapped clinic
    const clinic = await prisma.clinic.findFirst({
      where: { googleLocationId }
    });

    if (!clinic) {
      throw new Error(`No mapped clinic found for Google location ID: ${googleLocationId}`);
    }

    const client = await this.getClient();
    const tokenRes = await client.getAccessToken();
    const accessToken = tokenRes.token || client.credentials.access_token;
    if (!accessToken) throw new Error('Google Business Profile not connected');

    const url = `https://mybusiness.googleapis.com/v4/${reviewName}`;
    let response;
    try {
      response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
    } catch (error: any) {
      this.handleApiError(error, 'fetchAndSaveSingleReview');
    }

    const rev = response.data;
    const externalReviewId = rev.reviewId;
    const ratingNum = rev.starRating === 'FIVE' ? 5.0 : rev.starRating === 'FOUR' ? 4.0 : rev.starRating === 'THREE' ? 3.0 : rev.starRating === 'TWO' ? 2.0 : 1.0;
    const authorName = rev.reviewer?.displayName || 'Google User';
    
    const date = new Date(rev.createTime);
    const reviewUpdatedAt = rev.updateTime ? new Date(rev.updateTime) : date;
    const comment = rev.comment || '';
    
    const replyText = rev.reviewReply?.comment || null;
    const repliedAt = rev.reviewReply?.updateTime ? new Date(rev.reviewReply.updateTime) : null;
    
    let responseTime: number | null = null;
    if (repliedAt) {
      responseTime = Math.max(0, Math.floor((repliedAt.getTime() - date.getTime()) / 1000));
    }

    const reviewUrl = rev.reviewReply?.reviewUrl || `https://search.google.com/local/reviews?placeid=&q=${encodeURIComponent(clinic.name)}`;

    const data: any = {
      platform: 'Google',
      rating: ratingNum,
      comment: comment,
      authorName: authorName,
      date: date,
      externalReviewId: externalReviewId,
      googleReviewId: externalReviewId,
      googleLocationId: googleLocationId,
      clinicId: clinic.id,
      reply: replyText,
      repliedAt: repliedAt,
      reviewUrl: reviewUrl,
      responseTime: responseTime,
      reviewUpdatedAt: reviewUpdatedAt,
    };

    const existing = await prisma.review.findUnique({
      where: {
        platform_externalReviewId: {
          platform: 'Google',
          externalReviewId: externalReviewId
        }
      }
    });

    let savedReview;
    if (existing) {
      savedReview = await prisma.review.update({
        where: { id: existing.id },
        data,
        include: { clinic: true }
      });
    } else {
      savedReview = await prisma.review.create({
        data,
        include: { clinic: true }
      });
    }

    // Trigger staff notifications asynchronously
    try {
      const { notificationService } = require('./notification.service');
      await notificationService.sendNewReviewAlert(savedReview, clinic.name);
    } catch (notifErr: any) {
      console.error('[GBP WEBHOOK] Failed to dispatch staff notifications:', notifErr.message);
    }

    return savedReview;
  }
}

export const googleBusinessService = new GoogleBusinessService();
