import json
import os

# Create directories
os.makedirs("src/data", exist_ok=True)
os.makedirs("public/data", exist_ok=True)

# Parse raw line into record
def parse_line(line):
    line = line.strip()
    if not line or line.startswith("PROVINCIA"):
        return None
    parts = line.split(";")
    if len(parts) < 8:
        return None
    station = int(parts[2])
    mag = int(parts[3])
    year = int(parts[5])
    month = int(parts[6])
    values = []
    # D01, V01, D02, V02, ... up to 31
    for i in range(1, 32):
        d_idx = 7 + (i - 1) * 2
        v_idx = d_idx + 1
        if d_idx < len(parts) and v_idx < len(parts):
            val_str = parts[d_idx].replace(",", ".")
            valid = parts[v_idx] == "V"
            try:
                val = float(val_str)
                # Filter out negative erroneous readings or non-valid
                if valid and val >= 0:
                    values.append(val)
                else:
                    values.append(None)
            except:
                values.append(None)
        else:
            values.append(None)
    return {
        "s": station,
        "m": mag,
        "y": year,
        "mo": month,
        "v": values
    }

print("Helper ready")
