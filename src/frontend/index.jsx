import React from 'react';
import ForgeReconciler, {
  Text,
  Stack,
  Inline,
  Box,
  Strong,
  Lozenge,
  SectionMessage,
  useConfig,
} from '@forge/react';

/**
 * App — Macro View
 *
 * This is the view-mode render of the macro — what gets shown on the
 * Confluence page after the user has configured and inserted it.
 *
 * It reads the saved macro config (set in config.jsx via macroConfig.save())
 * and displays a summary card showing:
 *   - The selected journal type (name, icon, schedule)
 *   - Whether automation is enabled
 *   - The confirmation message from the resolver
 *
 * If no config has been saved yet (e.g. the macro was just inserted and the
 * config panel was closed without confirming), it shows a prompt to configure.
 */
const App = () => {
  // useConfig() returns the config object saved by macroConfig.save() in config.jsx.
  // It will be null/undefined until the user has confirmed their selection.
  const config = useConfig();

  // If there's no saved config, show a helpful placeholder
  if (!config || !config.ruleId) {
    return (
      <Box padding="space.200" backgroundColor="color.background.neutral">
        <Text>📋 Click the macro to configure your work journal.</Text>
      </Box>
    );
  }

  return (
    <Box padding="space.200" backgroundColor="color.background.selected">
      <Stack space="space.150">
        {/* Journal type heading with icon and frequency badge */}
        <Inline space="space.100" alignBlock="center">
          <Text><Strong>{config.ruleIcon} {config.ruleName}</Strong></Text>
          <Lozenge appearance="success">{config.ruleSchedule}</Lozenge>
          {config.isAutomated && (
            <Lozenge appearance="inprogress">Automated</Lozenge>
          )}
        </Inline>

        {/* Confirmation message from the resolver */}
        {config.message ? (
          <SectionMessage appearance="confirmation" title="Journal set up!">
            <Text>{config.message}</Text>
          </SectionMessage>
        ) : (
          <Text>
            Your <Strong>{config.ruleName}</Strong> work journal has been set up
            {config.isAutomated ? ' with automation.' : '.'}
          </Text>
        )}
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
