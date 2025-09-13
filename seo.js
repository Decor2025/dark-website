import { writeFileSync } from "fs";
import { SitemapStream, streamToPromise } from "sitemap";

async function generateSitemap() {
  // ✅ Add all public routes (skip login/cart/profile)
  const links = [
    { url: "/", changefreq: "weekly", priority: 1.0 },
    { url: "/about", changefreq: "monthly", priority: 0.8 },
    { url: "/contact", changefreq: "monthly", priority: 0.8 },
    { url: "/catalogue", changefreq: "weekly", priority: 0.9 },
    { url: "/estimate", changefreq: "monthly", priority: 0.7 },
    { url: "/our-work", changefreq: "monthly", priority: 0.8 },
    { url: "/terms", changefreq: "yearly", priority: 0.5 },
    { url: "/privacy", changefreq: "yearly", priority: 0.5 },
  ];

  // Build sitemap
  const stream = new SitemapStream({ hostname: "https://decordrapesinstyle.com" });
  links.forEach(link => stream.write(link));
  stream.end();

  // Save sitemap in public/
  const sitemap = await streamToPromise(stream).then(sm => sm.toString());
  writeFileSync("./public/sitemap.xml", sitemap);
}

generateSitemap();
