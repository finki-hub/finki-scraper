import { ContainerBuilder, heading, hyperlink } from 'discord.js';

import type { PostData } from '../lib/Post.js';
import type { ScraperStrategy } from '../lib/Scraper.js';

export class ExampleStrategy implements ScraperStrategy {
  public idsSelector = 'Selector for a unique identifier within each container';

  public postsSelector = 'Selector for all data containers';

  // Function for returning the ID of each data container
  public getId(element: Element): null | string {
    const url = element
      .querySelector(this.idsSelector)
      ?.getAttribute('href')
      ?.trim();
    return url ?? null;
  }

  // Function for returning a component representation of each data container
  public getPostData(element: Element): PostData {
    const url = element.querySelector('a')?.getAttribute('href')?.trim();
    const link = url ?? null;
    const title = element.querySelector('a')?.textContent.trim() ?? '?';

    const component = new ContainerBuilder().addTextDisplayComponents(
      (textDisplayComponent) =>
        textDisplayComponent.setContent(
          heading(link === null ? title : hyperlink(title, link), 2),
        ),
    );

    return {
      component,
      id: this.getId(element),
    };
  }
}
