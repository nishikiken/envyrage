import urllib.request, json, os, random

OUTPUT_PATH = '/Users/tymur/Desktop/Projects/upgrader.pro/skins.json'

print("Fetching ByMykel CSGO-API...")
url = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=25) as resp:
    raw_skins = json.loads(resp.read().decode('utf-8'))

print(f"Fetched {len(raw_skins)} raw skins.")

wear_map = {
    'Factory New': {'suffix': '(Factory New)', 'code': 2, 'mult': 1.65},
    'Minimal Wear': {'suffix': '(Minimal Wear)', 'code': 4, 'mult': 1.25},
    'Field-Tested': {'suffix': '(Field-Tested)', 'code': 3, 'mult': 1.0},
    'Well-Worn': {'suffix': '(Well-Worn)', 'code': 5, 'mult': 0.85},
    'Battle-Scarred': {'suffix': '(Battle-Scarred)', 'code': 1, 'mult': 0.70}
}

famous_skins_base = {
    'AWP | Dragon Lore': 850000.0,
    'AWP | Gungnir': 950000.0,
    'AWP | Medusa': 280000.0,
    'AWP | Desert Hydra': 180000.0,
    'AWP | The Prince': 240000.0,
    'AWP | Fade': 115000.0,
    'AWP | Lightning Strike': 65000.0,
    'AWP | Oni Taiji': 45000.0,
    'AWP | Asiimov': 12960.0,
    'AWP | Wildfire': 10500.0,
    'AWP | Hyper Beast': 6500.0,
    'AWP | Neo-Noir': 4200.0,
    'AWP | Redline': 5500.0,
    'AWP | Atheris': 1440.0,
    'AWP | Mortis': 850.0,
    'AK-47 | Wild Lotus': 1250000.0,
    'AK-47 | Gold Arabesque': 280000.0,
    'AK-47 | Fire Serpent': 120000.0,
    'AK-47 | Hydroponic': 110000.0,
    'AK-47 | Vulcan': 48000.0,
    'AK-47 | Case Hardened': 32000.0,
    'AK-47 | Fuel Injector': 28000.0,
    'AK-47 | Bloodsport': 12500.0,
    'AK-47 | The Empress': 8500.0,
    'AK-47 | Empress': 8500.0,
    'AK-47 | Asiimov': 7000.0,
    'AK-47 | Neon Rider': 6500.0,
    'AK-47 | Redline': 2688.0,
    'AK-47 | Slate': 1152.0,
    'AK-47 | Ice Coaled': 1800.0,
    'M4A4 | Howl': 650000.0,
    'M4A4 | Poseidon': 140000.0,
    'M4A4 | Eye of Horus': 85000.0,
    'M4A4 | The Coalition': 18000.0,
    'M4A4 | Temukau': 9500.0,
    'M4A4 | Asiimov': 13440.0,
    'M4A4 | The Emperor': 4500.0,
    'M4A4 | In Living Color': 4500.0,
    'M4A4 | Neo-Noir': 3500.0,
    'M4A4 | Desolate Space': 2500.0,
    'M4A1-S | Welcome to the Jungle': 220000.0,
    'M4A1-S | Imminent Danger': 150000.0,
    'M4A1-S | Knight': 180000.0,
    'M4A1-S | Hot Rod': 95000.0,
    'M4A1-S | Blue Phosphor': 68000.0,
    'M4A1-S | Printstream': 26000.0,
    'M4A1-S | Player Two': 9500.0,
    'M4A1-S | Chantico\'s Fire': 7500.0,
    'M4A1-S | Hyper Beast': 5800.0,
    'M4A1-S | Decimator': 2400.0,
    'M4A1-S | Cyrex': 3500.0,
    'Desert Eagle | Fennec Fox': 48000.0,
    'Desert Eagle | Sunset Storm': 35000.0,
    'Desert Eagle | Emerald Jörmungandr': 32000.0,
    'Desert Eagle | Printstream': 10500.0,
    'Desert Eagle | Golden Koi': 9500.0,
    'Desert Eagle | Code Red': 7500.0,
    'Desert Eagle | Ocean Drive': 4500.0,
    'Desert Eagle | Conspiracy': 1400.0,
    'Desert Eagle | Mecha Industries': 1200.0,
    'USP-S | Target Acquired': 24000.0,
    'USP-S | Kill Confirmed': 18000.0,
    'USP-S | Printstream': 12000.0,
    'USP-S | The Traitor': 5500.0,
    'USP-S | Neo-Noir': 4500.0,
    'USP-S | Cortex': 1400.0,
    'Glock-18 | Fade': 165000.0,
    'Glock-18 | Gamma Doppler': 6500.0,
    'Glock-18 | Bullet Queen': 5500.0,
    'Glock-18 | Neo-Noir': 3800.0,
    'Glock-18 | Water Elemental': 1800.0,
    'Glock-18 | Vogue': 1200.0,
    'Glock-18 | High Beam': 236.0
}

