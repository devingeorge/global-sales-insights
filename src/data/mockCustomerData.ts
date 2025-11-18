import { PlainTextOption } from '@slack/types';
export interface AccountRecord {
  id: string;
  accountName: string;
  companyName: string;
  localName: string;
  aov: string;
  industry: string;
  hq: string;
  stage: string;
  fiscalYearEnd: string;
  summary: string;
  carrierRelationship: string;
  metrics: {
    pipeCoverage: string;
    acvYoY: string;
    productAdoption: string;
    supportHealth: string;
    csat: string;
  };
  goals: string[];
  risks: string[];
  contacts: { name: string; role: string; notes?: string }[];
  opportunities: { name: string; value: string; nextStep: string }[];
}

export const accounts: AccountRecord[] = [
  {
    id: 'acc-supercell',
    accountName: 'Supercell Games - NA',
    companyName: 'Supercell',
    localName: 'North America Gaming',
    aov: '$2.4M',
    industry: 'Media & Entertainment',
    hq: 'Helsinki, FI',
    stage: 'Strategic',
    fiscalYearEnd: 'December',
    summary:
      'Supercell is expanding its go-to-market motion for Clash of Clans esports partnerships and needs deeper visibility into carrier-backed subscription bundles.',
    carrierRelationship:
      'Carrier partner: BlueSky Wireless since 2020. Joint offers across prepaid gaming bundles with 120k monthly active subscribers. Renewals due in Q2 FY26.',
    metrics: {
      pipeCoverage: '3.4x coverage vs. FY25 plan',
      acvYoY: '+29% YoY ACV growth',
      productAdoption: '89% adoption of Data Cloud + Tableau Pulse pilot',
      supportHealth: '3 Sev-2 cases open (all mitigated)',
      csat: '4.7 / 5 CSAT trailing 3 months'
    },
    goals: [
      'Launch gamer loyalty program with carrier bundle in Q1 FY25',
      'Consolidate analytics stack onto Customer 360 + Slack workflows'
    ],
    risks: [
      'Gaming ad market volatility could compress marketing budgets',
      'Carrier negotiating for larger MDF offsets if MAU goals missed'
    ],
    contacts: [
      { name: 'Priya Narayanan', role: 'VP, Global Partnerships', notes: 'Executive sponsor for carrier initiative' },
      { name: 'Evan Chang', role: 'Director, Growth Operations', notes: 'Key power user of Slack automation' }
    ],
    opportunities: [
      { name: 'Slack Workflow Automation Expansion', value: '$1.2M', nextStep: 'Exec alignment workshop on Dec 5' },
      { name: 'Carrier Loyalty Blueprint', value: '$650k', nextStep: 'Finalize value hypothesis deck' }
    ]
  },
  {
    id: 'acc-northwind',
    accountName: 'Northwind Logistics',
    companyName: 'Northwind Group',
    localName: 'Supply Chain HQ',
    aov: '$1.1M',
    industry: 'Transportation & Logistics',
    hq: 'Austin, TX',
    stage: 'Growth',
    fiscalYearEnd: 'March',
    summary:
      'Modernizing dispatch operations and predictive maintenance workflows with real-time telematics streaming into Slack + Customer 360. Needs field-ready executive briefings.',
    carrierRelationship:
      'Carrier partner: Velocity Mobile since 2018. Co-developing edge IoT roadmap with 5G fleet coverage expansion.',
    metrics: {
      pipeCoverage: '2.1x coverage vs. FY25 plan',
      acvYoY: '+18% YoY ACV growth',
      productAdoption: '56% adoption of Field Service Lightning mobile app',
      supportHealth: 'One Sev-1 outage in Oct (resolved)',
      csat: '4.2 / 5 partner CSAT'
    },
    goals: [
      'Reduce truck roll costs by 9% via automation',
      'Launch carrier-backed predictive maintenance offers in EU region'
    ],
    risks: [
      'IT talent gap slowing mobile rollouts',
      'Macro freight softness reduces discretionary spend'
    ],
    contacts: [
      { name: 'Sandra Martinez', role: 'COO', notes: 'Executive sponsor for modernization program' },
      { name: 'Marcus Lin', role: 'Sr. Director, Fleet Ops', notes: 'Voice of the user for dispatch team' }
    ],
    opportunities: [
      { name: 'IoT Dispatch Automation', value: '$450k', nextStep: 'Joint demo with Velocity Mobile' },
      { name: 'Field Service Lightning Seats', value: '$300k', nextStep: 'Finalize legal and security review' }
    ]
  },
  {
    id: 'acc-contoso',
    accountName: 'Contoso Retail APAC',
    companyName: 'Contoso Retail',
    localName: 'APAC HQ',
    aov: '$3.8M',
    industry: 'Retail & Consumer Goods',
    hq: 'Singapore',
    stage: 'Priority Global',
    fiscalYearEnd: 'June',
    summary:
      'Contoso is consolidating loyalty, service, and marketing data to create a cross-carrier shopper program across APAC mega cities.',
    carrierRelationship:
      'Carrier partner: Horizon Mobile across SG/HK/AU. Running co-funded media pilots tied to loyalty tiers.',
    metrics: {
      pipeCoverage: '4.0x coverage vs. FY25 plan',
      acvYoY: '+41% YoY ACV growth',
      productAdoption: '74% adoption of Einstein Copilot for Retail',
      supportHealth: 'Zero Sev-1 incidents in past 6 months',
      csat: '4.9 / 5 executive CSAT'
    },
    goals: [
      'Stand up unified loyalty dashboard for 12 markets',
      'Expand carrier bundles to include same-day delivery perks'
    ],
    risks: [
      'Regulatory complexity for cross-border data residency',
      'Carrier procurement renegotiation could delay timeline'
    ],
    contacts: [
      { name: 'Aiko Watanabe', role: 'Chief Customer Officer', notes: 'Primary ELT contact' },
      { name: 'Hassan Qureshi', role: 'VP, Digital Stores', notes: 'Owns carrier co-marketing programs' }
    ],
    opportunities: [
      { name: 'Einstein Copilot Expansion', value: '$2.1M', nextStep: 'Schedule innovation day with ELT' },
      { name: 'Horizon Joint GTM Pack', value: '$900k', nextStep: 'Align on funding split' }
    ]
  },
  {
    id: 'acc-acme',
    accountName: 'Acme Retail',
    companyName: 'Acme Retail Company',
    localName: 'Acme Retail Company',
    aov: '$1.2M',
    industry: 'Retail & Consumer Goods',
    hq: 'Chicago, IL',
    stage: 'Expansion',
    fiscalYearEnd: 'January',
    summary:
      'Acme Retail is rolling out a unified storefront experience and needs coordinated carrier-backed promotions across flagship outlets.',
    carrierRelationship:
      'Carrier partner: Summit Mobile across US & Canada. Joint executive sponsor program focused on connected store experiences.',
    metrics: {
      pipeCoverage: '2.6x coverage vs. FY25 plan',
      acvYoY: '+15% YoY ACV growth',
      productAdoption: '61% adoption of Slack Retail Execution kits',
      supportHealth: 'No Sev-1s in the last 120 days',
      csat: '4.5 / 5 retail exec CSAT',
    },
    goals: [
      'Launch carrier-backed connected store pilots in five marquee cities',
      'Consolidate merchandising signals into Customer 360 + Slack alerts',
    ],
    risks: [
      'In-store ops talent gap slowing rollout of new workflows',
      'Carrier incentives tied to Q3 sell-through thresholds',
    ],
    contacts: [
      { name: 'Julia Martinez', role: 'SVP, Stores', notes: 'Executive sponsor for connected store motion' },
      { name: 'Kenji Arai', role: 'Director, Retail Technology', notes: 'Owns Slack workflow expansion' },
    ],
    opportunities: [
      { name: 'Retail Execution Automation', value: '$1.2M', nextStep: 'Schedule executive blueprint review' },
      { name: 'Connected Store Analytics', value: '$450k', nextStep: 'Align on carrier-funded pilot budget' },
    ],
  }
];

export const accountOptions: PlainTextOption[] = accounts.map((account) => ({
  text: {
    type: 'plain_text',
    text: account.accountName,
  },
  value: account.id,
  description: {
    type: 'plain_text',
    text: `${account.companyName} • ${account.aov} AOV`,
  },
}));

export const aovOptions: PlainTextOption[] = accounts.map((account) => ({
  text: {
    type: 'plain_text',
    text: `${account.localName} (${account.aov})`,
  },
  value: account.id,
}));

export function getAccountById(id?: string): AccountRecord | undefined {
  return accounts.find((account) => account.id === id);
}
