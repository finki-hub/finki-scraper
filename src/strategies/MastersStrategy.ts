import { EmbedBuilder } from 'discord.js';
import { CasAuthentication, Service } from 'finki-auth';

import type { PostData } from '../lib/Post.js';
import type { ScraperStrategy } from '../lib/Scraper.js';

import { getConfigProperty, getThemeColor } from '../configuration/config.js';

export class MastersStrategy implements ScraperStrategy {
  public idsSelector = 'h5.p-2.mt-1';

  public postsSelector = 'div.row.rounded';

  public scraperService = Service.MASTERS;

  public async getCookie(): Promise<string> {
    const credentials = getConfigProperty('credentials');

    if (credentials === undefined) {
      throw new Error(
        'Credentials are not defined. Please check your configuration.',
      );
    }

    const auth = new CasAuthentication(credentials);

    await auth.authenticate(Service.MASTERS);

    return await auth.buildCookieHeader(Service.MASTERS);
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
    const title = element.querySelector('h5')?.textContent.trim() ?? '?';

    const rows = element.querySelectorAll('table tbody tr');

    const cellText = (row: number, col = 2) =>
      rows[row]?.querySelector(`td:nth-of-type(${col})`)?.textContent.trim() ??
      '?';

    const studentCell = rows[0]?.querySelector('td:nth-of-type(2)');
    const indexSpan =
      studentCell?.querySelector('span:nth-of-type(1)')?.textContent.trim() ??
      '?';
    const lastNameSpan =
      studentCell?.querySelector('span:nth-of-type(2)')?.textContent.trim() ??
      '?';
    const firstNameSpan =
      studentCell?.querySelector('span:nth-of-type(3)')?.textContent.trim() ??
      '?';
    const student = `${lastNameSpan} ${firstNameSpan}`;

    const mentor = cellText(1);
    const president = cellText(2);
    const member = cellText(3);

    const content = cellText(8).slice(0, 500);

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setAuthor({
        name: `${indexSpan} - ${student}`,
      })
      .addFields([
        { inline: true, name: 'Ментор', value: mentor },
        { inline: true, name: 'Претседател', value: president },
        { inline: true, name: 'Член', value: member },
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
      },
    };
  }
}
