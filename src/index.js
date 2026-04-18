export { handler } from './resolvers';
import { createJournalPageHandler } from './resolvers/pageCreator.js';

/**
 * actionHandler
 *
 * This is the entry point for the Rovo Agent action. When the Rovo Agent
 * in Atlassian Studio decides to call the "create-journal-page" action,
 * it invokes this function with the parameters defined in manifest.yml.
 *
 * The agent provides (via manifest.yml inputs schema):
 *   - spaceKey: The Confluence space key to create the page in
 *   - ruleType: One of "standup", "weekly-summary", "monthly-summary", "apex"
 *
 * This handler delegates to createJournalPageHandler — the same shared logic
 * used by the macro resolver — so both entrypoints produce identical pages.
 *
 * @param {object} payload - The action inputs from the Rovo Agent
 */
export async function actionHandler({ payload }) {
  const { spaceKey, ruleType } = payload;

  // Map the ruleType identifier to a human-readable name for the page title
  const ruleNameMap = {
    'standup': 'Standup',
    'weekly-summary': 'Weekly Summary',
    'monthly-summary': 'Monthly Summary',
    'apex': 'Apex',
  };

  const ruleName = ruleNameMap[ruleType] || ruleType;

  try {
    const result = await createJournalPageHandler({ ruleName, spaceKey });

    if (result.success) {
      // Return a message the Rovo Agent can relay back to the user in chat
      return {
        success: true,
        message: result.message,
        pageUrl: result.pageUrl,
      };
    } else {
      return {
        success: false,
        message: result.error,
      };
    }
  } catch (err) {
    return {
      success: false,
      message: `Failed to create journal page: ${err.message}`,
    };
  }
}
