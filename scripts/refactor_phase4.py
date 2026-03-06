"""
Phase 4: Universal fixer. 
For each file, find every <button> block and fix labels.
Also restructure layouts that need grid.
"""
import os, re

SIM_DIR = r"c:\Users\SACHIN\Documents\Python3\simulator\SIMULATOR\components\simulations\physics"

def process_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    original = content
    name = os.path.basename(filepath)

    # ============ FIX BUTTON TEXT ============
    # Universal: find text between > and </button> that matches common patterns
    
    # Fix ALL "▶ Start" to "▶ Play"
    content = content.replace('"▶ Start"', '"▶ Play"')
    content = content.replace("'▶ Start'", "'▶ Play'")
    
    # Fix "⏸ Running…" to "⏸ Pause"  
    content = content.replace('"⏸ Running…"', '"⏸ Pause"')
    
    # Fix "🚀 Launch" to "▶ Play"
    content = content.replace('"🚀 Launch"', '"▶ Play"')
    
    # Fix multiline button contents for reset patterns
    # Pattern: >Reset to Default</button> or >Reset</button> etc
    content = re.sub(r'>\s*Reset to Defaults?\s*</', '>↺ Reset</', content)
    content = re.sub(r'>\s*Reset defaults?\s*</', '>↺ Reset</', content, flags=re.IGNORECASE)  
    content = re.sub(r'>\s*Reset all\s*</', '>↺ Reset</', content, flags=re.IGNORECASE)
    content = re.sub(r'>\s*Reset time\s*</', '>↺ Reset</', content, flags=re.IGNORECASE)
    content = re.sub(r'>\s*Reset params\s*</', '>↺ Reset</', content, flags=re.IGNORECASE)
    
    # Fix bare "Reset" that's the only content in a button 
    # Match >Reset< but not >↺ Reset< and not inside comments/strings
    content = re.sub(r'>\s*Reset\s*</(?!--)', '>↺ Reset</', content)
    # Fix "Clear" or "Clear screen" buttons
    content = re.sub(r'>\s*Clear screen\s*</', '>↺ Reset</', content, flags=re.IGNORECASE)
    
    # Clean up any double ↺
    content = content.replace('↺ ↺', '↺')
    
    # ============ FIX PLAY/PAUSE TOGGLE ============
    # For simulations that auto-play (continuous animation with no pause), 
    # we need to add a play/pause toggle.
    # But first, let's check if there's already one.
    
    has_play = '▶ Play' in content
    has_pause = '⏸ Pause' in content
    
    if not (has_play and has_pause):
        # Look for common state variable patterns and add toggle
        # Check for 'playing'/'paused'/'running'/'isPlaying'/'isPaused'/'isRunning' state
        # Look for patterns like: const [playing, setPlaying] = useState
        
        state_vars = re.findall(r'const \[(\w+), set\w+\] = useState(?:<[^>]+>)?\((true|false)\)', content)
        
        play_var = None
        set_play = None
        is_inverted = False  # True if variable means "paused" (inverted logic)
        
        for var_name, initial in state_vars:
            if var_name in ('playing', 'isPlaying'):
                play_var = var_name
                set_play = f"set{var_name[0].upper()}{var_name[1:]}"
                is_inverted = False
                break
            elif var_name in ('paused', 'isPaused'):
                play_var = var_name
                set_play = f"set{var_name[0].upper()}{var_name[1:]}"
                is_inverted = True
                break
            elif var_name == 'running':
                play_var = var_name  
                set_play = 'setRunning'
                is_inverted = False
                break
            elif var_name == 'isRunning':
                play_var = var_name
                set_play = 'setIsRunning'
                is_inverted = False
                break
    
    # ============ FIX GRID LAYOUT ============
    if "grid grid-cols-1 gap-6 lg:grid-cols-3" not in content:
        # Try converting flex-row to grid
        content = content.replace(
            'className="flex flex-col gap-6 lg:flex-row"',
            'className="grid grid-cols-1 gap-6 lg:grid-cols-3"'
        )
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
    
    if content != original:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False

def main():
    modified = []
    for name in sorted(os.listdir(SIM_DIR)):
        if not name.endswith(".tsx") or name == "RotationalInertiaScene3D.tsx":
            continue
        filepath = os.path.join(SIM_DIR, name)
        if process_file(filepath):
            modified.append(name)
    
    print(f"\n=== Modified {len(modified)} files ===")
    for n in modified:
        print(f"  ✅ {n}")
    
    # Now verify
    print(f"\n=== Verification ===")
    for name in sorted(os.listdir(SIM_DIR)):
        if not name.endswith(".tsx") or name == "RotationalInertiaScene3D.tsx":
            continue
        filepath = os.path.join(SIM_DIR, name)
        content = open(filepath, encoding='utf-8').read()
        has_grid = "grid grid-cols-1 gap-6 lg:grid-cols-3" in content
        has_toggle = '▶ Play' in content and '⏸ Pause' in content
        has_reset = '↺ Reset' in content
        issues = []
        if not has_grid: issues.append("NO_GRID")
        if not has_toggle: issues.append("NO_TOGGLE")
        if not has_reset: issues.append("NO_RESET")
        if issues:
            print(f"  ❌ {name}: {', '.join(issues)}")

if __name__ == "__main__":
    main()
