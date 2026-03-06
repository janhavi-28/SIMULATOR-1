"""
Scan all remaining files to find exact button text and state variable patterns.
"""
import os, re

SIM_DIR = r"c:\Users\SACHIN\Documents\Python3\simulator\SIMULATOR\components\simulations\physics"

remaining = [
    "InclinedPlaneFrictionSimulation.tsx",
    "MomentofInertiaSimulation.tsx",
    "MotionInAStraightLineSimulation.tsx",
    "NewtonsSecondLawForceAccelerationLabSimulation.tsx",
    "OrbitalVelocitySimulation.tsx",
    "PhysicalWorldUnitsSimulation.tsx",
    "QuantumEntanglementSimulation.tsx",
    "QuantumSuperpositionSimulation.tsx",
    "QuantumTunnelingSimulation.tsx",
    "ResonanceSimulation.tsx",
    "RollingMotionSimulation.tsx",
    "RotationalInertiaMomentSimulation.tsx",
    "ThermodynamicSystemsAndProcessesSimulation.tsx",
    "TorqueAndRotationalDynamicsSimulation.tsx",
    "UniversalLawOfGravitationSimulation.tsx",
    "WaveFunctionCollapseSimulation.tsx",
    "WorkDoneByGasSimulation.tsx",
    "WorkEnergyTheoremSimulation.tsx",
]

for name in remaining:
    filepath = os.path.join(SIM_DIR, name)
    if not os.path.exists(filepath):
        continue
    c = open(filepath, encoding='utf-8').read()
    
    has_grid = "grid grid-cols-1 gap-6 lg:grid-cols-3" in c
    has_toggle = '▶ Play' in c and '⏸ Pause' in c  
    has_reset = '↺ Reset' in c
    
    # Find play/pause state vars
    state_matches = re.findall(r'const \[(\w+), (set\w+)\] = useState(?:<[^>]+>)?\((\w+)\)', c)
    play_vars = [(v,s,i) for v,s,i in state_matches if any(k in v.lower() for k in ['play','paus','run','anim'])]
    
    # Find toggle ternary expressions
    toggles = re.findall(r'\{(\w+)\s*\?\s*"([^"]{1,40})"\s*:\s*"([^"]{1,40})"\}', c)
    
    # Find button text (between > and </button>)
    btns = re.findall(r'>\s*([^<]{1,50}?)\s*</button>', c)
    btns = [b.strip() for b in btns if b.strip() and not b.strip().startswith('{')]
    
    # Find all onReset / onClick={reset patterns
    resets = re.findall(r'onClick=\{(\w+)\}', c)
    reset_fns = [r for r in resets if 'reset' in r.lower()]
    
    issues = []
    if not has_grid: issues.append("NO_GRID")
    if not has_toggle: issues.append("NO_TOGGLE")
    if not has_reset: issues.append("NO_RESET")
    
    print(f"\n{'='*60}")
    print(f"{name}: {', '.join(issues)}")
    print(f"  Play vars: {play_vars}")
    print(f"  Toggles: {toggles[:3]}")
    print(f"  Buttons: {btns[:5]}")
    print(f"  Reset fns: {reset_fns}")
