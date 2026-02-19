/**
 * Matter, Density & States subtopics for High School Physics.
 * Used by /high-school/physics/matter-density-states and its subtopics.
 */
export type MatterDensityStatesSubtopicSlug =
  | "states-of-matter"
  | "change-of-state"
  | "latent-heat"
  | "evaporation"
  | "density";

export interface MatterDensityStatesContentBlock {
  heading?: string;
  body: string;
  keyTakeaway?: string;
  icon?: string;
}

export interface MatterDensityStatesSubtopic {
  slug: MatterDensityStatesSubtopicSlug;
  title: string;
  shortDescription: string;
  keywords: string[];
  content: MatterDensityStatesContentBlock[];
  reflectivePrompt?: string;
  simulatorCallout?: string;
}

export const MATTER_DENSITY_STATES_SUBTOPICS: Record<MatterDensityStatesSubtopicSlug, MatterDensityStatesSubtopic> = {
  "states-of-matter": {
    slug: "states-of-matter",
    title: "States of Matter",
    shortDescription:
      "Matter exists mainly as solid, liquid, or gas. Particle arrangement and motion differ in each state, but particles themselves do not change.",
    keywords: [
      "states of matter",
      "solid",
      "liquid",
      "gas",
      "particles",
      "kinetic theory",
      "high school physics",
    ],
    content: [
      {
        heading: "Particle view of matter",
        body: "In the particle model, matter is made of tiny particles (atoms or molecules) separated by empty space. In a solid, particles are closely packed in fixed positions and can only vibrate about their mean positions. In a liquid, particles are still close but can slide past one another. In a gas, particles are far apart and move randomly in all directions.",
        keyTakeaway: "State of matter is about particle arrangement and motion, not about changing the particles themselves.",
      },
      {
        heading: "Energy and spacing",
        body: "On average, gas particles have more kinetic energy than liquid particles at the same temperature; liquid particles have more than solids. As you go from solid → liquid → gas, average spacing between particles increases and the strength of intermolecular forces typically decreases.",
        keyTakeaway: "More kinetic energy and larger spacing as you move from solid to gas.",
      },
    ],
    reflectivePrompt: "How does the motion of particles in ice differ from those in liquid water and in steam?",
    simulatorCallout: "Use the particle box simulator to compare motion and spacing in solid, liquid, and gas.",
  },
  "change-of-state": {
    slug: "change-of-state",
    title: "Change of State",
    shortDescription:
      "When matter changes state (melting, freezing, boiling, condensation), energy is absorbed or released, often at constant temperature.",
    keywords: [
      "change of state",
      "melting",
      "freezing",
      "boiling",
      "condensation",
      "heating curve",
      "high school physics",
    ],
    content: [
      {
        heading: "Heating and cooling curves",
        body: "If you heat a pure substance steadily, temperature rises in stages: sloping regions where temperature increases within a state, and flat regions during phase changes (e.g. melting, boiling) where temperature stays constant while energy goes into changing the state.",
        keyTakeaway: "During a phase change, energy changes the state, not the temperature.",
      },
      {
        heading: "Melting and boiling points",
        body: "Each pure substance has characteristic temperatures at which it changes state at a given pressure: the melting point (solid ↔ liquid) and the boiling point (liquid ↔ gas). At these points, both states can coexist while energy is absorbed or released.",
        keyTakeaway: "At melting and boiling points, two states coexist and energy is exchanged without temperature change.",
      },
    ],
    reflectivePrompt: "Why does the temperature of boiling water remain almost constant even when you keep heating?",
    simulatorCallout: "Watch flat regions on the heating curve and the particle animation as the state changes.",
  },
  "latent-heat": {
    slug: "latent-heat",
    title: "Latent Heat",
    shortDescription:
      "Latent heat is the energy absorbed or released during a change of state at constant temperature, given by Q = mL.",
    keywords: [
      "latent heat",
      "latent heat of fusion",
      "latent heat of vaporisation",
      "Q = mL",
      "phase change",
      "high school physics",
    ],
    content: [
      {
        heading: "Meaning of latent heat",
        body: "Latent heat is the energy required to change the state of unit mass of a substance without changing its temperature. For melting/freezing, we use latent heat of fusion; for boiling/condensation, latent heat of vaporisation. The total energy absorbed or released is Q = mL.",
        keyTakeaway: "Q = mL gives energy involved in changing state without a temperature change.",
      },
      {
        heading: "Bond breaking and forming",
        body: "During melting or boiling, energy is used mainly to overcome intermolecular forces and increase the separation between particles, not to increase their kinetic energy. That is why temperature remains constant even though energy is supplied. The reverse happens during freezing or condensation.",
        keyTakeaway: "Latent heat changes potential energy and arrangement; kinetic energy (and temperature) stay constant during the phase change.",
      },
    ],
    reflectivePrompt: "Why does ice at 0°C require more energy to become water at 0°C, even though the temperature is the same?",
    simulatorCallout: "Adjust mass and latent heat constant to see Q = mL update in the latent heat simulator.",
  },
  evaporation: {
    slug: "evaporation",
    title: "Evaporation",
    shortDescription:
      "Evaporation is the slow escape of high-energy molecules from the surface of a liquid at any temperature below its boiling point.",
    keywords: [
      "evaporation",
      "surface particles",
      "cooling effect",
      "humidity",
      "wind speed",
      "high school physics",
    ],
    content: [
      {
        heading: "Surface process",
        body: "In a liquid, particles at the surface have a range of kinetic energies. Some high-energy particles can overcome attractive forces and escape into the air as gas. This process, which happens at the surface and at all temperatures below the boiling point, is called evaporation.",
        keyTakeaway: "Evaporation can occur at any temperature, not just at boiling.",
      },
      {
        heading: "Cooling effect",
        body: "Because the highest-energy particles leave, the average kinetic energy of the remaining particles decreases, which lowers the liquid’s temperature. This is why evaporation causes cooling (e.g. sweating cools the body).",
        keyTakeaway: "Evaporation removes high-energy particles, so the remaining liquid cools.",
      },
    ],
    reflectivePrompt: "Why do we feel cool when sweat evaporates from our skin on a windy day?",
    simulatorCallout: "Change temperature, surface area, and wind speed to see how the evaporation rate and cooling change.",
  },
  density: {
    slug: "density",
    title: "Density",
    shortDescription:
      "Density ρ is mass per unit volume: ρ = m/V. It helps explain floating and sinking and is central to buoyancy.",
    keywords: [
      "density",
      "rho",
      "mass",
      "volume",
      "buoyancy",
      "upthrust",
      "Archimedes' principle",
      "high school physics",
    ],
    content: [
      {
        heading: "Definition of density",
        body: "Density (ρ) is defined as mass per unit volume: ρ = m/V. Objects with high mass packed into a small volume have high density; those with the same mass spread over a larger volume have lower density.",
        keyTakeaway: "ρ = m/V: how much mass is packed into a given volume.",
      },
      {
        heading: "Floating and sinking",
        body: "An object floats in a fluid if its average density is less than that of the fluid. If its density is greater, it sinks. Large ships float because their hull encloses air, so the overall density (ship + air) is less than the density of water.",
        keyTakeaway: "Floating depends on relative densities, not just on mass or size.",
      },
    ],
    reflectivePrompt: "How can a huge metal ship float while a small solid metal ball sinks?",
    simulatorCallout: "Adjust object mass and volume and compare with fluid density in the density simulator.",
  },
};

export const MATTER_DENSITY_STATES_SUBTOPIC_SLUGS: MatterDensityStatesSubtopicSlug[] = [
  "states-of-matter",
  "change-of-state",
  "latent-heat",
  "evaporation",
  "density",
];

