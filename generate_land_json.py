import json
import requests
import os

# URLs for Natural Earth 110m datasets
LAND_URL = "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/110m/physical/ne_110m_land.json"
LAKES_URL = "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/110m/physical/ne_110m_lakes.json"

def regenerate():
    print("Fetching geographical data...")
    try:
        # Fetch Land
        print(f"  - Fetching Land from {LAND_URL}")
        land_resp = requests.get(LAND_URL)
        land_resp.raise_for_status()
        land_data = land_resp.json()

        # Fetch Lakes
        print(f"  - Fetching Lakes from {LAKES_URL}")
        lakes_resp = requests.get(LAKES_URL)
        lakes_resp.raise_for_status()
        lakes_data = lakes_resp.json()
        
        combined_features = []

        # Process Land
        for feature in land_data.get("features", []):
            combined_features.append({
                "type": "Feature",
                "properties": { "featurecla": "Land" },
                "geometry": feature["geometry"]
            })

        # Process Lakes (Significant lakes only)
        for feature in lakes_data.get("features", []):
            combined_features.append({
                "type": "Feature",
                "properties": { "featurecla": "Lake" },
                "geometry": feature["geometry"]
            })
        
        output_data = {
            "type": "FeatureCollection",
            "features": combined_features
        }

        # Paths to save
        ts_path = os.path.join("src", "utils", "land.json")
        rust_path = os.path.join("rust", "assets", "land.json")

        # Ensure directories exist
        os.makedirs(os.path.dirname(ts_path), exist_ok=True)
        os.makedirs(os.path.dirname(rust_path), exist_ok=True)

        # Save to both locations
        with open(ts_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, separators=(',', ':'))
        print(f"Saved to {ts_path}")

        with open(rust_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, separators=(',', ':'))
        print(f"Saved to {rust_path}")

        print("Regeneration complete.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    regenerate()
