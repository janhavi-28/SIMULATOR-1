/**
 * Tooltip content for pipeline components. Data only — no React.
 */

export interface ComponentTooltip {
  name: string;
  role: string;
  formula: string;
  analogy: string;
}

export const PIPELINE_TOOLTIPS: Record<string, ComponentTooltip> = {
  fuelTank: {
    name: "Fuel reservoir",
    role: "Stores fossil fuel (coal, oil, or gas). Level drops as fuel is consumed.",
    formula: "Reserve % decreases with fuel input rate × time",
    analogy: "Like a gas tank in a car — once empty, you must refill (non-renewable).",
  },
  boiler: {
    name: "Boiler",
    role: "Burns fuel to heat water into high-pressure steam.",
    formula: "Thermal energy = chemical energy × combustion efficiency",
    analogy: "Like a kettle on a stove — heat turns water into steam.",
  },
  turbine: {
    name: "Turbine",
    role: "Converts steam energy into rotational motion.",
    formula: "Torque = Force × Radius; Power = Torque × Angular velocity",
    analogy: "Like a windmill — moving fluid (steam) spins the blades.",
  },
  generator: {
    name: "Generator",
    role: "Converts mechanical rotation into electrical energy.",
    formula: "EMF induced by changing magnetic flux (Faraday’s law)",
    analogy: "Like a bicycle dynamo — spinning creates electricity.",
  },
  output: {
    name: "Electrical output",
    role: "Power sent to the grid (MW).",
    formula: "P = η × (fuel input power); η ≈ 40% for thermal plants",
    analogy: "Like the plug in your wall — this is what powers homes.",
  },
  smokestack: {
    name: "Smokestack",
    role: "Releases CO₂ and other combustion products.",
    formula: "CO₂ ∝ fuel burned × carbon content",
    analogy: "Like exhaust from a car — burning fossil fuels releases greenhouse gases.",
  },
};

export function getTooltip(id: string): ComponentTooltip | undefined {
  return PIPELINE_TOOLTIPS[id];
}
