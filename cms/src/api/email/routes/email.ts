/**
 * email router
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/email/subscribe',
      handler: 'email.subscribe',
      config: {
        auth: false,
        middlewares: [
          { name: 'global::rate-limit', config: { maxRequests: 5, windowMs: 60_000 } },
        ],
      },
    },
    {
      method: 'POST',
      path: '/email/send',
      handler: 'email.send',
      config: {
        auth: false,
        middlewares: [
          { name: 'global::rate-limit', config: { maxRequests: 3, windowMs: 60_000 } },
        ],
      },
    },
  ],
};
