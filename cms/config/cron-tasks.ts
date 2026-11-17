import { createElement } from "react";
import { render } from "@react-email/render";
import { FollowUpEmailPlus1, FollowUpEmailPlus15, FollowUpEmailPlus7 } from "../src/api/email/templates/FollowUpEmails";

const FOLLOW_UP_UID = "api::follow-up-email-user.follow-up-email-user";
const FOLLOW_UP_SUBJECT = "diagBruit – Des questions sur votre diagnostic ? ";

const FOLLOW_UP_PLUS7_UID =
    "api::follow-up-email-plus7-user.follow-up-email-plus7-user";
const FOLLOW_UP_PLUS7_SUBJECT = "diagBruit – À propos de votre diagnostic";
const FOLLOW_UP_PLUS15_UID =
    "api::follow-up-email-plus15-user.follow-up-email-plus15-user";
const FOLLOW_UP_PLUS15_SUBJECT = "diagBruit – Des retours suite à votre diagnostic ?";
const FOLLOW_UP_PLUS7_DELAY_DAYS = 7;
const FOLLOW_UP_PLUS15_DELAY_DAYS = 15;

const FOLLOW_UP_TEST_MODE =
    process.env.FOLLOW_UP_TEST_MODE === "true" &&
    process.env.NODE_ENV === "development";

const DAY_MS = 24 * 60 * 60 * 1000;

const FOLLOW_UP_DELAY_MS = FOLLOW_UP_TEST_MODE ? 1000 : 0;
const FOLLOW_UP_PLUS7_DELAY_MS = FOLLOW_UP_TEST_MODE
    ? 7000
    : FOLLOW_UP_PLUS7_DELAY_DAYS * DAY_MS;
const FOLLOW_UP_PLUS15_DELAY_MS = FOLLOW_UP_TEST_MODE
    ? 15000
    : FOLLOW_UP_PLUS15_DELAY_DAYS * DAY_MS;

const CRON_OPTIONS = {
    rule: FOLLOW_UP_TEST_MODE ? "* * * * * *" : "0 9 * * *",
    tz: "Europe/Paris",
};

const isCronDisabled = () =>
    process.env.NODE_ENV === "development" && !FOLLOW_UP_TEST_MODE;

const createdBefore = (delayMs: number) =>
    delayMs > 0
        ? { createdAt: { $lte: new Date(Date.now() - delayMs).toISOString() } }
        : {};


const running = new Set<string>();
async function runExclusive(label: string, fn: () => Promise<void>) {
    if (running.has(label)) return;
    running.add(label);
    try {
        await fn();
    } finally {
        running.delete(label);
    }
}

async function sendFollowUps(
    strapi,
    {
        label,
        uid,
        subject,
        html,
        filters = {},
    }: {
        label: string;
        uid: string;
        subject: string;
        html: string;
        filters?: Record<string, unknown>;
    }
) {
    let sent = 0;
    let deleted = 0;
    let sendFailed = 0;

    const skipped = new Set<string>();

    while (true) {
        const pageFilters = skipped.size
            ? { $and: [filters, { documentId: { $notIn: [...skipped] } }] }
            : filters;
        const users = await strapi
            .documents(uid)
            .findMany({ limit: 100, filters: pageFilters });

        if (!users.length) break;

        for (const user of users) {
            try {
                await strapi.plugins.email.services.email.send({
                    to: user.email,
                    subject,
                    html,
                });
                sent++;
            } catch (err) {

                sendFailed++;
                skipped.add(user.documentId);
                strapi.log.error(
                    `[cron] ${label}: failed to send to ${user.email}, will retry next run: ${err}`
                );
                continue;
            }

            try {
                await strapi.documents(uid).delete({ documentId: user.documentId });
                deleted++;
            } catch (err) {
                skipped.add(user.documentId);
                strapi.log.error(
                    `[cron] ${label}: failed to delete ${user.documentId}: ${err}`
                );
            }
        }
    }

    if (sent || deleted || sendFailed || !FOLLOW_UP_TEST_MODE) {
        strapi.log.info(
            `[cron] ${label}: sent ${sent} follow-up email(s), deleted ${deleted} entrie(s), ${sendFailed} send failure(s) kept for retry.`
        );
    }
}

export default {
    // J+1
    followUpMail: {
        task: async ({ strapi }) => {
            if (isCronDisabled()) {
                strapi.log.info(
                    "Follow up mail cron is disabled in development environment."
                );
                return;
            }

            await runExclusive("followUpMail", async () => {
                try {
                    const html = await render(createElement(FollowUpEmailPlus1));
                    await sendFollowUps(strapi, {
                        label: "followUpMail",
                        uid: FOLLOW_UP_UID,
                        subject: FOLLOW_UP_SUBJECT,
                        html,
                        filters: createdBefore(FOLLOW_UP_DELAY_MS),
                    });
                } catch (err) {
                    strapi.log.error(`[cron] followUpMail failed: ${err}`);
                }
            });
        },
        options: CRON_OPTIONS,
    },

    // J+7 
    followUpMailPlus7: {
        task: async ({ strapi }) => {
            if (isCronDisabled()) {
                strapi.log.info(
                    "Follow up mail J+7 cron is disabled in development environment."
                );
                return;
            }

            await runExclusive("followUpMailPlus7", async () => {
                try {
                    const html = await render(createElement(FollowUpEmailPlus7));
                    await sendFollowUps(strapi, {
                        label: "followUpMailPlus7",
                        uid: FOLLOW_UP_PLUS7_UID,
                        subject: FOLLOW_UP_PLUS7_SUBJECT,
                        html,
                        filters: createdBefore(FOLLOW_UP_PLUS7_DELAY_MS),
                    });
                } catch (err) {
                    strapi.log.error(`[cron] followUpMailPlus7 failed: ${err}`);
                }
            });
        },
        options: CRON_OPTIONS,
    },
    //J+15
    followUpMailPlus15: {
        task: async ({ strapi }) => {
            if (isCronDisabled()) {
                strapi.log.info(
                    "Follow up mail J+15 cron is disabled in development environment."
                );
                return;
            }

            await runExclusive("followUpMailPlus15", async () => {
                try {
                    const html = await render(createElement(FollowUpEmailPlus15));
                    await sendFollowUps(strapi, {
                        label: "followUpMailPlus15",
                        uid: FOLLOW_UP_PLUS15_UID,
                        subject: FOLLOW_UP_PLUS15_SUBJECT,
                        html,
                        filters: createdBefore(FOLLOW_UP_PLUS15_DELAY_MS),
                    });
                } catch (err) {
                    strapi.log.error(`[cron] followUpMailPlus15 failed: ${err}`);
                }
            });
        },
        options: CRON_OPTIONS,
    },
};
