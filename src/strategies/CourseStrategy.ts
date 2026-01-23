import {
  bold,
  ContainerBuilder,
  heading,
  hyperlink,
  TextDisplayBuilder,
} from 'discord.js';
import { CasAuthentication, Service } from 'finki-auth';

import type { PostData } from '../lib/Post.js';

import { getConfigProperty } from '../configuration/config.js';
import { type ScraperStrategy } from '../lib/Scraper.js';
import { truncateString } from '../utils/components.js';

export class CourseStrategy implements ScraperStrategy {
  public idsSelector = '[title="Permanent link to this post"]';

  public postsSelector = 'article';

  public scraperService = Service.COURSES;

  public filterPosts(posts: Element[]): Element[] {
    return posts.toReversed().slice(0.3 * posts.length);
  }

  public async getCookie(): Promise<string> {
    const credentials = getConfigProperty('credentials');

    if (credentials === undefined) {
      throw new Error(
        'Credentials are not defined. Please check your configuration.',
      );
    }

    const auth = new CasAuthentication(credentials);

    await auth.authenticate(Service.COURSES);

    return await auth.buildCookieHeader(Service.COURSES);
  }

  public getId(element: Element): null | string {
    const id = element
      .querySelector(this.idsSelector)
      ?.getAttribute('href')
      ?.trim();
    return id === undefined || id === '' ? null : id;
  }

  public getPostData(element: Element): PostData {
    const linkEl = element.querySelector<HTMLAnchorElement>(
      '[title="Permanent link to this post"]',
    );
    const link = linkEl?.href ?? null;

    const imgEl = element.querySelector<HTMLImageElement>(
      'img[title*="Picture of"]',
    );
    const authorImage = imgEl?.src ?? null;

    const authorDiv = element.querySelector('div.mb-3');
    const authorAnchor = authorDiv?.querySelector('a');
    const authorName = authorAnchor?.textContent.trim() ?? '?';
    const authorLink = authorAnchor?.href ?? null;

    const content =
      element.querySelector('div.post-content-container')?.textContent.trim() ??
      '?';
    const title =
      element.querySelector('h4 > a:last-of-type')?.textContent.trim() ?? '?';

    const textDisplayComponents = [
      new TextDisplayBuilder().setContent(
        authorLink === null
          ? bold(authorName)
          : bold(hyperlink(authorName, authorLink)),
      ),
      new TextDisplayBuilder().setContent(
        link === null ? heading(title, 3) : heading(hyperlink(title, link), 3),
      ),
      new TextDisplayBuilder().setContent(
        content === '' ? 'Нема опис.' : truncateString(content),
      ),
    ];

    const containerBuilder = new ContainerBuilder();

    const component =
      authorImage === null
        ? containerBuilder.addTextDisplayComponents(textDisplayComponents)
        : containerBuilder.addSectionComponents((sectionComponentBuilder) =>
            sectionComponentBuilder
              .setThumbnailAccessory((thumbnailBuilder) =>
                thumbnailBuilder.setURL(authorImage),
              )
              .addTextDisplayComponents(textDisplayComponents),
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
