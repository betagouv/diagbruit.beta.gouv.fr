const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export default (_config, { strapi }) => {
  return async (ctx, next) => {
    const config = {
      maxRequests: _config.maxRequests || 10,
      windowMs: _config.windowMs || 60_000,
    };

    const ip = ctx.request.ip;
    const key = `${ip}:${ctx.request.path}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
      return next();
    }

    if (entry.count >= config.maxRequests) {
      ctx.status = 429;
      ctx.body = { error: 'Too many requests, please try again later.' };
      return;
    }

    entry.count += 1;
    return next();
  };
};
