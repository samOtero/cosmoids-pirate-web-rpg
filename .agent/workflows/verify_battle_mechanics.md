---
description: Verify battle mechanics by entering a specific battle via DevTools.
---

1.  **Start the Development Server** (if not already running):

    ```powershell
    npm run dev
    ```

2.  **Open the Application**:
    - Navigate to `http://localhost:3000` (or the active local URL).

3.  **Enter the Game**:
    - Click on the **First Profile** slot.

4.  **Open DevTools Immediately**:
    - **CRITICAL**: Do NOT click through any dialogs on the main screen yet.
    - Press `Ctrl + D` on your keyboard to open the DevTools menu immediately after loading.
    - Click on **Battle Debug**.

5.  **Start a Defined Battle**:
    - In the "Defined Battles" section, click on the button for the battle you want to test (e.g., `FIRST_BATTLE`).
    - This will immediately trigger the battle sequence.

6.  **Clear Any Dialogs**:
    - **Now** you can click through any dialogs that appear _inside_ the battle to reach the controls.

7.  **Verify Mechanics**:
    - Verify any mechanics that you are currently interested in based on the task at hand.

8.  **Only take a single screenshot**:
    - Only take a SINGLE screenshot, DO NOT keep taking multiple screenshots when verifying a feature.
