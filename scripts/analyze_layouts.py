"""
Phase 8: Analyze the main layout wrapper of each remaining NO_GRID file.
Show the first few lines of the return statement to understand structure.
"""
import os, re

SIM_DIR = r"c:\Users\SACHIN\Documents\Python3\simulator\SIMULATOR\components\simulations\physics"

remaining_no_grid = [
    "MomentofInertiaSimulation.tsx",
    "MotionInAStraightLineSimulation.tsx", 
    "OrbitalVelocitySimulation.tsx",
    "PhysicalWorldUnitsSimulation.tsx",
    "ResonanceSimulation.tsx",
    "RollingMotionSimulation.tsx",
    "ThermodynamicSystemsAndProcessesSimulation.tsx",
    "TorqueAndRotationalDynamicsSimulation.tsx",
    "UniversalLawOfGravitationSimulation.tsx",
    "WorkDoneByGasSimulation.tsx",
    "WorkEnergyTheoremSimulation.tsx",
]

for name in remaining_no_grid:
    filepath = os.path.join(SIM_DIR, name)
    c = open(filepath, encoding='utf-8').read()
    lines = c.split('\n')
    
    # Find the LAST "return (" in exported component
    last_return_idx = None
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('return (') or stripped == 'return (': 
            last_return_idx = i
    
    if last_return_idx is not None:
        # Show lines around the return: layout wrapper + first children
        snippet = '\n'.join(f'{last_return_idx+1+j:4d}: {lines[last_return_idx+j]}' for j in range(min(20, len(lines)-last_return_idx)))
        print(f"\n{'='*60}")
        print(f"{name}:")
        print(snippet)
        
        # Also find where canvas/aside/controls section starts
        for j in range(last_return_idx, min(last_return_idx+100, len(lines))):
            l = lines[j].strip()
            if 'flex-row' in l or 'flex flex-1' in l or 'flex-1 flex-col' in l:
                print(f"  >>> LAYOUT at line {j+1}: {l[:80]}")
            if 'aside' in l.lower() or 'Parameter' in l or 'Controls' in l:
                print(f"  >>> ASIDE/CTRL at line {j+1}: {l[:80]}")
