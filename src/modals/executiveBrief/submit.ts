import { DataSourceOption } from '../../types';
import { buildBrief } from '../../services/briefBuilder';
import { deliverBrief, shareExistingCanvas } from '../../services/canvas';
import { getUserPreference, updateUserPreference } from '../../store/userPrefs';
import { getAccountById } from '../../data/mockCustomerData';
import { getCanvasFileById } from '../../services/canvasFiles';
import { WebClient, KnownBlock } from '@slack/web-api';

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
      const account = getAccountById(request.accountId);
      const canvasMeta =
        (await getCanvasFileById(client, undefined, preference.selectedCanvasId)) || undefined;
      const shared = await shareExistingCanvas({
        client,
        userId: body.user.id,
        canvasId: preference.selectedCanvasId,
        canvasTitle: canvasMeta?.title || preference.selectedCanvasTitle,
      });
      if (shared) {
        await sendPrebuiltConfirmation({
          client,
          userId: body.user.id,
          accountName: account?.accountName,
          accountSummary: account?.summary,
          accountHighlights: {
            industry: account?.industry,
            stage: account?.stage,
            pipe: account?.metrics.pipeCoverage,
          },
          canvasTitle: canvasMeta?.title || preference.selectedCanvasTitle,
          canvasLink: canvasMeta?.permalink,
        });
      }
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

interface PrebuiltConfirmationArgs {
  client: WebClient;
  userId: string;
  accountName?: string;
  accountSummary?: string;
  accountHighlights?: {
    industry?: string;
    stage?: string;
    pipe?: string;
  };
  canvasTitle?: string;
  canvasLink?: string;
}

async function sendPrebuiltConfirmation({
  client,
  userId,
  accountName,
  accountSummary,
  accountHighlights,
  canvasTitle,
  canvasLink,
}: PrebuiltConfirmationArgs) {
  const blocks: KnownBlock[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Executive Brief requested' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `You have requested a GSI generated Executive Brief${
          accountName ? ` for *${accountName}*` : ''
        }.`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Please allow a few moments while it is generated. ⏳ You will receive another message in this window when it is ready for your use.',
      },
    },
  ];

  if (canvasLink || canvasTitle) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: canvasLink
          ? `<${canvasLink}|${canvasTitle || 'View Canvas'}>`
          : `Canvas: *${canvasTitle}*`,
      },
    });
  }

  if (accountSummary) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: accountSummary.slice(0, 280),
        },
      ],
    });
  }

  if (
    accountHighlights?.industry ||
    accountHighlights?.stage ||
    accountHighlights?.pipe
  ) {
    const fields: { type: 'mrkdwn'; text: string }[] = [];
    if (accountHighlights.industry) {
      fields.push({ type: 'mrkdwn', text: `*Industry*\n${accountHighlights.industry}` });
    }
    if (accountHighlights.stage) {
      fields.push({ type: 'mrkdwn', text: `*Stage*\n${accountHighlights.stage}` });
    }
    if (accountHighlights.pipe) {
      fields.push({ type: 'mrkdwn', text: `*Pipeline*\n${accountHighlights.pipe}` });
    }
    blocks.push({
      type: 'section',
      fields,
    });
  }

  await client.chat.postMessage({
    channel: userId,
    text: 'Executive Brief requested',
    blocks,
  });
}
