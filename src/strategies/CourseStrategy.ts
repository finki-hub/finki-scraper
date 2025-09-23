import { EmbedBuilder } from 'discord.js';
import { CasAuthentication, Service } from 'finki-auth';

import type { PostData } from '../lib/Post.js';

import { getConfigProperty, getThemeColor } from '../configuration/config.js';
import { type ScraperStrategy } from '../lib/Scraper.js';
import { getCookieHeader } from '../utils/cookies.js';

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

    const auth = new CasAuthentication(
      credentials.username,
      credentials.password,
    );

    const rawCookies = await auth.authenticate(Service.COURSES);
    const cookies: Record<string, string> = {};

    for (const { key, value } of rawCookies) {
      cookies[key] = value;
    }

    return getCookieHeader(cookies);
  }

  public getId(element: Element): null | string {
    return (
      element.querySelector(this.idsSelector)?.getAttribute('href')?.trim() ??
      null
    );
  }

  public getPostData(element: Element): PostData {
    const linkEl = element.querySelector<HTMLAnchorElement>(
      '[title="Permanent link to this post"]',
    );
    const link = linkEl?.href ?? null;

    const imgEl = element.querySelector<HTMLImageElement>(
      'img[title*="Picture of"]',
    );
    const authorImage = imgEl?.src ?? undefined;

    const authorDiv = element.querySelector('div.mb-3');
    const authorAnchor = authorDiv?.querySelector('a');
    const authorName = authorAnchor?.textContent.trim() ?? '?';
    const authorLink = authorAnchor?.href ?? undefined;

    const content =
      element.querySelector('div.post-content-container')?.textContent.trim() ??
      '?';
    const title =
      element.querySelector('h4 > a:last-of-type')?.textContent.trim() ?? '?';

    const embed = new EmbedBuilder()
      .setTitle(title)
      // @ts-expect-error optional keys
      .setAuthor({
        iconURL: authorImage,
        name: authorName,
        url: authorLink,
      })
      .setURL(link)
      .setDescription(content === '' ? 'Нема опис.' : content.slice(0, 500))
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
