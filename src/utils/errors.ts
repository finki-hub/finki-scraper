import { logger } from './logger.js';
import { errorWebhook } from './webhooks.js';

export const registerGlobalErrorHandlers = () => {
  process.on('unhandledRejection', async (reason) => {
    logger.error({ reason }, 'Unhandled Promise Rejection');

    const msg =
      `❌ **Unhandled Promise Rejection (global)**\n` +
      `Message: ${reason instanceof Error ? reason.message : String(reason)}`;

    try {
      await errorWebhook?.send({ content: msg });
    } catch (error: unknown) {
      logger.error({ error }, 'Failed to send rejection to webhook');
    }
  });

  process.on('uncaughtException', async (err) => {
    logger.error({ err }, 'Uncaught Exception');

    const msg = `🚨 **Uncaught Exception (global)**\nMessage: ${err.message}`;

    try {
      await errorWebhook?.send({ content: msg });
    } catch (error: unknown) {
      logger.error({ error }, 'Failed to send exception to webhook');
    }

    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  });
};
