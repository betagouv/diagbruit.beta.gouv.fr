/**
 * email controller
 */

import { factories } from '@strapi/strapi'
import { render } from '@react-email/render';
import DiagnosticEmail from '../templates/DiagnosticEmail';

export default factories.createCoreController('api::email.email', () => ({
  async send(ctx) {
    const { to } = ctx.request.body;
    const html = await render(<DiagnosticEmail />);

    if (!to) {
      return ctx.badRequest('Missing "to" field');
    }

    await strapi.plugins['email'].services.email.send({
      to,
      subject: 'Votre diagnostic acoustique diagBruit',
      html: html,
    });

    return ctx.send({ message: 'Email envoyé avec succès' });
  },
}));
