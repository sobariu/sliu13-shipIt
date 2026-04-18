import Resolver from '@forge/resolver';
import { asApp, route } from '@forge/api';
import { createJournalPageHandler } from './pageCreator.js';

const resolver = new Resolver();

/**
 * createWeeklyJournalAutomation
 *
 * This resolver is called from the macro frontend when the user clicks
 * "Create Weekly Journal Automation". It uses the Confluence Automation
 * REST API to create a scheduled rule that auto-creates a weekly journal
 * page every Monday at 9am.
 *
 * We use asUser() so the rule is created on behalf of the logged-in user,
 * which means their permissions are respected (no need for extra auth checks).
 *
 * @param {object} req - The Forge resolver request object
 * @param {object} req.payload - Data sent from the frontend
 * @param {string} req.payload.spaceKey - The Confluence space key to create pages in
 * @param {string} req.payload.parentPageTitle - Optional title of the parent page
 * @param {string} req.payload.ruleName - Human-readable name for the automation rule
 * @param {object} req.context - Forge context (contains cloudId, spaceKey, etc.)
 */
resolver.define('createWeeklyJournalAutomation', async (req) => {
  const { spaceKey, parentPageTitle, ruleName } = req.payload;

  // Build the automation rule JSON. The structure mirrors what you get when
  // you export a rule from the Confluence Automation UI.
  const automationRule = {
    // The name shown in the Confluence Automation rules list
    name: ruleName || 'Weekly Journal Creator',

    // ENABLED means the rule is active immediately after creation
    state: 'ENABLED',

    // The trigger defines WHEN the rule fires.
    // "confluence:scheduled" fires on a cron schedule.
    trigger: {
      component: {
        // Schema version 1 is the current version for all Confluence automation components
        schemaVersion: 1,
        // Scheduled trigger fires based on a cron expression
        type: 'confluence:scheduled',
        value: {
          // Cron expression: every Monday at 9:00 AM UTC
          // Format: <seconds> <minutes> <hours> <day-of-month> <month> <day-of-week>
          cronExpression: '0 0 9 ? * MON *',
          // Timezone for the schedule
          timezone: 'UTC'
        }
      }
    },

    // Components are the ordered list of actions the rule performs when it fires.
    // Each component has a type that maps to a specific Confluence automation action.
    components: [
      {
        schemaVersion: 1,
        // "confluence:createPage" creates a new Confluence page
        type: 'confluence:createPage',
        value: {
          // The space where the new page will be created
          spaceKey: spaceKey,

          // The title of the new page. {{now.format("YYYY-[W]WW")}} is a
          // Confluence Smart Value that inserts the current week number,
          // e.g. "Weekly Journal 2026-W16"
          title: 'Weekly Journal {{now.format("YYYY-[W]WW")}}',

          // Optional: the title of the parent page to nest this under.
          // If not provided, the page is created at the space root.
          ...(parentPageTitle ? { parentPageTitle } : {}),

          // The body content of the new page, using Confluence storage format.
          // You can put any valid Confluence storage format HTML here.
          content: `<h1>Weekly Journal - Week {{now.format("WW, YYYY")}}</h1>
<h2>Goals this week</h2>
<ul><li><br/></li></ul>
<h2>Progress &amp; Updates</h2>
<p></p>
<h2>Blockers</h2>
<ul><li><br/></li></ul>
<h2>Notes</h2>
<p></p>`
        }
      }
    ]
  };

  try {
    // Make the API call as the app identity. asApp() avoids the OAuth consent
    // popup that asUser() triggers in a macro context. Since this is a
    // single-customer site, using asApp() here is safe and straightforward.
    const response = await asApp().requestConfluence(
      route`/wiki/rest/automation/1.0/rule`,
      {
        method: 'POST',
        headers: {
          // The Confluence automation API expects JSON
          'Content-Type': 'application/json',
          // Accept JSON back so we can read the created rule's ID
          'Accept': 'application/json'
        },
        body: JSON.stringify(automationRule)
      }
    );

    // If the API returned a non-2xx status, surface the error clearly
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Confluence Automation API error:', response.status, errorText);
      return {
        success: false,
        error: `Failed to create automation rule (HTTP ${response.status}): ${errorText}`
      };
    }

    // Parse the created rule from the response
    const createdRule = await response.json();
    console.log('Automation rule created successfully:', createdRule);

    return {
      success: true,
      // Return the rule ID and name so the frontend can display confirmation
      ruleId: createdRule.id,
      ruleName: createdRule.name,
      message: `✅ Automation rule "${createdRule.name}" created! It will create a new weekly journal page every Monday at 9am UTC in space "${spaceKey}".`
    };

  } catch (err) {
    // Catch any network or unexpected errors and return a friendly message
    console.error('Unexpected error creating automation rule:', err);
    return {
      success: false,
      error: `Unexpected error: ${err.message}`
    };
  }
});

/**
 * createJournalPage
 *
 * Creates a new Confluence page pre-filled with real data by:
 * 1. Searching Confluence for pages the current user updated this week
 * 2. Searching Jira for issues the current user worked on this week
 * 3. Building the journal template with that real data inserted
 *
 * @param {object} req.payload.ruleId   - The selected rule ID (e.g. 'weekly-summary')
 * @param {object} req.payload.ruleName - Display name of the rule
 * @param {object} req.payload.spaceKey - The Confluence space key to create the page in
 */
resolver.define('createJournalPage', async (req) => {
  const { ruleName, spaceKey } = req.payload;
  // Delegate to the shared handler used by both the macro and the Rovo Agent action
  return createJournalPageHandler({ ruleName, spaceKey });
});

/**
 * getSpaceKey
 *
 * A helper resolver that returns the current Confluence space key from the
 * Forge macro context. This lets the frontend know which space the macro
 * is installed in, so it can pre-fill the space key in the automation rule.
 */
resolver.define('getSpaceKey', async (req) => {
  // The Forge context object contains information about where the macro is running.
  // For a Confluence macro, req.context.spaceKey is the key of the current space.
  const spaceKey = req.context.extension?.space?.key || null;
  return { spaceKey };
});

export const handler = resolver.getDefinitions();
