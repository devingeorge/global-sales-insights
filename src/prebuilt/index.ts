import fs from 'fs';
import path from 'path';
import { PlainTextOption } from '@slack/types';

export interface PrebuiltTemplateMeta {
  id: string;
  label: string;
  description: string;
  filename: string;
}

const CANVAS_DIR = path.resolve(process.cwd(), 'src', 'prebuilt', 'canvases');

const registry: PrebuiltTemplateMeta[] = [
  {
    id: 'executive-qbr',
    label: 'Executive QBR Canvas',
    description: 'Pre-built executive briefing with agenda starter.',
    filename: path.join(CANVAS_DIR, 'executive-qbr.md'),
  },
  {
    id: 'elt-brief',
    label: 'ELT Briefing Canvas',
    description: 'Fast-paced context for ELT syncs.',
    filename: path.join(CANVAS_DIR, 'elt-brief.md'),
  },
  {
    id: 'discovery-brief',
    label: 'Discovery Brief Canvas',
    description: 'Workshop prep outline and key questions.',
    filename: path.join(CANVAS_DIR, 'discovery-brief.md'),
  },
];

export function getPrebuiltOptions(): PlainTextOption[] {
  return registry.map((template) => ({
    text: {
      type: 'plain_text',
      text: template.label,
    },
    value: template.id,
    description: {
      type: 'plain_text',
      text: template.description,
    },
  }));
}

export function getPrebuiltById(id?: string): PrebuiltTemplateMeta | undefined {
  return registry.find((template) => template.id === id);
}

export function loadPrebuiltMarkdown(id: string): string {
  const template = getPrebuiltById(id);
  if (!template) {
    throw new Error(`Prebuilt template not found: ${id}`);
  }

  return fs.readFileSync(template.filename, 'utf-8');
}
