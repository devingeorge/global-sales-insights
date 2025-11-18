export type DataSourceOption = 'mock' | 'llm' | 'prebuilt';

export interface BriefRequest {
  templateId: string;
  dataSource: DataSourceOption;
  prebuiltId?: string;
  accountId?: string;
  companyName?: string;
  localName?: string;
  aov?: string;
  viewAsUserId?: string;
  requesterId: string;
}

export interface BriefSectionField {
  label: string;
  value: string;
}

export interface BriefSection {
  title: string;
  body?: string[];
  fields?: BriefSectionField[];
}

export interface BriefContent {
  title: string;
  subtitle?: string;
  templateId: string;
  dataSource: DataSourceOption;
  sections: BriefSection[];
  markdown?: string;
  prebuiltId?: string;
}
