"""
Updated detection: Check for ALL required patterns.
A simulation is 'done' if it has:
1. Grid layout (grid grid-cols-1 gap-6 lg:grid-cols-3)
2. Either a play/pause toggle OR it's a non-animating sim
3. ↺ Reset button
"""
import os, re, glob

d = r"c:\Users\SACHIN\Documents\Python3\simulator\SIMULATOR\components\simulations\physics"
done = []
needs_work = []
for f in sorted(glob.glob(os.path.join(d, "*.tsx"))):
    name = os.path.basename(f)
    if name == "RotationalInertiaScene3D.tsx":
        continue
    content = open(f, encoding='utf-8').read()
    has_grid = "grid grid-cols-1 gap-6 lg:grid-cols-3" in content
    has_toggle = ('▶ Play' in content and '⏸ Pause' in content)
    has_reset = '↺ Reset' in content or '↺ Reset' in content
    
    # Check if sim has any play/pause mechanism at all
    has_any_toggle = has_toggle or 'Measure' in content  # Quantum sims use Measure
    
    reasons = []
    if not has_grid: reasons.append("NO_GRID")
    if not has_toggle: reasons.append("NO_TOGGLE") 
    if not has_reset: reasons.append("NO_RESET")
    
    if reasons:
        needs_work.append((name, reasons, has_any_toggle))
    else:
        done.append(name)

print(f"\n=== DONE ({len(done)}) ===")
for n in done: print(f"  ✅ {n}")
print(f"\n=== NEEDS WORK ({len(needs_work)}) ===")
for n, r, has_measure in needs_work: 
    extra = " [has Measure btn]" if has_measure and "NO_TOGGLE" in r else ""
    print(f"  ❌ {n}: {', '.join(r)}{extra}")
