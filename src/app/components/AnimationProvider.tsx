'use client';

import React from 'react';
import { getAllAnimationsCss } from '@/utils/animationUtils';

export default function AnimationProvider() {
  const css = getAllAnimationsCss();

  return (
    <style id="dynamic-animations" dangerouslySetInnerHTML={{ __html: css }} />
  );
}
