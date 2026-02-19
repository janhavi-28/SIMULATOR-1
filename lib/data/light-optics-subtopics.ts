/**
 * Light and Optics subtopics: content and SEO for High School Physics.
 * Used by /high-school/physics/light/subtopics/[slug].
 */
export type SubtopicSlug =
  | "reflection-of-light"
  | "refraction-of-light"
  | "laws-of-reflection"
  | "laws-of-refraction"
  | "image-formation-plane-mirror"
  | "image-formation-spherical-mirrors"
  | "ray-diagrams"
  | "refraction-glass-slab"
  | "refraction-by-lenses"
  | "magnification";

export interface LightOpticsSubtopicContentBlock {
  heading?: string;
  body: string;
  keyTakeaway?: string;
  icon?: string;
}

export interface LightOpticsSubtopic {
  slug: SubtopicSlug;
  title: string;
  shortDescription: string;
  keywords: string[];
  content: LightOpticsSubtopicContentBlock[];
  reflectivePrompt?: string;
  simulatorCallout?: string;
}

export const LIGHT_OPTICS_SUBTOPICS: Record<SubtopicSlug, LightOpticsSubtopic> = {
  "reflection-of-light": {
    slug: "reflection-of-light",
    title: "Reflection of Light",
    shortDescription:
      "When light hits a surface and bounces back into the same medium. Essential for mirrors, visibility, and understanding ray optics.",
    keywords: [
      "reflection of light",
      "law of reflection",
      "angle of incidence",
      "angle of reflection",
      "plane mirror",
      "specular reflection",
      "diffuse reflection",
      "ray optics",
      "high school physics",
    ],
    content: [
      {
        heading: "What is reflection of light?",
        body: "Reflection of light is the phenomenon in which light rays striking a surface bounce back into the same medium instead of being absorbed or transmitted. The surface may be polished (e.g. a mirror) or rough (e.g. paper). Reflection is why we see objects: light from a source reflects off them and enters our eyes.",
        keyTakeaway: "Reflection is light bouncing back into the same medium; it is why we see objects.",
      },
      {
        heading: "Types of reflection",
        body: "Specular reflection occurs at smooth, shiny surfaces: parallel incident rays remain parallel after reflection, giving a clear image. Diffuse reflection occurs at rough surfaces: parallel rays are reflected in many directions, so no clear image is formed but the surface is visible from many angles.",
        keyTakeaway: "Specular reflection gives a clear image; diffuse reflection scatters light so the surface is visible from many angles.",
      },
      {
        heading: "Why it matters in optics",
        body: "Reflection is the basis of plane mirrors, spherical mirrors (concave and convex), and many optical instruments. Understanding reflection of light is the first step before studying image formation, ray diagrams, and the laws of reflection.",
        keyTakeaway: "Reflection underlies mirrors and image formation in optics.",
      },
    ],
    reflectivePrompt: "Why does a rough wall not form a clear image of your face even though it reflects light?",
    simulatorCallout: "Try changing the surface in the simulator to see how reflection behaves.",
  },
  "refraction-of-light": {
    slug: "refraction-of-light",
    title: "Refraction of Light",
    shortDescription:
      "Bending of light when it passes from one medium into another with a different refractive index. Described by Snell's law.",
    keywords: [
      "refraction of light",
      "Snell's law",
      "refractive index",
      "angle of refraction",
      "total internal reflection",
      "critical angle",
      "optical density",
      "ray optics",
      "high school physics",
    ],
    content: [
      {
        heading: "What is refraction of light?",
        body: "Refraction of light is the change in direction (bending) of light when it passes from one transparent medium into another with a different optical density. The speed of light changes between media; the change in speed causes the ray to bend at the interface. Refraction is responsible for lenses focusing light, mirages, and the apparent position of objects in water.",
        keyTakeaway: "Refraction is the bending of light at an interface between media with different optical densities.",
      },
      {
        heading: "Refractive index",
        body: "The refractive index n of a medium is the ratio of the speed of light in vacuum to the speed of light in that medium. Denser media (e.g. glass, water) have n > 1; when light enters a denser medium from air, it bends toward the normal. When light goes from a denser to a rarer medium, it bends away from the normal.",
        keyTakeaway: "Refractive index n characterises a medium; light bends toward the normal when entering a denser medium.",
      },
      {
        heading: "Snell's law and total internal reflection",
        body: "Snell's law relates the angles: n₁ sin θ₁ = n₂ sin θ₂. When light travels from a denser to a rarer medium, the angle of refraction can exceed 90° beyond a certain incident angle (critical angle); then all light reflects back—total internal reflection (TIR). Optical fibres and prisms use TIR.",
        keyTakeaway: "Snell's law relates angles at an interface; beyond the critical angle, total internal reflection occurs.",
      },
    ],
    reflectivePrompt: "Why does a straw in a glass of water look bent at the surface?",
    simulatorCallout: "The refraction simulator shows how changing media bends the ray.",
  },
  "laws-of-reflection": {
    slug: "laws-of-reflection",
    title: "Laws of Reflection",
    shortDescription:
      "The two laws that govern reflection: the incident ray, normal, and reflected ray lie in one plane; and the angle of incidence equals the angle of reflection.",
    keywords: [
      "laws of reflection",
      "angle of incidence",
      "angle of reflection",
      "normal",
      "plane of incidence",
      "first law of reflection",
      "second law of reflection",
      "ray optics",
      "high school physics",
    ],
    content: [
      {
        heading: "First law of reflection",
        body: "The incident ray, the normal to the reflecting surface at the point of incidence, and the reflected ray all lie in the same plane. This plane is called the plane of incidence. So reflection is a two-dimensional phenomenon in that plane.",
        keyTakeaway: "Incident ray, normal, and reflected ray lie in the same plane (plane of incidence).",
      },
      {
        heading: "Second law of reflection",
        body: "The angle of incidence (i) is equal to the angle of reflection (r). Both angles are measured from the normal: i = r. This holds for both specular and diffuse reflection at each small surface element; in diffuse reflection the surface normals point in different directions, so the reflected rays scatter.",
        keyTakeaway: "Angle of incidence = angle of reflection (i = r), both measured from the normal.",
      },
      {
        heading: "Using the laws",
        body: "These two laws are enough to draw ray diagrams for plane and spherical mirrors and to predict the position and nature of images. They are fundamental to understanding image formation by plane mirrors and by spherical mirrors.",
        keyTakeaway: "The two laws are sufficient for ray diagrams and image formation by mirrors.",
      },
    ],
    reflectivePrompt: "If you know the direction of the incident ray and the normal, how do you draw the reflected ray?",
    simulatorCallout: "Use the simulator to verify that angle of incidence equals angle of reflection.",
  },
  "laws-of-refraction": {
    slug: "laws-of-refraction",
    title: "Laws of Refraction",
    shortDescription:
      "Snell's law and the coplanar rule: the refracted ray lies in the plane of incidence, and n₁ sin θ₁ = n₂ sin θ₂.",
    keywords: [
      "laws of refraction",
      "Snell's law",
      "refractive index",
      "angle of incidence",
      "angle of refraction",
      "plane of incidence",
      "total internal reflection",
      "critical angle",
      "high school physics",
    ],
    content: [
      {
        heading: "First law of refraction",
        body: "The incident ray, the normal at the point of incidence, and the refracted ray all lie in the same plane (the plane of incidence). So refraction, like reflection, is confined to one plane containing the normal.",
        keyTakeaway: "Incident ray, normal, and refracted ray lie in the same plane.",
      },
      {
        heading: "Second law of refraction (Snell's law)",
        body: "The ratio of the sine of the angle of incidence to the sine of the angle of refraction is a constant for a given pair of media and for a given colour of light. In symbols: n₁ sin θ₁ = n₂ sin θ₂, where n₁ and n₂ are the refractive indices of the first and second medium, and θ₁ and θ₂ are the angles from the normal. This is Snell's law.",
        keyTakeaway: "Snell's law: n₁ sin θ₁ = n₂ sin θ₂ for a given pair of media.",
      },
      {
        heading: "Consequences",
        body: "When n₂ > n₁ (light enters a denser medium), θ₂ < θ₁: the ray bends toward the normal. When n₂ < n₁ (light enters a rarer medium), θ₂ > θ₁: the ray bends away from the normal. If θ₁ is large enough that sin θ₂ would exceed 1, refraction is impossible and total internal reflection occurs.",
        keyTakeaway: "Denser medium → bend toward normal; rarer medium → bend away; beyond critical angle, TIR.",
      },
    ],
    reflectivePrompt: "Why does the same prism separate white light into colours? (Think about n and Snell's law.)",
  },
  "image-formation-plane-mirror": {
    slug: "image-formation-plane-mirror",
    title: "Image Formation by Plane Mirror",
    shortDescription:
      "A plane mirror forms a virtual, erect image behind the mirror, same size as the object. Distance of image equals distance of object.",
    keywords: [
      "image formation by plane mirror",
      "plane mirror",
      "virtual image",
      "lateral inversion",
      "image distance",
      "object distance",
      "erect image",
      "ray diagram",
      "high school physics",
    ],
    content: [
      {
        heading: "Nature of the image",
        body: "A plane mirror always forms a virtual image: the reflected rays appear to come from behind the mirror, so the image cannot be obtained on a screen. The image is erect (upright) and of the same size as the object. The image is as far behind the mirror as the object is in front: object distance u and image distance v satisfy |u| = |v| (with sign convention, v = -u for a plane mirror).",
        keyTakeaway: "Plane mirror: virtual, erect image, same size; image distance = object distance.",
      },
      {
        heading: "Lateral inversion",
        body: "The image is laterally inverted: left and right are swapped. Text held in front of a plane mirror appears reversed. This is because the front-back direction is reversed relative to the mirror surface.",
        keyTakeaway: "The image is laterally inverted (left and right swapped).",
      },
      {
        heading: "Ray diagram",
        body: "To locate the image, take at least two rays from the object: one perpendicular to the mirror (reflects back along the same path) and one at an angle (reflects so that angle of incidence = angle of reflection). The reflected rays (when produced backwards) meet behind the mirror at the image position.",
        keyTakeaway: "Two rays (e.g. perpendicular and angled) locate the image behind the mirror.",
      },
    ],
    reflectivePrompt: "Why can't you catch the image of a candle formed by a plane mirror on a screen?",
  },
  "image-formation-spherical-mirrors": {
    slug: "image-formation-spherical-mirrors",
    title: "Image Formation by Spherical Mirrors",
    shortDescription:
      "Concave and convex mirrors form real or virtual images depending on object position. Mirror formula 1/v + 1/u = 1/f and magnification m = -v/u.",
    keywords: [
      "image formation by spherical mirrors",
      "concave mirror",
      "convex mirror",
      "focus",
      "centre of curvature",
      "mirror formula",
      "real image",
      "virtual image",
      "magnification",
      "high school physics",
    ],
    content: [
      {
        heading: "Concave and convex mirrors",
        body: "A concave mirror (converging) has a reflecting surface curved inward; parallel rays converge at the principal focus (F). A convex mirror (diverging) is curved outward; parallel rays appear to diverge from a virtual focus behind the mirror. The centre of curvature (C) is the centre of the sphere of which the mirror is a part; the radius of curvature R = 2f, where f is the focal length.",
        keyTakeaway: "Concave converges to F; convex diverges from a virtual F; R = 2f.",
      },
      {
        heading: "Mirror formula and sign convention",
        body: "The mirror formula is 1/v + 1/u = 1/f, where u is object distance, v is image distance, and f is focal length. Sign convention: distances measured against the direction of incident light are negative. For concave mirror f is negative; for convex mirror f is positive. Magnification m = height of image / height of object = -v/u; m > 0 means erect image, m < 0 means inverted.",
        keyTakeaway: "Mirror formula 1/v + 1/u = 1/f; magnification m = -v/u.",
      },
      {
        heading: "Image positions",
        body: "Concave mirror: object beyond C gives real, inverted, diminished image between F and C; object at C gives real, inverted image at C; object between F and C gives virtual, erect, magnified image behind the mirror. Convex mirror always gives virtual, erect, diminished image behind the mirror.",
        keyTakeaway: "Concave can give real or virtual images depending on object position; convex always gives virtual, diminished.",
      },
    ],
    reflectivePrompt: "Where must you place an object in front of a concave mirror to get a magnified, virtual image?",
  },
  "ray-diagrams": {
    slug: "ray-diagrams",
    title: "Ray Diagrams",
    shortDescription:
      "Principal rays used to locate images in mirrors and lenses: parallel-to-axis, through focus, through centre, and through optical centre.",
    keywords: [
      "ray diagrams",
      "principal rays",
      "concave mirror",
      "convex mirror",
      "convex lens",
      "concave lens",
      "image construction",
      "optics",
      "high school physics",
    ],
    content: [
      {
        heading: "Why ray diagrams matter",
        body: "Ray diagrams are scale drawings that show how a few chosen rays from an object refract or reflect to form an image. They help visualise image position, size, and nature (real/virtual, erect/inverted) without doing algebra. For mirrors and lenses we use a small set of principal rays whose paths are easy to draw.",
        keyTakeaway: "Ray diagrams use a few principal rays to find image position and nature without algebra.",
      },
      {
        heading: "Principal rays for mirrors",
        body: "For spherical mirrors: (1) A ray parallel to the principal axis passes through (or appears to pass through) the focus after reflection. (2) A ray through the focus (or directed toward it) reflects parallel to the axis. (3) A ray through the centre of curvature (C) reflects back along the same path. (4) A ray incident at the pole reflects with angle of incidence = angle of reflection. Any two of these rays suffice to locate the image.",
        keyTakeaway: "For mirrors: parallel→focus, through focus→parallel, through C→back; any two locate the image.",
      },
      {
        heading: "Principal rays for lenses",
        body: "For thin lenses: (1) A ray parallel to the axis passes through the second focus (convex) or appears to diverge from the first focus (concave). (2) A ray through the optical centre goes undeviated. (3) A ray through (or toward) the first focus emerges parallel to the axis. Using two of these rays we find the image point.",
        keyTakeaway: "For lenses: parallel→focus, through optical centre→undeviated, through focus→parallel.",
      },
    ],
    reflectivePrompt: "Why do we only need two principal rays to find the image, and not every ray from the object?",
  },
  "refraction-glass-slab": {
    slug: "refraction-glass-slab",
    title: "Refraction through Glass Slab",
    shortDescription:
      "Light entering a rectangular glass slab bends toward the normal, then bends back on leaving so the emergent ray is parallel to the incident ray. Lateral shift occurs.",
    keywords: [
      "refraction through glass slab",
      "glass slab",
      "lateral shift",
      "emergent ray",
      "parallel displacement",
      "refractive index",
      "Snell's law",
      "high school physics",
    ],
    content: [
      {
        heading: "Path of light through a glass slab",
        body: "When a ray of light enters a rectangular glass slab at one face, it refracts toward the normal (since glass is denser than air). Inside the slab the ray travels in a straight line. When it leaves at the opposite face, it refracts away from the normal. Because the two faces are parallel, the emergent ray is parallel to the incident ray. The ray is displaced sideways (lateral shift) but not deviated in direction.",
        keyTakeaway: "Emergent ray is parallel to incident ray; the ray is laterally shifted but not deviated.",
      },
      {
        heading: "Lateral shift",
        body: "The perpendicular distance between the incident ray (produced) and the emergent ray is called the lateral shift. It depends on the thickness of the slab, the refractive index of the slab, and the angle of incidence. Larger angle of incidence or thicker slab gives greater lateral shift.",
        keyTakeaway: "Lateral shift depends on thickness, refractive index, and angle of incidence.",
      },
      {
        heading: "Why it matters",
        body: "The glass slab illustrates Snell's law at both faces and shows that a parallel-sided block does not change the direction of a ray, only its position. This is relevant to understanding prisms (where the faces are not parallel and the ray is deviated) and to simple experiments measuring refractive index.",
        keyTakeaway: "A parallel-sided slab changes position (lateral shift) but not direction; prisms deviate the ray.",
      },
    ],
    reflectivePrompt: "Why is the emergent ray parallel to the incident ray in a glass slab but not in a prism?",
  },
  "refraction-by-lenses": {
    slug: "refraction-by-lenses",
    title: "Refraction by Lenses",
    shortDescription:
      "Convex lenses converge light; concave lenses diverge it. Thin lens formula 1/v - 1/u = 1/f. Used in magnifying glasses, cameras, and the eye.",
    keywords: [
      "refraction by lenses",
      "convex lens",
      "concave lens",
      "converging lens",
      "diverging lens",
      "thin lens formula",
      "focal length",
      "optical centre",
      "high school physics",
    ],
    content: [
      {
        heading: "Types of lenses",
        body: "A convex lens (converging) is thicker at the centre; parallel rays converge at the principal focus on the other side. A concave lens (diverging) is thinner at the centre; parallel rays appear to diverge from a virtual focus on the same side. Lenses have two focal points (one on each side) and an optical centre through which rays pass undeviated.",
        keyTakeaway: "Convex converges; concave diverges; rays through optical centre are undeviated.",
      },
      {
        heading: "Thin lens formula and sign convention",
        body: "The thin lens formula is 1/v - 1/u = 1/f. Sign convention: object distance u is negative when the object is on the side from which light is coming; v is positive for a real image on the other side, negative for a virtual image on the same side; f is positive for convex and negative for concave. Magnification m = v/u (height ratio).",
        keyTakeaway: "Thin lens formula: 1/v - 1/u = 1/f; m = v/u.",
      },
      {
        heading: "Applications",
        body: "Convex lenses are used as magnifying glasses (object inside F, virtual erect magnified image), in cameras and projectors (object beyond F, real inverted image), and in the human eye. Concave lenses are used to correct short sight (myopia) and in some optical instruments to diverge light.",
        keyTakeaway: "Convex: magnifying glass, camera, eye; concave: myopia correction, diverging.",
      },
    ],
    reflectivePrompt: "Why does a convex lens sometimes form a real image and sometimes a virtual one? What determines which?",
  },
  magnification: {
    slug: "magnification",
    title: "Magnification",
    shortDescription:
      "Magnification m is the ratio of image height to object height or (for mirrors and lenses) related to image and object distances: m = -v/u or m = v/u.",
    keywords: [
      "magnification",
      "linear magnification",
      "image height",
      "object height",
      "mirror magnification",
      "lens magnification",
      "magnifying glass",
      "high school physics",
    ],
    content: [
      {
        heading: "Definition of magnification",
        body: "Linear magnification (m) is the ratio of the height of the image to the height of the object: m = h'/h. If m > 1 the image is magnified; if m < 1 it is diminished; if m = 1 the image is the same size as the object. A negative m (in the sign convention) indicates an inverted image; positive m indicates an erect image.",
        keyTakeaway: "Magnification m = image height / object height; |m| > 1 means magnified, negative m means inverted.",
      },
      {
        heading: "Relation to u and v",
        body: "For spherical mirrors, magnification m = -v/u. So if we know u and v (from the mirror formula), we get m. For thin lenses, m = v/u. In both cases, |m| > 1 means a magnified image, |m| < 1 means a diminished image. Magnification can be expressed in terms of f and u as well, which is useful when designing optical systems.",
        keyTakeaway: "Mirrors: m = -v/u; lenses: m = v/u; once u and v are known, m is determined.",
      },
      {
        heading: "Uses",
        body: "Magnification tells us how much larger or smaller the image is compared to the object. In a magnifying glass we want m > 1 (virtual, erect); in a projector we get a real, inverted image with |m| often greater than 1 on the screen. The eye and cameras also form images with a certain magnification that depends on object distance and focal length.",
        keyTakeaway: "Different applications aim for different m (e.g. magnifying glass m > 1, projector real image).",
      },
    ],
    reflectivePrompt: "When you use a convex lens as a magnifying glass, is the magnification constant or does it change as you move the lens?",
  },
};

export const LIGHT_OPTICS_SUBTOPIC_SLUGS: SubtopicSlug[] = [
  "reflection-of-light",
  "refraction-of-light",
  "laws-of-reflection",
  "laws-of-refraction",
  "image-formation-plane-mirror",
  "image-formation-spherical-mirrors",
  "ray-diagrams",
  "refraction-glass-slab",
  "refraction-by-lenses",
  "magnification",
];
