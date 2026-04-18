import React, { useState } from 'react';
import ForgeReconciler, {
  Text,
  Button,
  Stack,
  Heading,
  SectionMessage,
  Inline,
  Box,
  Strong,
  Lozenge,
} from '@forge/react';

/**
 * The 4 automation rules the user can pick between.
 * Each entry has a display name, a short description of when it runs,
 * and a lozenge appearance for visual distinction.
 *
 * To update these rules, just edit the RULES array below.
 */
const RULES = [
  {
    // Unique key used internally to track which rule is selected
    id: 'standup',
    // Display name shown in the UI
    name: 'Standup',
    // Short description of what this rule does / when it runs
    description: 'Creates a daily standup page each morning to capture updates.',
    // Schedule label shown as a badge
    schedule: 'Daily',
    // Lozenge colour: default | success | removed | inprogress | new | moved
    lozengeAppearance: 'inprogress',
    // Emoji icon for visual flair
    icon: '☀️',
  },
  {
    id: 'weekly-summary',
    name: 'Weekly Summary',
    description: 'Creates a weekly summary page every Monday to recap the week.',
    schedule: 'Weekly',
    lozengeAppearance: 'new',
    icon: '📅',
  },
  {
    id: 'monthly-summary',
    name: 'Monthly Summary',
    description: 'Creates a monthly summary page on the 1st of each month.',
    schedule: 'Monthly',
    lozengeAppearance: 'moved',
    icon: '📆',
  },
  {
    id: 'apex',
    name: 'Apex',
    description: 'Creates a quarterly apex review page for high-level planning.',
    schedule: 'Quarterly',
    lozengeAppearance: 'success',
    icon: '🏔️',
  },
];

/**
 * RuleCard
 *
 * Renders a single selectable automation rule card.
 * Highlights with a confirmation SectionMessage when selected.
 *
 * @param {object} props
 * @param {object} props.rule - The rule definition from the RULES array
 * @param {boolean} props.isSelected - Whether this card is currently selected
 * @param {function} props.onSelect - Callback when the user clicks "Select"
 */
const RuleCard = ({ rule, isSelected, onSelect }) => {
  return (
    <Box
      padding="space.200"
      backgroundColor={isSelected ? 'color.background.selected' : 'color.background.neutral'}
    >
      <Stack space="space.100">
        {/* Rule header: icon + name + schedule badge */}
        <Inline space="space.100" alignBlock="center">
          <Text><Strong>{rule.icon} {rule.name}</Strong></Text>
          {/* Lozenge shows the schedule frequency at a glance */}
          <Lozenge appearance={rule.lozengeAppearance}>{rule.schedule}</Lozenge>
        </Inline>

        {/* Rule description */}
        <Text>{rule.description}</Text>

        {/* Select button — changes to "Selected" when active */}
        <Button
          appearance={isSelected ? 'primary' : 'default'}
          onClick={() => onSelect(rule.id)}
        >
          {isSelected ? '✓ Selected' : 'Select'}
        </Button>
      </Stack>
    </Box>
  );
};

/**
 * App
 *
 * The main macro UI. Displays the 4 automation rules as selectable cards.
 * When the user selects one, it shows a confirmation message with the
 * selected rule's name and schedule.
 */
const App = () => {
  // Tracks which rule ID the user has currently selected (null = none selected)
  const [selectedRuleId, setSelectedRuleId] = useState(null);

  // Look up the full rule object for the selected ID
  const selectedRule = RULES.find((r) => r.id === selectedRuleId) || null;

  /**
   * handleSelect
   *
   * Called when the user clicks "Select" on a rule card.
   * If the user clicks the already-selected rule, deselect it (toggle).
   *
   * @param {string} ruleId - The ID of the rule that was clicked
   */
  const handleSelect = (ruleId) => {
    // Toggle: clicking the selected rule again deselects it
    setSelectedRuleId((prev) => (prev === ruleId ? null : ruleId));
  };

  return (
    <Stack space="space.300">
      {/* Page title */}
      <Heading as="h2">📋 Choose an Automation Rule</Heading>

      <Text>
        Select the automation rule that matches how often you want your
        Confluence pages to be created automatically.
      </Text>

      {/* Render one card per rule */}
      <Stack space="space.150">
        {RULES.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            isSelected={selectedRuleId === rule.id}
            onSelect={handleSelect}
          />
        ))}
      </Stack>

      {/* Confirmation message shown when a rule is selected */}
      {selectedRule && (
        <SectionMessage
          appearance="confirmation"
          title={`${selectedRule.icon} ${selectedRule.name} selected`}
        >
          <Text>
            You have selected the <Strong>{selectedRule.name}</Strong> rule.
            This will create a Confluence page on a <Strong>{selectedRule.schedule}</Strong> schedule.
          </Text>
        </SectionMessage>
      )}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
