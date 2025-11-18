import { DataSourceOption } from '../../types';
import { buildBrief } from '../../services/briefBuilder';
import { deliverBrief, shareExistingCanvas } from '../../services/canvas';
import { getUserPreference, updateUserPreference } from '../../store/userPrefs';

export async function handleExecutiveBriefSubmission({
  ack,
  body,
  client,
  logger,
  view,
}: any) {
  await ack();

  try {
    const request = parseSubmission(view, body.user.id);
    updateUserPreference(body.user.id, { viewAsUserId: request.viewAsUserId });

    if (request.dataSource === 'prebuilt') {
      const preference = getUserPreference(body.user.id);
      if (!preference.selectedCanvasId) {
        await client.chat.postMessage({
          channel: body.user.id,
          text: 'Prebuilt mode needs a Canvas selected in Settings. Pick one and try again.',
        });
        return;
      }
      await shareExistingCanvas({
        client,
        userId: body.user.id,
        canvasId: preference.selectedCanvasId,
        canvasTitle: preference.selectedCanvasTitle,
      });
      return;
    }

    const brief = await buildBrief(request);
    await deliverBrief({ client, userId: body.user.id, brief });
  } catch (error) {
    logger?.error?.('Failed to generate brief', error);
    await client.chat.postMessage({
      channel: body.user.id,
      text:
        error instanceof Error
          ? `I couldn't create that brief: ${error.message}`
          : 'Something went wrong creating your brief. Please try again.',
    });
  }
}

function parseSubmission(view: any, requesterId: string) {
  const metadata = JSON.parse(view.private_metadata || '{}');
  const dataSource = (metadata.dataSource as DataSourceOption) || 'mock';
  const templateId = (metadata.templateId as string) || 'executive_brief';

  const viewAsUserId = view.state.values.view_as?.view_as_action?.selected_user || undefined;
  const accountId = view.state.values.account_select?.account_action?.selected_option?.value;

  return {
    templateId,
    dataSource,
    accountId,
    viewAsUserId,
    requesterId,
  };
}
