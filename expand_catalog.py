import urllib.request, json, os, random

OUTPUT_PATH = '/Users/tymur/Desktop/Projects/upgrader.pro/skins.json'

# Existing skins
with open(OUTPUT_PATH, 'r', encoding='utf-8') as f:
    existing_skins = json.load(f)

print(f'Starting with {len(existing_skins)} existing skins...')
existing_names = set(s['marketName'] for s in existing_skins)

# Fetch official CSGO-API skins
url = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        raw_skins = json.loads(resp.read().decode('utf-8'))
    print(f'Fetched {len(raw_skins)} raw skins from ByMykel CSGO-API!')
except Exception as e:
    print('Error fetching API:', e)
    raw_skins = []

rarity_colors = {
    'rarity_common_weapon': 'b0c3d9',
    'rarity_rare_weapon': '4b69ff',
    'rarity_mythical_weapon': '8847ff',
    'rarity_legendary_weapon': 'd32ce6',
    'rarity_ancient_weapon': 'eb4b4b',
    'rarity_ancient': 'ffd700',
    'rarity_contraband': 'e4ae39'
}

rarity_numbers = {
    'rarity_common_weapon': 13,
    'rarity_rare_weapon': 14,
    'rarity_mythical_weapon': 15,
    'rarity_legendary_weapon': 16,
    'rarity_ancient_weapon': 17,
    'rarity_ancient': 18,
    'rarity_contraband': 19
}

wear_map = {
    'Factory New': {'suffix': '(Factory New)', 'code': 2, 'mult': 1.6},
    'Minimal Wear': {'suffix': '(Minimal Wear)', 'code': 4, 'mult': 1.25},
    'Field-Tested': {'suffix': '(Field-Tested)', 'code': 3, 'mult': 1.0},
    'Well-Worn': {'suffix': '(Well-Worn)', 'code': 5, 'mult': 0.85},
    'Battle-Scarred': {'suffix': '(Battle-Scarred)', 'code': 1, 'mult': 0.7}
}

# Base pricing tiers by skin name / weapon
knife_patterns = {
    'Fade': 1450.0,
    'Doppler': 1200.0,
    'Gamma Doppler': 1350.0,
    'Marble Fade': 1100.0,
    'Tiger Tooth': 850.0,
    'Lore': 950.0,
    'Crimson Web': 980.0,
    'Slaughter': 800.0,
    'Case Hardened': 750.0,
    'Autotronic': 650.0,
    'Black Laminate': 450.0,
    'Blue Steel': 380.0,
    'Damascus Steel': 360.0,
    'Rust Coat': 260.0,
    'Safari Mesh': 180.0,
    'Boreal Forest': 190.0,
    'Forest DDPAT': 185.0,
    'Urban Masked': 210.0,
    'Scorched': 195.0,
    'Night': 320.0,
    'Stained': 290.0,
    'Ultraviolet': 340.0
}

knife_multipliers = {
    'Butterfly Knife': 2.2,
    'Karambit': 2.0,
    'M9 Bayonet': 1.8,
    'Skeleton Knife': 1.6,
    'Talon Knife': 1.4,
    'Bayonet': 1.2,
    'Nomad Knife': 1.1,
    'Stiletto Knife': 1.1,
    'Classic Knife': 0.9,
    'Flip Knife': 0.85,
    'Huntsman Knife': 0.75,
    'Falchion Knife': 0.7,
    'Bowie Knife': 0.65,
    'Ursus Knife': 0.7,
    'Paracord Knife': 0.65,
    'Survival Knife': 0.6,
    'Gut Knife': 0.55,
    'Navaja Knife': 0.45,
    'Shadow Daggers': 0.5
}

