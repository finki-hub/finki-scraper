import type { APIMessageTopLevelComponent, JSONEncodable } from 'discord.js';

export type PostData = {
  component: JSONEncodable<APIMessageTopLevelComponent>;
  id: null | string;
};
