import os, shutil

BASE_DIR = '/Users/tymur/Desktop/Projects/upgrader.pro'

def ensure_dir(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)

def write_file(rel_path, content):
    full_path = os.path.join(BASE_DIR, rel_path)
    ensure_dir(full_path)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print('Created:', rel_path)

# 1. light-gray-logo-padded.png
src_logo = os.path.join(BASE_DIR, 'assets/images/light-gray-logo.png')
dest_logo = os.path.join(BASE_DIR, 'assets/images/light-gray-logo-padded.png')
if os.path.exists(src_logo):
    shutil.copyfile(src_logo, dest_logo)
    print('Copied light-gray-logo-padded.png')

# 2. store.svg (white version of store-yellow.svg)
store_svg = '''<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.985 5.379L15.08 1.757C14.969 1.312 14.569 1 14.11 1H1.891C1.432 1 1.032 1.312 0.92 1.757L0.015 5.379C0.005 5.418 0 5.459 0 5.5C0 6.878 1.065 8 2.375 8C3.136 8 3.815 7.621 4.25 7.033C4.685 7.621 5.364 8 6.125 8C6.886 8 7.565 7.621 8 7.033C8.435 7.621 9.113 8 9.875 8C10.637 8 11.315 7.621 11.75 7.033C12.185 7.621 12.863 8 13.625 8C14.935 8 16 6.878 16 5.5C16 5.459 15.995 5.418 15.985 5.379Z" fill="currentColor"/>
<path d="M13.625 9.00011C12.944 9.00011 12.297 8.79211 11.75 8.41211C10.656 9.17311 9.094 9.17311 8 8.41211C6.906 9.17311 5.344 9.17311 4.25 8.41211C3.703 8.79211 3.056 9.00011 2.375 9.00011C1.884 9.00011 1.421 8.88511 1 8.68911V14.0001C1 14.5521 1.448 15.0001 2 15.0001H6V11.0001H10V15.0001H14C14.552 15.0001 15 14.5521 15 14.0001V8.68911C14.579 8.88511 14.116 9.00011 13.625 9.00011Z" fill="currentColor"/>
</svg>'''
write_file('assets/icons/store.svg', store_svg)

# 3. knife-white.svg
knife_svg = '''<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21.707 2.293a1 1 0 0 0-1.414 0l-5.657 5.657-1.414-1.414a1 1 0 0 0-1.414 1.414l1.414 1.414-6.364 6.364A3 3 0 0 0 5.5 19.828l-3.207 3.207a1 1 0 0 0 1.414 1.414l3.207-3.207a3 3 0 0 0 2.121-.879l6.364-6.364 1.414 1.414a1 1 0 0 0 1.414-1.414l-1.414-1.414 5.657-5.657a1 1 0 0 0 0-1.414z" fill="#FFFFFF"/>
</svg>'''
write_file('assets/icons/knife-white.svg', knife_svg)

# 4. Social SVGs
telegram_svg = '''<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" fill="currentColor"/>
</svg>'''
write_file('assets/images/socials/telegram.svg', telegram_svg)

vk_svg = '''<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.72 13.56h-1.63c-.62 0-.81-.49-1.92-1.6-.97-.95-1.4-1.07-1.64-1.07-.33 0-.43.1-.43.57v1.54c0 .39-.13.56-1.16.56-1.71 0-3.61-1.04-4.96-2.97-2.03-2.85-2.58-5-2.58-5.44 0-.24.1-.46.56-.46h1.63c.42 0 .58.19.74.63.82 2.37 2.19 4.45 2.76 4.45.21 0 .31-.1.31-.64V9.67c-.07-1.14-.67-1.24-.67-1.64 0-.19.16-.38.42-.38h2.56c.35 0 .48.19.48.61v3.31c0 .35.16.48.26.48.21 0 .39-.13.78-.52 1.22-1.37 2.08-3.48 2.08-3.48.11-.24.32-.42.74-.42h1.63c.49 0 .6.25.49.6-.2 1.01-2.19 3.65-2.28 3.79-.22.34-.3.49 0 .91.22.31.94.92 1.42 1.48.88 1.01 1.55 1.86 1.73 2.45.18.58-.1.87-.58.87z" fill="currentColor"/>
</svg>'''
write_file('assets/images/socials/vk.svg', vk_svg)

