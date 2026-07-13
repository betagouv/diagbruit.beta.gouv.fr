import { createElement } from "react";
import { render } from "@react-email/render";
import { FollowUpEmail } from "../src/api/email/templates/DiagnosticEmail";

const FOLLOW_UP_UID = "api::follow-up-email-user.follow-up-email-user";
const FOLLOW_UP_SUBJECT = "Votre diagnostic diagBruit vous a-t-il été utile ?";

export default {
    followUpMail: {
        task: async ({ strapi }) => {
            if (process.env.NODE_ENV === "development") {
                strapi.log.info(
                    "Follow up mail cron is disabled in development environment."
                );
                return;
            }

            try {
                const html = await render(createElement(FollowUpEmail));

                let sent = 0;
                let deleted = 0;

                // Track entries whose deletion failed so we never re-fetch and
                // re-email the same recipient. Deletes normally succeed, so this
                // set stays empty and $notIn is omitted in the common case.
                const failed = new Set<string>();

                while (true) {
                    const filters = failed.size
                        ? { documentId: { $notIn: [...failed] } }
                        : {};
                    const users = await strapi
                        .documents(FOLLOW_UP_UID)
                        .findMany({ limit: 100, filters });

                    if (!users.length) break;

                    for (const user of users) {
                        try {
                            await strapi.plugins.email.services.email.send({
                                to: user.email,
                                subject: FOLLOW_UP_SUBJECT,
                                html,
                            });
                            sent++;
                        } catch (err) {
                            strapi.log.error(
                                `[cron] followUpMail: failed to send to ${user.email}: ${err}`
                            );
                        }

                        try {
                            await strapi
                                .documents(FOLLOW_UP_UID)
                                .delete({ documentId: user.documentId });
                            deleted++;
                        } catch (err) {
                            failed.add(user.documentId);
                            strapi.log.error(
                                `[cron] followUpMail: failed to delete ${user.documentId}: ${err}`
                            );
                        }
                    }
                }

                strapi.log.info(
                    `[cron] followUpMail: sent ${sent} follow-up email(s), deleted ${deleted} entrie(s).`
                );
            } catch (err) {
                strapi.log.error(`[cron] followUpMail failed: ${err}`);
            }
        },
        options: {
            rule: "0 9 * * *",
            tz: 'Europe/Paris',
        }
    }
}
