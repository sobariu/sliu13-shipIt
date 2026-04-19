import React, { useState, useEffect } from 'react';
import ForgeReconciler, {
  Text,
  Button,
  ButtonGroup,
  Stack,
  Heading,
  SectionMessage,
  Inline,
  Box,
  Strong,
  Lozenge,
  Toggle,
  Label,
  Spinner,
  Select,
  Textfield,
  RequiredAsterisk,
} from '@forge/react';
import { invoke, macroConfig } from '@forge/bridge';

/**
 * The 4 work journal types the user can pick from.
 *
 * This config panel opens as a dialog when the user types /WhatHaveIDone
 * and selects the macro from the slash-command menu. After the user clicks
 * Confirm, the macro is inserted on the page and index.jsx renders the summary.
 */
const RULES = [
  {
    id: 'standup',
    name: 'Standup',
    description: 'Creates a daily standup page each morning to capture updates.',
    schedule: 'Daily',
    automationDescription: 'Page will be automatically created every morning at 9am.',
    lozengeAppearance: 'inprogress',
    icon: '☀️',
  },
  {
    id: 'weekly-summary',
    name: 'Weekly Summary',
    description: 'Creates a weekly summary page every Monday to recap the week.',
    schedule: 'Weekly',
    automationDescription: 'Page will be automatically created every Monday at 9am.',
    lozengeAppearance: 'new',
    icon: '📅',
  },
  {
    id: 'monthly-summary',
    name: 'Monthly Summary',
    description: 'Creates a monthly summary page on the 1st of each month.',
    schedule: 'Monthly',
    automationDescription: 'Page will be automatically created on the 1st of each month.',
    lozengeAppearance: 'moved',
    icon: '🗓️',
  },
  {
    id: 'apex',
    name: 'Apex',
    description: 'Creates a quarterly apex review page for high-level planning.',
    schedule: 'Quarterly',
    automationDescription: 'Page will be automatically created at the start of each quarter.',
    lozengeAppearance: 'success',
    icon: '🏔️',
  },
];

/**
 * RuleCard
 *
 * A selectable card for one journal type.
 * Highlighted when selected.
 */
const RuleCard = ({ rule, isSelected, onSelect }) => (
  <Box
    padding="space.200"
    backgroundColor={isSelected ? 'color.background.selected' : 'color.background.neutral'}
  >
    <Stack space="space.100">
      <Inline space="space.100" alignBlock="center">
        <Text><Strong>{rule.icon} {rule.name}</Strong></Text>
        <Lozenge appearance={rule.lozengeAppearance}>{rule.schedule}</Lozenge>
      </Inline>
      <Text>{rule.description}</Text>
      <Button
        appearance={isSelected ? 'primary' : 'default'}
        onClick={() => onSelect(rule.id)}
      >
        {isSelected ? '✓ Selected' : 'Select'}
      </Button>
    </Stack>
  </Box>
);

/**
 * Config
 *
 * The macro configuration panel. This opens automatically when the user
 * picks /WhatHaveIDone from the Confluence slash-command menu.
 *
 * On Confirm:
 *   - Calls the resolver to create the journal page or automation rule
 *   - Saves the selection to macro config via macroConfig.save() so that
 *     index.jsx (the view) can display a summary of what was set up
 *   - Closes the config panel
 *
 * On Cancel:
 *   - Closes the config panel without inserting the macro
 */
