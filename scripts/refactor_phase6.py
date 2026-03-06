"""
Phase 6: Handle files with flex-row and other patterns.
More aggressive pattern matching.
"""
import os, re

SIM_DIR = r"c:\Users\SACHIN\Documents\Python3\simulator\SIMULATOR\components\simulations\physics"

def read_file(name):
    return open(os.path.join(SIM_DIR, name), encoding='utf-8').read()

def write_file(name, content):
    with open(os.path.join(SIM_DIR, name), 'w', encoding='utf-8') as f:
        f.write(content)

modified = []

# Files with various flex-row patterns to convert to grid
flex_row_files = {
    "InclinedPlaneFrictionSimulation.tsx": 'flex w-full flex-col lg:flex-row',
    "PhysicalWorldUnitsSimulation.tsx": None,  # uses section with lg:flex-row 
    "RotationalInertiaMomentSimulation.tsx": 'flex flex-col lg:flex-row',
    "UniformCircularMotionSimulation.tsx": 'flex flex-1 min-h-0 flex-col lg:flex-row px-4 py-4 gap-4',
    "NewtonsSecondLawForceAccelerationLabSimulation.tsx": 'grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 lg:items-stretch lg:min-h-[520px]',
}

for name, pattern in flex_row_files.items():
    c = read_file(name)
    orig = c
    
    if "grid grid-cols-1 gap-6 lg:grid-cols-3" in c:
        continue
    
    if pattern and pattern in c:
        c = c.replace(pattern, 'grid grid-cols-1 gap-6 lg:grid-cols-3')
    
    # Also fix section with flex-row in className
    c = re.sub(
        r'(className="[^"]*)\bflex\b([^"]*)\blg:flex-row\b([^"]*)"',
        lambda m: m.group(0).replace('flex', 'grid grid-cols-1').replace('lg:flex-row', 'lg:grid-cols-3').replace('grid grid-cols-1-col', 'flex-col'),
        c
    )
    
    # Fix column widths: lg:w-[XX%] -> grid col spans
    c = re.sub(r'lg:w-\[(?:55|58|60|65|70)%\]', 'lg:col-span-2', c) 
    c = re.sub(r'lg:w-\[(?:30|35|40|42|45)%\]', '', c)
    
    # Fix "w-full shrink-0" for grid
    c = c.replace('w-full shrink-0 lg:col-span-2', 'col-span-1 lg:col-span-2')
    
    if c != orig:
        write_file(name, c)
        modified.append(name)

# Now handle files that have NO layout at all - they need complete wrapping
# These files typically have a simple div-based layout without any grid/flex-row
no_layout_files = [
    "KeplersLawsSimulation.tsx",
    "MomentofInertiaSimulation.tsx",
    "MotionInAPlaneSimulation.tsx",
    "MotionInAStraightLineSimulation.tsx",
    "OrbitalVelocitySimulation.tsx",
    "ResonanceSimulation.tsx",
    "RollingMotionSimulation.tsx",
    "ThermodynamicSystemsAndProcessesSimulation.tsx",
    "TorqueAndRotationalDynamicsSimulation.tsx",
    "UniversalLawOfGravitationSimulation.tsx",
    "WorkDoneByGasSimulation.tsx",
    "WorkEnergyTheoremSimulation.tsx",
]

# For files without any layout, we need to manually restructure.
# This requires understanding each file's return statement.
# Too complex for automated regex - need to handle individually.

print(f"\n=== Modified {len(modified)} files ===")
for n in modified:
    print(f"  ✅ {n}")

# Verify
print(f"\n=== Still need grid ===")
for name in sorted(os.listdir(SIM_DIR)):
    if not name.endswith(".tsx") or name == "RotationalInertiaScene3D.tsx":
        continue
    filepath = os.path.join(SIM_DIR, name)
    content = open(filepath, encoding='utf-8').read()
    if "grid grid-cols-1 gap-6 lg:grid-cols-3" not in content:
        # Check if it has ANY grid-like layout
        has_any = bool(re.search(r'lg:(?:grid-cols|flex-row|col-span)', content))
        print(f"  ❌ {name} {'(has some layout)' if has_any else '(NO layout at all)'}")
