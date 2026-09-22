import os
import glob

# Files to update
files_to_update = []
files_to_update.extend(glob.glob('src/app/add-new/page.tsx', recursive=True))
files_to_update.extend(glob.glob('src/components/add-client/**/*.tsx', recursive=True))

replacements = {
    'bg-[#F8FAF9]': 'bg-[#FBF9F5]',
    'bg-gray-50': 'bg-[#FBF9F5]',
    'border-gray-100': 'border-[#E9E4DC]',
    'border-gray-200': 'border-[#E9E4DC]',
    'text-brand-green': 'text-[#064e3b]',
    'bg-brand-green': 'bg-[#064e3b]',
    'ring-brand-green': 'ring-[#064e3b]',
    'border-brand-green': 'border-[#064e3b]',
    'shadow-brand-green': 'shadow-[#064e3b]',
    'text-gray-900': 'text-[#002b17]',
    'text-gray-800': 'text-[#1E1F22]',
    'text-gray-600': 'text-[#4E473D]',
    'text-gray-500': 'text-[#7C756B]',
    'text-gray-400': 'text-[#888174]',
    'text-gray-300': 'text-[#A49C8F]',
    'bg-gray-100': 'bg-[#EFE9DF]',
    'bg-gray-200': 'bg-[#E9E4DC]',
    'bg-[#E8EFEA]': 'bg-[#E5EFE9]',
    'bg-amber-50': 'bg-[#FEF3C7]',
    'text-amber-500': 'text-[#9A6014]',
    'rounded-[20px]': 'rounded-[32px]',
    'rounded-xl': 'rounded-2xl',
    'rounded-lg': 'rounded-xl',
    'shadow-sm': 'shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]'
}

for filepath in files_to_update:
    if not os.path.isfile(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Updated {len(files_to_update)} files.")
