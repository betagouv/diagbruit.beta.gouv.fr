/**
 * email controller
 */

import { factories } from '@strapi/strapi'
import { render } from '@react-email/render';
import DiagnosticEmail from '../templates/DiagnosticEmail';

export default factories.createCoreController('api::email.email', () => ({
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
