ARG METABASE_VERSION=latest
ARG OAUTH2_PROXY_VERSION=v7.7.1

FROM quay.io/oauth2-proxy/oauth2-proxy:${OAUTH2_PROXY_VERSION} AS proxy

FROM metabase/metabase:${METABASE_VERSION}

COPY --from=proxy /bin/oauth2-proxy /usr/local/bin/oauth2-proxy
COPY entrypoint.sh /entrypoint.sh

CMD ["/entrypoint.sh"]
