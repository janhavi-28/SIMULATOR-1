import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { TRENDING_TOPICS_PHYSICS_SIMS } from "@/lib/data/simulation-mapping";
import { physicsChapters, physicsTopicsByChapter } from "@/lib/data/senior-secondary-physics";
import { SENIOR_SECONDARY_PHYSICS_SIMS } from "@/lib/data/simulation-mapping";
import { chemistry11Chapters } from "@/app/subjects/class-11/data";
import { mathsChapters } from "@/app/subjects/class-11/maths/chapters-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const now = new Date().toISOString();

  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/subjects`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/high-school/physics`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/high-school/chemistry`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/high-school/maths`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/senior-secondary/physics`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/senior-secondary/chemistry`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/senior-secondary/maths`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/trending-topics/physics`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/trending-topics/chemistry`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/trending-topics/maths`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/trending-topics/biology`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];

  // Trending Topics Physics simulations
  for (const slug of TRENDING_TOPICS_PHYSICS_SIMS) {
    entries.push({
      url: `${base}/trending-topics/physics/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    });
  }

  // Senior Secondary Physics – chapters and simulation topics
  for (const ch of physicsChapters) {
    entries.push({
      url: `${base}/senior-secondary/physics/${ch.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
    const topics = physicsTopicsByChapter[ch.id] ?? [];
    for (const t of topics) {
      entries.push({
        url: `${base}/senior-secondary/physics/${ch.id}/${t.id}`,
        lastModified: now,
        changeFrequency: (SENIOR_SECONDARY_PHYSICS_SIMS as readonly string[]).includes(t.id) ? "weekly" : "monthly",
        priority: (SENIOR_SECONDARY_PHYSICS_SIMS as readonly string[]).includes(t.id) ? 0.85 : 0.75,
      });
    }
  }

  // Senior Secondary Chemistry – chapters and topics
  for (const ch of chemistry11Chapters) {
    entries.push({
      url: `${base}/senior-secondary/chemistry/${ch.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
    for (const t of ch.topics) {
      entries.push({
        url: `${base}/senior-secondary/chemistry/${ch.id}/${t.id}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.75,
      });
      for (const s of t.subtopics) {
        entries.push({
          url: `${base}/senior-secondary/chemistry/${ch.id}/${t.id}/${s.id}`,
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
  }

  // Senior Secondary Maths – chapters
  for (const ch of mathsChapters) {
    entries.push({
      url: `${base}/senior-secondary/maths/${ch.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return entries;
}
