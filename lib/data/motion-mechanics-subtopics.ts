/**
 * Motion & Mechanics subtopics: content and SEO for High School Physics.
 * Used by /high-school/physics/motion and /high-school/physics/motion/subtopics/[slug].
 */
export type MotionMechanicsSubtopicSlug =
  | "motion"
  | "distance-and-displacement"
  | "speed-and-velocity"
  | "acceleration"
  | "uniform-and-non-uniform-motion"
  | "graphical-representation-of-motion"
  | "equations-of-motion"
  | "force"
  | "newtons-laws-of-motion"
  | "inertia"
  | "momentum-and-conservation-of-momentum";

export interface MotionMechanicsSubtopicContentBlock {
  heading?: string;
  body: string;
  keyTakeaway?: string;
  icon?: string;
}

export interface MotionMechanicsSubtopic {
  slug: MotionMechanicsSubtopicSlug;
  title: string;
  shortDescription: string;
  keywords: string[];
  content: MotionMechanicsSubtopicContentBlock[];
  reflectivePrompt?: string;
  simulatorCallout?: string;
}

export const MOTION_MECHANICS_SUBTOPICS: Record<MotionMechanicsSubtopicSlug, MotionMechanicsSubtopic> = {
  motion: {
    slug: "motion",
    title: "Motion",
    shortDescription:
      "Motion is the change in position of an object with time. It is described using quantities such as distance, displacement, speed, velocity, and acceleration.",
    keywords: ["motion", "kinematics", "position", "time", "rest", "high school physics"],
    content: [
      {
        heading: "What is motion?",
        body: "Motion is the change in position of an object with respect to a reference point (or frame of reference) as time passes. An object at rest has no change in position; an object in motion changes its position. The study of motion without considering the cause (force) is called kinematics.",
        keyTakeaway: "Motion is change in position with time; kinematics studies motion without its cause.",
      },
      {
        heading: "Reference frame",
        body: "To describe motion we need a reference frame—a set of axes (e.g. x, y) and a clock. Whether an object is \"at rest\" or \"moving\" depends on the frame. For example, a passenger in a moving train is at rest relative to the train but moving relative to the ground.",
        keyTakeaway: "Rest and motion depend on the reference frame; we need axes and a clock to describe them.",
      },
      {
        heading: "Types of motion",
        body: "Motion can be along a straight line (rectilinear), along a curve (curvilinear), or in a circle (circular). It can be uniform (constant speed) or non-uniform (changing speed or direction). These ideas lead to the concepts of distance, displacement, speed, velocity, and acceleration.",
        keyTakeaway: "Motion can be rectilinear, curvilinear, or circular; uniform or non-uniform.",
      },
    ],
    reflectivePrompt: "When you sit in a moving car, are you at rest or in motion? How does your answer depend on the reference frame?",
    simulatorCallout: "The speed–time graph above shows how motion can be uniform or changing; position depends on your reference.",
  },
  "distance-and-displacement": {
    slug: "distance-and-displacement",
    title: "Distance and Displacement",
    shortDescription:
      "Distance is the total path length; displacement is the straight-line change in position from start to end. Distance is a scalar, displacement is a vector.",
    keywords: ["distance", "displacement", "scalar", "vector", "path length", "position", "high school physics"],
    content: [
      {
        heading: "Distance",
        body: "Distance is the total length of the path actually travelled by an object. It is a scalar quantity—it has magnitude only, no direction. The SI unit is the metre (m). For example, if you walk 3 m east and then 4 m north, the distance travelled is 7 m.",
        keyTakeaway: "Distance is total path length; it is a scalar (magnitude only).",
      },
      {
        heading: "Displacement",
        body: "Displacement is the change in position of an object from its initial position to its final position. It is a vector: it has both magnitude and direction. Displacement is the straight line from start to end, regardless of the path taken. In the example above, the displacement is 5 m in a direction between east and north (by Pythagoras).",
        keyTakeaway: "Displacement is the straight-line change in position; it is a vector (magnitude and direction).",
      },
      {
        heading: "Distance vs displacement",
        body: "Distance is always positive or zero; displacement can be positive, negative, or zero (when the object returns to the start). For motion in one dimension along a line, we often take displacement as positive in one direction and negative in the other. The magnitude of displacement is less than or equal to the distance.",
        keyTakeaway: "Magnitude of displacement ≤ distance; displacement can be negative when we choose a sign convention.",
      },
    ],
    reflectivePrompt: "If you run one lap around a track and stop where you started, what is your displacement? What is your distance?",
  },
  "speed-and-velocity": {
    slug: "speed-and-velocity",
    title: "Speed and Velocity",
    shortDescription:
      "Speed is the rate of change of distance (scalar); velocity is the rate of change of displacement (vector). Average and instantaneous values are used in kinematics.",
    keywords: ["speed", "velocity", "average speed", "instantaneous velocity", "scalar", "vector", "high school physics"],
    content: [
      {
        heading: "Speed",
        body: "Speed is the rate at which distance is covered. Average speed = total distance / total time. Speed is a scalar—it has no direction. The SI unit is m/s (metres per second). Instantaneous speed is the speed at a particular instant.",
        keyTakeaway: "Speed is rate of change of distance; it is a scalar (no direction).",
      },
      {
        heading: "Velocity",
        body: "Velocity is the rate of change of displacement. It is a vector: it has magnitude (speed) and direction. Average velocity = total displacement / total time. For motion in one dimension (e.g. along the x-axis), we use positive and negative signs to indicate direction. Instantaneous velocity is the velocity at a particular instant.",
        keyTakeaway: "Velocity is rate of change of displacement; it is a vector (magnitude and direction).",
      },
      {
        heading: "Uniform velocity",
        body: "When an object moves with constant velocity, its speed and direction do not change. The displacement in time t is s = v t, where v is the (constant) velocity. Uniform motion is a special case that leads to simple equations and straight-line graphs.",
        keyTakeaway: "Uniform velocity means constant speed and direction; displacement s = v t.",
      },
    ],
    reflectivePrompt: "Can an object have constant speed but changing velocity? When?",
    simulatorCallout: "The speed–time graph above shows how speed can change; velocity also has direction, so a turn changes velocity even if speed is constant.",
  },
  acceleration: {
    slug: "acceleration",
    title: "Acceleration",
    shortDescription:
      "Acceleration is the rate of change of velocity. It is a vector. Uniform acceleration means constant rate of change of velocity (e.g. free fall near Earth).",
    keywords: ["acceleration", "rate of change of velocity", "uniform acceleration", "free fall", "high school physics"],
    content: [
      {
        heading: "Definition of acceleration",
        body: "Acceleration is the rate at which velocity changes with time. Average acceleration = change in velocity / time taken. It is a vector. The SI unit is m/s². When velocity increases, acceleration is in the direction of motion; when velocity decreases (e.g. braking), acceleration is opposite to the direction of motion.",
        keyTakeaway: "Acceleration is rate of change of velocity; it is a vector (unit m/s²).",
      },
      {
        heading: "Uniform acceleration",
        body: "When the rate of change of velocity is constant, we have uniform (constant) acceleration. Free fall near the Earth's surface is approximately uniform acceleration: a = g ≈ 9.8 m/s² downward. The equations of motion (v = u + at, s = ut + ½at², etc.) apply when acceleration is constant.",
        keyTakeaway: "Uniform acceleration is constant; free fall has a ≈ g downward; kinematic equations apply.",
      },
      {
        heading: "Deceleration",
        body: "Deceleration is acceleration that opposes the direction of motion—the object slows down. It is still described by the same vector quantity; we often say \"deceleration\" when the speed is decreasing. In one dimension, deceleration corresponds to acceleration with sign opposite to velocity.",
        keyTakeaway: "Deceleration is acceleration that reduces speed (opposite to velocity in 1D).",
      },
    ],
    reflectivePrompt: "When you throw a ball upward, what is the direction of its acceleration at the highest point? What about its velocity?",
    simulatorCallout: "The slope of the speed–time graph above gives acceleration; a constant slope means uniform acceleration.",
  },
  "uniform-and-non-uniform-motion": {
    slug: "uniform-and-non-uniform-motion",
    title: "Uniform and Non-uniform Motion",
    shortDescription:
      "Uniform motion: constant speed in a straight line. Non-uniform motion: changing speed and/or direction. These ideas lead to graphs and equations of motion.",
    keywords: ["uniform motion", "non-uniform motion", "constant speed", "variable speed", "high school physics"],
    content: [
      {
        heading: "Uniform motion",
        body: "In uniform motion, the object covers equal distances in equal intervals of time. For motion in a straight line with constant velocity, the position–time graph is a straight line and the velocity–time graph is a horizontal line. No acceleration is present in the direction of motion.",
        keyTakeaway: "Uniform motion: constant velocity; position–time graph is straight, velocity–time graph is horizontal.",
      },
      {
        heading: "Non-uniform motion",
        body: "In non-uniform motion, the object does not cover equal distances in equal intervals of time—either the speed changes or the direction changes (or both). The velocity–time graph is not horizontal; the slope gives the acceleration. Most real motions (e.g. a car in traffic, a ball in free fall) are non-uniform.",
        keyTakeaway: "Non-uniform motion has changing speed or direction; slope of v–t graph gives acceleration.",
      },
      {
        heading: "Why it matters",
        body: "Uniform motion is the simplest case and is used to introduce displacement, velocity, and graphs. Non-uniform motion requires the concept of acceleration and leads to the equations of motion for uniformly accelerated motion, which is a very common approximation (e.g. free fall, braking).",
        keyTakeaway: "Uniform motion is the baseline; uniformly accelerated motion is a common and useful approximation.",
      },
    ],
    reflectivePrompt: "Why do we often treat free fall as uniformly accelerated motion even though air resistance affects real falling objects?",
    simulatorCallout: "Compare a flat speed–time line (uniform) with a sloping line (non-uniform) in the simulator above.",
  },
  "graphical-representation-of-motion": {
    slug: "graphical-representation-of-motion",
    title: "Graphical Representation of Motion",
    shortDescription:
      "Position–time, velocity–time, and acceleration–time graphs help visualise motion. Slope and area under curves give velocity and displacement.",
    keywords: ["position-time graph", "velocity-time graph", "acceleration-time graph", "slope", "area under curve", "high school physics"],
    content: [
      {
        heading: "Position–time (x–t) graph",
        body: "The position–time graph shows position (or displacement) on the vertical axis and time on the horizontal axis. The slope of the x–t graph at any point gives the velocity at that instant. A straight line means constant velocity; a curve means changing velocity.",
        keyTakeaway: "Slope of position–time graph = velocity; straight line means constant velocity.",
      },
      {
        heading: "Velocity–time (v–t) graph",
        body: "The velocity–time graph shows velocity on the vertical axis and time on the horizontal. The slope of the v–t graph gives the acceleration. The area under the v–t graph (between the curve and the time axis) gives the displacement in that time interval. A horizontal line means constant velocity (zero acceleration).",
        keyTakeaway: "Slope of v–t graph = acceleration; area under v–t graph = displacement.",
      },
      {
        heading: "Acceleration–time (a–t) graph",
        body: "The acceleration–time graph shows acceleration versus time. The area under the a–t graph gives the change in velocity. For uniform acceleration, the a–t graph is a horizontal line. These three types of graphs are linked: from one we can derive the others using slope and area.",
        keyTakeaway: "Area under a–t graph = change in velocity; the three graphs are linked by slope and area.",
      },
    ],
    reflectivePrompt: "If the velocity–time graph is a straight line sloping up, what can you say about the position–time graph?",
    simulatorCallout: "The graph above is a velocity–time (or speed–time) representation; its slope is acceleration, its area is displacement.",
  },
  "equations-of-motion": {
    slug: "equations-of-motion",
    title: "Equations of Motion",
    shortDescription:
      "For uniformly accelerated motion in a straight line: v = u + at, s = ut + ½at², v² = u² + 2as. Here u = initial velocity, v = final velocity, a = acceleration, s = displacement, t = time.",
    keywords: ["equations of motion", "kinematic equations", "v equals u plus at", "s equals ut plus half at squared", "uniformly accelerated motion", "high school physics"],
    content: [
      {
        heading: "First equation: v = u + at",
        body: "For motion with constant acceleration a, the final velocity v after time t is v = u + at, where u is the initial velocity. This comes from the definition of acceleration: a = (v − u) / t. It relates velocity and time.",
        keyTakeaway: "v = u + at relates final velocity to initial velocity, acceleration, and time.",
      },
      {
        heading: "Second equation: s = ut + ½at²",
        body: "The displacement s in time t for an object starting with velocity u and having constant acceleration a is s = ut + ½at². When a = 0, this gives s = ut (uniform motion). The term ½at² is the extra displacement due to acceleration.",
        keyTakeaway: "s = ut + ½at² gives displacement in terms of initial velocity, time, and acceleration.",
      },
      {
        heading: "Third equation: v² = u² + 2as",
        body: "This equation relates v, u, a, and s without involving time: v² = u² + 2as. It is useful when time is unknown. For free fall from rest, u = 0 and a = g, so v² = 2gs. These three equations are sufficient to solve problems in one-dimensional uniformly accelerated motion.",
        keyTakeaway: "v² = u² + 2as relates velocities and displacement without time.",
      },
    ],
    reflectivePrompt: "For free fall from rest, which equation gives you the speed when the object has fallen a distance h?",
    simulatorCallout: "The motion in the simulator can be described by these equations when acceleration is constant.",
  },
  force: {
    slug: "force",
    title: "Force",
    shortDescription:
      "Force is a push or pull that can change the state of motion or shape of an object. It is a vector. SI unit is the newton (N).",
    keywords: ["force", "newton", "push", "pull", "contact force", "non-contact force", "high school physics"],
    content: [
      {
        heading: "What is force?",
        body: "Force is that which can change the state of rest or of uniform motion of a body, or change its shape. It is a vector: it has magnitude and direction. The SI unit of force is the newton (N): 1 N is the force that gives a mass of 1 kg an acceleration of 1 m/s². So F = ma.",
        keyTakeaway: "Force can change motion or shape; F = ma; unit is the newton (N).",
      },
      {
        heading: "Types of forces",
        body: "Forces can be contact forces (e.g. friction, normal force, tension) or non-contact forces (e.g. gravitational force, magnetic force, electrostatic force). Forces occur in pairs: when body A exerts a force on body B, B exerts an equal and opposite force on A (Newton's third law).",
        keyTakeaway: "Forces can be contact or non-contact; they occur in action–reaction pairs.",
      },
      {
        heading: "Effect of force",
        body: "A net (unbalanced) force causes acceleration. If the net force on an object is zero, the object remains at rest or moves with constant velocity (Newton's first law). Force is central to the study of mechanics and Newton's laws of motion.",
        keyTakeaway: "Net force causes acceleration; zero net force means constant velocity or rest.",
      },
    ],
    reflectivePrompt: "When you stand on the ground, the ground pushes up on you. What is the pair to this force, and why don't they cancel?",
  },
  "newtons-laws-of-motion": {
    slug: "newtons-laws-of-motion",
    title: "Newton's Laws of Motion",
    shortDescription:
      "First law: inertia. Second law: F = ma. Third law: action and reaction are equal and opposite. These laws form the foundation of classical mechanics.",
    keywords: ["Newton's laws", "first law", "second law", "third law", "F equals ma", "action and reaction", "high school physics"],
    content: [
      {
        heading: "First law (law of inertia)",
        body: "An object remains at rest or in uniform motion in a straight line unless acted upon by a net external force. In other words, if the net force is zero, the acceleration is zero. This law defines inertia: the tendency of an object to resist changes in its state of motion.",
        keyTakeaway: "First law: no net force ⇒ no change in motion (inertia).",
      },
      {
        heading: "Second law",
        body: "The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass: F = ma, or a = F/m. So a larger force gives greater acceleration; a larger mass gives smaller acceleration for the same force. The second law allows us to predict motion when forces are known.",
        keyTakeaway: "Second law: F = ma; acceleration depends on net force and mass.",
      },
      {
        heading: "Third law (action–reaction)",
        body: "When one body exerts a force on a second body, the second body exerts an equal and opposite force on the first. These forces act on different bodies, so they do not cancel each other. For example, when you push a wall, the wall pushes you back with the same magnitude of force.",
        keyTakeaway: "Third law: action and reaction are equal and opposite and act on different bodies.",
      },
    ],
    reflectivePrompt: "When a rocket expels exhaust backward, what force accelerates the rocket forward? Which of Newton's laws is at work?",
  },
  inertia: {
    slug: "inertia",
    title: "Inertia",
    shortDescription:
      "Inertia is the tendency of an object to resist changes in its state of rest or uniform motion. Mass is a measure of inertia.",
    keywords: ["inertia", "mass", "Newton's first law", "resistance to change", "high school physics"],
    content: [
      {
        heading: "Definition of inertia",
        body: "Inertia is the property of matter by which it tends to remain at rest or in uniform motion in a straight line unless acted upon by an external force. It is a qualitative concept expressed quantitatively by mass: the greater the mass, the greater the inertia.",
        keyTakeaway: "Inertia is the tendency to resist changes in motion; it is linked to mass.",
      },
      {
        heading: "Mass as measure of inertia",
        body: "Mass is the measure of inertia. A heavier object is harder to accelerate or decelerate than a lighter one when the same force is applied (from F = ma, larger m means smaller a for the same F). In everyday life we feel inertia when a vehicle brakes suddenly and we lurch forward.",
        keyTakeaway: "Mass measures inertia: larger mass means smaller acceleration for the same force.",
      },
      {
        heading: "Examples",
        body: "When a bus starts moving, passengers feel pushed backward (their bodies tend to stay at rest). When the bus stops, passengers lurch forward (their bodies tend to keep moving). Seat belts and airbags help by applying a force over time to reduce the effect of inertia in collisions.",
        keyTakeaway: "Everyday effects (lurching in a bus, seat belts) illustrate inertia.",
      },
    ],
    reflectivePrompt: "Why does a heavy truck take longer to stop than a car moving at the same speed?",
  },
  "momentum-and-conservation-of-momentum": {
    slug: "momentum-and-conservation-of-momentum",
    title: "Momentum and Conservation of Momentum",
    shortDescription:
      "Momentum p = mv. In an isolated system, total momentum is conserved. This principle is used to analyse collisions and explosions.",
    keywords: ["momentum", "conservation of momentum", "p equals mv", "collision", "isolated system", "high school physics"],
    content: [
      {
        heading: "Momentum",
        body: "The linear momentum of an object is the product of its mass and velocity: p = mv. It is a vector (same direction as velocity). The SI unit is kg·m/s. A fast-moving object or a heavy object can have large momentum. Momentum is central to understanding collisions and the effect of forces over time (impulse).",
        keyTakeaway: "Momentum p = mv is a vector; it is central to collisions and impulse.",
      },
      {
        heading: "Conservation of momentum",
        body: "When no net external force acts on a system, the total momentum of the system remains constant. This is the law of conservation of momentum. It holds for collisions (elastic or inelastic), explosions, and any interaction within an isolated system. For two bodies: m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂ (before and after).",
        keyTakeaway: "In an isolated system, total momentum is conserved (before = after).",
      },
      {
        heading: "Applications",
        body: "Conservation of momentum is used to find velocities after collision when forces during the collision are not known. Rocket propulsion can be explained by momentum: the rocket pushes exhaust backward, and by Newton's third law and conservation of momentum, the rocket moves forward.",
        keyTakeaway: "Conservation of momentum lets us analyse collisions and rocket motion without knowing contact forces.",
      },
    ],
    reflectivePrompt: "In a head-on collision of two cars, how does the total momentum before the crash compare to the total momentum after? What about the total kinetic energy?",
  },
};

export const MOTION_MECHANICS_SUBTOPIC_SLUGS: MotionMechanicsSubtopicSlug[] = [
  "motion",
  "distance-and-displacement",
  "speed-and-velocity",
  "acceleration",
  "uniform-and-non-uniform-motion",
  "graphical-representation-of-motion",
  "equations-of-motion",
  "force",
  "newtons-laws-of-motion",
  "inertia",
  "momentum-and-conservation-of-momentum",
];
