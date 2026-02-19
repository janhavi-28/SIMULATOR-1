"use client";

import React from "react";
import Image from "next/image";

/**
 * Newton's Second Law: Force & Acceleration Lab
 * Two-column layout (image left, full-height; explanations right), then full-width summary section.
 */
export default function NewtonsSecondLawForceAccelerationLabSimulation() {
  return (
    <div className="min-h-[100vh] bg-[#F1F5F9]">
      {/* Single main title */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight text-[#1e3a5f]">
            Newton&apos;s Second Law: Force &amp; Acceleration Lab
          </h1>
        </div>
      </div>

      {/* Two-column main section: full-height left (image), right (explanations) */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 lg:items-stretch lg:min-h-[520px]">
          {/* Left column: full-height; image vertically centered, no large gaps */}
          <div className="flex items-center justify-center min-h-[320px] lg:min-h-0 lg:h-full bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden p-4">
            <div className="relative w-full h-full min-h-[280px] lg:min-h-[440px]">
              <Image
                src="/images/newtons-second-law-diagram.png"
                alt="Newton's Second Law diagram: horizontal track, pulley, wooden block (m), hanging masses (M), with force arrows N, Wb, T, f on the block and T, Wh on the hanging masses"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Right column: force explanations in a grouped panel */}
          <div className="bg-[#FAFAFA] rounded-xl border border-[#E5E7EB] p-6 shadow-sm lg:self-stretch flex flex-col">
            <h2 className="text-lg font-bold text-[#1d4ed8] border-b border-[#E5E7EB] pb-2 mb-4">
              Force Arrows and Labels
            </h2>
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="font-semibold text-[#c2410c]">Wooden Block (m)</h3>
                <p className="text-[#475569] text-sm mt-1 leading-relaxed">
                  The object whose motion we analyze. It sits on the track and is pulled by the string. Its mass <em>m</em> appears in Newton’s second law for the block: net force on the block equals <em>m a</em>.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#c2410c]">N (Normal Force)</h3>
                <p className="text-[#475569] text-sm mt-1 leading-relaxed">
                  The track pushes upward on the block, perpendicular to the surface. <strong>Direction: upward.</strong> It balances the vertical component of the block’s weight so the block does not sink into the track. No vertical acceleration means <em>N = W<sub>b</sub></em> in magnitude.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#c2410c]">W<sub>b</sub> (Weight of Block)</h3>
                <p className="text-[#475569] text-sm mt-1 leading-relaxed">
                  The gravitational force on the block. <strong>Direction: downward.</strong> Magnitude <em>W<sub>b</sub> = m g</em>, where <em>g</em> is the acceleration due to gravity (about 9.8 m/s²). It does not directly cause horizontal motion; the normal force cancels it in the vertical direction.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#c2410c]">T (Tension)</h3>
                <p className="text-[#475569] text-sm mt-1 leading-relaxed">
                  The string pulls on the block and on the hanging masses. <strong>On the block:</strong> tension points to the right (along the string toward the pulley). <strong>On the hanging masses:</strong> tension points upward. If the string is massless and the pulley is ideal, the <strong>magnitude of tension is the same</strong> on both sides; the string simply transmits the force from the hanging mass to the block.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#c2410c]">f (Friction)</h3>
                <p className="text-[#475569] text-sm mt-1 leading-relaxed">
                  The force exerted by the track on the block, parallel to the surface, opposing sliding. <strong>Direction: to the left</strong> (opposing the pull of the string). It opposes the motion (or tendency to move). Friction reduces the net force on the block and hence the acceleration.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#c2410c]">Hanging Masses (M)</h3>
                <p className="text-[#475569] text-sm mt-1 leading-relaxed">
                  The combined mass <em>M</em> hanging from the string. Their weight <em>W<sub>h</sub> = M g</em> is the <strong>driving force</strong> of the system: gravity pulls the masses down, the string gets taut, and the same tension pulls the block horizontally. So the external “pull” on the block ultimately comes from the weight of the hanging masses.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#c2410c]">W<sub>h</sub> (Weight of Hanging Masses)</h3>
                <p className="text-[#475569] text-sm mt-1 leading-relaxed">
                  For clarity, the weight of the hanging masses is labeled here as <strong>W<sub>h</sub></strong> (the diagram may show it as W<sub>b</sub>; that is a typo—we use W<sub>h</sub> to distinguish it from the block’s weight). This is the gravitational force on the hanging masses. <strong>Direction: downward.</strong> Magnitude <em>W<sub>h</sub> = M g</em>. This weight is the <strong>driving force</strong> of the system: it causes the string to pull the block and accelerates both the block and the hanging masses.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width bottom section */}
        <div className="mt-8 w-full bg-[#FAFAFA] rounded-xl border border-[#E5E7EB] shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#1d4ed8] border-b border-[#E5E7EB] pb-2 mb-4">
            Summary, Formulas, and Worked Example
          </h2>

          <div className="space-y-5 text-[#475569]">
            <div>
              <h3 className="font-semibold text-[#334155] mb-2">Summary</h3>
              <p className="text-sm leading-relaxed">
                Newton’s second law states that the acceleration of an object is in the direction of the net force and proportional to it, and inversely proportional to the object’s mass: <strong>F = m a</strong>. In this setup, the net force on the block (horizontal) is the tension minus friction; the net force on the hanging masses (vertical) is their weight minus the tension. The string ties the two so they have the same magnitude of acceleration (and the same tension in the string).
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#334155] mb-2">Key formulas for this setup</h3>
              <ul className="text-sm space-y-2 list-disc list-inside leading-relaxed">
                <li><strong>General law:</strong> <em>F = m a</em> (net force = mass × acceleration)</li>
                <li><strong>Net force on the system</strong> (driving force minus opposing force): <em>F<sub>net</sub> = W<sub>h</sub> − f = M g − f</em></li>
                <li><strong>Acceleration of the system:</strong> <em>a = F<sub>net</sub> / (m + M) = (M g − f) / (m + M)</em></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#334155] mb-2">Worked example</h3>
              <p className="text-sm mb-3 leading-relaxed">
                Use the diagram setup. Let the <strong>wooden block mass m = 2.0 kg</strong>, the <strong>hanging masses M = 0.5 kg</strong>, and the <strong>friction force f = 1.0 N</strong>. Take <em>g = 10 m/s²</em>. Find the acceleration of the system.
              </p>
              <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 text-sm font-mono text-[#334155] space-y-1">
                <p>W<sub>h</sub> = M g = 0.5 × 10 = 5.0 N</p>
                <p>F<sub>net</sub> = W<sub>h</sub> − f = 5.0 − 1.0 = 4.0 N</p>
                <p>Total mass = m + M = 2.0 + 0.5 = 2.5 kg</p>
                <p>a = F<sub>net</sub> / (m + M) = 4.0 / 2.5 = <strong>1.6 m/s²</strong></p>
              </div>
              <p className="text-sm mt-2 leading-relaxed">
                The block and the hanging masses both accelerate at <strong>1.6 m/s²</strong> (the block to the right, the masses downward).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