glove_prices = {
    'Sport Gloves | Vice': 3200.0,
    'Sport Gloves | Pandora\'s Box': 4500.0,
    'Sport Gloves | Amphibious': 1400.0,
    'Sport Gloves | Hedge Maze': 2200.0,
    'Specialist Gloves | Crimson Kimono': 2400.0,
    'Specialist Gloves | Fade': 950.0,
    'Specialist Gloves | Emerald Web': 1100.0,
    'Specialist Gloves | Foundation': 650.0,
    'Driver Gloves | King Snake': 1200.0,
    'Driver Gloves | Snow Leopard': 1150.0,
    'Driver Gloves | Imperial Plaid': 750.0,
    'Moto Gloves | Spearmint': 2600.0,
    'Moto Gloves | Polygon': 650.0,
    'Hand Wraps | Cobalt Skulls': 950.0,
    'Hand Wraps | Overprint': 450.0,
    'Bloodhound Gloves | Snakebite': 280.0,
    'Hydra Gloves | Emerald': 220.0
}

famous_skins_base = {
    'AWP | Dragon Lore': 5500.0,
    'AWP | Gungnir': 6200.0,
    'AWP | Medusa': 2800.0,
    'AWP | Desert Hydra': 1900.0,
    'AWP | The Prince': 2400.0,
    'AWP | Fade': 1150.0,
    'AWP | Lightning Strike': 650.0,
    'AWP | Oni Taiji': 450.0,
    'AWP | Asiimov': 135.0,
    'AWP | Wildfire': 110.0,
    'AWP | Hyper Beast': 65.0,
    'AWP | Neo-Noir': 42.0,
    'AWP | Redline': 55.0,
    'AWP | Atheris': 15.0,
    'AWP | Mortis': 8.5,
    'AK-47 | Fire Serpent': 1250.0,
    'AK-47 | Gold Arabesque': 2800.0,
    'AK-47 | Hydroponic': 1100.0,
    'AK-47 | Wild Lotus': 7500.0,
    'AK-47 | Vulcan': 480.0,
    'AK-47 | Fuel Injector': 280.0,
    'AK-47 | Case Hardened': 320.0,
    'AK-47 | Bloodsport': 125.0,
    'AK-47 | Empress': 85.0,
    'AK-47 | Asiimov': 70.0,
    'AK-47 | Neon Rider': 65.0,
    'AK-47 | Redline': 28.0,
    'AK-47 | Slate': 12.0,
    'AK-47 | Ice Coaled': 18.0,
    'M4A4 | Howl': 4800.0,
    'M4A4 | Poseidon': 1400.0,
    'M4A4 | Eye of Horus': 850.0,
    'M4A4 | The Coalition': 180.0,
    'M4A4 | Temukau': 95.0,
    'M4A4 | In Living Color': 45.0,
    'M4A4 | Neo-Noir': 35.0,
    'M4A4 | Asiimov': 140.0,
    'M4A4 | Desolate Space': 25.0,
    'M4A4 | Spider Lily': 16.0,
    'M4A1-S | Welcome to the Jungle': 2200.0,
    'M4A1-S | Imminent Danger': 1500.0,
    'M4A1-S | Knight': 1800.0,
    'M4A1-S | Hot Rod': 950.0,
    'M4A1-S | Blue Phosphor': 680.0,
    'M4A1-S | Printstream': 260.0,
    'M4A1-S | Player Two': 95.0,
    'M4A1-S | Chantico\'s Fire': 75.0,
    'M4A1-S | Hyper Beast': 60.0,
    'M4A1-S | Decimator': 25.0,
    'M4A1-S | Cyrex': 35.0,
    'Desert Eagle | Fennec Fox': 480.0,
    'Desert Eagle | Sunset Storm 弐': 350.0,
    'Desert Eagle | Emerald J\u00f6rmungandr': 320.0,
    'Desert Eagle | Printstream': 110.0,
    'Desert Eagle | Code Red': 75.0,
    'Desert Eagle | Golden Koi': 95.0,
    'Desert Eagle | Ocean Drive': 45.0,
    'Desert Eagle | Conspiracy': 14.0,
    'Desert Eagle | Mecha Industries': 12.0,
    'USP-S | Kill Confirmed': 180.0,
    'USP-S | Target Acquired': 240.0,
    'USP-S | Printstream': 120.0,
    'USP-S | Neo-Noir': 45.0,
    'USP-S | The Traitor': 55.0,
    'USP-S | Cortex': 14.0,
    'Glock-18 | Fade': 1650.0,
    'Glock-18 | Gamma Doppler': 65.0,
    'Glock-18 | Bullet Queen': 55.0,
    'Glock-18 | Neo-Noir': 38.0,
    'Glock-18 | Water Elemental': 18.0,
    'Glock-18 | Vogue': 12.0
}

