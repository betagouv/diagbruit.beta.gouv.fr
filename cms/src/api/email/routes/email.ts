/**
 * email router
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/email/send',
      handler: 'email.send',
      config: {
        auth: false,
      },
    },
  ],
};
