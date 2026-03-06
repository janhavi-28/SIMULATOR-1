"""
Check which remaining files have canvas vs static content.
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
    has_canvas = '<canvas' in c or 'canvasRef' in c or 'Canvas' in c
    has_svg = '<svg' in c
    has_grid3 = 'grid grid-cols-1 gap-6 lg:grid-cols-3' in c
    has_toggle = '▶ Play' in c and '⏸ Pause' in c
    has_reset = '↺ Reset' in c
    lines = len(c.split('\n'))
    
    kind = "CANVAS" if has_canvas else ("SVG" if has_svg else "STATIC")
    issues = []
    if not has_grid3: issues.append("NO_GRID")
    if not has_toggle: issues.append("NO_TOGGLE")
    if not has_reset: issues.append("NO_RESET")
    
    print(f"{name} ({lines} lines) [{kind}]: {', '.join(issues) or 'OK'}")
