'use client';

import { useEffect, useState } from 'react';
import { getSoundManager } from '../lib/sounds';
import type SoundManager from '../lib/sounds';

export function useSounds() {
  const [soundManager, setSoundManager] = useState<SoundManager | null>(null);

  useEffect(() => {
    setSoundManager(getSoundManager());
  }, []);

  return soundManager;
}
