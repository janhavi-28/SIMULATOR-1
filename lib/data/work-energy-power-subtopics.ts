/**
 * Work, Energy & Power subtopics for High School Physics.
 * Used by /high-school/physics/work-energy-power and subtopics/[slug].
 */
export type WorkEnergyPowerSubtopicSlug =
  | "work"
  | "energy"
  | "kinetic-energy"
  | "potential-energy"
  | "conservation-of-energy"
  | "power";

export interface WorkEnergyPowerContentBlock {
  heading?: string;
  body: string;
  keyTakeaway?: string;
  icon?: string;
}

export interface WorkEnergyPowerSubtopic {
  slug: WorkEnergyPowerSubtopicSlug;
  title: string;
  shortDescription: string;
  keywords: string[];
  content: WorkEnergyPowerContentBlock[];
  reflectivePrompt?: string;
  simulatorCallout?: string;
}

export const WORK_ENERGY_POWER_SUBTOPICS: Record<WorkEnergyPowerSubtopicSlug, WorkEnergyPowerSubtopic> = {
  work: {
    slug: "work",
    title: "Work",
    shortDescription:
      "Work is done when a force causes a displacement. W = F·s·cos θ. Unit: joule (J). Zero work when force is perpendicular to displacement.",
    keywords: ["work", "force", "displacement", "joule", "W = Fs", "high school physics"],
    content: [
      {
        heading: "Definition of work",
        body: "Work is done when a force acts on an object and the object moves in the direction of the force (or has a component of displacement along the force). W = F·s = F s cos θ, where F is the force, s is the displacement, and θ is the angle between the force and the displacement. The SI unit of work is the joule (J): 1 J = 1 N·m.",
        keyTakeaway: "Work W = F·s (or F s cos θ). Unit is the joule (J).",
      },
      {
        heading: "When is work zero?",
        body: "No work is done when the force is perpendicular to the displacement (cos 90° = 0). For example, carrying a bag horizontally does no work against gravity. Work can be positive (force and displacement in the same direction) or negative (e.g. friction opposing motion).",
        keyTakeaway: "Zero work when force ⟂ displacement; work can be positive or negative.",
      },
    ],
    reflectivePrompt: "Why does holding a heavy box at rest not do work on the box?",
    simulatorCallout: "Use the simulator to change the angle between force and displacement and see how work changes.",
  },
  energy: {
    slug: "energy",
    title: "Energy",
    shortDescription:
      "Energy is the ability to do work. It can be kinetic (motion), potential (position), or other forms. Energy is transferred when work is done.",
    keywords: ["energy", "kinetic", "potential", "joule", "energy transfer", "high school physics"],
    content: [
      {
        heading: "What is energy?",
        body: "Energy is the capacity to do work. The SI unit is the joule (J). Energy can exist in many forms: kinetic energy (due to motion), gravitational potential energy (due to height), elastic potential energy, thermal energy, etc. When work is done, energy is transferred from one form or object to another.",
        keyTakeaway: "Energy is the ability to do work; unit is the joule (J).",
      },
      {
        heading: "Kinetic and potential energy",
        body: "Kinetic energy KE = ½mv² depends on mass and speed. Gravitational potential energy PE = mgh depends on mass, gravitational field strength g, and height h. As an object falls, PE decreases and KE increases.",
        keyTakeaway: "KE = ½mv²; PE = mgh. Energy can transform between forms.",
      },
    ],
    reflectivePrompt: "How is the work done by gravity related to the change in potential energy?",
    simulatorCallout: "Watch KE and PE change as the object moves along the track.",
  },
  "kinetic-energy": {
    slug: "kinetic-energy",
    title: "Kinetic Energy",
    shortDescription:
      "Kinetic energy is the energy of motion: KE = ½mv². Doubling speed quadruples KE.",
    keywords: ["kinetic energy", "KE", "half m v squared", "motion", "high school physics"],
    content: [
      {
        heading: "Formula for kinetic energy",
        body: "The kinetic energy of an object of mass m moving with speed v is KE = ½mv². So KE depends on the square of the speed: doubling the speed quadruples the kinetic energy. The unit is the joule (J).",
        keyTakeaway: "KE = ½mv²; doubling v → 4× KE.",
      },
    ],
    reflectivePrompt: "Why does a car need much more braking distance at high speed?",
    simulatorCallout: "Compare KE for different masses and speeds in the simulator.",
  },
  "potential-energy": {
    slug: "potential-energy",
    title: "Potential Energy",
    shortDescription:
      "Gravitational potential energy PE = mgh. It increases with height and mass; it depends on the planet (g).",
    keywords: ["potential energy", "PE", "mgh", "gravitational", "height", "high school physics"],
    content: [
      {
        heading: "Gravitational potential energy",
        body: "The gravitational potential energy of an object near the Earth is PE = mgh, where m is mass, g is the gravitational field strength (about 10 N/kg on Earth), and h is the height above a chosen reference level (often the ground). On the Moon, g is smaller, so PE for the same mass and height is less.",
        keyTakeaway: "PE = mgh; depends on mass, g, and height.",
      },
    ],
    reflectivePrompt: "Where do we choose the zero of potential energy, and why does it matter?",
    simulatorCallout: "Lift the object and compare PE on Earth vs Moon.",
  },
  "conservation-of-energy": {
    slug: "conservation-of-energy",
    title: "Law of Conservation of Energy",
    shortDescription:
      "Energy cannot be created or destroyed; it can only be transformed or transferred. In a closed system, total energy is constant.",
    keywords: ["conservation of energy", "total energy", "friction", "thermal", "high school physics"],
    content: [
      {
        heading: "Conservation of mechanical energy",
        body: "In the absence of non-conservative forces (like friction), the total mechanical energy E = KE + PE remains constant. As an object falls, PE decreases and KE increases by the same amount. When friction is present, some mechanical energy is converted to thermal energy, but the total energy of the system (including heat) is still conserved.",
        keyTakeaway: "Energy is conserved; it transforms from one form to another.",
      },
    ],
    reflectivePrompt: "Where does the energy go when a ball rolls to a stop on a rough surface?",
    simulatorCallout: "Toggle friction and watch total energy and thermal energy.",
  },
  power: {
    slug: "power",
    title: "Power",
    shortDescription:
      "Power is the rate of doing work: P = W/t. Same work in less time means higher power. Unit: watt (W).",
    keywords: ["power", "watt", "rate of work", "P = W/t", "high school physics"],
    content: [
      {
        heading: "Definition of power",
        body: "Power P is the rate at which work is done (or energy is transferred): P = W/t. The SI unit is the watt (W): 1 W = 1 J/s. Doing the same work in half the time requires twice the power. Climbing stairs quickly requires more power than climbing slowly, even though the work done (mgh) is the same.",
        keyTakeaway: "Power P = W/t is the rate of doing work; unit is the watt (W).",
      },
    ],
    reflectivePrompt: "Why do we say a car engine is \"more powerful\" when it can do the same work in less time?",
    simulatorCallout: "Lift the same mass at different speeds and compare power.",
  },
};

export const WORK_ENERGY_POWER_SUBTOPIC_SLUGS: WorkEnergyPowerSubtopicSlug[] = [
  "work",
  "energy",
  "kinetic-energy",
  "potential-energy",
  "conservation-of-energy",
  "power",
];