knife_multipliers = {
    'Butterfly Knife': 2.3,
    'Karambit': 2.1,
    'M9 Bayonet': 1.85,
    'Skeleton Knife': 1.6,
    'Talon Knife': 1.45,
    'Stiletto Knife': 1.2,
    'Nomad Knife': 1.15,
    'Bayonet': 1.1,
    'Classic Knife': 0.95,
    'Flip Knife': 0.9,
    'Huntsman Knife': 0.8,
    'Falchion Knife': 0.75,
    'Ursus Knife': 0.75,
    'Bowie Knife': 0.7,
    'Paracord Knife': 0.7,
    'Survival Knife': 0.65,
    'Shadow Daggers': 0.55,
    'Gut Knife': 0.55,
    'Navaja Knife': 0.45
}

knife_patterns = {
    'Doppler Ruby': 550000.0,
    'Doppler Sapphire': 600000.0,
    'Doppler Black Pearl': 480000.0,
    'Gamma Doppler Emerald': 650000.0,
    'Fade': 110000.0,
    'Gamma Doppler': 95000.0,
    'Doppler': 85000.0,
    'Marble Fade': 90000.0,
    'Tiger Tooth': 68000.0,
    'Lore': 75000.0,
    'Crimson Web': 72000.0,
    'Slaughter': 62000.0,
    'Case Hardened': 58000.0,
    'Autotronic': 52000.0,
    'Black Laminate': 35000.0,
    'Freehand': 32000.0,
    'Blue Steel': 30000.0,
    'Damascus Steel': 28000.0,
    'Bright Water': 26000.0,
    'Rust Coat': 22000.0,
    'Stained': 24000.0,
    'Night': 26000.0,
    'Ultraviolet': 27000.0,
    'Urban Masked': 20000.0,
    'Boreal Forest': 19000.0,
    'Forest DDPAT': 18500.0,
    'Scorched': 19000.0,
    'Safari Mesh': 18000.0
}

glove_prices = {
    'Sport Gloves | Vice': 320000.0,
    'Sport Gloves | Pandora\'s Box': 450000.0,
    'Sport Gloves | Amphibious': 140000.0,
    'Sport Gloves | Hedge Maze': 220000.0,
    'Specialist Gloves | Crimson Kimono': 240000.0,
    'Specialist Gloves | Fade': 95000.0,
    'Specialist Gloves | Emerald Web': 110000.0,
    'Specialist Gloves | Foundation': 65000.0,
    'Driver Gloves | King Snake': 120000.0,
    'Driver Gloves | Snow Leopard': 115000.0,
    'Driver Gloves | Imperial Plaid': 75000.0,
    'Moto Gloves | Spearmint': 260000.0,
    'Moto Gloves | Polygon': 65000.0,
    'Moto Gloves | Cool Mint': 45000.0,
    'Hand Wraps | Cobalt Skulls': 95000.0,
    'Hand Wraps | Overprint': 45000.0,
    'Bloodhound Gloves | Snakebite': 28000.0,
    'Bloodhound Gloves | Guerrilla': 25000.0,
    'Hydra Gloves | Emerald': 22000.0,
    'Broken Fang Gloves | Jade': 24000.0
}

all_skins = []
existing_names = set()
start_id = 10000

