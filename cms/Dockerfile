ARG OAUTH2_PROXY_VERSION=v7.7.1

FROM quay.io/oauth2-proxy/oauth2-proxy:${OAUTH2_PROXY_VERSION} AS proxy

# Creating multi-stage build for production
FROM node:22.9.0-alpine AS build
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git > /dev/null 2>&1
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/
COPY package.json yarn.lock ./
RUN yarn global add node-gyp
RUN yarn config set network-timeout 600000 -g && yarn install --production
ENV PATH=/opt/node_modules/.bin:$PATH
WORKDIR /opt/app
COPY . .
RUN yarn build

# Creating final production image
FROM node:22.9.0-alpine
RUN apk add --no-cache vips-dev bash
COPY --from=proxy /bin/oauth2-proxy /usr/local/bin/oauth2-proxy
ENV NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /opt/
COPY --from=build /opt/node_modules ./node_modules
WORKDIR /opt/app
COPY --from=build /opt/app ./
ENV PATH=/opt/node_modules/.bin:$PATH

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && chown -R node:node /opt/app
USER node
CMD ["/entrypoint.sh"]
