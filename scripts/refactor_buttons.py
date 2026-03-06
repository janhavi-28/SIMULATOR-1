import os
import re

directory = r'c:\Users\SACHIN\Documents\Python3\simulator\SIMULATOR\components\simulations\physics'

for filename in os.listdir(directory):
    if not filename.endswith('.tsx'):
        continue
    if filename in ['GravitySimulation.tsx', 'RutherfordSimulation.tsx']:
        continue
        
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Standardize pause button class
    # For `paused` state (where true means paused)
    content = re.sub(
        r'className=["`][^"`]*?["`]\s*>\s*\{\s*paused\s*\?\s*"▶[^"]+"[^:]+:\s*"⏸[^"]+"[^}]*\}',
        r'className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors flex gap-2 items-center ${paused ? \'bg-blue-600 hover:bg-blue-700\' : \'bg-green-600 hover:bg-green-700\'}`}\n                >\n                  {paused ? "▶ Play" : "⏸ Pause"}',
        content
    )
    content = re.sub(
        r'className=["`][^"`]*?["`]\s*>\s*\{\s*isPaused\s*\?\s*"▶[^"]+"[^:]+:\s*"⏸[^"]+"[^}]*\}',
        r'className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors flex gap-2 items-center ${isPaused ? \'bg-blue-600 hover:bg-blue-700\' : \'bg-green-600 hover:bg-green-700\'}`}\n                >\n                  {isPaused ? "▶ Play" : "⏸ Pause"}',
        content
    )

    # For `playing` state (where true means playing)
    content = re.sub(
        r'className=["`][^"`]*?["`]\s*>\s*\{\s*playing\s*\?\s*"⏸[^"]+"[^:]+:\s*"▶[^"]+"[^}]*\}',
        r'className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors flex gap-2 items-center ${!playing ? \'bg-blue-600 hover:bg-blue-700\' : \'bg-green-600 hover:bg-green-700\'}`}\n                >\n                  {playing ? "⏸ Pause" : "▶ Play"}',
        content
    )
    content = re.sub(
        r'className=["`][^"`]*?["`]\s*>\s*\{\s*isPlaying\s*\?\s*"⏸[^"]+"[^:]+:\s*"▶[^"]+"[^}]*\}',
        r'className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors flex gap-2 items-center ${!isPlaying ? \'bg-blue-600 hover:bg-blue-700\' : \'bg-green-600 hover:bg-green-700\'}`}\n                >\n                  {isPlaying ? "⏸ Pause" : "▶ Play"}',
        content
    )
    
    # Similarly, standard Reset button (which appears next to pause)
    content = re.sub(
        r'className=["`][^"`]*(?:bg-neutral-800)[^"`]*["`]\s*>\s*↺ Reset\s*</button>',
        r'className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"\n                >\n                  ↺ Reset\n                </button>',
        content
    )

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated buttons in {filename}")

