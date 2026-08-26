import { FastifyRequest, FastifyReply } from 'fastify';
import { integrationsService } from '../services/integrations.service';
import { ga4Service } from '../services/ga4.service';
import { gscService } from '../services/gsc.service';
import { googleAdsService } from '../services/google-ads.service';
import { metaAdsService } from '../services/meta-ads.service';
import { googleBusinessService } from '../services/google-business.service';
import { callRailService } from '../services/callrail.service';
import { hubspotService } from '../services/hubspot.service';
import { mailchimpService } from '../services/mailchimp.service';
import { wordpressService } from '../services/wordpress.service';
import prisma from '../plugins/db';
import { campaignsService } from '../services/campaigns.service';
import { SyncIntegrationInput } from '../validators/integrations.schema';

export const getIntegrationStatusHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const statuses = await integrationsService.getStatus();
  return reply.send({ success: true, data: statuses });
};

export const syncIntegrationHandler = async (
  request: FastifyRequest<{ Body: SyncIntegrationInput }>,
  reply: FastifyReply
) => {
  const result = await integrationsService.triggerSync(request.body);
  return reply.send({ success: true, data: result });
};

// WordPress integration handlers
export const checkWordPressHealthHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await integrationsService.verifyWordPressHealth();
    return reply.send(result);
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getWordPressPostsHandler = async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
  try {
    const data = await wordpressService.getPosts(request.query as Record<string, any>);
    return reply.send({ success: true, ...data });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getWordPressPagesHandler = async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
  try {
    const data = await wordpressService.getPages(request.query as Record<string, any>);
    return reply.send({ success: true, ...data });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getWordPressMediaHandler = async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
  try {
    const data = await wordpressService.getMedia(request.query as Record<string, any>);
    return reply.send({ success: true, ...data });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getWordPressCategoriesHandler = async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
  try {
    const data = await wordpressService.getCategories(request.query as Record<string, any>);
    return reply.send({ success: true, ...data });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getWordPressTagsHandler = async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
  try {
    const data = await wordpressService.getTags(request.query as Record<string, any>);
    return reply.send({ success: true, ...data });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getWordPressTypesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await wordpressService.getTypes();
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getWordPressTaxonomiesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await wordpressService.getTaxonomies();
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getWordPressConditionTreatmentsHandler = async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
  try {
    const data = await wordpressService.getConditionTreatments(request.query as Record<string, any>);
    return reply.send({ success: true, ...data });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getGa4PropertiesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const properties = await ga4Service.getProperties();
    return reply.send({ success: true, data: properties });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const setGa4PropertyHandler = async (request: FastifyRequest<{ Body: { propertyId: string } }>, reply: FastifyReply) => {
  try {
    await ga4Service.setPropertyId(request.body.propertyId);
    return reply.send({ success: true });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getGscSitesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const sites = await gscService.getSites();
    return reply.send({ success: true, data: sites });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const setGscSiteHandler = async (request: FastifyRequest<{ Body: { siteUrl: string } }>, reply: FastifyReply) => {
  try {
    await gscService.setSiteUrl(request.body.siteUrl);
    return reply.send({ success: true });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const syncGoogleAdsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const campaigns = await googleAdsService.listCampaigns();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();
    
    const metrics = await googleAdsService.getCampaignMetricsByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    await campaignsService.upsertExternalCampaigns(campaigns, metrics);
    return reply.send({ success: true, message: 'Google Ads synced successfully' });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const syncMetaAdsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const campaigns = await metaAdsService.listCampaigns();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();
    
    const metrics = await metaAdsService.getCampaignMetricsByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    await campaignsService.upsertExternalCampaigns(campaigns, metrics);
    return reply.send({ success: true, message: 'Meta Ads synced successfully' });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const syncGbpHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await googleBusinessService.syncReviews();
    return reply.send({ success: true, message: 'GBP synced successfully' });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const syncCallrailHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await callRailService.syncCalls();
    return reply.send({ success: true, message: 'CallRail synced successfully' });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const syncHubspotHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await hubspotService.syncLeads();
    return reply.send({ success: true, message: 'HubSpot synced successfully' });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const syncMailchimpHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await mailchimpService.syncCampaigns();
    return reply.send({ success: true, message: 'Mailchimp synced successfully' });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const getGoogleAdsConfigHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const config = await googleAdsService.getConfig();
    return reply.send({ success: true, data: config });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export const setGoogleAdsConfigHandler = async (
  request: FastifyRequest<{ Body: { customerId: string; loginCustomerId?: string | null } }>,
  reply: FastifyReply
) => {
  try {
    const { customerId, loginCustomerId } = request.body;
    await googleAdsService.setConfig(customerId, loginCustomerId);
    return reply.send({ success: true, message: 'Google Ads configuration saved successfully' });
  } catch (err: any) {
    return reply.status(500).send({ success: false, error: err.message });
  }
};
