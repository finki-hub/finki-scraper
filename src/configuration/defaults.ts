import type { FullyRequiredConfig } from '../lib/Config.js';

export const DEFAULT_CONFIGURATION: FullyRequiredConfig = {
  errorDelay: 60_000,
  errorWebhook: '',
  maxPosts: 20,
  scrapers: {},
  sendPosts: false,
  successDelay: 180_000,
  webhook: '',
} as const;
