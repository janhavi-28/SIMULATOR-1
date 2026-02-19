"use client";

import React from "react";
import Link from "next/link";
import { MOTION_MECHANICS_SUBTOPIC_SLUGS } from "@/lib/data/motion-mechanics-subtopics";

export default function MotionMechanicsSimulation() {
  return (
    <div className="flex flex-col w-full h-full min-h-[420px] bg-neutral-900 rounded-xl border border-neutral-700 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Motion &amp; Mechanics</h2>
        <p className="text-neutral-400 text-sm max-w-md mb-6">
          Explore subtopics below for motion, distance and displacement, speed and velocity, acceleration, equations of motion, force, Newton&apos;s laws, inertia, and momentum. Each subtopic has clear explanations and will include interactive simulators.
        </p>
        <Link
          href="#subtopics"
          className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-500/20 transition"
        >
          View subtopics
        </Link>
      </div>
      <div className="border-t border-neutral-700 p-4">
        <p className="text-xs text-neutral-500 text-center">
          {MOTION_MECHANICS_SUBTOPIC_SLUGS.length} subtopics: Motion, Distance &amp; Displacement, Speed &amp; Velocity, Acceleration, Uniform &amp; Non-uniform Motion, Graphs, Equations of Motion, Force, Newton&apos;s Laws, Inertia, Momentum.
        </p>
      </div>
    </div>
  );
}
