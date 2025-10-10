import { EmbedBuilder } from 'discord.js';
import { CasAuthentication } from 'finki-auth';
import { Service } from 'finki-auth/dist/lib/Service.js';

import type { PostData } from '../lib/Post.js';

import { getConfigProperty, getThemeColor } from '../configuration/config.js';
import { type ScraperStrategy } from '../lib/Scraper.js';

export class DiplomasStrategy implements ScraperStrategy {
  public idsSelector = 'div.panel-heading';

  public postsSelector = 'div.panel';

  public scraperService = Service.DIPLOMAS;

  public async getCookie(): Promise<string> {
    const credentials = getConfigProperty('credentials');

    if (credentials === undefined) {
      throw new Error(
        'Credentials are not defined. Please check your configuration.',
      );
    }

    const auth = new CasAuthentication(credentials);

    await auth.authenticate(Service.DIPLOMAS);

    return await auth.buildCookieHeader(Service.DIPLOMAS);
  }

  public getId(element: Element): null | string {
    return (
      element
        .querySelector(this.idsSelector)
        ?.textContent.replaceAll(/\s+/gu, ' ')
        .trim() ?? null
    );
  }

  public getPostData(element: Element): PostData {
    const title =
      element.querySelector('div.panel-heading')?.textContent.trim() ?? '?';

    const rows = element.querySelectorAll('div.panel-body table tr');

    const cellText = (row: number, col = 2) =>
      rows[row]?.querySelector(`td:nth-of-type(${col})`)?.textContent.trim() ??
      '?';

    const [index, student] = cellText(0)
      .split(' - ')
      .map((s) => s.trim());

    const mentor = cellText(1);
    const member1 = cellText(2);
    const member2 = cellText(3);

    const content = cellText(7).slice(0, 500);

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setAuthor({
        name: `${index} - ${student}`,
      })
      .addFields([
        { inline: true, name: 'Ментор', value: mentor },
        { inline: true, name: 'Член 1', value: member1 },
        { inline: true, name: 'Член 2', value: member2 },
      ])
      .setDescription(content === '' ? 'Нема опис.' : content)
      .setColor(getThemeColor())
      .setTimestamp();

    return {
      embed,
      id: this.getId(element),
    };
  }

  public getRequestInit(cookie: string | undefined): RequestInit | undefined {
    if (cookie === undefined) {
      return undefined;
    }

    return {
      credentials: 'include',
      headers: {
        Cookie: cookie,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      },
    };
  }
}
