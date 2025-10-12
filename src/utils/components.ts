import { roleMention, TextDisplayBuilder } from 'discord.js';

export const createMentionComponent = (userId: string) =>
  new TextDisplayBuilder().setContent(roleMention(userId));

export const truncateString = (str: string, maxLength = 500): string =>
  str.length > maxLength ? `${str.slice(0, maxLength - 3)}...` : str;