added_count = 0
new_skins = list(existing_skins)
start_id = 90000

for item in raw_skins:
    name = item.get('name', '')
    if not name or not item.get('image'):
        continue

    is_knife = '★' in name and 'Knife' in name or 'Bayonet' in name or 'Karambit' in name or 'Daggers' in name
    is_glove = '★' in name and ('Gloves' in name or 'Wraps' in name)

    # Determine base price
    base_price = None
    clean_name = name.replace('★ ', '').strip()

    for k, v in famous_skins_base.items():
        if k in clean_name:
            base_price = v
            break

    if base_price is None and is_knife:
        matched_knife_mult = 1.0
        for k_type, mult in knife_multipliers.items():
            if k_type in name:
                matched_knife_mult = mult
                break
        matched_pat = 300.0
        for p_name, p_price in knife_patterns.items():
            if p_name in name:
                matched_pat = p_price
                break
        base_price = matched_pat * matched_knife_mult

    if base_price is None and is_glove:
        for g_name, g_price in glove_prices.items():
            if g_name in clean_name:
                base_price = g_price
                break
        if base_price is None:
            base_price = random.choice([250.0, 380.0, 520.0, 780.0])

    if base_price is None:
        rarity_id = item.get('rarity', {}).get('id', '')
        if 'ancient' in rarity_id: # Covert
            base_price = random.uniform(35.0, 220.0)
        elif 'legendary' in rarity_id: # Classified
            base_price = random.uniform(12.0, 65.0)
        elif 'mythical' in rarity_id: # Restricted
            base_price = random.uniform(3.5, 22.0)
        elif 'rare' in rarity_id: # Mil-Spec
            base_price = random.uniform(0.8, 8.0)
        else:
            base_price = random.uniform(0.2, 2.5)

    rarity_id = item.get('rarity', {}).get('id', '')
    color_hex = rarity_colors.get(rarity_id, 'eb4b4b' if is_knife or is_glove else '8847ff')
    rarity_num = 18 if (is_knife or is_glove) else rarity_numbers.get(rarity_id, 16)
    weapon_name = (item.get('weapon') or {}).get('name', '')
    pattern_name = (item.get('pattern') or {}).get('name', '') or (item.get('name', '').split('|')[-1].strip() if '|' in item.get('name', '') else item.get('name', ''))

    # Generate 1 or 2 wear variants for each skin
    wears_to_add = ['Field-Tested', 'Factory New'] if (base_price > 50 or is_knife or is_glove) else ['Field-Tested']
    
    for wear_name in wears_to_add:
        w_info = wear_map[wear_name]
        full_market_name = f"{name} {w_info['suffix']}"
        if full_market_name in existing_names:
            continue
            
        final_price = round(base_price * w_info['mult'], 2)
        start_id += 1
        
        skin_entry = {
            "id": str(start_id),
            "appId": 730,
            "marketName": full_market_name,
            "price": f"{final_price:.3f}",
            "image": item['image'],
            "extra": {
                "e": w_info['code'],
                "g": (item.get('weapon') or {}).get('weapon_id', 1),
                "n": [weapon_name or name.split('|')[0].strip(), pattern_name, wear_name],
                "r": rarity_num,
                "s": False,
                "t": 16,
                "ch": color_hex,
                "st": False
            }
        }
        new_skins.append(skin_entry)
        existing_names.add(full_market_name)
        added_count += 1

print(f'Added {added_count} new high-quality skins!')
print(f'Total skins in new catalog: {len(new_skins)}')

with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(new_skins, f, ensure_ascii=False, indent=2)

print('Successfully saved to', OUTPUT_PATH)
