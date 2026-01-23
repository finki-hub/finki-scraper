import { ContainerBuilder, heading, hyperlink } from 'discord.js';

import type { PostData } from '../lib/Post.js';
import type { ScraperStrategy } from '../lib/Scraper.js';

const PARTNER_LABELS = ['Gold partner', 'Silver partner'] as const;

const cleanPartnerName = (name: null | string): null | string => {
  if (name === null) {
    return null;
  }

  let cleanedName = name;

  for (const label of PARTNER_LABELS) {
    cleanedName = cleanedName.replace(label, '').trim();
  }

  const result = cleanedName.replaceAll(/\s+/gu, ' ').trim();

  return result === '' ? null : result;
};

const isSupportedByPartner = (url: string): boolean => url.includes('a1.com');

export class PartnersStrategy implements ScraperStrategy {
  public idsSelector = 'a';

  public postsSelector = 'div.card, div.support';

  public getId(element: Element): null | string {
    const url =
      element.querySelector('a')?.getAttribute('href')?.trim() ?? null;

    if (url && isSupportedByPartner(url)) {
      return 'A1';
    }

    return cleanPartnerName(element.textContent);
  }

  public getPostData(element: Element): PostData {
    const url =
      element.querySelector('a')?.getAttribute('href')?.trim() ?? null;
    let name = cleanPartnerName(element.textContent) ?? '?';

    if (url && isSupportedByPartner(url)) {
      name = 'A1';
    }

    const component = new ContainerBuilder()
      .addTextDisplayComponents((textDisplayComponent) =>
        textDisplayComponent.setContent(
          url === null ? heading(name, 2) : heading(hyperlink(name, url), 2),
        ),
      )
      .addTextDisplayComponents((textDisplayComponent) =>
        textDisplayComponent.setContent('Нов партнер на ФИНКИ'),
      );

    return {
      component,
      id: this.getId(element),
    };
  }
}
