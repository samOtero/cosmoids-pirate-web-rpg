---
description: Verify the web application state by running the dev server and checking with a browser agent
---

1. Start the development server using `npm run dev` in the background. Make sure to capture the Command ID so we can stop it later.
2. Wait for a few seconds to ensure the server is up and running (e.g., waiting for "Ready in" or just a fixed delay of 5-10 seconds).
3. Use the `browser_subagent` to navigate to `http://localhost:3000`.
   - **TaskName**: "Verifying App State"
   - **Task**: "Navigate to http://localhost:3000 and verify that the page loads fast and looks correct. Check for any obvious errors on the page. Take a screenshot of the homepage."
   - **RecordingName**: "verification_check"
4. After the subagent returns, terminate the development server using the Command ID from step 1.
