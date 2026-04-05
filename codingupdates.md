# Coding Updates Log

## Batch 1 - completed
1. Added April to the heatmap.
2. Moved sign out to Settings only.
3. Renamed "Danger Zone" to "Data".
4. Changed play button to `#7D7575`.
5. Stopped forcing timer stop when task changes while paused.
6. Fixed removed tasks reappearing in History.

## Batch 2 - completed
1. Erase data now archives all tasks in the same operation.
2. Added editable shortcuts in Settings, saved to `localStorage`.
3. Added heatmap hover explanations and legend ranges.
4. Started using this file as the change log.

## Batch 3 - completed
1. Added legend hover tooltip with all color levels.
2. Updated heat levels to `0-1`, `1-2`, `2-3`, `3-4`, `4-6`, `6+` hours.
3. Added day modal with total, hourly chart, and task breakdown.
4. Verified History bar scaling was already correct.

## Batch 4 - completed
1. Added multi-key shortcut recording and shared `matchesShortcut` handling.

## Batch 5 - completed
1. Added stop timer shortcut: default `Ctrl+Enter`.

## Batch 6 - completed
1. Added live "Today" total inside the stopwatch card.
2. Persisted timer state across navigation and refresh via `TimerProvider` + `localStorage`.

## Batch 7 - completed
1. Fixed active task loss during an in-progress session by keeping the persisted timer state synced with the selected task across navigation and restore flows.
