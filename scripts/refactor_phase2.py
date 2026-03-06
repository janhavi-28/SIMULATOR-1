"""
Phase 2 refactoring: Fix remaining button labels and structural issues.
Handles specific patterns in each file.
"""
import os, re

SIM_DIR = r"c:\Users\SACHIN\Documents\Python3\simulator\SIMULATOR\components\simulations\physics"

def fix_file(filepath, replacements):
    """Apply a list of (old, new) string replacements to a file."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    original = content
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
    if content != original:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False


def fix_regex(filepath, patterns):
    """Apply a list of (regex_pattern, replacement) to a file."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    original = content
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    if content != original:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False


def main():
    changes = {}
    
    # --- EscapeVelocitySimulation.tsx ---
    # Has "🚀 Launch" / "⏸ Pause" toggle - needs to be "▶ Play" / "⏸ Pause"
    f = os.path.join(SIM_DIR, "EscapeVelocitySimulation.tsx")
    if os.path.exists(f):
        changes[f] = fix_file(f, [
            ('{running ? "⏸ Pause" : "🚀 Launch"}', '{running ? "⏸ Pause" : "▶ Play"}'),
        ])

    # --- FrameOfReferenceSimulation.tsx ---
    f = os.path.join(SIM_DIR, "FrameOfReferenceSimulation.tsx")
    if os.path.exists(f):
        changes[f] = fix_regex(f, [
            # Various play/pause patterns
            (r'\{playing\s*\?\s*"⏸\s*Pause"\s*:\s*"▶\s*Start"\}', '{playing ? "⏸ Pause" : "▶ Play"}'),
            (r'\{isPlaying\s*\?\s*"⏸\s*Pause"\s*:\s*"▶\s*Start"\}', '{isPlaying ? "⏸ Pause" : "▶ Play"}'),
            (r'\{running\s*\?\s*"⏸\s*Pause"\s*:\s*"▶\s*Start"\}', '{running ? "⏸ Pause" : "▶ Play"}'),
            (r'\{playing\s*\?\s*"Pause"\s*:\s*"Start"\}', '{playing ? "⏸ Pause" : "▶ Play"}'),
        ])

    # --- HeatTransferSimulation.tsx ---
    f = os.path.join(SIM_DIR, "HeatTransferSimulation.tsx")
    if os.path.exists(f):
        changes[f] = fix_regex(f, [
            (r'\{playing\s*\?\s*"⏸\s*Pause"\s*:\s*"▶\s*Start"\}', '{playing ? "⏸ Pause" : "▶ Play"}'),
            (r'\{isPlaying\s*\?\s*"⏸\s*Pause"\s*:\s*"▶\s*Start"\}', '{isPlaying ? "⏸ Pause" : "▶ Play"}'),
            (r'\{running\s*\?\s*"⏸.*?"\s*:\s*"▶\s*Start"\}', '{running ? "⏸ Pause" : "▶ Play"}'),
        ])

    # --- WormholesSimulation.tsx ---
    f = os.path.join(SIM_DIR, "WormholesSimulation.tsx")
    if os.path.exists(f):
        changes[f] = fix_file(f, [
            ("Reset time", "↺ Reset"),
            # Also fix the other reset
            (">Reset<", ">↺ Reset<"),
        ])
    
    # --- TimeTravelSimulation.tsx ---
    f = os.path.join(SIM_DIR, "TimeTravelSimulation.tsx")
    if os.path.exists(f):
        changes[f] = fix_file(f, [
            (">Reset<", ">↺ Reset<"),
            ("Reset Time", "↺ Reset"),
            ("Reset time", "↺ Reset"),
        ])

    # --- ProjectileMotionSimulation.tsx ---
    f = os.path.join(SIM_DIR, "ProjectileMotionSimulation.tsx")
    if os.path.exists(f):
        changes[f] = fix_file(f, [
            (">Reset<", ">↺ Reset<"),
        ])

    # --- RelationsUniformlyAcceleratedMotionSimulation.tsx ---
    f = os.path.join(SIM_DIR, "RelationsUniformlyAcceleratedMotionSimulation.tsx")
    if os.path.exists(f):
        changes[f] = fix_file(f, [
            (">Reset<", ">↺ Reset<"),
        ])

    # --- VelocityTimePositionTimeGraphsSimulation.tsx ---
    f = os.path.join(SIM_DIR, "VelocityTimePositionTimeGraphsSimulation.tsx")
    if os.path.exists(f):
        changes[f] = fix_file(f, [
            (">Reset<", ">↺ Reset<"),
        ])

    # Now handle ALL remaining files with general patterns
    for name in os.listdir(SIM_DIR):
        if not name.endswith(".tsx"):
            continue
        f = os.path.join(SIM_DIR, name)
        with open(f, "r", encoding="utf-8") as fh:
            content = fh.read()
        
        original = content

        # Fix various play/pause patterns
        # {xxx ? "⏸ Pause" : "▶ Start"} -> {xxx ? "⏸ Pause" : "▶ Play"}
        content = re.sub(r'"▶ Start"', '"▶ Play"', content)
        
        # {xxx ? "⏸ Running…" : ...} patterns
        content = re.sub(r'"⏸ Running…"', '"⏸ Pause"', content)
        
        # Fix >Reset defaults< or >Reset Defaults< 
        content = re.sub(r'>Reset defaults<', '>↺ Reset<', content, flags=re.IGNORECASE)
        content = re.sub(r'>Reset default<', '>↺ Reset<', content, flags=re.IGNORECASE) 
        content = re.sub(r'>Reset All<', '>↺ Reset<', content, flags=re.IGNORECASE)
        content = re.sub(r'>Reset all<', '>↺ Reset<', content, flags=re.IGNORECASE)
        content = re.sub(r'>Reset time<', '>↺ Reset<', content, flags=re.IGNORECASE)
        content = re.sub(r'>Reset to Default<', '>↺ Reset<', content, flags=re.IGNORECASE)
        content = re.sub(r'>Reset to Defaults<', '>↺ Reset<', content, flags=re.IGNORECASE)
        
        # Fix bare >Reset< without ↺ 
        content = re.sub(r'>Reset<(?!/)', '>↺ Reset<', content)
        # Fix double ↺
        content = content.replace('>↺ ↺ Reset<', '>↺ Reset<')
        content = content.replace('↺ ↺ Reset', '↺ Reset')
        
        if content != original:
            with open(f, "w", encoding="utf-8") as fh:
                fh.write(content)
            if f not in changes:
                changes[f] = True
    
    print("\n=== Phase 2 Results ===")
    for f, changed in changes.items():
        name = os.path.basename(f)
        print(f"  {'✅' if changed else '⏭'} {name}")


if __name__ == "__main__":
    main()
