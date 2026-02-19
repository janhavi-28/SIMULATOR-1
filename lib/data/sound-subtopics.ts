/**
 * Sound subtopics: content and SEO for High School Physics.
 * Used by /high-school/physics/sound and /high-school/physics/sound/subtopics/[slug].
 */
export type SoundSubtopicSlug =
  | "nature-of-sound"
  | "sound-as-a-wave"
  | "longitudinal-waves"
  | "amplitude"
  | "time-period"
  | "frequency"
  | "wavelength"
  | "speed-of-sound"
  | "reflection-of-sound"
  | "echo-and-reverberation";

export interface SoundSubtopicContentBlock {
  heading?: string;
  body: string;
  keyTakeaway?: string;
  icon?: string;
}

export interface SoundSubtopic {
  slug: SoundSubtopicSlug;
  title: string;
  shortDescription: string;
  keywords: string[];
  content: SoundSubtopicContentBlock[];
  reflectivePrompt?: string;
  simulatorCallout?: string;
}

export const SOUND_SUBTOPICS: Record<SoundSubtopicSlug, SoundSubtopic> = {
  "nature-of-sound": {
    slug: "nature-of-sound",
    title: "Nature of Sound",
    shortDescription:
      "Sound is a mechanical wave produced by vibrating sources. It requires a medium—solid, liquid, or gas—to travel. No sound in vacuum.",
    keywords: [
      "nature of sound",
      "mechanical wave",
      "vibration",
      "medium",
      "solid liquid gas",
      "vacuum",
      "high school physics",
    ],
    content: [
      {
        heading: "What is sound?",
        body: "Sound is a mechanical wave: a disturbance that travels through a medium due to the vibration of particles. When a source (e.g. a speaker cone or tuning fork) vibrates, it pushes and pulls neighbouring particles, which in turn disturb their neighbours. The disturbance propagates as a wave, but the medium itself does not travel from the source to the listener—only the energy and the pattern of compression and rarefaction do.",
        keyTakeaway: "Sound is a mechanical wave; it needs a medium and is caused by vibrations.",
      },
      {
        heading: "Why sound needs a medium",
        body: "Sound cannot travel through vacuum because there are no particles to vibrate and pass the disturbance along. In solids, liquids, and gases, particles are close enough to transfer the vibration. Sound generally travels fastest in solids (stiff, dense bonds), then liquids, then gases.",
        keyTakeaway: "No medium → no sound. Sound travels in solids, liquids, and gases, not in vacuum.",
      },
    ],
    reflectivePrompt: "Why can you hear a bell inside a jar when air is present, but not after the air is pumped out?",
    simulatorCallout: "Use the simulator to switch between solid, liquid, and gas and see how the medium affects particle motion.",
  },
  "sound-as-a-wave": {
    slug: "sound-as-a-wave",
    title: "Sound as a Wave",
    shortDescription:
      "Sound exhibits wave properties: it has displacement, travels in a direction, and can be represented as displacement vs time or position.",
    keywords: [
      "sound as a wave",
      "travelling wave",
      "displacement",
      "wave motion",
      "high school physics",
    ],
    content: [
      {
        heading: "Wave representation",
        body: "A sound wave can be plotted as displacement of particles versus position (at one instant) or displacement versus time (at one place). The wave shape repeats in space (wavelength λ) and in time (period T). The wave travels in the direction of propagation while the particles oscillate back and forth about their mean position.",
        keyTakeaway: "Sound is a wave: it has wavelength, period, and travels in a direction; particles oscillate locally.",
      },
    ],
    simulatorCallout: "Toggle between wave view and particle view in the simulator to see both representations.",
  },
  "longitudinal-waves": {
    slug: "longitudinal-waves",
    title: "Longitudinal Waves",
    shortDescription:
      "Sound is a longitudinal wave: particles oscillate along the direction of propagation. Regions of compression (high pressure) and rarefaction (low pressure) move forward.",
    keywords: [
      "longitudinal wave",
      "compression",
      "rarefaction",
      "pressure",
      "sound wave",
      "high school physics",
    ],
    content: [
      {
        heading: "Compressions and rarefactions",
        body: "In a longitudinal wave, particles move back and forth along the same line as the direction of travel. Where particles are pushed together, we get a compression (high pressure); where they are spread apart, a rarefaction (low pressure). These regions move along the medium, carrying energy.",
        keyTakeaway: "Longitudinal wave: compressions (high density) and rarefactions (low density) propagate in the direction of the wave.",
      },
    ],
    simulatorCallout: "Watch the compression–rarefaction pattern and the direction arrows in the simulator.",
  },
  amplitude: {
    slug: "amplitude",
    title: "Amplitude",
    shortDescription:
      "Amplitude is the maximum displacement of particles from their mean position. It is related to loudness and to the energy carried by the wave.",
    keywords: [
      "amplitude",
      "loudness",
      "displacement",
      "sound intensity",
      "energy",
      "high school physics",
    ],
    content: [
      {
        heading: "Amplitude and loudness",
        body: "The amplitude of a sound wave is the maximum displacement of the vibrating particles. Larger amplitude means a louder sound (more energy per unit time crossing a unit area). Doubling the amplitude of a wave increases the intensity (and perceived loudness) significantly.",
        keyTakeaway: "Amplitude = maximum displacement; larger amplitude → louder sound and more energy.",
      },
    ],
    simulatorCallout: "Use the amplitude slider to see how displacement and loudness change together.",
  },
  "time-period": {
    slug: "time-period",
    title: "Time Period",
    shortDescription:
      "The time period T is the time for one complete oscillation. It is the inverse of frequency: T = 1/f.",
    keywords: [
      "time period",
      "period",
      "oscillation",
      "frequency",
      "T = 1/f",
      "high school physics",
    ],
    content: [
      {
        heading: "Definition and relation to frequency",
        body: "The time period (T) of a wave is the time taken for one complete cycle—e.g. from one compression to the next. Frequency (f) is the number of cycles per second, so f = 1/T and T = 1/f. Units: T in seconds (s), f in hertz (Hz).",
        keyTakeaway: "T = 1/f; period and frequency are inverses.",
      },
    ],
    simulatorCallout: "Change frequency and watch the time period readout update in the simulator.",
  },
  frequency: {
    slug: "frequency",
    title: "Frequency",
    shortDescription:
      "Frequency is the number of oscillations per second (Hz). It determines the pitch of the sound: higher frequency means higher pitch.",
    keywords: [
      "frequency",
      "pitch",
      "hertz",
      "Hz",
      "oscillations per second",
      "high school physics",
    ],
    content: [
      {
        heading: "Frequency and pitch",
        body: "Frequency (f) is the number of complete cycles of the wave that pass a point per second, measured in hertz (Hz). For sound, higher frequency is perceived as higher pitch (e.g. a whistle vs a drum). The human ear typically hears roughly 20 Hz to 20,000 Hz.",
        keyTakeaway: "Frequency f (Hz) = cycles per second; higher f → higher pitch.",
      },
    ],
    simulatorCallout: "Use the frequency slider to see the f ↔ T relationship and optional beat effect.",
  },
  wavelength: {
    slug: "wavelength",
    title: "Wavelength",
    shortDescription:
      "Wavelength λ is the distance between successive compressions (or rarefactions). It is related to speed and frequency by v = fλ.",
    keywords: [
      "wavelength",
      "lambda",
      "v = fλ",
      "speed of sound",
      "frequency",
      "high school physics",
    ],
    content: [
      {
        heading: "Wavelength and the wave equation",
        body: "Wavelength (λ) is the distance over which the wave shape repeats—e.g. from one compression to the next. The fundamental relation is v = fλ: wave speed = frequency × wavelength. So if speed is constant, increasing frequency decreases wavelength.",
        keyTakeaway: "v = fλ; wavelength is the spatial repeat distance of the wave.",
      },
    ],
    simulatorCallout: "Change frequency and see wavelength adjust; read λ, f, and v in the simulator.",
  },
  "speed-of-sound": {
    slug: "speed-of-sound",
    title: "Speed of Sound",
    shortDescription:
      "The speed of sound depends on the medium and, in gases, on temperature. It is typically around 343 m/s in air at 20°C.",
    keywords: [
      "speed of sound",
      "medium",
      "temperature",
      "air",
      "water",
      "steel",
      "high school physics",
    ],
    content: [
      {
        heading: "Dependence on medium and temperature",
        body: "Speed of sound is different in different media: roughly 343 m/s in air at 20°C, about 1500 m/s in water, and several thousand m/s in steel. In gases, speed increases with temperature (approximately proportional to √T). In liquids and solids, the relationship is more complex but still depends on elastic properties and density.",
        keyTakeaway: "Speed depends on medium (and in gases, on temperature); v_air ≈ 343 m/s at 20°C.",
      },
    ],
    simulatorCallout: "Select medium and temperature in the simulator and read the speed and travel time.",
  },
  "reflection-of-sound": {
    slug: "reflection-of-sound",
    title: "Reflection of Sound",
    shortDescription:
      "Sound obeys the law of reflection: the angle of incidence equals the angle of reflection. Used in echoes and in designing rooms.",
    keywords: [
      "reflection of sound",
      "angle of incidence",
      "angle of reflection",
      "echo",
      "normal",
      "high school physics",
    ],
    content: [
      {
        heading: "Law of reflection",
        body: "When sound hits a surface, it can reflect. The angle of incidence (measured from the normal) equals the angle of reflection. The incident ray, normal, and reflected ray lie in the same plane. This is the same geometric law as for light.",
        keyTakeaway: "Angle of incidence = angle of reflection; sound follows the same reflection law as light.",
      },
    ],
    simulatorCallout: "In the simulator, see the sound ray hit the wall and verify that angles are equal.",
  },
  "echo-and-reverberation": {
    slug: "echo-and-reverberation",
    title: "Echo and Reverberation",
    shortDescription:
      "An echo is a distinct reflected sound heard after a delay. Reverberation is the persistence of many reflections in a closed space. The delay depends on distance to the reflecting surface.",
    keywords: [
      "echo",
      "reverberation",
      "reflection",
      "time delay",
      "distance",
      "acoustics",
      "high school physics",
    ],
    content: [
      {
        heading: "Echo vs reverberation",
        body: "An echo is when a single reflection is heard as a distinct repeat of the original sound; this usually requires the reflecting surface to be far enough that the delay (2d/v for distance d, speed v) is noticeable (e.g. ≥ 0.1 s). Reverberation is the overlapping of many reflections in a room, so the sound seems to \"linger\" rather than producing a clear second copy.",
        keyTakeaway: "Echo = distinct delayed reflection; reverberation = many overlapping reflections in a space.",
      },
    ],
    simulatorCallout: "Adjust the distance to the wall and watch the delay and the echo vs reverberation condition.",
  },
};

export const SOUND_SUBTOPIC_SLUGS: SoundSubtopicSlug[] = [
  "nature-of-sound",
  "sound-as-a-wave",
  "longitudinal-waves",
  "amplitude",
  "time-period",
  "frequency",
  "wavelength",
  "speed-of-sound",
  "reflection-of-sound",
  "echo-and-reverberation",
];