const Config = () => {
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  const [isAutomated, setIsAutomated] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Space picker state
  // spaces is an array of { label, value } objects for the Select component
  const [spaces, setSpaces] = useState([]);
  const [spacesLoading, setSpacesLoading] = useState(true);
  // selectedSpace holds the full { label, value } object that Select returns onChange
  const [selectedSpace, setSelectedSpace] = useState(null);

  // Page title input state — defaults to empty, user can customise
  const [pageTitle, setPageTitle] = useState('');

  const selectedRule = RULES.find((r) => r.id === selectedRuleId) || null;

  /**
   * Dummy spaces for development — replace with the getSpaces resolver call
   * once the backend is wired up.
   */
  const DUMMY_SPACES = [
    { label: 'Winnie Tan', value: 'winnietan' },
    { label: 'Jira - AI Foundations', value: 'JSMGS' },
    { label: 'ShipIt', value: 'SHIPIT' },
  ];

  useEffect(() => {
    // Use dummy spaces directly instead of fetching from the API
    setSpaces(DUMMY_SPACES);
    setSpacesLoading(false);
  }, []);

  /**
   * When a rule is selected, auto-populate the page title with the rule name.
   * This always updates so switching between rules keeps the title in sync.
   * If the user has already typed a custom title, it gets replaced — they can
   * edit it afterwards if they want something different.
   */
  const handleSelect = (ruleId) => {
    const rule = RULES.find((r) => r.id === ruleId);
    // Toggle off if already selected, otherwise select the new rule
    const newRuleId = selectedRuleId === ruleId ? null : ruleId;
    setSelectedRuleId(newRuleId);
    // Always sync the title to the selected rule name (or clear if deselected)
    setPageTitle(newRuleId && rule ? rule.name : '');
    setStatus('idle');
    setFeedbackMessage('');
  };

  const handleToggleAutomation = () => {
    setIsAutomated((prev) => !prev);
    setStatus('idle');
    setFeedbackMessage('');
  };

  /**
   * handleConfirm
   *
   * 1. Calls the backend resolver to create the page or automation rule.
   * 2. On success, saves the config (ruleId, ruleName, isAutomated) to the
   *    macro so that index.jsx can render a summary view on the page.
   * 3. Closes the config panel via macroConfig.save().
   */
  const handleConfirm = async () => {
    if (!selectedRule) return;

    setStatus('loading');
    setFeedbackMessage('');

    try {
      let result;

      if (isAutomated) {
        result = await invoke('createWeeklyJournalAutomation', {
          ruleId: selectedRule.id,
          ruleName: `${selectedRule.name} — Auto Journal`,
          spaceKey: selectedSpace.value,
          pageTitle: pageTitle.trim(),
        });
      } else {
        result = await invoke('createJournalPage', {
          ruleId: selectedRule.id,
          ruleName: selectedRule.name,
          spaceKey: selectedSpace.value,
          pageTitle: pageTitle.trim(),
        });
      }

      if (result.success) {
        // Save the selected config to the macro so index.jsx can show a summary.
        // macroConfig.save() also closes the config panel automatically.
        await macroConfig.save({
          ruleId: selectedRule.id,
          ruleName: selectedRule.name,
          ruleSchedule: selectedRule.schedule,
          ruleIcon: selectedRule.icon,
          isAutomated,
          message: result.message || '',
        });
      } else {
        setStatus('error');
        setFeedbackMessage(result.error || '❌ Something went wrong. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setFeedbackMessage(`❌ Unexpected error: ${err.message}`);
    }
  };

  /**
   * handleCancel
   *
   * Closes the config panel without inserting the macro onto the page.
   * macroConfig.cancel() signals to Confluence to abort the insertion.
   */
  const handleCancel = () => {
    macroConfig.cancel();
  };

  // Confirm requires a rule, a space, and a non-empty title
  const canConfirm = selectedRule !== null && selectedSpace !== null && pageTitle.trim() !== '' && status !== 'loading';

  return (
    <Stack space="space.300">
      {/* ── Title ── */}
      <Heading as="h2">What Have I Done? 🤔💭📋</Heading>
      <Text>
        Select the summary that will show all your progress from Jira, Confluence,
        Bitbucket, Slack, Google Calendar, and more!
      </Text>

      {/* ── Journal type cards ── */}
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

      {/* ── Space picker ── */}
      {/*
        Fetches all spaces the user has access to on mount and pre-selects
        the current space. The user can change it via the dropdown.
      */}
      <Stack space="space.100">
        <Label labelFor="space-select">Confluence Space <RequiredAsterisk /></Label>
        {spacesLoading ? (
          <Inline space="space.100" alignBlock="center">
            <Spinner size="small" label="Loading spaces..." />
            <Text>Loading spaces…</Text>
          </Inline>
        ) : (
          <Select
            inputId="space-select"
            options={spaces}
            value={selectedSpace}
            onChange={(option) => setSelectedSpace(option)}
            placeholder="Select a space…"
          />
        )}
      </Stack>

      {/* ── Page title input ── */}
      {/*
        The user can type a custom title for their journal page.
        When they select a journal type above, the title is auto-filled
        with the rule name as a starting point.
      */}
      <Stack space="space.100">
        <Label labelFor="page-title-input">Page Title <RequiredAsterisk /></Label>
        <Textfield
          id="page-title-input"
          placeholder="e.g. My Weekly Journal"
          value={pageTitle}
          onChange={(e) => setPageTitle(e.target.value)}
        />
      </Stack>

      {/* ── Automated Page toggle ── */}
      <Box padding="space.200" backgroundColor="color.background.discovery">
        <Stack space="space.100">
          <Inline space="space.150" alignBlock="center" spread="space-between">
            <Label labelFor="automated-page-toggle">
              <Strong>⚡ Make this an automated page</Strong>
            </Label>
            <Toggle
              id="automated-page-toggle"
              isChecked={isAutomated}
              onChange={handleToggleAutomation}
            />
          </Inline>

          {isAutomated ? (
            <SectionMessage appearance="information" title="Automation enabled">
              <Text>
                {selectedRule
                  ? selectedRule.automationDescription
                  : 'Select a journal type above to see how often it will run.'}
                {' '}Confluence Automation will handle this for you automatically.
              </Text>
            </SectionMessage>
          ) : (
            <Text>
              Turn this on to have Confluence automatically create this journal page
              on a recurring schedule based on the frequency you select.
            </Text>
          )}
        </Stack>
      </Box>

      {/* ── Selection summary ── */}
      {selectedRule && status === 'idle' && (
        <Box padding="space.200" backgroundColor="color.background.success">
          <Stack space="space.100">
            <Text><Strong>{selectedRule.icon} {selectedRule.name} selected</Strong></Text>
            <Text>
              You have selected the {selectedRule.name} journal ({selectedRule.schedule}).
              {isAutomated
                ? ` Automation is ON — ${selectedRule.automationDescription}`
                : ' Automation is OFF — a single page will be created now.'}
            </Text>
          </Stack>
        </Box>
      )}

      {/* ── Error feedback ── */}
      {status === 'error' && (
        <SectionMessage appearance="error" title="Something went wrong">
          <Text>{feedbackMessage}</Text>
        </SectionMessage>
      )}

      {/* ── Confirm + Cancel buttons ── */}
      <Inline space="space.100" alignBlock="center" alignInline="end">
        {status === 'loading' && <Spinner size="small" label="Creating journal..." />}
        <ButtonGroup>
          <Button
            appearance="primary"
            isDisabled={!canConfirm}
            onClick={handleConfirm}
          >
            {status === 'loading' ? 'Creating…' : 'Confirm'}
          </Button>
          <Button appearance="subtle" onClick={handleCancel}>
            Cancel
          </Button>
        </ButtonGroup>
      </Inline>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <Config />
  </React.StrictMode>
);
