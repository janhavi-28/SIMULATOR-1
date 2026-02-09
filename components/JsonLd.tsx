/**
 * Renders JSON-LD structured data for SEO. Crawlers parse this for rich results.
 */
export function SimulationJsonLd({
  name,
  description,
  url,
  keywords,
}: {
  name: string;
  description: string;
  url: string;
  keywords?: string[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name,
    description,
    url,
    learningResourceType: "Simulation",
    educationalLevel: ["High School", "Senior Secondary", "Undergraduate"],
    inLanguage: "en",
    isAccessibleForFree: true,
    ...(keywords?.length && { keywords: keywords.join(", ") }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function OrganizationJsonLd({ url }: { url: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Illustrate.live",
    url,
    description: "Interactive science and mathematics simulations for visual-first learning.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteJsonLd({ url }: { url: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Illustrate.live",
    url,
    description: "Illustrated Concepts – Interactive science and math simulations.",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${url}/subjects` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
