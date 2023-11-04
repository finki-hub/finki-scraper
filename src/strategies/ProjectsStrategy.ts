import { type ScraperStrategy } from "../types/Scraper.js";
import { EmbedBuilder } from "discord.js";

export class ProjectsStrategy implements ScraperStrategy {
  public postsSelector = "div.news-item";

  public idsSelector = "a + a";

  public getPostData(element: Element): [string | null, EmbedBuilder] {
    const url = element.querySelector("a + a")?.getAttribute("href")?.trim();
    const link = url === undefined ? null : `https://finki.ukim.mk${url}`;
    const title = element.querySelector("a + a")?.textContent?.trim() ?? "?";
    const content =
      element
        .querySelector("div.col-xs-12.col-sm-8 > div.field-content")
        ?.textContent?.trim()
        .slice(0, 500) ?? "?";
    const image =
      element.querySelector("img")?.getAttribute("src")?.split("?").at(0) ??
      "?";

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setURL(link)
      .setThumbnail(image)
      .setDescription(content === "" ? "Нема опис." : content)
      .setColor("#313183")
      .setTimestamp();

    return [link, embed];
  }

  public getRequestInit(): RequestInit | undefined {
    return undefined;
  }

  public getId(element: Element): string | null {
    const url = element
      .querySelector(this.idsSelector)
      ?.getAttribute("href")
      ?.trim();
    return url === undefined ? null : `https://finki.ukim.mk${url}`;
  }
}
