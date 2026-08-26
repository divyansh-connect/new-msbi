import { google } from 'googleapis';
import { googleOAuthService } from './google.service';
import { integrationsService } from './integrations.service';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export class GA4Service {
  private async getAnalyticsDataClient() {
    // Programmatically delete the GOOGLE_APPLICATION_CREDENTIALS environment variable inside
    // our Node process to prevent the Google Auth library from overriding the custom authClient
    // with local system credentials.
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

    const oauth2Client = await this.getClient();
    console.log('[GA4 SERVICE] Initializing BetaAnalyticsDataClient with OAuth2Client');
    const client = new BetaAnalyticsDataClient({
      authClient: oauth2Client as any
    });
    console.log('[GA4 SERVICE] BetaAnalyticsDataClient initialized successfully.');
    return client;
  }

  private async getPropertyId() {
    const creds = await integrationsService.getSecureCredentials('ga4');
    const config = creds?.config as any;
    if (config?.propertyId) {
      return config.propertyId;
    }
    if (process.env.GOOGLE_GA4_PROPERTY_ID) {
      return process.env.GOOGLE_GA4_PROPERTY_ID;
    }
    return null;
  }

  private async getClient() {
    console.log('[GA4 SERVICE] Loading credentials from secure store...');
    const creds = await integrationsService.getSecureCredentials('ga4');
    if (!creds?.accessToken) {
      console.error('[GA4 SERVICE] Load failed: accessToken is missing. Authorization required.');
      throw new Error('Google Analytics authorization required');
    }
    console.log('[GA4 SERVICE] Credentials loaded successfully. Refresh token present:', !!creds.refreshToken);
    
    try {
      console.log('[GA4 SERVICE] Retrieving authenticated OAuth2Client...');
      const config = creds.config as any;
      const { client, onTokens } = await googleOAuthService.getAuthenticatedClient(creds.accessToken, creds.refreshToken, config?.expiryDate);
      
      onTokens(async (tokens) => {
        if (tokens.access_token) {
          console.log('[GA4 SERVICE] Tokens updated/refreshed automatically. Saving new credentials...');
          const newRefreshToken = tokens.refresh_token || creds.refreshToken;
          const newConfig = { ...config, expiryDate: tokens.expiry_date };
          await integrationsService.saveCredentials('ga4', tokens.access_token, newRefreshToken, newConfig);
          console.log('[GA4 SERVICE] Refreshed credentials saved.');
        }
      });

      return client;
    } catch (error) {
      console.error('[GA4 SERVICE] Authenticated client retrieval failed:', error);
      throw new Error('Google Analytics authorization required');
    }
  }

  async getProperties() {
    const propertyId = await this.getPropertyId();
    if (propertyId) {
      return [{
        name: `properties/${propertyId}`,
        property: `properties/${propertyId}`,
        displayName: `GA4 Property (${propertyId})`
      }];
    }
    const client = await this.getClient();
    const adminApi = google.analyticsadmin({ version: 'v1beta', auth: client });
    const response = await adminApi.accountSummaries.list();
    return response.data.accountSummaries || [];
  }

  async healthCheck() {
    try {
      const propertyId = await this.getPropertyId();
      if (!propertyId) return false;

      const analyticsDataClient = await this.getAnalyticsDataClient();
      await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: 'today', endDate: 'today' }],
        metrics: [{ name: 'activeUsers' }]
      });
      return true;
    } catch (error) {
      console.error('GA4 Health Check Failed:', error);
      return false;
    }
  }

  async setPropertyId(propertyId: string) {
    const creds = await integrationsService.getSecureCredentials('ga4');
    if (!creds?.accessToken) throw new Error('Not connected');
    
    const config = creds.config as any || {};
    config.propertyId = propertyId;
    
    await integrationsService.saveCredentials('ga4', creds.accessToken, creds.refreshToken || null, config);
  }

  async runReport(dimensions: string[], metrics: string[], startDate = '30daysAgo', endDate = 'today') {
    const propertyId = await this.getPropertyId();
    if (!propertyId) {
      throw new Error('GOOGLE_GA4_PROPERTY_ID is not configured in .env and not found in database');
    }
    const cleanPropertyId = propertyId.replace(/^properties\//, '');
    
    try {
      const analyticsDataClient = await this.getAnalyticsDataClient();
      const [response] = await analyticsDataClient.runReport({
        property: `properties/${cleanPropertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: dimensions.map(d => ({ name: d })),
        metrics: metrics.map(m => ({ name: m }))
      });
      return response;
    } catch (error: any) {
      const isUnauthenticated = error.code === 16 || 
        error.message?.includes('UNAUTHENTICATED') || 
        error.message?.includes('invalid authentication credentials') ||
        error.message?.includes('invalid_grant');
        
      if (isUnauthenticated) {
        console.log('[GA4 SERVICE] Request failed with unauthenticated error. Attempting manual token refresh...');
        try {
          const oauth2Client = await this.getClient();
          if (oauth2Client.credentials.refresh_token) {
            console.log('[GA4 SERVICE] Refresh token found. Refreshing access token...');
            const refreshRes = await oauth2Client.refreshAccessToken();
            const newAccessToken = refreshRes.credentials.access_token;
            if (newAccessToken) {
              console.log('[GA4 SERVICE] Token refresh successful. Saving new credentials...');
              const creds = await integrationsService.getSecureCredentials('ga4');
              const newRefreshToken = refreshRes.credentials.refresh_token || creds?.refreshToken;
              const newConfig = { ...(creds?.config as any), expiryDate: refreshRes.credentials.expiry_date };
              await integrationsService.saveCredentials('ga4', newAccessToken, newRefreshToken || null, newConfig);
              
              // Retry the report with the new client
              console.log('[GA4 SERVICE] Retrying runReport with refreshed credentials...');
              const newAnalyticsDataClient = await this.getAnalyticsDataClient();
              const [response] = await newAnalyticsDataClient.runReport({
                property: `properties/${cleanPropertyId}`,
                dateRanges: [{ startDate, endDate }],
                dimensions: dimensions.map(d => ({ name: d })),
                metrics: metrics.map(m => ({ name: m }))
              });
              return response;
            }
          } else {
            console.warn('[GA4 SERVICE] No refresh token available. Cannot perform manual refresh.');
          }
        } catch (refreshErr: any) {
          console.error('[GA4 SERVICE] Manual token refresh or retry failed:', refreshErr);
        }
      }
      
      console.error('[GA4 runReport Error Details]:', error);
      const msg = error.message || '';
      // Map only token/key expiration issues to authorization prompts, letting real API errors pass through
      if (
        msg.includes('invalid_grant') ||
        msg.includes('Getting credentials failed') ||
        msg.includes('Getting metadata from plugin failed') ||
        msg.includes('key must be')
      ) {
        throw new Error('Google Analytics authorization required: token is invalid or expired.');
      }
      throw error;
    }
  }

  async getOverview(startDate = '30daysAgo', endDate = 'today') {
    const data = await this.runReport([], ['totalUsers', 'activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'engagedSessions'], startDate, endDate);
    if (!data || !data.rows || data.rows.length === 0) return null;
    
    const metrics = data.rows[0].metricValues;
    return {
      totalUsers: parseInt(metrics?.[0]?.value || '0', 10),
      activeUsers: parseInt(metrics?.[1]?.value || '0', 10),
      newUsers: parseInt(metrics?.[2]?.value || '0', 10),
      sessions: parseInt(metrics?.[3]?.value || '0', 10),
      screenPageViews: parseInt(metrics?.[4]?.value || '0', 10),
      engagedSessions: parseInt(metrics?.[5]?.value || '0', 10),
    };
  }

  async getLandingPagesReport(startDate = '30daysAgo', endDate = 'today') {
    const data = await this.runReport(['landingPage'], ['sessions', 'screenPageViews', 'bounceRate'], startDate, endDate);
    if (!data || !data.rows) return [];

    return data.rows.map((row: any) => {
      const path = row.dimensionValues?.[0]?.value || '/';
      const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);
      const pageviews = parseInt(row.metricValues?.[1]?.value || '0', 10);
      const bounceRate = parseFloat(row.metricValues?.[2]?.value || '0');

      return {
        path,
        sessions,
        pageviews,
        bounceRate
      };
    });
  }
}

export const ga4Service = new GA4Service();
