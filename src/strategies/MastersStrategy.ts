import {
  bold,
  ContainerBuilder,
  heading,
  SeparatorSpacingSize,
} from 'discord.js';
import { CasAuthentication, Service } from 'finki-auth';

import type { PostData } from '../lib/Post.js';
import type { ScraperStrategy } from '../lib/Scraper.js';

import { getConfigProperty } from '../configuration/config.js';
import { truncateString } from '../utils/components.js';

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

    const content = cellText(8);

    const component = new ContainerBuilder()
      .addTextDisplayComponents((textDisplayComponent) =>
        textDisplayComponent.setContent(bold(`${indexSpan} - ${student}`)),
      )
      .addSeparatorComponents((separatorComponent) =>
        separatorComponent.setSpacing(SeparatorSpacingSize.Large),
      )
      .addTextDisplayComponents((textDisplayComponent) =>
        textDisplayComponent.setContent(heading(title, 3)),
      )
      .addSeparatorComponents((separatorComponent) =>
        separatorComponent
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(false),
      )
      .addTextDisplayComponents((textDisplayComponent) =>
        textDisplayComponent.setContent(
          content === '' ? 'Нема опис.' : truncateString(content),
        ),
      )
      .addSeparatorComponents((separatorComponent) =>
        separatorComponent.setSpacing(SeparatorSpacingSize.Large),
      )
      .addTextDisplayComponents((textDisplayComponent) =>
        textDisplayComponent.setContent(`${bold('Ментор:')} ${mentor}`),
      )
      .addTextDisplayComponents((textDisplayComponent) =>
        textDisplayComponent.setContent(`${bold('Претседател:')} ${president}`),
      )
      .addTextDisplayComponents((textDisplayComponent) =>
        textDisplayComponent.setContent(`${bold('Член:')} ${member}`),
      );

    return {
      component,
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
