import { App, ExpressReceiver, BlockAction } from '@slack/bolt';
import dotenv from 'dotenv';
import { publishHome } from './home/publishHome';
import { openTemplateModal } from './modals/executiveBrief/openTemplateModal';
import { buildInputsModal } from './modals/executiveBrief/openInputsModal';
import { DataSourceOption } from './types';
import { handleExecutiveBriefSubmission } from './modals/executiveBrief/submit';
import { openSettingsModal, handleSettingsSubmission, handleSettingsReset, handleSettingsClearMessages } from './modals/settingsModal';
import { updateUserPreference } from './store/userPrefs';

dotenv.config();

const signingSecret = process.env.SLACK_SIGNING_SECRET;
const botToken = process.env.SLACK_BOT_TOKEN;

if (!signingSecret || !botToken) {
  throw new Error('Missing SLACK_SIGNING_SECRET or SLACK_BOT_TOKEN environment variables.');
}

const receiver = new ExpressReceiver({
  signingSecret,
  endpoints: '/slack/events',
});

receiver.router.get('/healthz', (_req, res) => {
  res.status(200).send('ok');
});

const app = new App({
  token: botToken,
  receiver,
  processBeforeResponse: true,
});

app.event('app_home_opened', async ({ event, client, logger }) => {
  try {
    await publishHome({ client, userId: event.user });
  } catch (error) {
    logger.error('Failed to publish App Home', error);
  }
});

app.action('action_executive_brief', async ({ ack, body, client, logger }) => {
  await ack();
  try {
    await openTemplateModal({
      client,
      triggerId: (body as BlockAction).trigger_id!,
      userId: body.user.id,
    });
  } catch (error) {
    logger.error('Failed to open template modal', error);
  }
});

const disabledActions = ['action_account_insights', 'action_deck_automation', 'action_release_notes'];
disabledActions.forEach((actionId) => {
  app.action(actionId, async ({ ack }) => {
    await ack();
  });
});

app.action('home_view_as_select', async ({ ack, body, client, logger, action }) => {
  await ack();
  try {
    const selectedUser = (action as any).selected_user as string | undefined;
    if (selectedUser) {
      updateUserPreference(body.user.id, { viewAsUserId: selectedUser });
    }
    await publishHome({ client, userId: body.user.id });
  } catch (error) {
    logger.error('Failed to update View As preference', error);
  }
});

app.action('action_settings', async ({ ack, body, client, logger }) => {
  await ack();
  try {
    await openSettingsModal({
      client,
      triggerId: (body as BlockAction).trigger_id!,
      userId: body.user.id,
    });
  } catch (error) {
    logger.error('Failed to open settings modal', error);
  }
});

app.action('settings_reset_action', async ({ ack, body, client, logger }) => {
  await ack();
  try {
    const view = (body as any).view;
    if (!view?.id) {
      return;
    }
    await handleSettingsReset({
      client,
      userId: body.user.id,
      viewId: view.id,
      viewHash: view.hash,
    });
  } catch (error) {
    logger.error('Failed to reset settings', error);
  }
});

app.action('settings_clear_messages', async ({ ack, body, client, logger }) => {
  await ack();
  try {
    const view = (body as any).view;
    if (!view?.id) {
      return;
    }
    await handleSettingsClearMessages({
      client,
      userId: body.user.id,
      viewId: view.id,
      viewHash: view.hash,
    });
  } catch (error) {
    logger.error('Failed to clear messages tab', error);
  }
});

app.view('settings_modal', async ({ ack, body, view, client, logger }) => {
  await ack();
  try {
    const dataSource = view.state.values.data_source?.data_source_action?.selected_option?.value as DataSourceOption;
    const canvasSelection =
      view.state.values.canvas_select?.canvas_select_action?.selected_option || undefined;
    if (dataSource) {
      await handleSettingsSubmission({
        client,
        userId: body.user.id,
        dataSource,
        selectedCanvasOption: canvasSelection,
      });
      await publishHome({ client, userId: body.user.id });
    }
  } catch (error) {
    logger.error('Failed to handle settings submission', error);
  }
});

app.view('executive_brief_template', async ({ ack, view, logger }) => {
  try {
    const metadata = JSON.parse(view.private_metadata || '{}');
    const dataSource = (metadata.dataSource as DataSourceOption) || 'mock';
    let templateId = 'executive_brief';
    templateId =
      view.state.values.template_select?.template_action?.selected_option?.value || 'executive_brief';

    const nextView = buildInputsModal({
      dataSource,
      templateId,
      viewAsUserId: metadata.viewAsUserId,
    });

    await ack({ response_action: 'update', view: nextView });
  } catch (error) {
    logger.error('Failed to progress template modal', error);
    await ack({ response_action: 'clear' });
  }
});

app.view('executive_brief_inputs', handleExecutiveBriefSubmission);

app.error(async (error) => {
  console.error('⚠️ Bolt app error:', error);
});

const port = Number(process.env.PORT) || 3000;

(async () => {
  await app.start(port);
  console.log(`⚡️ Global Sales Insights app is running on port ${port}`);
})();
