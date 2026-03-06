"""
Phase 5: Scan remaining files to understand their return JSX structure.
"""
import os, re

SIM_DIR = r"c:\Users\SACHIN\Documents\Python3\simulator\SIMULATOR\components\simulations\physics"

remaining = [
    "FrameOfReferenceSimulation.tsx",
    "HeatTransferSimulation.tsx", 
    "InclinedPlaneFrictionSimulation.tsx",
    "KeplersLawsSimulation.tsx",
    "MomentofInertiaSimulation.tsx",
    "MotionInAPlaneSimulation.tsx",
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
    "UniformCircularMotionSimulation.tsx",
    "UniversalLawOfGravitationSimulation.tsx",
    "WaveFunctionCollapseSimulation.tsx",
    "WorkDoneByGasSimulation.tsx",
    "WorkEnergyTheoremSimulation.tsx",
]

for name in remaining:
    filepath = os.path.join(SIM_DIR, name)
    if not os.path.exists(filepath):
        continue
    content = open(filepath, encoding='utf-8').read()
    
    has_grid = "grid grid-cols-1 gap-6 lg:grid-cols-3" in content
    has_toggle = '▶ Play' in content and '⏸ Pause' in content  
    has_reset = '↺ Reset' in content
    
    # Find play/pause state variable
    state_matches = re.findall(r'const \[(\w*(?:play|paus|run|anim)\w*), (set\w+)\] = useState(?:<[^>]+>)?\((\w+)\)', content, re.IGNORECASE)
    
    # Find button text patterns  
    btn_texts = re.findall(r'>\s*([^<]{1,30})\s*</button>', content)
    
    issues = []
    if not has_grid: issues.append("NO_GRID")
    if not has_toggle: issues.append("NO_TOGGLE")
    if not has_reset: issues.append("NO_RESET")
    
    print(f"\n{'='*60}")
    print(f"{name}: {', '.join(issues)}")
    print(f"  State vars (play/pause): {state_matches}")
    print(f"  Button texts: {btn_texts[:8]}")
    
    # Count lines
    lines = content.split('\n')
    print(f"  Total lines: {len(lines)}")

