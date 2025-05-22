module.exports = ({ env }) => {
  const hasAwsCreds =
    env("AWS_ACCESS_KEY_ID") &&
    env("AWS_SECRET_ACCESS_KEY") &&
    env("AWS_BUCKET") &&
    env("AWS_REGION");

  const isUsingAws = hasAwsCreds && env("NODE_ENV") === "production";

  return {
    upload: {
      config: isUsingAws
        ? {
            provider: "aws-s3",
            providerOptions: {
              accessKeyId: env("AWS_ACCESS_KEY_ID"),
              secretAccessKey: env("AWS_SECRET_ACCESS_KEY"),
              region: env("AWS_REGION"),
              params: {
                Bucket: env("AWS_BUCKET"),
              },
            },
          }
        : {
            provider: "local",
            providerOptions: {
              sizeLimit: 1000000,
            },
          },
    },
  };
};