for item in raw_skins:
    name = item.get('name', '').strip()
    if not name or not item.get('image'):
        continue

    is_knife = item.get('category', {}).get('name') == 'Knives' or 'Knife' in name or 'Bayonet' in name or 'Karambit' in name or 'Daggers' in name
    is_glove = item.get('category', {}).get('name') == 'Gloves' or 'Gloves' in name or 'Wraps' in name
    
    # Clean base name (remove ★ prefix if present)
    clean_name = name.replace('★ ', '').strip()
    
    # 1. Base price calculation
    base_price = None
    for k, v in famous_skins_base.items():
        if k in clean_name or k == clean_name:
            base_price = v
            break
            
    if base_price is None and is_knife:
        matched_mult = 1.0
        for k_type, mult in knife_multipliers.items():
            if k_type in clean_name:
                matched_mult = mult
                break
        matched_pat = 28000.0
        for p_name, p_price in knife_patterns.items():
            if p_name in clean_name:
                matched_pat = p_price
                break
        base_price = max(9850.0, matched_pat * matched_mult)
        
    if base_price is None and is_glove:
        for g_name, g_price in glove_prices.items():
            if g_name in clean_name:
                base_price = g_price
                break
        if base_price is None:
            base_price = random.choice([25000.0, 38000.0, 52000.0, 78000.0])
            
    rarity_name = item.get('rarity', {}).get('name', '')
    
    if base_price is None:
        if 'Contraband' in rarity_name:
            base_price = 650000.0
        elif 'Covert' in rarity_name or 'Extraordinary' in rarity_name:
            base_price = random.uniform(2200.0, 28000.0)
        elif 'Classified' in rarity_name:
            base_price = random.uniform(850.0, 5500.0)
        elif 'Restricted' in rarity_name:
            base_price = random.uniform(220.0, 1800.0)
        elif 'Mil-Spec' in rarity_name:
            base_price = random.uniform(50.0, 480.0)
        elif 'Industrial' in rarity_name:
            base_price = random.uniform(20.0, 120.0)
        else:
            base_price = random.uniform(15.0, 80.0)

    # 2. Rarity mapping for Angular colorPipe and UI
    if is_knife or is_glove:
        rarity_num = 11      # Angular getColor(11) -> #FFAE39 (Gold/Yellow)
        rarity_color = 'ffae39'
    elif 'Contraband' in rarity_name:
        rarity_num = 11
        rarity_color = 'ffae39'
    elif 'Covert' in rarity_name:
        rarity_num = 7       # Angular getColor(7) -> #EB4B4B (Red/Covert)
        rarity_color = 'eb4b4b'
    elif 'Classified' in rarity_name:
        rarity_num = 5       # Angular getColor(5) -> #D32CE6 (Pink/Classified)
        rarity_color = 'd32ce6'
    elif 'Restricted' in rarity_name:
        rarity_num = 3       # Angular getColor(3) -> #8847FF (Purple/Restricted)
        rarity_color = '8847ff'
    elif 'Mil-Spec' in rarity_name:
        rarity_num = 2       # Angular getColor(2) -> #4B69FF (Blue/Mil-Spec)
        rarity_color = '4b69ff'
    elif 'Industrial' in rarity_name:
        rarity_num = 14      # Angular getColor(14) -> #5E98D9 (Light Blue)
        rarity_color = '5e98d9'
    else:
        rarity_num = 1       # Angular getColor(1) -> #B0C3D9 (Gray/Consumer)
        rarity_color = 'b0c3d9'

    # Weapon and pattern names
    raw_weapon = (item.get('weapon') or {}).get('name', '') or clean_name.split('|')[0].strip()
    if is_knife and not raw_weapon.startswith('★'):
        weapon_label = "★ " + raw_weapon
    elif is_glove and not raw_weapon.startswith('★'):
        weapon_label = "★ " + raw_weapon
    else:
        weapon_label = raw_weapon

    pattern_name = (item.get('pattern') or {}).get('name', '')
    if not pattern_name and '|' in clean_name:
        pattern_name = clean_name.split('|')[1].strip()
    if not pattern_name:
        pattern_name = clean_name

    # Wears to generate
    if is_knife or is_glove or base_price > 10000:
        wears_to_add = ['Factory New', 'Field-Tested']
    elif base_price > 1000:
        wears_to_add = ['Factory New', 'Field-Tested']
    else:
        wears_to_add = ['Field-Tested']

    for wear_name in wears_to_add:
        w_info = wear_map[wear_name]
        
        # Proper full market name
        market_prefix = weapon_label
        full_market_name = f"{market_prefix} | {pattern_name} {w_info['suffix']}"
        
        if full_market_name in existing_names:
            continue
            
        final_price = round(base_price * w_info['mult'], 2)
        if is_knife:
            final_price = max(9850.0, final_price)
        elif is_glove:
            final_price = max(9500.0, final_price)
            
        start_id += 1
        
        skin_entry = {
            "id": str(start_id),
            "appId": 730,
            "marketName": full_market_name,
            "price": f"{final_price:.3f}",
            "image": item['image'],
            "rarity": "extraordinary" if (is_knife or is_glove) else rarity_name.lower().replace(' ', '_'),
            "rarityColor": "#" + rarity_color,
            "extra": {
                "e": w_info['code'],
                "g": (item.get('weapon') or {}).get('weapon_id', 1),
                "n": [weapon_label, pattern_name, wear_name],
                "r": rarity_num,
                "s": False,
                "t": 16,
                "ch": rarity_color,
                "st": False
            }
        }
        all_skins.append(skin_entry)
        existing_names.add(full_market_name)

print(f"Generated {len(all_skins)} total skins!")

# Check knife count and rarities
knives = [s for s in all_skins if '★' in s['marketName']]
print(f"Total knives/gloves: {len(knives)}")
sample_knife = knives[0]
print("Sample knife:", sample_knife['marketName'], sample_knife['price'], "RUB")
print("Sample knife extra.n:", sample_knife['extra']['n'], "extra.r:", sample_knife['extra']['r'])

with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(all_skins, f, ensure_ascii=False, indent=2)

print(f"Saved complete catalog to {OUTPUT_PATH}")
