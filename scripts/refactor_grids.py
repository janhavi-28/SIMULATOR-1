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

    # 1. Add the outer wrapper and mb-6 around the grid grid-cols-1 gap-6 lg:grid-cols-3
    # Find: <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
    # Replace: <div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">\n          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
    content = re.sub(
        r'<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">',
        r'<div className="rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl mb-6">\n          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">',
        content,
        count=1
    )

    # 2. Modify the Aside
    # Find something like: <aside className="col-span-1 h-[580px] overflow-y-auto rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-8">
    # Or height varying, padding varying.
    # Replace the whole className string with: className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6"
    content = re.sub(
        r'<aside className="col-span-1 [^"]+">',
        r'<aside className="col-span-1 h-auto lg:max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 space-y-6">',
        content,
        count=1
    )

    # 3. Close the inner grid wrapper and the new wrapper right after </aside>
    # Find: </aside>
    # Replace: </aside>\n          </div>\n        </div>
    content = re.sub(
        r'</aside>',
        r'</aside>\n          </div>\n        </div>',
        content,
        count=1
    )

    # 4. Remove col-span from bottom row info panel
    # Find: <div className="col-span-1 lg:col-span-3 rounded-3xl border border-neutral-700 bg-neutral-950/50 p-6 shadow-xl text-neutral-300"> (or similar with md:flex-row gap-6)
    # Replace: Remove 'col-span-1 lg:col-span-3 '
    content = re.sub(
        r'<div className="col-span-1 lg:col-span-3 ([^"]+)">',
        r'<div className="\1">',
        content,
        count=1
    )
    
    # Also fix header mb-6
    # Find: border-b border-neutral-800 pb-4"> (inside the simulation canvas area)
    content = re.sub(
        r'border-b border-neutral-800 pb-4"',
        r'border-b border-neutral-800 pb-4 mb-6"',
        content,
        count=1
    )

    # 5. Remove the final closing </div> (that used to close grid) before </section>
    # This is tricky without parsing. Let's do it by finding:
    #         </div>
    #       </section>
    # at the end of the file and removing the </div>.
    content = re.sub(
        r'(\s+)</div>\s+</section>',
        r'\1</section>',
        content,
        count=1
    )

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filename}")
    else:
        print(f"No changes matched in {filename}")

