# Device testing

**Status: not yet run.** This needs the app deployed over HTTPS (see `docs/deployment.md`); installation and the service worker don't work over plain HTTP except on localhost.

The automated end-to-end suite runs Chromium, Firefox, and WebKit (Safari's engine) at phone and desktop sizes in CI. That doesn't replace real devices: install prompts, Add to Home Screen, standalone display, and real network loss only show up there.

## Checks on each device

1. **Install:** Android Chrome shows the install prompt or menu item; iOS Safari → Share → Add to Home Screen; desktop Chrome or Edge shows the install icon. The installed app opens without browser chrome, with the right icon and name.
2. **First run:** set up a plan, add a meal and a snack, create a shopping list.
3. **Offline:** open the core pages once. Turn on aeroplane mode, close and reopen the app. Today, Meal plan, Recipes, Shopping list, and Settings open, edits save, and the offline banner shows. An unvisited recipe shows the offline page.
4. **Back online:** the banner goes away by itself, and the edits made offline are still there.
5. **Layout:** no horizontal scrolling at the narrowest width; the bottom navigation clears the home indicator on notched phones; text stays readable at the largest system text size.
6. **Data:** download your data, delete everything, then restore the file.

## Results

Record one row per device. `npm run launch:check` passes this item once an Android or iPhone row says Pass.

| Device and OS | Browser | Result | Date | Tester | Issues |
|---|---|---|---|---|---|
| Android (version) | Chrome | Not yet run | — | — | — |
| iPhone (iOS version) | Safari | Not yet run | — | — | — |
| Desktop (OS) | Chrome or Edge | Not yet run | — | — | — |
