import { BriefContent, BriefRequest, BriefSection } from '../types';
import { getAccountById } from '../data/mockCustomerData';
import { getPrebuiltById, loadPrebuiltMarkdown } from '../prebuilt';
import { generateLLMBrief } from './llm';

export async function buildBrief(request: BriefRequest): Promise<BriefContent> {
  if (request.dataSource === 'prebuilt') {
    if (!request.prebuiltId) {
      throw new Error('Please choose a prebuilt Canvas.');
    }
    const meta = getPrebuiltById(request.prebuiltId);
    if (!meta) {
      throw new Error('Prebuilt Canvas not found.');
    }
    const markdown = loadPrebuiltMarkdown(request.prebuiltId);
    return {
      title: meta.label,
      subtitle: 'Prebuilt Canvas',
      templateId: request.templateId,
      dataSource: request.dataSource,
      markdown,
      sections: [],
      prebuiltId: request.prebuiltId,
    };
  }

  const account = getAccountById(request.accountId);
  if (!account) {
    throw new Error('Account details are required to generate this brief.');
  }

  if (request.dataSource === 'llm') {
    const llmMarkdown = await generateLLMBrief({
      account,
      templateId: request.templateId,
      personaUserId: request.viewAsUserId,
    });

    return {
      title: `${account.accountName} Executive Brief`,
      subtitle: account.companyName,
      templateId: request.templateId,
      dataSource: request.dataSource,
      markdown: llmMarkdown,
      sections: [
        {
          title: 'Summary',
          body: [llmMarkdown],
        },
      ],
    };
  }

  const sections = buildMockSections(account);
  return {
    title: `${account.accountName} Executive Brief`,
    subtitle: `${account.companyName} • ${account.aov} AOV`,
    templateId: request.templateId,
    dataSource: request.dataSource,
    sections,
    markdown: sectionsToMarkdown(sections, account.accountName),
  };
}

function buildMockSections(account: ReturnType<typeof getAccountById>): BriefSection[] {
  if (!account) {
    return [];
  }

  return [
    {
      title: 'Customer Snapshot',
      body: [account.summary],
      fields: [
        { label: 'Industry', value: account.industry },
        { label: 'Stage', value: account.stage },
        { label: 'FY End', value: account.fiscalYearEnd },
      ],
    },
    {
      title: 'Carrier Relationship',
      body: [account.carrierRelationship],
    },
    {
      title: 'Metrics Pulse',
      fields: [
        { label: 'Pipe Coverage', value: account.metrics.pipeCoverage },
        { label: 'ACV YoY', value: account.metrics.acvYoY },
        { label: 'Adoption', value: account.metrics.productAdoption },
        { label: 'Support', value: account.metrics.supportHealth },
        { label: 'CSAT', value: account.metrics.csat },
      ],
    },
    {
      title: 'Goals & Risks',
      body: [
        `*Goals*\n• ${account.goals.join('\n• ')}`,
        `*Risks*\n• ${account.risks.join('\n• ')}`,
      ],
    },
    {
      title: 'Key Contacts',
      body: account.contacts.map((contact) => `• *${contact.name}* — ${contact.role}${contact.notes ? ` (${contact.notes})` : ''}`),
    },
    {
      title: 'Opportunities & Next Steps',
      body: account.opportunities.map(
        (oppty) => `• *${oppty.name}* · ${oppty.value}\nNext Step: ${oppty.nextStep}`
      ),
    },
  ];
}

function sectionsToMarkdown(sections: BriefSection[], accountName: string): string {
  const lines = [`# ${accountName} Executive Meeting Brief`, ''];
  sections.forEach((section) => {
    lines.push(`## ${section.title}`);
    if (section.body) {
      section.body.forEach((line) => lines.push(line));
    }
    if (section.fields) {
      section.fields.forEach((field) => lines.push(`- **${field.label}:** ${field.value}`));
    }
    lines.push('');
  });
  return lines.join('\n');
}
