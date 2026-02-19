/**
 * Sources of Energy subtopics for High School Physics.
 * Used by /high-school/physics/sources-of-energy and its subtopics.
 */
export type SourcesOfEnergySubtopicSlug =
  | "renewable-sources-of-energy"
  | "non-renewable-sources-of-energy"
  | "thermal-power-plant"
  | "solar-energy"
  | "wind-energy"
  | "biogas-plant";

export interface SourcesOfEnergyContentBlock {
  heading?: string;
  body: string;
  keyTakeaway?: string;
  icon?: string;
}

export interface SourcesOfEnergySubtopic {
  slug: SourcesOfEnergySubtopicSlug;
  title: string;
  shortDescription: string;
  keywords: string[];
  content: SourcesOfEnergyContentBlock[];
  reflectivePrompt?: string;
  simulatorCallout?: string;
}

export const SOURCES_OF_ENERGY_SUBTOPICS: Record<
  SourcesOfEnergySubtopicSlug,
  SourcesOfEnergySubtopic
> = {
  "renewable-sources-of-energy": {
    slug: "renewable-sources-of-energy",
    title: "Renewable Sources of Energy",
    shortDescription:
      "Energy sources that are replenished naturally on a human timescale, such as solar, wind, and hydroelectric power.",
    keywords: [
      "renewable energy",
      "solar energy",
      "wind energy",
      "hydroelectric",
      "sustainable",
      "high school physics",
    ],
    content: [
      {
        heading: "What counts as renewable?",
        body: "Renewable sources of energy are replenished by natural processes relatively quickly: sunlight arrives every day, winds are driven by atmospheric circulation, and rivers are part of the water cycle. They can, in principle, supply energy for a very long time if used sustainably.",
        keyTakeaway:
          "Solar, wind, and hydro are examples of renewable energy sources; they are replenished naturally.",
      },
      {
        heading: "Advantages and limitations",
        body: "Renewable sources typically have low greenhouse gas emissions and reduce dependence on fossil fuels, but they can be intermittent (e.g. solar and wind) and location dependent. Systems must be designed to handle variability and integrate with storage or backup sources.",
        keyTakeaway:
          "Renewable energy reduces emissions but can be variable; energy storage and grids help smooth supply.",
      },
    ],
    reflectivePrompt: "Why are solar and wind called intermittent sources, and how can we deal with that?",
    simulatorCallout:
      "Use the renewable sources simulator to compare power output and carbon footprint for solar, wind, and hydro.",
  },
  "non-renewable-sources-of-energy": {
    slug: "non-renewable-sources-of-energy",
    title: "Non-renewable Sources of Energy",
    shortDescription:
      "Energy sources like coal, petroleum, and natural gas that exist in limited quantities and are consumed faster than they are formed.",
    keywords: [
      "non-renewable energy",
      "fossil fuels",
      "coal",
      "petroleum",
      "natural gas",
      "greenhouse gases",
      "high school physics",
    ],
    content: [
      {
        heading: "Fossil fuels and reserves",
        body: "Coal, petroleum, and natural gas are formed from ancient biomass over millions of years. They are non-renewable on human timescales because we consume them far faster than they are formed. Burning them releases energy but also carbon dioxide and other pollutants.",
        keyTakeaway:
          "Coal, oil, and natural gas provide high energy density but are limited and polluting.",
      },
      {
        heading: "Environmental impact",
        body: "Combustion of fossil fuels produces CO₂ (a greenhouse gas) and other emissions that contribute to air pollution and climate change. Efficient use and transition to cleaner sources reduce their environmental impact.",
        keyTakeaway:
          "Non-renewable sources have significant environmental costs; efficiency and alternatives are important.",
      },
    ],
    reflectivePrompt:
      "Why is it important to improve efficiency in fossil-fuel-based power plants even before completely switching to renewables?",
    simulatorCallout:
      "Use the non-renewable sources simulator to relate fuel input, power output, and CO₂ emissions.",
  },
  "thermal-power-plant": {
    slug: "thermal-power-plant",
    title: "Thermal Power Plant",
    shortDescription:
      "A thermal power plant converts chemical energy in fuel into electrical energy through a chain of boiler, steam turbine, and generator stages.",
    keywords: [
      "thermal power plant",
      "boiler",
      "steam turbine",
      "generator",
      "efficiency",
      "high school physics",
    ],
    content: [
      {
        heading: "Energy conversion chain",
        body: "Fuel is burned in a boiler to heat water into high-pressure steam. Steam drives a turbine, converting thermal energy into mechanical energy. The turbine drives a generator, which converts mechanical energy into electrical energy.",
        keyTakeaway:
          "Thermal power plants convert fuel energy → heat → mechanical → electrical energy in stages.",
      },
      {
        heading: "Overall efficiency",
        body: "Each stage has an efficiency less than 100%. The overall efficiency is the product of boiler, turbine, and generator efficiencies. Improving any stage reduces fuel consumption for the same electrical output.",
        keyTakeaway:
          "Overall efficiency = product of stage efficiencies; losses at each stage add up.",
      },
    ],
    reflectivePrompt:
      "If each stage in a thermal plant is 80% efficient, what can you say about the overall efficiency?",
    simulatorCallout:
      "Use the thermal power plant simulator to see how changes in boiler, turbine, and generator efficiency affect overall efficiency.",
  },
  "solar-energy": {
    slug: "solar-energy",
    title: "Solar Energy",
    shortDescription:
      "Solar panels convert sunlight directly into electricity. Output depends on sunlight intensity, panel area, orientation, and temperature.",
    keywords: [
      "solar energy",
      "solar panel",
      "photovoltaic",
      "renewable",
      "efficiency",
      "high school physics",
    ],
    content: [
      {
        heading: "Solar panels and power",
        body: "A solar panel converts a fraction of incoming solar power into electrical power. The instantaneous power output is approximately P = η · A · I, where η is efficiency, A is panel area, and I is solar intensity (irradiance).",
        keyTakeaway: "Solar power ≈ η A I; orientation and shading strongly affect output.",
      },
    ],
    reflectivePrompt:
      "Why can solar panels still generate power on a cloudy day, even though the output is reduced?",
    simulatorCallout:
      "Use the solar energy simulator to vary intensity, angle, and area and see power and daily energy change.",
  },
  "wind-energy": {
    slug: "wind-energy",
    title: "Wind Energy",
    shortDescription:
      "Wind turbines convert kinetic energy of moving air into electrical energy. Power depends strongly on wind speed and blade size.",
    keywords: [
      "wind energy",
      "wind turbine",
      "renewable",
      "power from wind",
      "efficiency",
      "high school physics",
    ],
    content: [
      {
        heading: "Power from wind",
        body: "The power available in wind through area A with air density ρ and speed v is proportional to ρ A v³. A turbine captures only a fraction of this due to Betz limit and practical losses. Small increases in wind speed greatly increase available power.",
        keyTakeaway: "Available wind power ∝ v³; wind speed is a critical factor.",
      },
    ],
    reflectivePrompt:
      "Why is a location with slightly higher average wind speed often much better for wind farms?",
    simulatorCallout:
      "Use the wind energy simulator to see how power vs wind speed changes with blade length and efficiency.",
  },
  "biogas-plant": {
    slug: "biogas-plant",
    title: "Biogas Plant",
    shortDescription:
      "Biogas plants use anaerobic digestion of organic waste to produce methane-rich gas that can be burned for heat or electricity.",
    keywords: [
      "biogas plant",
      "anaerobic digestion",
      "methane",
      "renewable",
      "waste to energy",
      "high school physics",
    ],
    content: [
      {
        heading: "From waste to gas",
        body: "In a biogas plant, organic waste (e.g. animal dung, kitchen waste) is fed into a sealed digester where microorganisms break it down without oxygen, producing biogas (mainly methane and CO₂). The gas can be used for cooking or to run a generator.",
        keyTakeaway: "Biogas plants turn organic waste into useful fuel while reducing pollution.",
      },
      {
        heading: "Environmental benefits",
        body: "Using biogas can reduce reliance on firewood and fossil fuels and cut methane emissions that would otherwise escape from rotting waste. Slurry left behind can be used as fertiliser.",
        keyTakeaway:
          "Biogas is a renewable, low-waste energy source with multiple environmental benefits.",
      },
    ],
    reflectivePrompt:
      "How does a small biogas plant help both energy supply and waste management in rural areas?",
    simulatorCallout:
      "Use the biogas simulator to relate waste input, gas production, and energy output.",
  },
};

export const SOURCES_OF_ENERGY_SUBTOPIC_SLUGS: SourcesOfEnergySubtopicSlug[] = [
  "renewable-sources-of-energy",
  "non-renewable-sources-of-energy",
  "thermal-power-plant",
  "solar-energy",
  "wind-energy",
  "biogas-plant",
];

