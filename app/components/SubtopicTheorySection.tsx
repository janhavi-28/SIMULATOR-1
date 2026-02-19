"use client";

/**
 * Shared theory section for physics subtopic pages.
 * Renders content blocks with heading icons, key takeaway boxes,
 * optional simulator callout, and a reflective prompt.
 */

const DEFAULT_ICONS = ["⚡", "🔢", "💡", "📘"] as const;

export interface TheoryBlock {
  heading?: string;
  body: string;
  keyTakeaway?: string;
  icon?: string;
}

export interface SubtopicTheorySectionProps {
  content: TheoryBlock[];
  reflectivePrompt?: string;
  simulatorCallout?: string;
}

function getBlockIcon(block: TheoryBlock, index: number): string {
  if (block.icon) return block.icon;
  return DEFAULT_ICONS[index % DEFAULT_ICONS.length];
}

export default function SubtopicTheorySection({
  content,
  reflectivePrompt,
  simulatorCallout,
}: SubtopicTheorySectionProps) {
  return (
    <div className="prose prose-invert prose-neutral max-w-3xl">
      {content.map((block, i) => (
        <section key={i} className="mb-6">
          {block.heading && (
            <h2 className="text-xl font-semibold text-white mt-8 mb-3 first:mt-0 flex items-center gap-2">
              <span className="text-cyan-400/90 text-lg" aria-hidden>
                {getBlockIcon(block, i)}
              </span>
              {block.heading}
            </h2>
          )}
          <p className="text-neutral-300 leading-relaxed">
            {block.body}
          </p>
          {block.keyTakeaway && (
            <div
              className="mt-3 rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-3 py-2 text-sm text-cyan-100/95"
              role="complementary"
              aria-label="Key takeaway"
            >
              <span className="font-medium text-cyan-300/90">✔ Key takeaway:</span>{" "}
              {block.keyTakeaway}
            </div>
          )}
        </section>
      ))}

      {simulatorCallout && (
        <div
          className="mt-6 rounded-xl border border-neutral-600 bg-neutral-800/60 px-4 py-3 text-sm text-neutral-200"
          role="note"
        >
          <span className="text-amber-400/90" aria-hidden>
            🧪
          </span>{" "}
          <span className="font-medium text-neutral-100">Link to simulator:</span>{" "}
          {simulatorCallout}
        </div>
      )}

      {reflectivePrompt && (
        <div
          className="mt-6 rounded-xl border border-neutral-600 bg-neutral-800/50 px-4 py-3 text-sm"
          role="complementary"
          aria-label="Reflective prompt"
        >
          <span className="text-cyan-400/90 font-medium">💭 Think about this:</span>
          <p className="mt-1.5 text-neutral-300 leading-relaxed">
            {reflectivePrompt}
          </p>
        </div>
      )}
    </div>
  );
}
