# Reflection & Refraction Simulator — How to View

The **updated** Reflection & Refraction simulator (refactored UI, 75% canvas, right-hand controls, ray colors, etc.) is the component in:

- **File:** `components/simulations/physics/LightSimulation.tsx`
- **Used on:** High School Physics → Light and Optics

## Correct URL

Open this exact URL in your browser (with the dev server running):

**http://127.0.0.1:3000/high-school/physics/light**

Scroll to the **simulator** section (the big canvas with the light rays). That block is the updated component.

## Run the app (see changes)

1. **Terminal:** run from the **SIMULATOR** folder:
   ```bash
   cd SIMULATOR
   npm run dev
   ```
2. **Browser:** go to **http://127.0.0.1:3000/high-school/physics/light**
3. **Hard refresh** so you don’t see old cached JS/CSS: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

## If you still see the old UI

- **Wrong page:** Subtopics like “Laws of Refraction” or “Refraction of Light” use *different* simulators (e.g. `RefractionOfLightSimulation.tsx`), not `LightSimulation.tsx`. Use the main **Light and Optics** page URL above.
- **Cache:** Try an incognito/private window or clear cache for localhost.
- **Build:** If you use `npm run build` + `npm run start`, run `npm run build` again after code changes.

## What you should see (updated simulator)

- **No** formula strip on the canvas
- **No** Cinematic button
- **No** Teaching Insights panel
- **Controls only on the right:** Simulation (Launch, Pause, Reset, Demo) → Phenomena (Reflection, Refraction, Labels, Wavefronts) → Angle → Medium (n₁, n₂) → Source (Intensity)
- **Large canvas** (~75% width), minimal padding
- **Rays:** incident = yellow, reflected = white, refracted = cyan; normal = dashed white
- **Refraction** visible when “Refraction” is on and angle is below critical (refracted ray in cyan)
