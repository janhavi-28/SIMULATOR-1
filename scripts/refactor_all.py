"""
Refactor ALL physics simulations to match the Gravity/Rutherford/SpecialRelativity pattern:
1. Parameters on RIGHT side of simulation in a 3-col grid (sim 2/3, params 1/3)
2. Single toggle play/pause: "▶ Play" / "⏸ Pause"
3. Reset button: "↺ Reset"
4. Info section below the main grid
"""
import os, re, glob

SIM_DIR = os.path.join(os.path.dirname(__file__), "..", "components", "simulations", "physics")

def fix_buttons(content: str) -> str:
    """Fix play/pause toggle and reset button labels."""
    
    # --- Fix play/pause toggle patterns ---
    # Pattern: {playing ? "Pause" : "Play"} -> {playing ? "⏸ Pause" : "▶ Play"}
    # Pattern: {paused ? "Resume" : "Pause"} -> {paused ? "▶ Play" : "⏸ Pause"}
    # Pattern: {paused ? "Play" : "Pause"} -> {paused ? "▶ Play" : "⏸ Pause"}
    # Pattern: {isPlaying ? "Pause" : "Play"} -> {isPlaying ? "⏸ Pause" : "▶ Play"}  
    # Pattern: {isRunning ? "Pause" : "Play"} -> {isRunning ? "⏸ Pause" : "▶ Play"}
    # Pattern: {isPaused ? "Play" : "Pause"} -> {isPaused ? "▶ Play" : "⏸ Pause"}
    
    # These patterns already have the right text but with emojis
    # Skip files that already have "▶ Play" and "⏸ Pause"
    
    # Fix: playing ? "Pause" : "Play"  (no emojis)
    content = re.sub(
        r'\{playing\s*\?\s*"Pause"\s*:\s*"Play"\}',
        '{playing ? "⏸ Pause" : "▶ Play"}',
        content
    )
    
    # Fix: playing ? "⏸ Pause" : "▶ Play"  -- already correct, skip
    
    # Fix: paused ? "Resume" : "Pause"
    content = re.sub(
        r'\{paused\s*\?\s*"Resume"\s*:\s*"Pause"\}',
        '{paused ? "▶ Play" : "⏸ Pause"}',
        content
    )
    
    # Fix: paused ? "Play" : "Pause" (no emojis)  
    content = re.sub(
        r'\{paused\s*\?\s*"Play"\s*:\s*"Pause"\}',
        '{paused ? "▶ Play" : "⏸ Pause"}',
        content
    )
    
    # Fix: isPlaying ? "Pause" : "Play" (no emojis)
    content = re.sub(
        r'\{isPlaying\s*\?\s*"Pause"\s*:\s*"Play"\}',
        '{isPlaying ? "⏸ Pause" : "▶ Play"}',
        content
    )
    
    # Fix: isRunning ? "Pause" : "Play" (no emojis)
    content = re.sub(
        r'\{isRunning\s*\?\s*"Pause"\s*:\s*"Play"\}',
        '{isRunning ? "⏸ Pause" : "▶ Play"}',
        content
    )
    
    # Fix: isPaused ? "Play" : "Pause" (no emojis)
    content = re.sub(
        r'\{isPaused\s*\?\s*"Play"\s*:\s*"Pause"\}',
        '{isPaused ? "▶ Play" : "⏸ Pause"}',
        content
    )
    
    # Fix: running ? "⏸ Running…" : ... patterns
    content = re.sub(
        r'\{running\s*\?\s*"⏸ Running…"\s*:\s*raceStarted\s*\?\s*"▶ Restart"\s*:\s*"▶ Start"\}',
        '{running ? "⏸ Pause" : "▶ Play"}',
        content
    )
    
    # --- Fix reset button labels ---
    # "Reset time" -> "↺ Reset"
    content = content.replace(">Reset time<", ">↺ Reset<")
    # "Reset to Default" -> "↺ Reset"
    content = content.replace(">Reset to Default<", ">↺ Reset<")
    content = content.replace(">Reset to Defaults<", ">↺ Reset<")
    # "Reset" without ↺ prefix -> "↺ Reset" (but NOT "↺ Reset")
    # Be careful not to double-prefix
    content = re.sub(r'>Reset<(?!/)', '>↺ Reset<', content)
    # "Clear screen" -> "↺ Reset" 
    content = content.replace(">Clear screen<", ">↺ Reset<")
    
    return content


