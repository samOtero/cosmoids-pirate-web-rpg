import React from 'react';
import type { Preview } from '@storybook/nextjs-vite';
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },

    backgrounds: {
      default: 'cosmoids-dark',
      values: [
        {
          name: 'cosmoids-dark',
          value: '#0d2b45',
        },
        {
          name: 'light',
          value: '#f4f4f4',
        },
      ],
    },

    viewport: {
      viewports: {
        mobileLandscape: {
          name: "Mobile Landscape",
          styles: {
            width: "896px",
            height: "414px",
          },
          type: "mobile",
        },
        desktop: {
          name: "Desktop Large",
          styles: {
            width: "1280px",
            height: "800px",
          },
          type: "desktop",
        },
      },
      defaultViewport: "mobileLandscape",
    },
  },
  decorators: [
    (Story) => (
      <div className="antialiased text-[#f4e4bc] p-4 min-h-screen flex items-center justify-center font-sans">
        <Story />
      </div>
    ),
  ],
};

export default preview;

