# Isolated Criteo visit benchmark — run v002

Review date: 2026-11-04 (Asia/Bangkok). Research status: **RESEARCH_LIMITED**.
Production ROI status: **BASELINE_ONLY**. This directory is never loaded by the production API.

Source: Criteo AI Lab, corrected CRITEO-UPLIFTv2.1. Cite Eustache Diemert,
Artem Betlei, Christophe Renaudin, Massih-Reza Amini, Théophane Gregoir and
Thibaud Rahier, *A Large Scale Benchmark for Individual Treatment Effect
Prediction and Uplift Modeling*, 2021; also retain the publisher's requested
AdKDD 2018 dataset citation. Publisher terms:
https://ailab.criteo.com/criteo-uplift-prediction-dataset/ .
Dataset license: CC BY-NC-SA 4.0; this academic, noncommercial use does not
authorize commercial deployment or unrestricted redistribution of raw/derived
data. Preserve applicable notices/attribution and review upstream conditions
before sharing. The raw file is stored only under the isolated reassessment
directory; it is not a replacement for the original DreamMakers CSV.

Pinned revision, LFS SHA256, actual header/count audit and design assumptions
are under `../phase4b4/reassessment/`. A published RCT-compatible-release
assumption supports the conditional benchmark, not recovery of original-
population effects after undisclosed label sampling. No ROI exists in this file.

## Commands from project root

```powershell
# Main search only in a fresh run: refuses an existing run_lock.json.
& .\backend\.venv\Scripts\python.exe -X utf8 research/phase4b5_criteo_v2/run.py
# Recompute policy metrics/400 bootstrap draws for the already frozen policy.
& .\backend\.venv\Scripts\python.exe -X utf8 research/phase4b5_criteo_v2/evaluate_policy.py
# Three independent classifier refits, metric/scope/integrity checks.
& .\backend\.venv\Scripts\python.exe -X utf8 research/phase4b5_criteo_v2/verify.py
& .\backend\.venv\Scripts\python.exe -X utf8 research/phase4b5_criteo_v2/render_handoff.py
```

Do not delete/overwrite the original run to repeat the full CV search. A fresh
run directory at the same depth under research can carry the unchanged source
and locked protocol; keep original evidence and compare IDs/config hashes.
Changing source, protocol, metric or sample requires a new experiment ID and
must not be selected using the original final outcomes. This run performed one
full search and one replay of selected refits, not two full CV searches.

## Outputs and interpretation

- `results/run_lock.json`: source/config/gate hashes, versions and threadpools.
- `split_manifest.json/npz`: complete sampled source row IDs and partitions.
- `inner_trials.json/csv`: all 12 CV trial scores and warnings.
- `selection_results.json`: inner-selected C and validation model selection.
- `frozen_policy.json`: policy fixed before final scoring.
- `final_scores.json`, `*_final_predictions.npz`: raw final outcomes/probabilities.
- `policy_results.json`, `policy_bootstrap.csv`, `policy_sensitivity.csv`:
  conditional HT policy functionals, 400 paired bootstraps, nine fixed stress tests.
- `verification_results.json`: 41 checks and actual selected-model refit errors.

Main run: 21 classifier fits. Replay: three fits. The preserved v001 attempt
contains one discarded fit before any CV scores due to an iprint compatibility
warning; two earlier startup failures did not fit. Total observed classifier
fits including that failed attempt: 25. All 21 main-run compatibility warnings
are recorded. No convergence warning is allowed. No package on disk was patched.

Numeric runtime uses the existing wide-character module enumeration fallback
in memory for a threadpoolctl Windows Unicode-path issue. Thread budgets are
set before numeric-library imports. Requirements below describe the already
used environment; no install/change to the Backend virtual environment occurred.

Final handoff reports are in `../final_ml_research_summary.md`,
`../final_ml_experiment_results.md`, `../ml_to_website_handoff.md`.
No optimizer, production model replacement or old ROI Test evaluation occurred.
