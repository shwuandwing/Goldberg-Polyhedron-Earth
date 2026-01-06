import json
import requests
import os

# Stable URL for Natural Earth 110m land GeoJSON from a well-known repository
URL = "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/110m/physical/ne_110m_land.json"

def regenerate():
    print(f"Fetching data from {URL}...")
    try:
        response = requests.get(URL)
        response.raise_for_status()
        data = response.json()
        
        # Keep only the properties the app expects
        # The app's logic in goldberg.ts/rs only uses the geometry
        # but we preserve some properties for consistency with the original.
        simplified_features = []
        for feature in data.get("features", []):
            new_feature = {
                "type": "Feature",
                "properties": {
                    "featurecla": feature["properties"].get("featurecla", "Land"),
                    "scalerank": feature["properties"].get("scalerank", 0),
                    "min_zoom": feature["properties"].get("min_zoom", 0.0)
                },
                "geometry": feature["geometry"]
            }
            simplified_features.append(new_feature)
        
        simplified_data = {
            "type": "FeatureCollection",
            "features": simplified_features
        }

        # Paths to save
        ts_path = os.path.join("src", "utils", "land.json")
        rust_path = os.path.join("rust", "assets", "land.json")

        # Ensure directories exist
        os.makedirs(os.path.dirname(ts_path), exist_ok=True)
        os.makedirs(os.path.dirname(rust_path), exist_ok=True)

        # Save to both locations
        with open(ts_path, 'w', encoding='utf-8') as f:
            json.dump(simplified_data, f, separators=(',', ':'))
        print(f"Saved to {ts_path}")

        with open(rust_path, 'w', encoding='utf-8') as f:
            json.dump(simplified_data, f, separators=(',', ':'))
        print(f"Saved to {rust_path}")

        print("Regeneration complete.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    regenerate()
