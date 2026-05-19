import React from 'react';

import { FeatureScreen } from '@/screens/common/FeatureScreen';

export function SettingsScreen() {
  return (
    <FeatureScreen
      title="Settings"
      subtitle="Notification preferences, language, privacy, and account controls."
      note="This screen is intentionally simple now and will expand cleanly with data-driven settings rows."
      actionLabel="Update Preferences"
    />
  );
}
