/**
 * Gravitation and Fluids subtopics: content and SEO for High School Physics.
 * Used by /high-school/physics/gravitation-fluids and subtopics/[slug].
 */
export type GravitationFluidsSubtopicSlug =
  | "universal-law-of-gravitation"
  | "acceleration-due-to-gravity"
  | "free-fall"
  | "mass-and-weight"
  | "thrust-and-pressure"
  | "pressure-in-fluids"
  | "buoyancy"
  | "archimedes-principle";

export interface GravitationFluidsSubtopicContentBlock {
  heading?: string;
  body: string;
  keyTakeaway?: string;
  icon?: string;
}

export interface GravitationFluidsSubtopic {
  slug: GravitationFluidsSubtopicSlug;
  title: string;
  shortDescription: string;
  keywords: string[];
  content: GravitationFluidsSubtopicContentBlock[];
  reflectivePrompt?: string;
  simulatorCallout?: string;
}

export const GRAVITATION_FLUIDS_SUBTOPICS: Record<GravitationFluidsSubtopicSlug, GravitationFluidsSubtopic> = {
  "universal-law-of-gravitation": {
    slug: "universal-law-of-gravitation",
    title: "Universal Law of Gravitation",
    shortDescription: "Every mass attracts every other mass with a force proportional to the product of masses and inversely proportional to the square of the distance between them.",
    keywords: ["universal gravitation", "Newton's law of gravitation", "F = Gm₁m₂/r²", "gravitational constant", "high school physics"],
    content: [
      {
        heading: "Newton's law of gravitation",
        body: "Every particle in the universe attracts every other particle with a force that is directly proportional to the product of their masses and inversely proportional to the square of the distance between their centres: F = Gm₁m₂/r². G is the universal gravitational constant.",
        keyTakeaway: "F = Gm₁m₂/r²; force decreases with the square of distance.",
      },
    ],
    reflectivePrompt: "Why does the gravitational force between two everyday objects (e.g. two books) seem negligible?",
  },
  "acceleration-due-to-gravity": {
    slug: "acceleration-due-to-gravity",
    title: "Acceleration due to Gravity",
    shortDescription: "The acceleration g of a body near Earth's surface due to Earth's gravity; g ≈ 9.8 m/s² downward.",
    keywords: ["acceleration due to gravity", "g", "free fall", "Earth's gravity", "high school physics"],
    content: [
      {
        heading: "Definition of g",
        body: "The acceleration due to gravity g at a point is the acceleration experienced by a body in free fall at that point. Near Earth's surface, g ≈ 9.8 m/s² (downward). It varies slightly with latitude and altitude. g = GM/R² where M is Earth's mass and R is distance from centre.",
        keyTakeaway: "g = GM/R²; near Earth g ≈ 9.8 m/s².",
      },
    ],
    reflectivePrompt: "How would g change if you went to the Moon?",
    simulatorCallout: "The gravity simulator shows how g affects motion near a massive body.",
  },
  "free-fall": {
    slug: "free-fall",
    title: "Free Fall",
    shortDescription: "Motion under the influence of gravity only; acceleration a = g (assuming no air resistance).",
    keywords: ["free fall", "gravity", "kinematics", "equations of motion", "high school physics"],
    content: [
      {
        heading: "Free fall motion",
        body: "An object in free fall has acceleration a = g (downward). The equations of motion apply with a = g. If air resistance is negligible, all objects fall with the same acceleration regardless of mass.",
        keyTakeaway: "Free fall: a = g; same equations as uniformly accelerated motion.",
      },
    ],
    reflectivePrompt: "In a vacuum, would a feather and a hammer fall at the same rate?",
    simulatorCallout: "Use the simulator to see free-fall motion under gravity.",
  },
  "mass-and-weight": {
    slug: "mass-and-weight",
    title: "Mass and Weight",
    shortDescription: "Mass is the amount of matter (kg); weight is the force due to gravity, W = mg (N).",
    keywords: ["mass", "weight", "W = mg", "kilogram", "newton", "high school physics"],
    content: [
      {
        heading: "Mass vs weight",
        body: "Mass is a scalar measure of the amount of matter; SI unit is the kilogram (kg). Weight is the force exerted on a body by gravity: W = mg. Weight is a vector (direction: toward the centre of the attracting body). On the Moon, mass is the same but weight is less because g is smaller.",
        keyTakeaway: "Mass is intrinsic; weight W = mg depends on g.",
      },
    ],
    reflectivePrompt: "Why do we say \"weigh\" in kg in everyday life when kg is mass?",
  },
  "thrust-and-pressure": {
    slug: "thrust-and-pressure",
    title: "Thrust and Pressure",
    shortDescription: "Thrust is total force; pressure is force per unit area. P = F/A; unit is the pascal (Pa).",
    keywords: ["thrust", "pressure", "P = F/A", "pascal", "force per unit area", "high school physics"],
    content: [
      {
        heading: "Pressure",
        body: "Pressure P is the force per unit area: P = F/A. The SI unit is the pascal (Pa): 1 Pa = 1 N/m². Thrust is the total force (e.g. on a surface). A small force over a small area can produce high pressure (e.g. a sharp nail).",
        keyTakeaway: "P = F/A; pressure is force per unit area (Pa).",
      },
    ],
    reflectivePrompt: "Why do sharp knives cut more easily than blunt ones?",
  },
  "pressure-in-fluids": {
    slug: "pressure-in-fluids",
    title: "Pressure in Fluids",
    shortDescription: "In a fluid at rest, pressure increases with depth: P = hρg (hydrostatic pressure).",
    keywords: ["pressure in fluids", "hydrostatic pressure", "P = hρg", "density", "high school physics"],
    content: [
      {
        heading: "Hydrostatic pressure",
        body: "In a fluid at rest, the pressure at a depth h is P = P₀ + hρg, where P₀ is pressure at the surface (e.g. atmospheric), ρ is fluid density, and g is acceleration due to gravity. Pressure acts equally in all directions at a point.",
        keyTakeaway: "Pressure in fluid: P = hρg (plus atmospheric if open).",
      },
    ],
    reflectivePrompt: "Why does a dam need to be thicker at the bottom?",
  },
  buoyancy: {
    slug: "buoyancy",
    title: "Buoyancy",
    shortDescription: "The upward force exerted by a fluid on an immersed or floating body; it opposes the weight.",
    keywords: ["buoyancy", "upthrust", "buoyant force", "floating", "high school physics"],
    content: [
      {
        heading: "Buoyant force",
        body: "When a body is immersed in a fluid, the fluid exerts an upward force called the buoyant force (upthrust). It is due to the pressure difference between the top and bottom of the object. This force can support the object so it floats or partially floats.",
        keyTakeaway: "Buoyancy is the upward force exerted by a fluid on an immersed body.",
      },
    ],
    reflectivePrompt: "Why do you feel lighter when standing in a swimming pool?",
  },
  "archimedes-principle": {
    slug: "archimedes-principle",
    title: "Archimedes' Principle",
    shortDescription: "The upthrust on a body immersed in a fluid equals the weight of the fluid displaced by the body.",
    keywords: ["Archimedes' principle", "upthrust", "displaced fluid", "floating", "high school physics"],
    content: [
      {
        heading: "Archimedes' principle",
        body: "When a body is fully or partially immersed in a fluid, the upward buoyant force (upthrust) is equal to the weight of the fluid displaced by the body. So upthrust = weight of displaced fluid = Vρg (V = volume displaced, ρ = fluid density). A body floats when weight = upthrust.",
        keyTakeaway: "Upthrust = weight of displaced fluid.",
      },
    ],
    reflectivePrompt: "Why does a ship made of steel float when a steel block sinks?",
  },
};

export const GRAVITATION_FLUIDS_SUBTOPIC_SLUGS: GravitationFluidsSubtopicSlug[] = [
  "universal-law-of-gravitation",
  "acceleration-due-to-gravity",
  "free-fall",
  "mass-and-weight",
  "thrust-and-pressure",
  "pressure-in-fluids",
  "buoyancy",
  "archimedes-principle",
];
