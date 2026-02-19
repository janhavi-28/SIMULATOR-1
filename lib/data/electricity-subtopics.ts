import { title } from "process";

/**
 * Electricity subtopics: content and SEO for High School Physics.
 * Used by /high-school/physics/electricity and /high-school/physics/electricity/subtopics/[slug].
 */
export type ElectricitySubtopicSlug =
  | "electric-charge"
  | "electric-current"
  | "electric-potential-and-potential-difference"
  | "ohms-law"
  | "resistance"
  | "factors-affecting-resistance"
  | "electric-circuit"
  | "electrical-energy"
  | "electric-power"
  | "electric-motor"

export interface ElectricitySubtopicContentBlock {
  heading?: string;
  body: string;
  keyTakeaway?: string;
  icon?: string;
}

export interface ElectricitySubtopic {
  slug: ElectricitySubtopicSlug;
  title: string;
  shortDescription: string;
  keywords: string[];
  content: ElectricitySubtopicContentBlock[];
  reflectivePrompt?: string;
  simulatorCallout?: string;
}

export const ELECTRICITY_SUBTOPICS: Record<ElectricitySubtopicSlug, ElectricitySubtopic> = {
  "electric-charge": {
    slug: "electric-charge",
    title: "Electric Charge",
    shortDescription:
      "Electric charge is a fundamental property of matter. Like charges repel, unlike charges attract. SI unit is the coulomb (C).",
    keywords: [
      "electric charge",
      "coulomb",
      "positive charge",
      "negative charge",
      "electrostatics",
      "conservation of charge",
      "elementary charge",
      "high school physics",
    ],
    content: [
      {
        heading: "What is electric charge?",
        body: "Electric charge is a fundamental property of matter that causes it to experience a force in an electric field. There are two types: positive and negative. Like charges repel each other; unlike charges attract. The SI unit of charge is the coulomb (C). The charge on an electron is approximately −1.6 × 10⁻¹⁹ C; the proton has an equal but positive charge.",
        keyTakeaway: "Charge is a fundamental property; like charges repel, unlike charges attract.",
      },
      {
        heading: "Conservation of charge",
        body: "Charge is conserved: the total charge in an isolated system remains constant. Charge can be transferred (e.g. by friction or contact) but not created or destroyed. In circuits, the rate of flow of charge is electric current.",
        keyTakeaway: "Total charge in an isolated system is conserved—it can be transferred but not created or destroyed.",
      },
      {
        heading: "Quantisation of charge",
        body: "Charge exists in discrete multiples of the elementary charge e ≈ 1.6 × 10⁻¹⁹ C. Any charge Q is an integer multiple of e. This quantisation is important in understanding current at the microscopic level.",
        keyTakeaway: "Charge is quantised in multiples of the elementary charge e.",
      },
    ],
    reflectivePrompt: "If charge is quantised, why does current appear continuous in circuits?",
    simulatorCallout: "The circuit above shows charge flowing as current; at the microscopic level each electron carries one elementary charge.",
  },
  "electric-current": {
    slug: "electric-current",
    title: "Electric Current",
    shortDescription:
      "Electric current is the rate of flow of electric charge. I = Q/t. SI unit is the ampere (A).",
    keywords: [
      "electric current",
      "ampere",
      "current formula",
      "charge flow",
      "conventional current",
      "direct current",
      "high school physics",
    ],
    content: [
      {
        heading: "Definition of electric current",
        body: "Electric current is the rate at which electric charge flows through a cross-section of a conductor. Mathematically, I = Q/t, where Q is the charge passing through in time t. The SI unit of current is the ampere (A): 1 A = 1 C/s. Current is a scalar; direction is indicated by the sense of flow (conventional current is from positive to negative).",
        keyTakeaway: "Current is the rate of flow of charge: I = Q/t; unit is the ampere (A).",
      },
      {
        heading: "Conventional current vs electron flow",
        body: "Conventional current is defined as the direction in which positive charges would move—from the positive terminal of a battery toward the negative. In metals, charge is carried by electrons, which move in the opposite direction. For most circuit analysis we use conventional current.",
        keyTakeaway: "Conventional current is from positive to negative; in metals electrons flow the opposite way.",
      },
      {
        heading: "Direct and alternating current",
        body: "Direct current (DC) flows in one direction only (e.g. from a battery). Alternating current (AC) reverses direction periodically (e.g. mains supply). Ohm's law and basic circuit rules apply to DC and to instantaneous values in AC.",
        keyTakeaway: "DC flows one way; AC reverses periodically; circuit rules apply to both.",
      },
    ],
    reflectivePrompt: "Why do we use conventional current (positive to negative) when electrons actually move the other way?",
    simulatorCallout: "The arrows in the simulator show conventional current direction; the same analysis holds for DC circuits.",
  },
  "electric-potential-and-potential-difference": {
    slug: "electric-potential-and-potential-difference",
    title: "Electric Potential and Potential Difference",
    shortDescription:
      "Electric potential at a point is work done per unit charge to bring a test charge from infinity. Potential difference (voltage) is the difference in potential between two points.",
    keywords: [
      "electric potential",
      "potential difference",
      "voltage",
      "volt",
      "electrical potential energy",
      "high school physics",
    ],
    content: [
      {
        heading: "Electric potential",
        body: "The electric potential at a point is the work done per unit charge in bringing a small positive test charge from infinity to that point without acceleration. It is a scalar. The SI unit is the volt (V): 1 V = 1 J/C. Potential is relative; we often take earth or the negative terminal of a battery as zero.",
        keyTakeaway: "Potential at a point is work per unit charge to bring a test charge from infinity; unit is the volt (V).",
      },
      {
        heading: "Potential difference (voltage)",
        body: "The potential difference (p.d.) between two points A and B is the work done per unit charge in moving a charge from A to B. So V = W/Q, or V = E/Q. It is measured in volts. In a circuit, the battery provides a potential difference across its terminals; this drives the current through the circuit.",
        keyTakeaway: "Potential difference (voltage) between two points is work per unit charge; the battery provides this to drive current.",
      },
      {
        heading: "Why it matters in circuits",
        body: "Current flows from higher potential to lower potential (in the direction of the field). Resistors have a potential drop V = IR. Understanding potential difference is essential for analysing series and parallel circuits and for power calculations.",
        keyTakeaway: "Current flows from higher to lower potential; resistors have a drop V = IR.",
      },
    ],
    reflectivePrompt: "If we take the negative terminal as zero potential, what does the battery voltage tell you about the positive terminal?",
    simulatorCallout: "The voltage you set in the simulator is the potential difference driving current through the circuit.",
  },
  "ohms-law": {
    slug: "ohms-law",
    title: "Ohm's Law",
    shortDescription:
      "Ohm's law states that for many conductors, V = IR: the potential difference across a conductor is proportional to the current through it, at constant temperature.",
    keywords: [
      "Ohm's law",
      "V equals IR",
      "voltage current resistance",
      "ohmic conductor",
      "high school physics",
    ],
    content: [
      {
        heading: "Statement of Ohm's law",
        body: "Ohm's law states that for a conductor at constant temperature, the potential difference V across it is directly proportional to the current I through it: V ∝ I, or V = IR, where R is the resistance of the conductor. So R = V/I; the unit of resistance is the ohm (Ω): 1 Ω = 1 V/A.",
        keyTakeaway: "At constant temperature, V = IR for many conductors; R = V/I defines resistance in ohms.",
      },
      {
        heading: "Ohmic and non-ohmic conductors",
        body: "Conductors that obey Ohm's law (e.g. many metals) are called ohmic; a plot of V vs I is a straight line through the origin. Filament bulbs, diodes, and some devices are non-ohmic: R changes with V or I.",
        keyTakeaway: "Ohmic conductors have constant R; non-ohmic devices (e.g. bulbs, diodes) do not.",
      },
      {
        heading: "Using Ohm's law",
        body: "Ohm's law is used to find current when V and R are known (I = V/R), voltage when I and R are known (V = IR), or resistance when V and I are known (R = V/I). It applies to the whole circuit or to a single resistor.",
        keyTakeaway: "Use V = IR (or I = V/R, R = V/I) to relate voltage, current, and resistance in a circuit.",
      },
    ],
    reflectivePrompt: "When a filament bulb gets hotter as it glows, does its resistance stay constant? What would that do to the V–I graph?",
    simulatorCallout: "In the simulator, changing voltage or resistance shows how current responds—consistent with V = IR for ohmic resistors.",
  },
  "resistance": {
    slug: "resistance",
    title: "Resistance",
    shortDescription:
      "Resistance is the opposition offered by a conductor to the flow of current. R = V/I. Unit is the ohm (Ω).",
    keywords: [
      "resistance",
      "ohm",
      "electrical resistance",
      "resistor",
      "V equals IR",
      "high school physics",
    ],
    content: [
      {
        heading: "Definition of resistance",
        body: "The resistance R of a conductor is the ratio of the potential difference V across it to the current I through it: R = V/I. The SI unit is the ohm (Ω). Higher resistance means less current for a given voltage. Resistors are components designed to have a specific resistance.",
        keyTakeaway: "Resistance R = V/I opposes current; higher R means less current for a given voltage.",
      },
      {
        heading: "Resistors in series and parallel",
        body: "In series: total resistance R_total = R₁ + R₂ + … . In parallel: 1/R_total = 1/R₁ + 1/R₂ + … . These rules allow us to simplify circuits and find current and voltage in each part.",
        keyTakeaway: "Series: R_total = R₁ + R₂ + …; parallel: 1/R_total = 1/R₁ + 1/R₂ + ….",
      },
      {
        heading: "Why resistance matters",
        body: "Resistance limits current and causes a drop in potential (V = IR). It also leads to heating (Joule heating: P = I²R). Understanding resistance is essential for designing and analysing electric circuits.",
        keyTakeaway: "Resistance limits current, causes voltage drop, and leads to Joule heating.",
      },
    ],
    reflectivePrompt: "Why does adding a resistor in parallel reduce the total resistance, while adding one in series increases it?",
    simulatorCallout: "Try adding resistors in series and parallel in the simulator to see how total resistance and current change.",
  },
  "factors-affecting-resistance": {
    slug: "factors-affecting-resistance",
    title: "Factors Affecting Resistance",
    shortDescription:
      "Resistance of a conductor depends on its length, cross-sectional area, and material: R = ρ L/A, where ρ is resistivity.",
    keywords: [
      "factors affecting resistance",
      "resistivity",
      "length and resistance",
      "cross-sectional area",
      "R equals rho L by A",
      "high school physics",
    ],
    content: [
      {
        heading: "Resistance and dimensions",
        body: "For a uniform conductor, resistance R is directly proportional to length L and inversely proportional to cross-sectional area A: R = ρ L/A. The constant ρ (rho) is the resistivity of the material, in Ω·m. So longer or thinner wires have higher resistance.",
        keyTakeaway: "R = ρ L/A: resistance increases with length and decreases with cross-sectional area.",
      },
      {
        heading: "Resistivity",
        body: "Resistivity ρ depends on the material and temperature. Good conductors (copper, silver) have low ρ; insulators have very high ρ. Resistivity usually increases with temperature for metals.",
        keyTakeaway: "Resistivity is a material property; conductors have low ρ, insulators very high ρ.",
      },
      {
        heading: "Practical implications",
        body: "Power lines use thick, low-resistivity conductors to minimise loss. Heating elements use materials with higher resistivity. Variable resistors (rheostats) change effective length or area to vary R.",
        keyTakeaway: "Real applications choose dimensions and materials to get the desired resistance.",
      },
    ],
    reflectivePrompt: "Why do power lines use thick wires and not thin ones, even though both could carry the same current if the voltage were adjusted?",
    simulatorCallout: "The resistance factors simulator shows how length and area affect resistance for a given material.",
  },
  "electric-circuit": {
    slug: "electric-circuit",
    title: "Electric Circuit",
    shortDescription:
      "An electric circuit is a closed path in which current can flow. It typically includes a source (e.g. battery), conductors, and loads (e.g. resistors, lamps).",
    keywords: [
      "electric circuit",
      "closed circuit",
      "series circuit",
      "parallel circuit",
      "circuit diagram",
      "current flow",
      "high school physics",
    ],
    content: [
      {
        heading: "What is an electric circuit?",
        body: "An electric circuit is a closed conducting path through which electric charge can flow. A simple circuit has a source of electromotive force (e.g. battery), connecting wires, and one or more loads (resistors, lamps, etc.). Current flows when the circuit is complete; opening a switch breaks the path and stops the current.",
        keyTakeaway: "A circuit is a closed path with a source, conductors, and loads; current flows when the path is complete.",
      },
      {
        heading: "Series and parallel connections",
        body: "In a series circuit, components are connected one after another; the same current flows through each. In parallel, components are connected across the same two points; the potential difference across each is the same, and currents add. Real circuits often combine both.",
        keyTakeaway: "Series: same current through each; parallel: same voltage across each, currents add.",
      },
      {
        heading: "Circuit analysis",
        body: "Kirchhoff's laws and Ohm's law allow us to find currents and voltages. In series, R_total = R₁ + R₂ + … and I is the same everywhere. In parallel, 1/R_total = 1/R₁ + 1/R₂ + … and V is the same across each branch.",
        keyTakeaway: "Ohm's law and series/parallel rules let you find currents and voltages in the circuit.",
      },
    ],
    reflectivePrompt: "In a parallel branch, why is the current through each resistor different (in general) even though the voltage across each is the same?",
    simulatorCallout: "Build series and parallel circuits above to see how current and voltage behave in each layout.",
  },
  "electrical-energy": {
    slug: "electrical-energy",
    title: "Electrical Energy",
    shortDescription:
      "Electrical energy consumed when charge Q moves through a potential difference V is E = VQ = VIt. Unit is the joule (J).",
    keywords: [
      "electrical energy",
      "work done by current",
      "E equals VIt",
      "joule",
      "kilowatt hour",
      "high school physics",
    ],
    content: [
      {
        heading: "Work done by current",
        body: "When a charge Q moves through a potential difference V, the work done (energy transferred) is W = VQ. Since I = Q/t, we have Q = It, so the energy consumed in time t is E = VIt. This is the electrical energy converted (e.g. into heat or light) in a device.",
        keyTakeaway: "Energy transferred when charge moves through a p.d. is E = VQ = VIt.",
      },
      {
        heading: "Relation to power",
        body: "Power P is the rate of energy transfer: P = E/t = VI. So E = Pt = VIt. For a resistor, using V = IR, we get E = I²Rt or E = V²t/R.",
        keyTakeaway: "Power is rate of energy transfer; E = Pt = VIt.",
      },
      {
        heading: "Units and practical use",
        body: "Energy is in joules (J). Domestic electricity is often billed in kilowatt-hours (kWh): 1 kWh = 3.6 × 10⁶ J. Understanding electrical energy helps in comparing appliances and calculating cost.",
        keyTakeaway: "Energy is in joules; billing often uses kilowatt-hours (kWh).",
      },
    ],
    reflectivePrompt: "Why is a kilowatt-hour a unit of energy and not of power?",
    simulatorCallout: "The energy consumed in the circuit above depends on V, I, and time—try different values to see the relationship.",
  },
  "electric-power": {
    slug: "electric-power",
    title: "Electric Power",
    shortDescription:
      "Electric power is the rate at which electrical energy is consumed or supplied. P = VI = I²R = V²/R. Unit is the watt (W).",
    keywords: [
      "electric power",
      "power formula",
      "watt",
      "P equals VI",
      "Joule heating",
      "high school physics",
    ],
    content: [
      {
        heading: "Definition of electric power",
        body: "Electric power P is the rate at which electrical energy is transferred or consumed. P = E/t = VI. The SI unit is the watt (W): 1 W = 1 J/s = 1 V·A. So a device with a potential difference V across it and current I through it dissipates power P = VI.",
        keyTakeaway: "Power P = E/t = VI is the rate of energy transfer; unit is the watt (W).",
      },
      {
        heading: "Forms of the power formula",
        body: "Using Ohm's law V = IR, we get P = VI = I²R = V²/R. So for a resistor, power can be calculated from any two of V, I, and R. Power is dissipated as heat (Joule heating) in resistors.",
        keyTakeaway: "For a resistor, P = VI = I²R = V²/R; power is dissipated as heat.",
      },
      {
        heading: "Ratings of appliances",
        body: "Appliances are rated by power (e.g. 100 W bulb, 1 kW heater). Higher power means more energy consumed per second. Fuses and circuit breakers are chosen to limit current so that power loss and heating stay safe.",
        keyTakeaway: "Appliance ratings (e.g. 100 W) tell you power; fuses limit current to keep heating safe.",
      },
    ],
    reflectivePrompt: "A 100 W bulb and a 25 W bulb both run at the same voltage. Which has the higher resistance, and why?",
    simulatorCallout: "In the circuit simulator, power depends on V and I; try different resistances to see how power changes.",
  },
  "electric-motor": {
    slug: "electric-motor",
    title: "Electric Motor",
    shortDescription:
      "Understand how electric current produces rotational motion using magnetic fields.",
    keywords: ["electric motor", "lorentz force", "motor principle"],
    content: [
      {
        heading: "Principle",
        body: "An electric motor converts electrical energy into mechanical energy using magnetic force acting on a current-carrying conductor.",
        keyTakeaway: "Current + magnetic field → force → rotation",
      },
    ],
    reflectivePrompt: "Why does reversing current reverse motor direction?",
    simulatorCallout: "Change current and observe rotation speed.",
  },
};



export const ELECTRICITY_SUBTOPIC_SLUGS: ElectricitySubtopicSlug[] = [
  "electric-charge",
  "electric-current",
  "electric-potential-and-potential-difference",
  "ohms-law",
  "resistance",
  "factors-affecting-resistance",
  "electric-circuit",
  "electrical-energy",
  "electric-power",
  "electric-motor",
  
];
