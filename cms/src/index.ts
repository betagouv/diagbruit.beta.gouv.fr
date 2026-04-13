import type { Core } from '@strapi/strapi';
import homePageContentSeed from './seeds/home-page-content.json';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const uid = 'api::home-page-content.home-page-content';

    const existing = await strapi.documents(uid).findFirst({ status: 'published' });

    if (!existing) {
      strapi.log.info('[seed] No home-page-content found, seeding...');
      await strapi.documents(uid).create({ data: homePageContentSeed, status: 'published' });
      strapi.log.info('[seed] home-page-content seeded.');
    }
  },
};