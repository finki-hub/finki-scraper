import { logger } from './logger.js';
import { errorWebhook } from './webhooks.js';

export const registerGlobalErrorHandlers = () => {
  process.on('unhandledRejection', async (reason) => {
    logger.error({ reason }, 'Unhandled Promise Rejection');

    const msg =
      `❌ **Unhandled Promise Rejection (global)**\n` +
      `Message: ${reason instanceof Error ? reason.message : String(reason)}\n` +
      `⚠️ **The application will continue running**, but this indicates a bug that should be fixed.`;

    try {
      await errorWebhook?.send({ content: msg });
    } catch (error: unknown) {
      logger.error({ error }, 'Failed to send rejection to webhook');
    }
  });

  process.on('uncaughtException', async (err) => {
    logger.error({ err }, 'Uncaught Exception');

    const msg =
      `🚨 **Uncaught Exception (global)**\n` +
      `Message: ${err.message}\n` +
      `🛑 **THE APPLICATION WILL NOW EXIT**. This is a critical error that requires immediate attention.`;

    try {
      await errorWebhook?.send({ content: msg });
    } catch (error: unknown) {
      logger.error({ error }, 'Failed to send exception to webhook');
    }

    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  });
};

export const extractErrorCauses = (error: unknown): string[] => {
  const causes: string[] = [];
  let current: unknown = error;

  while (current !== undefined && current !== null) {
    if (!Error.isError(current)) {
      break;
    }

    const next: unknown = current.cause;

    if (next === undefined || next === current) {
      break;
    }

    current = next;

    causes.push(Error.isError(current) ? current.message : String(current));
  }

  return causes;
};
