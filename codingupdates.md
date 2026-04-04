# Coding Updates Log

## Batch 1 — completed
1. ✅ Add April to the heat map
2. ✅ Remove the sign out option at the top, and only have sign out on the setting wheel
3. ✅ Call the erase all history, data rather than danger zone
4. ✅ Change play button to #7D7575
5. ✅ For situations where user changes task while task is paused the task is stopped, remove that again just in case user selected the wrong task in the first place
6. ✅ Bug where after removing task in lock in page, then going to history completely recovers the removed task

## Batch 2 — completed
1. ✅ For a brief moment test1 was not removed after erase data — erase now archives all tasks in the same operation
2. ✅ Option to change shortcuts — added to Settings, click any key badge to edit, saves to localStorage
3. ✅ When hovering over heat maps show a small explanation of how colours are judged — time ranges shown in tooltip and legend
4. ✅ In the future whenever a new change is made edit this document

## Batch 3 — completed
1. ✅ Heatmap legend hover tooltip — hovering over the Less→More legend row shows a floating popup with all 7 color levels and their time ranges
2. ✅ Updated heat level timings — 6 stages: 0–1 hr, 1–2 hrs, 2–3 hrs, 3–4 hrs, 4–6 hrs, 6+ hrs
3. ✅ Day popup modal — clicking any heatmap cell opens a modal with date, total time, 24-bar hourly chart, and time by task breakdown
4. ✅ Bar chart scaling in History — verified already scales so tallest bar = 100% (no change needed)

## Batch 4 — completed
1. ✅ Multi-key shortcut recording — clicking a key badge opens a full-screen dark overlay; pressing any combination (e.g. Ctrl+B) shows the combo live; Enter saves, Esc cancels. Navigation matching updated on all pages via `matchesShortcut` helper so combos actually trigger correctly.

## Batch 5 — completed
1. ✅ Stop timer shortcut — default Ctrl+Enter, stops the timer from anywhere on the timer page; configurable via Settings like other shortcuts

## Pending / Notes
