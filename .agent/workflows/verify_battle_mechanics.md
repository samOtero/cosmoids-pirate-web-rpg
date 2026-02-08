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
    - If the profile is new, complete the initial setup until you are on the Map or in a state where you can access DevTools (usually available everywhere).

4.  **Open DevTools**:
    - Press `Ctrl + D` on your keyboard to open the DevTools menu.
    - Click on **Battle Debug**.

5.  **Start a Defined Battle**:
    - In the "Defined Battles" section, click on the button for the battle you want to test (e.g., `FIRST_BATTLE`).
    - This will immediately trigger the battle sequence.

6.  **Clear Any Dialogs**:
    - During battles there might be dialogs that show up, make sure you press to continue in the dialog button before resuming the battle.

7.  **Verify Mechanics**:
    - **Energy Consumption**: Attack and watch the yellow energy bar decrease.
    - **Low Energy**: Continue attacking until energy is 0. Verify that the "Refuse to Attack" or "Weak Attack" behaviors occur.
    - **Enemy Behavior**: Observe if the enemy also follows energy rules.
