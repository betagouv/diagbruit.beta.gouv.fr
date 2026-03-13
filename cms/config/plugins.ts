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
    email: {
      config: {
        provider: "nodemailer",
        providerOptions: {
          host: env("NODEMAILER_HOST"),
          port: env.int("NODEMAILER_PORT", 587),
          secure: env("NODEMAILER_SECURE") === "true",
          requireTLS: env("NODEMAILER_TLS") === "true",
          ...(env("NODEMAILER_USER") && env("NODEMAILER_PASS")
            ? {
                auth: {
                  type: "LOGIN",
                  user: env("NODEMAILER_USER"),
                  pass: env("NODEMAILER_PASS"),
                },
              }
            : {}),
        },
        settings: {
          defaultFrom: env("NODEMAILER_FROM"),
          defaultReplyTo: env("NODEMAILER_FROM"),
        },
      },
    },
  };
};
