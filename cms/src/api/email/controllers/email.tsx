/**
 * email controller
 */

import { factories } from '@strapi/strapi'
import { render } from '@react-email/render';
import DiagnosticEmail from '../templates/DiagnosticEmail';

export default factories.createCoreController('api::email.email', () => ({
  async subscribe(ctx) {
    const { email, profile } = ctx.request.body;

    if (!email || !profile) {
      return ctx.badRequest('Missing email or profile');
    }

    const existing = await strapi.documents('api::email.email').findMany({
      filters: { email },
    });

    if (existing.length > 0) {
      const doc = existing[0];
      await strapi.documents('api::email.email').update({
        documentId: doc.documentId,
        data: { count: (doc.count || 0) + 1 },
      });
      return ctx.send({ message: 'Email already registered, count incremented' });
    }

    await strapi.documents('api::email.email').create({
      data: { email, profile, count: 1, publishedAt: new Date() },
    });

    return ctx.send({ message: 'Email registered successfully' });
  },

  async send(ctx) {
    const { to, link } = ctx.request.body;

    if (!to) {
      return ctx.badRequest('Missing "to" field');
    }

    const html = await render(<DiagnosticEmail diagLink={link} />);

    await strapi.plugins['email'].services.email.send({
      to,
      subject: 'Votre diagnostic acoustique diagBruit',
      html,
    });

    return ctx.send({ message: 'Email envoyé avec succès' });
  },
}));
