"""
Phase 8: Convert remaining non-grid files to grid layout.
Each file gets a specific transformation based on its structure.
"""
import os, re

SIM_DIR = r"c:\Users\SACHIN\Documents\Python3\simulator\SIMULATOR\components\simulations\physics"

def read_file(name):
    return open(os.path.join(SIM_DIR, name), encoding='utf-8').read()

def write_file(name, content):
    with open(os.path.join(SIM_DIR, name), 'w', encoding='utf-8') as f:
        f.write(content)

modified = []

# ============================================================
# RollingMotionSimulation.tsx
# Uses inline styles - flex column layout
# Convert top-level div with inline flex to main with grid
# ============================================================
name = "RollingMotionSimulation.tsx"
c = read_file(name)
if 'grid grid-cols-1 gap-6 lg:grid-cols-3' not in c:
    # Replace the outer wrapper
    c = c.replace(
        '<div style={{ ...cs, background:"#060c18", minHeight:"100vh", display:"flex", flexDirection:"column", color:"#e2e8f0" }}>',
        '<main className="min-h-screen bg-[#060c18] text-neutral-200" style={cs}>\n      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#020617] via-[#0c1222] to-[#020617]" />\n      <section className="mx-auto w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">\n        <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">\n          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">'
    )
    # Convert the main area flex to col-span-2
    c = c.replace(
        '      {/* MAIN */}\n      <div style={{ display:"flex", height:"62vh", minHeight:410 }}>',
        ''
    )
    c = c.replace(
        '        {/* Canvas */}\n        <div style={{ flex:"0 0 65%", position:"relative", borderRight:"1px solid #1e3a5f" }}>',
        '          {/* Canvas (2 columns) */}\n          <div className="col-span-1 lg:col-span-2 relative border border-neutral-800 rounded-2xl overflow-hidden" style={{ minHeight:410 }}>'
    )
    c = c.replace(
        '        {/* Controls */}\n        <div style={{ flex:"0 0 35%", padding:"14px 18px", overflowY:"auto", background:"#040810" }}>',
        '          {/* Controls (1 column) */}\n          <aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700" style={{ padding:"14px 18px", background:"#040810" }}>'
    )
    # Fix the closing div for controls → aside
    c = c.replace(
        "          </div>\n      </div>", 
        "          </aside>\n          </div>\n        </div>"
    )
    # Close the section before bottom panel  
    c = c.replace(
        '      {/* BOTTOM PANEL */}',
        '        {/* BOTTOM PANEL */}'
    )
    # Close everything at the end - replace last </div> 
    c = c.replace(
        '      </div>\n    </div>\n  );',
        '      </div>\n      </section>\n    </main>\n  );'
    )
    write_file(name, c)
    modified.append(name)

# ============================================================
# ThermodynamicSystemsAndProcessesSimulation.tsx
# WorkDoneByGasSimulation.tsx
# MotionInAStraightLineSimulation.tsx
# MomentofInertiaSimulation.tsx
# ResonanceSimulation.tsx
# TorqueAndRotationalDynamicsSimulation.tsx
# OrbitalVelocitySimulation.tsx
# UniversalLawOfGravitationSimulation.tsx
# 
# These use Tailwind classes with md:flex-row or similar patterns
# ============================================================

# For each file, find the return statement's main wrapper and convert
for name in [
    "ThermodynamicSystemsAndProcessesSimulation.tsx",
    "WorkDoneByGasSimulation.tsx", 
    "MotionInAStraightLineSimulation.tsx",
    "MomentofInertiaSimulation.tsx",
    "ResonanceSimulation.tsx",
    "TorqueAndRotationalDynamicsSimulation.tsx",
    "OrbitalVelocitySimulation.tsx",
    "UniversalLawOfGravitationSimulation.tsx",
]:
    c = read_file(name)
    if 'grid grid-cols-1 gap-6 lg:grid-cols-3' in c:
        continue
    
    # Pattern 1: md:flex-row layout
    c = c.replace('flex flex-col md:flex-row', 'grid grid-cols-1 gap-6 lg:grid-cols-3')
    c = c.replace('flex flex-1 flex-col md:flex-row', 'grid grid-cols-1 gap-6 lg:grid-cols-3')
    c = c.replace('flex flex-col gap-4 md:flex-row', 'grid grid-cols-1 gap-6 lg:grid-cols-3')
    c = c.replace('flex flex-col gap-6 md:flex-row', 'grid grid-cols-1 gap-6 lg:grid-cols-3')
    c = c.replace('flex flex-col lg:flex-row', 'grid grid-cols-1 gap-6 lg:grid-cols-3')
    
    # Pattern 2: Canvas area class updates
    # Make the main canvas area span 2 cols
    c = re.sub(
        r'className="flex-\[0_0_6[05]%\]',
        'className="col-span-1 lg:col-span-2',
        c
    )
    c = re.sub(
        r'className="flex-1\s+min-w-0',
        'className="col-span-1 lg:col-span-2 min-w-0',
        c
    )
    # Make control areas span 1 col
    c = re.sub(
        r'className="(?:flex )?w-full flex-col (?:justify-start )?gap-\d+ (?:overflow-hidden )?(?:rounded-xl )?(?:border (?:border-\w+-\d+ ))?(?:bg-\w+ )?p-\d+ md:w-\[3[05]%\]',
        'className="col-span-1',
        c
    )
    
    if c != read_file(name):
        write_file(name, c)
        modified.append(name)
    else:
        # If no simple pattern matched, try to find the specific layout pattern
        lines = c.split('\n')
        found = False
        for i, line in enumerate(lines):
            # Look for display:flex with percentages (inline styles)
            if 'display:"flex"' in line and ('height:' in line or 'minHeight:' in line):
                # Check if the next few lines have flex: 0 0 patterns
                snippet = '\n'.join(lines[i:i+3])
                if ('flex:' in snippet or 'flex-' in snippet) and not found:
                    found = True
                    print(f"  {name}: Found inline flex at line {i+1}")
        if not found:
            print(f"  {name}: NO flex pattern found - needs manual review")

print(f"\n=== Modified {len(modified)} files ===")
for n in modified:
    print(f"  ✅ {n}")
