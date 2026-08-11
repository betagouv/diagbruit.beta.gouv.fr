import type { Core } from '@strapi/strapi';
import homePageContentSeed from './seeds/home-page-content.json';
import noisezoneAlertSeed from './seeds/noisezone-alert.json';
import acousticCertification from './seeds/acoustic-certificate.json'
import emailProfilesSeed from './seeds/email-profiles.json';

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
    const certificateUid = 'api::acoustic-certificate.acoustic-certificate';
    const existingCertificate = await strapi.documents(certificateUid).findFirst();
    if (!existingCertificate) {
      strapi.log.info('[seed] No acoustic-certificate found, seeding...');
      await strapi.documents(certificateUid).create({ data: acousticCertification as any, status: 'published' });
      strapi.log.info('[seed] acoustic-certificate seeded.');
    }

    const emailProfileUid = 'api::email-form-profile.email-form-profile';
    const existingEmailProfile = await strapi.documents(emailProfileUid).findFirst();
    if (!existingEmailProfile) {
      strapi.log.info(`[seed] No email-form-profile found, seeding ${emailProfilesSeed.length} profile(s)...`);
      await strapi.documents(emailProfileUid).create({
        data: { EmailProfiles: emailProfilesSeed } as any,
        status: 'published',
      });
      strapi.log.info('[seed] email-form-profile seeded.');
    }
  },
};
