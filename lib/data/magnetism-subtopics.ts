/**
 * Magnetism & Electromagnetism subtopics for High School Physics.
 * Used by /high-school/physics/magnetism and its subtopics.
 */
export type MagnetismSubtopicSlug =
  | "magnetic-field"
  | "magnetic-field-lines"
  | "field-due-to-current"
  | "flemings-left-hand-rule"
  | "flemings-right-hand-rule"
  | "electromagnetic-induction"
  | "electric-motor"
  | "electric-generator";

export interface MagnetismContentBlock {
  heading?: string;
  body: string;
  keyTakeaway?: string;
  icon?: string;
}

export interface MagnetismSubtopic {
  slug: MagnetismSubtopicSlug;
  title: string;
  shortDescription: string;
  keywords: string[];
  content: MagnetismContentBlock[];
  reflectivePrompt?: string;
  simulatorCallout?: string;
}

export const MAGNETISM_SUBTOPICS: Record<MagnetismSubtopicSlug, MagnetismSubtopic> = {
  "magnetic-field": {
    slug: "magnetic-field",
    title: "Magnetic Field",
    shortDescription:
      "A magnetic field is the region around a magnet or current-carrying conductor where magnetic effects can be detected, represented by field lines and vectors.",
    keywords: [
      "magnetic field",
      "magnetic field strength",
      "B-field",
      "compass",
      "bar magnet",
      "high school physics",
    ],
    content: [
      {
        heading: "Definition of magnetic field",
        body: "A magnetic field is a vector field around a magnet, current-carrying conductor, or moving charge in which another magnet or moving charge experiences a force. We represent it by magnetic field lines or arrows. The direction at a point is the direction a north pole would tend to move.",
        keyTakeaway: "Magnetic field is a vector quantity: it has magnitude and direction and can be probed with a compass.",
      },
      {
        heading: "Field strength and distance",
        body: "For a bar magnet, the magnetic field is strongest near the poles and decreases with distance. Field lines crowd where the field is strong and spread out where it is weak. For a long straight current-carrying conductor, the field strength is approximately proportional to current and inversely proportional to distance from the wire.",
        keyTakeaway: "Magnetic field strength decreases with distance and depends on source strength (magnet or current).",
      },
    ],
    reflectivePrompt: "How would you use a small compass to map the magnetic field around a bar magnet?",
    simulatorCallout: "Use the magnetic field simulator to place a probe and read field magnitude and direction.",
  },
  "magnetic-field-lines": {
    slug: "magnetic-field-lines",
    title: "Magnetic Field Lines",
    shortDescription:
      "Magnetic field lines are imaginary lines used to represent the direction and strength of the magnetic field; they emerge from the north pole and enter the south pole outside a magnet.",
    keywords: [
      "magnetic field lines",
      "field density",
      "neutral points",
      "bar magnets",
      "high school physics",
    ],
    content: [
      {
        heading: "Properties of field lines",
        body: "Magnetic field lines are drawn so that the tangent at any point gives the direction of the field at that point. Outside a bar magnet, they emerge from the north pole and enter the south pole; inside the magnet, they go from south to north, forming closed loops. Lines never intersect and field is stronger where they are closer together.",
        keyTakeaway: "Field lines are a visualization tool: closer lines mean stronger field; they form closed loops.",
      },
      {
        heading: "Interaction of two magnets",
        body: "When two magnets are placed near each other, their field lines distort and combine. Like poles facing each other produce a region of weakened field and neutral points; unlike poles produce stronger field lines connecting N to S between them.",
        keyTakeaway: "Two-magnet systems show attraction or repulsion through the pattern and density of combined field lines.",
      },
    ],
    reflectivePrompt: "Why do we say magnetic field lines are 'imaginary', yet very useful?",
    simulatorCallout: "Switch between single and double magnet mode to see how field patterns change.",
  },
  "field-due-to-current": {
    slug: "field-due-to-current",
    title: "Magnetic Field due to Current-Carrying Conductor",
    shortDescription:
      "A current-carrying conductor produces a magnetic field with circular field lines around it; the direction is given by the right-hand thumb rule.",
    keywords: [
      "magnetic field due to current",
      "current-carrying conductor",
      "right-hand thumb rule",
      "B ∝ I / r",
      "high school physics",
    ],
    content: [
      {
        heading: "Circular field around a straight conductor",
        body: "When an electric current passes through a straight conductor, it produces a magnetic field in the surrounding space. The field lines form concentric circles around the wire, with direction given by the right-hand thumb rule: if you hold the conductor with your right hand and thumb pointing in the direction of current, your fingers curl in the direction of field lines.",
        keyTakeaway: "Current in a straight conductor produces circular magnetic field lines around it.",
      },
      {
        heading: "Dependence on current and distance",
        body: "The magnitude of the magnetic field near a long straight conductor is directly proportional to the current (I) and inversely proportional to the distance (r) from the wire: B ∝ I / r for points close to the wire in air or vacuum.",
        keyTakeaway: "Increase current → stronger field; move farther away → weaker field.",
      },
    ],
    reflectivePrompt: "How would the field pattern change if you reverse the direction of current in the conductor?",
    simulatorCallout: "Use the conductor simulator to change current, direction, and distance and watch B update.",
  },
  "flemings-left-hand-rule": {
    slug: "flemings-left-hand-rule",
    title: "Fleming’s Left-Hand Rule",
    shortDescription:
      "Fleming’s left-hand rule gives the direction of force on a current-carrying conductor placed in a magnetic field: thumb = force, forefinger = field, middle finger = current.",
    keywords: [
      "Fleming's left-hand rule",
      "motor rule",
      "force on conductor",
      "F = BIL",
      "high school physics",
    ],
    content: [
      {
        heading: "Motor rule",
        body: "When a current-carrying conductor is placed in a magnetic field, it experiences a force. Fleming’s left-hand rule helps remember the direction: stretch your left hand so that the forefinger, middle finger, and thumb are mutually perpendicular. Forefinger points in the direction of magnetic field (B), middle finger in the direction of current (I), and thumb then gives the direction of force (F) on the conductor.",
        keyTakeaway: "Left hand: Forefinger (Field), Middle finger (Current), Thumb (Force).",
      },
      {
        heading: "Magnitude of force",
        body: "If the conductor of length L carries current I in a magnetic field of strength B, and the conductor is perpendicular to the field, the magnitude of the force is F = BIL. If the angle between the field and the conductor is θ, then F = BIL sin θ.",
        keyTakeaway: "Force magnitude F = BIL sin θ; direction from Fleming’s left-hand rule.",
      },
    ],
    reflectivePrompt: "Why is Fleming’s left-hand rule often called the motor rule?",
    simulatorCallout: "Change current and field strength to see force direction and F = BIL update.",
  },
  "flemings-right-hand-rule": {
    slug: "flemings-right-hand-rule",
    title: "Fleming’s Right-Hand Rule",
    shortDescription:
      "Fleming’s right-hand rule gives the direction of induced current when a conductor moves in a magnetic field: thumb = motion, forefinger = field, middle finger = induced current.",
    keywords: [
      "Fleming's right-hand rule",
      "generator rule",
      "induced current",
      "electromagnetic induction",
      "high school physics",
    ],
    content: [
      {
        heading: "Generator rule",
        body: "When a straight conductor moves in a magnetic field and cuts magnetic field lines, an emf is induced and current may flow if the circuit is closed. Fleming’s right-hand rule helps remember the direction: stretch your right hand so that the thumb, forefinger, and middle finger are mutually perpendicular. Thumb points in the direction of motion of the conductor, forefinger in the direction of magnetic field (north to south), and middle finger gives the direction of induced current.",
        keyTakeaway: "Right hand: Thumb (Motion), Forefinger (Field), Middle finger (Induced current).",
      },
      {
        heading: "Link to induction",
        body: "The rule is consistent with the idea that induced current opposes the change causing it (Lenz’s law). It is particularly useful in understanding generators where mechanical motion in a magnetic field produces electrical energy.",
        keyTakeaway: "Right-hand rule is used for generators and induction direction.",
      },
    ],
    reflectivePrompt: "How is Fleming’s right-hand rule related to electromagnetic induction in a generator?",
    simulatorCallout: "Use the rotating coil simulator to see how motion direction affects induced current.",
  },
  "electromagnetic-induction": {
    slug: "electromagnetic-induction",
    title: "Electromagnetic Induction",
    shortDescription:
      "Electromagnetic induction is the production of emf in a conductor when the magnetic flux linked with it changes, described qualitatively by Faraday’s and Lenz’s laws.",
    keywords: [
      "electromagnetic induction",
      "Faraday's law",
      "Lenz's law",
      "magnetic flux",
      "induced emf",
      "high school physics",
    ],
    content: [
      {
        heading: "Changing flux",
        body: "An emf is induced in a coil when the magnetic flux linked with it changes. This can happen by moving a magnet towards or away from the coil, moving the coil in a magnetic field, or changing the current in a nearby coil. Faster change in flux produces larger induced emf.",
        keyTakeaway: "Induced emf ∝ rate of change of magnetic flux.",
      },
      {
        heading: "Direction of induced current",
        body: "Lenz’s law states that the direction of induced current is such that it opposes the change in flux that produced it. This explains why pushing a magnet into a coil feels harder when current is induced, and why the induced current direction reverses when you reverse the motion.",
        keyTakeaway: "Induced current direction opposes the change causing it (Lenz’s law).",
      },
    ],
    reflectivePrompt: "Why does a galvanometer needle deflect in opposite directions when a magnet is moved into and out of a coil?",
    simulatorCallout:
      "In the induction simulator, vary magnet speed and coil turns and watch the emf–time graph and galvanometer deflection.",
  },
  "electric-motor": {
    slug: "electric-motor",
    title: "Electric Motor",
    shortDescription:
      "An electric motor converts electrical energy into mechanical energy using the force on a current-carrying coil in a magnetic field, plus a commutator to keep it rotating in one direction.",
    keywords: [
      "electric motor",
      "DC motor",
      "torque on coil",
      "commutator",
      "Fleming's left-hand rule",
      "high school physics",
    ],
    content: [
      {
        heading: "Principle of motor action",
        body: "A current-carrying conductor in a magnetic field experiences a force. In a rectangular coil placed between the poles of a magnet, forces on opposite sides of the coil form a couple, creating a torque that makes the coil rotate. Fleming’s left-hand rule gives the direction of force on each side.",
        keyTakeaway: "Motor principle: current + magnetic field → force → rotation (torque).",
      },
      {
        heading: "Role of commutator",
        body: "In a simple DC motor, a split-ring commutator reverses the direction of current in the coil every half-rotation. This ensures that the torque on the coil always acts in roughly the same rotational direction, allowing continuous rotation.",
        keyTakeaway: "Commutator reverses coil current each half-turn so the motor keeps spinning.",
      },
    ],
    reflectivePrompt: "What would happen to a DC motor if the commutator were not present?",
    simulatorCallout: "Adjust current, field strength, and turns in the motor simulator to see torque and rotation speed.",
  },
  "electric-generator": {
    slug: "electric-generator",
    title: "Electric Generator",
    shortDescription:
      "An electric generator converts mechanical energy into electrical energy by rotating a coil in a magnetic field to induce emf and current.",
    keywords: [
      "electric generator",
      "AC generator",
      "induced emf",
      "electromagnetic induction",
      "Fleming's right-hand rule",
      "high school physics",
    ],
    content: [
      {
        heading: "Principle of generator action",
        body: "When a coil rotates in a magnetic field, the magnetic flux through the coil changes with time. According to Faraday’s law, an emf is induced in the coil. If the circuit is closed, an alternating current flows. Fleming’s right-hand rule gives the direction of induced current for a given motion and field direction.",
        keyTakeaway: "Generator principle: changing flux through a rotating coil induces emf and current.",
      },
      {
        heading: "AC waveform",
        body: "As the coil rotates, the induced emf varies sinusoidally with time, going through positive and negative values. This produces an alternating voltage and current. The frequency of the AC depends on the rotation speed of the coil.",
        keyTakeaway: "Generators typically produce sinusoidal AC; frequency is set by mechanical rotation speed.",
      },
    ],
    reflectivePrompt: "How can changing the rotation speed of a generator affect the frequency and magnitude of the output AC?",
    simulatorCallout:
      "Use the generator simulator to vary rotation speed and field strength and watch the AC waveform change.",
  },
};

export const MAGNETISM_SUBTOPIC_SLUGS: MagnetismSubtopicSlug[] = [
  "magnetic-field",
  "magnetic-field-lines",
  "field-due-to-current",
  "flemings-left-hand-rule",
  "flemings-right-hand-rule",
  "electromagnetic-induction",
  "electric-motor",
  "electric-generator",
];

