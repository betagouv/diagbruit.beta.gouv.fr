import type { Core } from '@strapi/strapi';
import homePageContentSeed from './seeds/home-page-content.json';
import noisezoneAlertSeed from './seeds/noisezone-alert.json';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) { },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const homeUid = 'api::home-page-content.home-page-content';
    const existingHome = await strapi.documents(homeUid).findFirst({ status: 'published' });
    if (!existingHome) {
      strapi.log.info('[seed] No home-page-content found, seeding...');
      await strapi.documents(homeUid).create({ data: homePageContentSeed, status: 'published' });
      strapi.log.info('[seed] home-page-content seeded.');
    }

    const alertUid = 'api::noisezone-alert.noisezone-alert';
    const existingAlert = await strapi.documents(alertUid).findFirst();
    if (!existingAlert) {
      strapi.log.info(`[seed] No noisezone-alert found, seeding ${noisezoneAlertSeed.length}...`);
      for (const data of noisezoneAlertSeed) {
        await strapi.documents(alertUid).create({ data: data as any, status: 'published' });
      }
      strapi.log.info('[seed] noisezone-alert seeded.');
    }
  },
};
