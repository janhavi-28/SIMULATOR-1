"""
Phase 7: Extract the return statement of each remaining file 
to understand what needs restructuring.
"""
import os, re

SIM_DIR = r"c:\Users\SACHIN\Documents\Python3\simulator\SIMULATOR\components\simulations\physics"

remaining = [
    "KeplersLawsSimulation.tsx",
    "MomentofInertiaSimulation.tsx", 
    "MotionInAPlaneSimulation.tsx",
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

for name in remaining:
    filepath = os.path.join(SIM_DIR, name)
    c = open(filepath, encoding='utf-8').read()
    lines = c.split('\n')
    
    # Find the LAST "return (" in the file (main component's return)
    last_return_line = None
    for i, line in enumerate(lines):
        if 'return (' in line.strip():
            last_return_line = i + 1
    
    if last_return_line:
        # Show first 15 lines after return  
        snippet = '\n'.join(lines[last_return_line-1:last_return_line+14])
        print(f"\n{'='*60}")
        print(f"{name} - return at line {last_return_line}:")
        print(snippet[:500])
