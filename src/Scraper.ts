import { existsSync } from 'node:fs';
import {
  writeFile,
  readFile,
  mkdir
} from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import {
  WebhookClient,
  roleMention
} from 'discord.js';
import { JSDOM } from 'jsdom';
import { type Logger } from 'winston';
import config from '../config/config.json' assert {'type': 'json'};
import { AnnouncementsStrategy } from './AnnouncementsStrategy.js';
import { CourseStrategy } from './CourseStrategy.js';
import { EventsStrategy } from './EventsStrategy.js';
import { JobsStrategy } from './JobsStrategy.js';
import { ProjectsStrategy } from './ProjectsStrategy.js';
import { getLogger } from './logger.js';

export class Scraper {
  private readonly strategy: ScraperStrategy;

  private readonly scraperConfig: ScraperConfig;

  private readonly scraperName: string;

  private readonly cookie: string;

  private readonly webhook: WebhookClient;

  private readonly logger: Logger;

  public constructor (scraperName: string) {
    if (!Object.keys(config.scrapers).includes(scraperName)) {
      throw new Error(`Scraper ${scraperName} not found in config`);
    }

    this.scraperName = scraperName;
    // @ts-expect-error - this is a valid key
    this.scraperConfig = config.scrapers[scraperName];
    this.strategy = Scraper.getStrategy(this.scraperConfig.strategy);
    this.webhook = new WebhookClient({ url: this.scraperConfig.webhook });
    this.cookie = this.scraperConfig.cookie ?? config.cookie;
    this.logger = getLogger(scraperName);
  }

  public static getStrategy (strategyName: string): ScraperStrategy {
    switch (strategyName) {
      case 'announcements': return new AnnouncementsStrategy();
      case 'course': return new CourseStrategy();
      case 'events': return new EventsStrategy();
      case 'jobs': return new JobsStrategy();
      case 'projects': return new ProjectsStrategy();
      default: throw new Error(`Strategy ${strategyName} not found`);
    }
  }

  public async run () {
    while (true) {
      this.logger.info('Searching...');

      let response: Response;

      try {
        response = await fetch(this.scraperConfig.link, this.strategy.getRequestInit(this.cookie));
      } catch (error) {
        this.logger.warn(`Error while fetching\n${error}`);
        await setTimeout(config.errorDelay);
        continue;
      }

      let text: string;

      try {
        text = await response.text();
      } catch (error) {
        this.logger.warn(`Error while parsing fetch results\n${error}`);
        await setTimeout(config.errorDelay);
        continue;
      }

      if (!response.ok) {
        this.logger.warn(`Received response code ${response.status}`);
        await setTimeout(config.errorDelay);
        continue;
      }

      if (!existsSync('cache')) {
        this.logger.debug('Creating cache directory...');
        await mkdir('cache');
      }

      const cache = (await readFile(`./cache/${this.scraperName}`, {
        encoding: 'utf8',
        flag: 'a+'
      })).trim().split('\n');

      const DOM = new JSDOM(text);

      const posts = Array.from(DOM.window.document.querySelectorAll(this.strategy.postsSelector));
      const links = posts.map((post) => post.querySelector(this.strategy.linksSelector)?.getAttribute('href'));

      if (links.length === 0 || links.includes(undefined) || links.includes(null)) {
        this.logger.warn('No posts found');
        await setTimeout(config.errorDelay);
        continue;
      }

      const cacheSet = new Set(cache);
      if (links.length === cache.length && links.every((value) => cacheSet.has(value as string))) {
        this.logger.info('No new posts');
        await setTimeout(config.successDelay);
        continue;
      }

      for (const post of posts.reverse().slice(0.3 * posts.length)) {
        const [link, embed] = this.strategy.getPostData(post);

        if (link === null || cacheSet.has(link)) {
          this.logger.info(`Post already sent: ${link}`);
          continue;
        }

        try {
          await this.webhook.send({
            content: this.scraperConfig.role === undefined || this.scraperConfig.role === '' ? '' : roleMention(this.scraperConfig.role),
            embeds: [embed]
          });
          this.logger.info(`Sent post: ${link}`);
        } catch (error) {
          this.logger.error(`Failed to send post ${link}\n${error}`);
        }
      }

      await writeFile(`./cache/${this.scraperName}`, links.join('\n'), {
        encoding: 'utf8',
        flag: 'w'
      });

      this.logger.info('Finished');
      await setTimeout(config.successDelay);
    }
  }
}
