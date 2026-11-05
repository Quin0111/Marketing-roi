"""Read only Duration from the original CSV; never train/evaluate a model."""
import argparse
import hashlib
import json
from pathlib import Path

import pandas as pd


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", type=Path)
    parser.add_argument("notebook", type=Path)
    args = parser.parse_args()
    notebook = json.loads(args.notebook.read_text(encoding="utf-8"))
    matches = []
    for index, cell in enumerate(notebook["cells"]):
        source = "".join(cell.get("source", []))
        if "df_clean['Duration_days'] = df_clean['Duration'].str.extract(r'(\\d+)').astype(int)" in source:
            matches.append(index)
    if not matches:
        raise ValueError("Notebook conversion could not be verified")
    raw = pd.read_csv(args.dataset, usecols=["Duration"])["Duration"]
    # Same conversion as the notebook; only inspect the input domain, not ROI.
    days = raw.str.extract(r"(\d+)").astype(int)[0]
    allowed = sorted(int(x) for x in days.unique())
    if allowed != [15, 30, 45, 60]:
        raise ValueError(f"Unexpected duration domain: {allowed}")
    result = {
        "status": "PASS", "allowed_duration_days": allowed,
        "dataset_file": args.dataset.name,
        "dataset_sha256": hashlib.sha256(args.dataset.read_bytes()).hexdigest(),
        "notebook_file": args.notebook.name,
        "notebook_sha256": hashlib.sha256(args.notebook.read_bytes()).hexdigest(),
        "notebook_cell_indices_zero_based": matches,
        "conversion": "Duration.str.extract(r'(\\d+)').astype(int)",
        "rows": len(raw), "missing_duration": int(raw.isna().sum()),
        "raw_counts": {str(k): int(v) for k, v in raw.value_counts().sort_index().items()},
        "duration_days_counts": {str(k): int(v) for k, v in days.value_counts().sort_index().items()},
        "scope": "Input-domain verification only; only Duration column read; no ROI, model selection or fitting.",
    }
    output = Path(__file__).resolve().parent / "duration_verification.json"
    output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    main()
