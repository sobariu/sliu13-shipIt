import React, { useState } from 'react';
import { invoke } from '@forge/bridge';
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
  Textfield,
  Label,
  Spinner,
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
    <Box padding="space.200">
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
 * When the user clicks Confirm, it calls the resolver to create a Confluence
 * page immediately using the template for the selected rule type.
 */
const App = () => {
  // Tracks which rule ID the user has currently selected (null = none selected)
  const [selectedRuleId, setSelectedRuleId] = useState(null);

  // The Confluence space key where the page will be created
  const [spaceKey, setSpaceKey] = useState('');

  // Whether the page creation API call is in progress
  const [loading, setLoading] = useState(false);

  // Result of the page creation attempt (success or error)
  const [result, setResult] = useState(null);

  // Look up the full rule object for the selected ID
  const selectedRule = RULES.find((r) => r.id === selectedRuleId) || null;

  // Note: space key is entered manually by the user.
  // Auto-detection via getSpaceKey resolver can be added later if needed.

  /**
   * handleSelect
   *
   * Called when the user clicks "Select" on a rule card.
   * Toggles selection — clicking the already-selected rule deselects it.
   * Also clears any previous result when a new rule is picked.
   */
  const handleSelect = (ruleId) => {
    setSelectedRuleId((prev) => (prev === ruleId ? null : ruleId));
    // Clear previous result when changing selection
    setResult(null);
  };

  /**
   * handleConfirm
   *
   * Called when the user clicks "Confirm". Invokes the resolver to
   * create a Confluence page immediately using the selected rule's template.
   */
  const handleConfirm = async () => {
    if (!selectedRule) return;

    if (!spaceKey.trim()) {
      setResult({ success: false, error: 'Please enter a Confluence space key.' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Call the resolver which creates the Confluence page via REST API
      const response = await invoke('createJournalPage', {
        ruleId: selectedRule.id,
        ruleName: selectedRule.name,
        spaceKey: spaceKey.trim(),
      });
      setResult(response);
    } catch (err) {
      setResult({ success: false, error: `Failed to create page: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack space="space.300">
      {/* Page title */}
      <Heading as="h2">📋 What Have I Done?</Heading>

      <Text>
        Select a journal type, enter your space key, and click Confirm to
        create a new Confluence page instantly using your journal template.
      </Text>

      {/* Space key input */}
      <Stack space="space.050">
        <Label labelFor="spaceKey">Confluence Space Key</Label>
        <Textfield
          id="spaceKey"
          name="spaceKey"
          placeholder="e.g. TEAM"
          value={spaceKey}
          onChange={(e) => setSpaceKey(e.target.value)}
        />
      </Stack>

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

      {/* Confirm button — only shown when a rule is selected */}
      {selectedRule && (
        <Inline space="space.100" alignBlock="center">
          <Button
            appearance="primary"
            onClick={handleConfirm}
            isDisabled={loading}
          >
            {loading ? 'Creating page...' : `✓ Confirm — Create ${selectedRule.name} Page`}
          </Button>
          {loading && <Spinner size="medium" />}
        </Inline>
      )}

      {/* Result message after page creation attempt */}
      {result && (
        <SectionMessage
          appearance={result.success ? 'confirmation' : 'error'}
          title={result.success ? 'Page Created!' : 'Error'}
        >
          <Text>{result.success ? result.message : result.error}</Text>
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
