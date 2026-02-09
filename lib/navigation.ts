/**
 * Navigation config: High School, Senior Secondary (no class concept),
 * Trending Topics (standalone/unmatched simulations).
 */
export type NavCategory = "high-school" | "senior-secondary" | "professional" | "roadmap" | "quizzes" | "trending-topics";

export interface NavCard {
  id: string;
  label: string;
  href: string;
  neonColor: "cyan" | "emerald" | "amber" | "violet" | "fuchsia" | "sky" | "rose" | "lime";
}

export interface NavMenu {
  id: NavCategory;
  label: string;
  icon?: string;
  cards: NavCard[];
}

// High School = Physics, Chemistry, Maths (no class)
export const highSchoolMenu: NavMenu = {
  id: "high-school",
  label: "High School",
  icon: "graduation-cap",
  cards: [
    { id: "hs-physics", label: "Physics", href: "/high-school/physics", neonColor: "sky" },
    { id: "hs-chemistry", label: "Chemistry", href: "/high-school/chemistry", neonColor: "emerald" },
    { id: "hs-maths", label: "Mathematics", href: "/high-school/maths", neonColor: "violet" },
  ],
};

// Senior Secondary = Physics, Chemistry, Maths (no class)
export const seniorSecondaryMenu: NavMenu = {
  id: "senior-secondary",
  label: "Senior Secondary",
  icon: "book",
  cards: [
    { id: "ss-physics", label: "Physics", href: "/senior-secondary/physics", neonColor: "sky" },
    { id: "ss-chemistry", label: "Chemistry", href: "/senior-secondary/chemistry", neonColor: "emerald" },
    { id: "ss-maths", label: "Mathematics", href: "/senior-secondary/maths", neonColor: "violet" },
  ],
};

// Trending Topics = standalone sims (physics, chemistry, maths, biology)
export const trendingTopicsMenu: NavMenu = {
  id: "trending-topics",
  label: "Trending Topics",
  icon: "trending-up",
  cards: [
    { id: "tt-physics", label: "Physics", href: "/trending-topics/physics", neonColor: "cyan" },
    { id: "tt-chemistry", label: "Chemistry", href: "/trending-topics/chemistry", neonColor: "emerald" },
    { id: "tt-maths", label: "Mathematics", href: "/trending-topics/maths", neonColor: "violet" },
    { id: "tt-biology", label: "Biology", href: "/trending-topics/biology", neonColor: "lime" },
  ],
};

export const professionalMenu: NavMenu = {
  id: "professional",
  label: "Professional",
  icon: "zap",
  cards: [{ id: "pro-ai", label: "Coming Soon", href: "#", neonColor: "fuchsia" }],
};

export const roadmapMenu: NavMenu = {
  id: "roadmap",
  label: "Roadmap",
  icon: "map",
  cards: [{ id: "road-learning-path", label: "Coming Soon", href: "#", neonColor: "amber" }],
};

export const quizzesMenu: NavMenu = {
  id: "quizzes",
  label: "Quizzes",
  icon: "clipboard",
  cards: [{ id: "quiz-subjects", label: "Coming Soon", href: "#", neonColor: "rose" }],
};

export const allNavMenus: NavMenu[] = [
  highSchoolMenu,
  seniorSecondaryMenu,
  professionalMenu,
  roadmapMenu,
  quizzesMenu,
  trendingTopicsMenu,
];
