---
trigger: always_on
---

# Styling and Layout Policy for Cosmoids Web

When styling components, layouts, or screens in this repository, you MUST strictly adhere to the following rules:

1. **Base Sizing (Mobile Landscape First)**:
   - The application natively supports **mobile landscape** as its default, base styling. 
   - All standard class names (e.g., margins, padding, grids, dimensions, fonts) must be designed to fit and look exceptional in a landscape aspect ratio.
   
2. **Portrait Mode**:
   - **Portrait mode is NOT supported**. 
   - Do not spend effort designing or adapting layouts specifically for portrait viewports. Keep designs optimized for a landscape-wide perspective.

3. **Desktop Targeting (`lg:`)**:
   - Target desktop viewports exclusively by layering enhancements using the Tailwind **`lg:`** prefix.
   - Do not use intermediate breakpoint modifiers (like `md:`, `sm:`, etc.) unless absolutely necessary to bridge landscape phones and larger screens.

4. **Avoiding Overflow**:
   - Ensure vertical heights are constrained appropriately (e.g., compact card heights, small padding, restricted image heights) so that the UI fits perfectly within mobile landscape screens without requiring scrollbars or causing vertical cutoffs.
