"""
Phase 3: Comprehensive fix for ALL remaining files.
Searches for exact button text patterns and fixes them.
Also adds grid layout wrapper and proper structure.
"""
import os, re

SIM_DIR = r"c:\Users\SACHIN\Documents\Python3\simulator\SIMULATOR\components\simulations\physics"

def process_all():
    modified = []
    
    for name in sorted(os.listdir(SIM_DIR)):
        if not name.endswith(".tsx") or name == "RotationalInertiaScene3D.tsx":
            continue
        
        filepath = os.path.join(SIM_DIR, name)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        original = content
        
        # ===== BUTTON FIXES =====
        
        # Fix: "▶ Start" -> "▶ Play" (anywhere in file)
        content = content.replace('"▶ Start"', '"▶ Play"')
        content = content.replace("'▶ Start'", "'▶ Play'")
        
        # Fix: "⏸ Running…" -> "⏸ Pause"
        content = content.replace('"⏸ Running…"', '"⏸ Pause"')
        
        # Fix: "🚀 Launch" -> "▶ Play" 
        content = content.replace('"🚀 Launch"', '"▶ Play"')
        
        # Fix: >Measure< button to >▶ Play< (for quantum sims that use measure)
        # Actually, quantum sims with "Measure" are different - they don't have play/pause
        # We should add a play/pause toggle. But for now let's leave them as is
        # and just fix the reset.
        
        # Fix reset labels
        content = content.replace(">Reset defaults<", ">↺ Reset<")
        content = content.replace(">Reset Defaults<", ">↺ Reset<")  
        content = content.replace(">Reset to Default<", ">↺ Reset<")
        content = content.replace(">Reset to Defaults<", ">↺ Reset<")
        content = content.replace(">Reset All<", ">↺ Reset<")
        content = content.replace(">Reset all<", ">↺ Reset<")
        content = content.replace(">Reset time<", ">↺ Reset<")
        content = content.replace(">Reset Time<", ">↺ Reset<")
        
        # Fix bare >Reset< without ↺ prefix (but not if already has ↺)
        # Use regex to avoid matching ↺ Reset
        content = re.sub(r'>(?!↺)Reset<', '>↺ Reset<', content)
        
        # Fix double ↺
        content = content.replace('>↺ ↺ Reset<', '>↺ Reset<')
        
        # ===== GRID LAYOUT FIXES =====
        
        # For files that have flex-row layout, convert to grid 
        if "grid grid-cols-1 gap-6 lg:grid-cols-3" not in content:
            # Common pattern: <div className="flex flex-col gap-6 lg:flex-row">
            content = content.replace(
                'className="flex flex-col gap-6 lg:flex-row"',
                'className="grid grid-cols-1 gap-6 lg:grid-cols-3"'
            )
            # Fix column widths
            content = re.sub(
                r'className="relative w-full shrink-0 lg:w-\[\d+%\]"',
                'className="col-span-1 flex flex-col gap-6 lg:col-span-2"',
                content
            )
            content = re.sub(
                r'<aside className="w-full lg:w-\[\d+%\]"',
                '<aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6"',
                content
            )

        # Some simulations use max-w-7xl instead of w-full - fix section class
        # Don't change if already correct
        
        if content != original:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            modified.append(name)
    
    return modified

if __name__ == "__main__":
    modified = process_all()
    print(f"\n=== Modified {len(modified)} files ===")
    for n in modified:
        print(f"  ✅ {n}")
