# NoteList

A lightweight, standalone Windows desktop notepad and checklist application built with Electron.

## Features
- **Tabbed Management:** Organize separate lists across multiple tabs (`Untitled` by default; double-click any tab title to rename).
- **Flexible List Formatting:** Switch rows between checkboxes (with automatic dimming on completion), bullet points, and numbered lists.
- **Inline Screenshots:** Paste screenshots directly from your clipboard (`Ctrl + V`) as inline thumbnails and click them to inspect in a full-size modal viewer.
- **Dark & Light Mode:** Toggle between clean light and dark themes.
- **Automatic Local Persistence:** Saves all tabs, items, and pasted images automatically to a local JSON file (`notelist-data.json`) in your Windows `userData` directory.

## Download & Run (Windows)
1. Go to the **[Releases](https://github.com/jonathansison/notelist-app/releases)** page.
2. Download either:
   - **`NoteList 1.0.0.exe` (Portable):** Double-click to run immediately without installation[cite: 3, 5].
   - **`NoteList Setup 1.0.0.exe` (Installer):** Run to install NoteList on your PC[cite: 3, 5].

> **Note:** Because the executable is self-packaged without a paid code-signing certificate, Windows SmartScreen may show a *"Windows protected your PC"* prompt on first launch[cite: 3]. Click **More info** → **Run anyway**.

## Run from Source
```bash
git clone [https://github.com/jonathansison/notelist-app.git](https://github.com/jonathansison/notelist-app.git)
cd notelist-app
npm install
npm start


