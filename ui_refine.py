import os
import glob
import re

steps_files = glob.glob('src/components2/add-client2/steps/*.tsx', recursive=True)
sidebar_file = 'src/components2/add-client2/ProfileSidebar.tsx'

# --- Update Step Components ---
for filepath in steps_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Refine Labels
    content = re.sub(
        r'text-\[13px\] font-semibold text-\[\#002b17\] flex gap-1',
        r'text-[12px] font-bold text-[#1E2022] flex gap-1 mb-1',
        content
    )
    
    # Refine Inputs
    content = re.sub(
        r'w-full h-12 px-4 text-sm border border-\[\#E9E4DC\] rounded-2xl',
        r'w-full h-12 px-4 text-[13px] font-medium bg-[#FCF9F4] border border-[#E9E4DC] rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-[#A49C8F]',
        content
    )
    
    content = re.sub(
        r'w-full h-12 pl-10 pr-4 text-sm border border-\[\#E9E4DC\] rounded-2xl',
        r'w-full h-12 pl-10 pr-4 text-[13px] font-medium bg-[#FCF9F4] border border-[#E9E4DC] rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-[#A49C8F]',
        content
    )

    # Primary Button
    content = re.sub(
        r'h-11 px-6 rounded-2xl bg-\[\#064e3b\] text-white text-sm font-semibold hover:bg-\[\#043d2e\] transition-colors flex items-center gap-2 shadow-\[.*?\] shadow-\[\#064e3b\]/20',
        r'h-11 px-6 rounded-full bg-[#064e3b] text-white text-[13px] font-bold hover:bg-[#0f4229] transition-all flex items-center gap-2 shadow-sm',
        content
    )
    # Some steps might just have standard classes
    content = re.sub(
        r'h-11 px-6 rounded-2xl bg-\[\#064e3b\] text-white text-sm font-semibold hover:bg-\[\#043d2e\]',
        r'h-11 px-6 rounded-full bg-[#064e3b] text-white text-[13px] font-bold hover:bg-[#0f4229] shadow-sm',
        content
    )

    # Cancel/Back Button
    content = re.sub(
        r'h-11 px-6 rounded-2xl border border-\[\#E9E4DC\] text-sm font-semibold text-\[\#4E473D\] hover:bg-\[\#FBF9F5\] transition-colors',
        r'h-11 px-6 rounded-full border border-[#E9E4DC] bg-white text-[13px] font-bold text-[#4E473D] hover:bg-[#FBF9F5] shadow-sm transition-all',
        content
    )
    
    # Toggle Buttons (Gender etc)
    content = re.sub(
        r'flex-1 h-10 rounded-xl text-sm font-medium shadow-\[.*?\] transition-all',
        r'flex-1 h-10 rounded-xl text-[13px] font-bold transition-all',
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# --- Update Profile Sidebar ---
with open(sidebar_file, 'r', encoding='utf-8') as f:
    sidebar = f.read()

# Make it match the right-side cards from client2
sidebar = sidebar.replace(
    'bg-[#FBF9F5] rounded-[32px] p-6 border border-[#E9E4DC] shadow-sm',
    'bg-white rounded-[26px] p-6 border border-[#ECE5D9] shadow-[0_2px_14px_-3px_rgba(0,0,0,0.04),0_1px_4px_-1px_rgba(0,0,0,0.02)]'
)
sidebar = sidebar.replace(
    'bg-[#E5EFE9] flex items-center justify-center text-[#064e3b]',
    'bg-[#F7F3EA] border border-[#ECC066]/60 flex items-center justify-center text-[#725b24]'
)
sidebar = sidebar.replace(
    'text-gray-900',
    'text-[#1E2022]'
)
with open(sidebar_file, 'w', encoding='utf-8') as f:
    f.write(sidebar)

print("UI Refinements Applied!")