instagram_svg = '''<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="currentColor"/>
</svg>'''
write_file('assets/images/socials/instagram.svg', instagram_svg)

x_svg = '''<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
</svg>'''
write_file('assets/images/socials/x.svg', x_svg)

discord_svg = '''<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="currentColor"/>
</svg>'''
write_file('assets/images/socials/discord.svg', discord_svg)

tiktok_svg = '''<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.33 6.33 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 8.66 5.92 6.31 6.31 0 0 0 4.02-5.92V8.41a8.27 8.27 0 0 0 3.77 1.72V6.69z" fill="currentColor"/>
</svg>'''
write_file('assets/images/socials/tiktok.svg', tiktok_svg)

# 5. Status icons
success_svg = '''<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="10" fill="#10B981" fill-opacity="0.2"/>
<path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''
write_file('assets/icons/status/success.svg', success_svg)

pending_svg = '''<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="10" fill="#F59E0B" fill-opacity="0.2"/>
<path d="M12 6v6l4 2" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
</svg>'''
write_file('assets/icons/status/pending.svg', pending_svg)

decline_svg = '''<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="10" fill="#EF4444" fill-opacity="0.2"/>
<path d="M15 9l-6 6M9 9l6 6" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
</svg>'''
write_file('assets/icons/status/decline.svg', decline_svg)

# 6. Payment icons
card_svg = '''<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
<line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" stroke-width="2"/>
<circle cx="6" cy="15" r="1.5" fill="currentColor"/>
</svg>'''
write_file('assets/icons/payment-modal-new/card.svg', card_svg)

crypto_svg = '''<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
<path d="M10 7h4a2 2 0 0 1 0 4h-4m0 0h5a2 2 0 0 1 0 4h-5m0-8v10M9 5v2m6-2v2m-6 10v2m6-2v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
</svg>'''
write_file('assets/icons/payment-modal-new/crypto.svg', crypto_svg)

skins_svg = '''<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 13l4-4 3 3 7-7 4 4-7 7-3-3-4 4H3v-4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
</svg>'''
write_file('assets/icons/payment-modal-new/skins.svg', skins_svg)

write_file('assets/icons/payment-modal-new/chevron-currencies-dark.svg', '''<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>''')

# 7. Provably fair icons
copy_svg = '''<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
<path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>'''
write_file('assets/icons/provably-fair/copy.svg', copy_svg)

calendar_svg = '''<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/>
<line x1="2" y1="6" x2="14" y2="6" stroke="currentColor" stroke-width="1.5"/>
<line x1="5" y1="1" x2="5" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
<line x1="11" y1="1" x2="11" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>'''
write_file('assets/icons/provably-fair/calendar.svg', calendar_svg)

write_file('assets/icons/provably-fair/exclamation.svg', '''<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="4" x2="8" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.75" fill="currentColor"/></svg>''')

write_file('assets/images/provably-fair/shield.svg', '''<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 4L6 10v14c0 11.5 7.7 22.2 18 24 10.3-1.8 18-12.5 18-24V10L24 4z" fill="#FDD911" fill-opacity="0.1" stroke="#FDD911" stroke-width="2"/><path d="M16 24l5 5 11-11" stroke="#FDD911" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>''')

# 8. Stars
write_file('assets/images/guard-opinion/star.svg', '''<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1l2.2 4.4 4.8.7-3.5 3.4.8 4.8L8 12l-4.3 2.3.8-4.8L1 6.1l4.8-.7L8 1z" fill="#FDD911"/></svg>''')
write_file('assets/images/guard-opinion/star-half.svg', '''<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1l2.2 4.4 4.8.7-3.5 3.4.8 4.8L8 12l-4.3 2.3.8-4.8L1 6.1l4.8-.7L8 1z" fill="#3A3B40"/><path d="M8 1v11l-4.3 2.3.8-4.8L1 6.1l4.8-.7L8 1z" fill="#FDD911"/></svg>''')

print('All assets created successfully!')
