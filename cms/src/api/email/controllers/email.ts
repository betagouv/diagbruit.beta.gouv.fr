/**
 * email controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::email.email', () => ({
  async send(ctx) {
    const { to } = ctx.request.body;

    if (!to) {
      return ctx.badRequest('Missing "to" field');
    }

    await strapi.plugins['email'].services.email.send({
      to,
      subject: 'Votre diagnostic acoustique diagBruit',
      text: 'Merci pour votre inscription. Vous recevrez prochainement votre diagnostic bruit.',
      html: '<p>Merci pour votre inscription. Vous recevrez prochainement votre diagnostic bruit.</p>',
    });

    return ctx.send({ message: 'Email envoyé avec succès' });
  },
}));
