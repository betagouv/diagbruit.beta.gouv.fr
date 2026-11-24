import { createElement } from "react";
import { render } from "@react-email/render";
import { FollowUpEmailPlus1, FollowUpEmailPlus15, FollowUpEmailPlus7 } from "../src/api/email/templates/FollowUpEmails";
import {
    FOLLOW_UP_PLUS15_UID,
    FOLLOW_UP_PLUS7_UID,
    FOLLOW_UP_UID,
} from "../src/api/email/followUps";

const FOLLOW_UP_SUBJECT = "diagBruit – Des questions sur votre diagnostic ? ";

const FOLLOW_UP_PLUS7_SUBJECT = "diagBruit – À propos de votre diagnostic";
const FOLLOW_UP_PLUS15_SUBJECT = "diagBruit – Des retours suite à votre diagnostic ?";
const FOLLOW_UP_DELAY_DAYS = 1;
const FOLLOW_UP_PLUS7_DELAY_DAYS = 7;
const FOLLOW_UP_PLUS15_DELAY_DAYS = 15;

const FOLLOW_UP_TEST_MODE =
    process.env.FOLLOW_UP_TEST_MODE === "true" &&
    process.env.NODE_ENV === "development";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SEND_ATTEMPTS = 3;

const CRON_OPTIONS = {
    rule: FOLLOW_UP_TEST_MODE ? "* * * * * *" : "0 9 * * *",
    tz: "Europe/Paris",
};

const isCronDisabled = () =>
    process.env.NODE_ENV === "development" && !FOLLOW_UP_TEST_MODE;

const startOfParisDay = (date: Date) => {
    const { hour, minute, second } = Object.fromEntries(
        new Intl.DateTimeFormat("en-GB", {
            timeZone: "Europe/Paris",
            hourCycle: "h23",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
        })
            .formatToParts(date)
            .map(({ type, value }) => [type, Number(value)])
    );
    return new Date(
        date.getTime() -
            date.getMilliseconds() -
            ((hour * 60 + minute) * 60 + second) * 1000
    );
};

const createdAtLeastDaysAgo = (days: number) => ({
    createdAt: FOLLOW_UP_TEST_MODE
        ? { $lte: new Date(Date.now() - days * 1000).toISOString() }
        : {
              $lt: startOfParisDay(
                  new Date(Date.now() - (days - 1) * DAY_MS)
              ).toISOString(),
          },
});

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
    let abandoned = 0;

    const skipped = new Set<string>();
    const sentTo = new Set<string>();

    while (true) {
        const pageFilters = skipped.size
            ? { $and: [filters, { documentId: { $notIn: [...skipped] } }] }
            : filters;
        const users = await strapi
            .documents(uid)
            .findMany({ limit: 100, filters: pageFilters });

        if (!users.length) break;

        for (const user of users) {
            const email = user.email.toLowerCase();
            if (sentTo.has(email)) {
                try {
                    await strapi.documents(uid).delete({ documentId: user.documentId });
                    deleted++;
                } catch (err) {
                    skipped.add(user.documentId);
                    strapi.log.error(
                        `[cron] ${label}: failed to delete duplicate ${user.documentId}: ${err}`
                    );
                }
                continue;
            }

            try {
                await strapi.plugins.email.services.email.send({
                    to: user.email,
                    subject,
                    html,
                });
                sent++;
                sentTo.add(email);
            } catch (err) {
                skipped.add(user.documentId);
                const attempts = (user.attempts ?? 0) + 1;

                if (attempts >= MAX_SEND_ATTEMPTS) {
                    abandoned++;
                    strapi.log.error(
                        `[cron] ${label}: failed to send to ${user.email} after ${attempts} attempts, giving up: ${err}`
                    );
                    try {
                        await strapi.documents(uid).delete({ documentId: user.documentId });
                    } catch (deleteErr) {
                        strapi.log.error(
                            `[cron] ${label}: failed to delete ${user.documentId}: ${deleteErr}`
                        );
                    }
                    continue;
                }

                sendFailed++;
                strapi.log.error(
                    `[cron] ${label}: failed to send to ${user.email} (attempt ${attempts}/${MAX_SEND_ATTEMPTS}), will retry next run: ${err}`
                );
                try {
                    await strapi.documents(uid).update({
                        documentId: user.documentId,
                        data: { attempts },
                    });
                } catch (updateErr) {
                    strapi.log.error(
                        `[cron] ${label}: failed to record attempt for ${user.documentId}: ${updateErr}`
                    );
                }
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

    if (sent || deleted || sendFailed || abandoned || !FOLLOW_UP_TEST_MODE) {
        strapi.log.info(
            `[cron] ${label}: sent ${sent} follow-up email(s), deleted ${deleted} entrie(s), ${sendFailed} send failure(s) kept for retry, ${abandoned} abandoned.`
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
                        filters: createdAtLeastDaysAgo(FOLLOW_UP_DELAY_DAYS),
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
                        filters: createdAtLeastDaysAgo(FOLLOW_UP_PLUS7_DELAY_DAYS),
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
                        filters: createdAtLeastDaysAgo(FOLLOW_UP_PLUS15_DELAY_DAYS),
                    });
                } catch (err) {
                    strapi.log.error(`[cron] followUpMailPlus15 failed: ${err}`);
                }
            });
        },
        options: CRON_OPTIONS,
    },
};
