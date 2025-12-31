import {
  ContainerBuilder,
  heading,
  hyperlink,
  TextDisplayBuilder,
} from 'discord.js';

import type { PostData } from '../lib/Post.js';

import { type ScraperStrategy } from '../lib/Scraper.js';
import { truncateString } from '../utils/components.js';

export class EventsStrategy implements ScraperStrategy {
  public idsSelector = 'a + a';

  public postsSelector = 'div.news-item';

  public getId(element: Element): null | string {
    const url = element
      .querySelector(this.idsSelector)
      ?.getAttribute('href')
      ?.trim();
    return url === undefined ? null : `https://finki.ukim.mk${url}`;
  }

  public getPostData(element: Element): PostData {
    const url = element.querySelector('a + a')?.getAttribute('href')?.trim();
    const link = url === undefined ? null : `https://finki.ukim.mk${url}`;
    const title = element.querySelector('a + a')?.textContent.trim() ?? '?';
    const content =
      element
        .querySelector('div.col-xs-12.col-sm-8 > div.field-content')
        ?.textContent.trim() ?? '?';
    const image =
      element.querySelector('img')?.getAttribute('src')?.split('?').at(0) ??
      null;

    const textDisplayComponents = [
      new TextDisplayBuilder().setContent(
        link === null ? heading(title, 3) : heading(hyperlink(title, link), 3),
      ),
      new TextDisplayBuilder().setContent(
        content === '' ? 'Нема опис.' : truncateString(content),
      ),
    ];

    const containerBuilder = new ContainerBuilder();

    const component =
      image === null
        ? containerBuilder.addTextDisplayComponents(textDisplayComponents)
        : containerBuilder.addSectionComponents((sectionComponentBuilder) =>
            sectionComponentBuilder
              .addTextDisplayComponents(textDisplayComponents)
              .setThumbnailAccessory((thumbnailBuilder) =>
                thumbnailBuilder.setURL(image),
              ),
          );

    return {
      component,
      id: this.getId(element),
    };
  }
}