def restructure_wormholes(content: str) -> str:
    """Restructure WormholesSimulation from flex-row to grid layout."""
    # Find the return section and restructure
    old_layout = '''<section className="w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="relative w-full shrink-0 lg:w-[60%]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xs text-neutral-400">
                Morris–Thorne wormhole: embedding diagram from dz/dr = ±1/√(r/b(r)−1). Geodesics integrated via RK4 from metric.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="rounded-xl border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-200 hover:border-teal-400 hover:bg-teal-500/20"
                >
                  {playing ? "Pause" : "Play"}
                </button>
                <button
                  type="button"
                  onClick={() => setTime(0)}
                  className="rounded-xl border border-neutral-600 bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700"
                >
                  Reset time
                </button>
              </div>
            </div>

            <SimulatorCanvas params={params} time={time} playing={playing} />

            <div className="relative z-10 mt-6 rounded-3xl border border-neutral-700 bg-neutral-950/50 p-4 shadow-xl">'''
    
    # This is too fragile. Let me use a different approach.
    return content


def process_file(filepath: str) -> bool:
    """Process a single simulation file. Returns True if modified."""
    name = os.path.basename(filepath)
    
    with open(filepath, "r", encoding="utf-8") as f:
        original = f.read()
    
    content = original
    
    # Phase 1: Fix button labels
    content = fix_buttons(content)
    
    # Phase 2: Structural changes for files without grid layout
    if "grid grid-cols-1 gap-6 lg:grid-cols-3" not in content:
        content = restructure_to_grid(content, name)
    
    if content != original:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False


def restructure_to_grid(content: str, filename: str) -> str:
    """Restructure files that don't have the grid layout."""
    
    # For files with flex-row layout, convert to grid
    # Common pattern: <div className="flex flex-col gap-6 lg:flex-row">
    content = content.replace(
        'className="flex flex-col gap-6 lg:flex-row"',
        'className="grid grid-cols-1 gap-6 lg:grid-cols-3"'
    )
    
    # Fix the simulation column: lg:w-[60%] -> col-span-2
    content = re.sub(
        r'className="relative w-full shrink-0 lg:w-\[60%\]"',
        'className="col-span-1 flex flex-col gap-6 lg:col-span-2"',
        content
    )
    content = re.sub(
        r'className="relative w-full shrink-0 lg:w-\[\d+%\]"',
        'className="col-span-1 flex flex-col gap-6 lg:col-span-2"',
        content
    )
    
    # Fix the aside column: lg:w-[40%] -> col-span-1
    content = re.sub(
        r'<aside className="w-full lg:w-\[40%\]">',
        '<aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6">',
        content
    )
    content = re.sub(
        r'<aside className="w-full lg:w-\[\d+%\]"',
        '<aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6"',
        content
    )
    
    # Add the outer wrapper if missing
    # Look for <section> without the grid wrapper
    if 'rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6' not in content:
        # Try to add the wrapper
        content = re.sub(
            r'(<section className="[^"]*">\s*)\n(\s*<div className="grid grid-cols-1 gap-6 lg:grid-cols-3")',
            r'\1\n        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">\n\2',
            content
        )
    
    return content


def main():
    files = sorted(glob.glob(os.path.join(SIM_DIR, "*.tsx")))
    
    modified = []
    skipped = []
    errors = []
    
    for filepath in files:
        name = os.path.basename(filepath)
        # Skip the 3D helper file
        if name == "RotationalInertiaScene3D.tsx":
            skipped.append(name)
            continue
            
        try:
            if process_file(filepath):
                modified.append(name)
            else:
                skipped.append(name)
        except Exception as e:
            errors.append((name, str(e)))
            print(f"  ERROR: {name}: {e}")
    
    print(f"\n=== RESULTS ===")
    print(f"Modified: {len(modified)}")
    for n in modified:
        print(f"  ✅ {n}")
    print(f"Skipped: {len(skipped)}")
    for n in skipped:
        print(f"  ⏭ {n}")
    if errors:
        print(f"Errors: {len(errors)}")
        for n, e in errors:
            print(f"  ❌ {n}: {e}")


if __name__ == "__main__":
    main()
