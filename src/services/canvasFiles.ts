import { WebClient } from '@slack/web-api';
import { PlainTextOption } from '@slack/types';

export interface CanvasFileMeta {
  id: string;
  title: string;
  permalink?: string;
}

const LIST_CACHE_TTL_MS = 5 * 60 * 1000;
const INFO_CACHE_TTL_MS = 10 * 60 * 1000;

let canvasListCache: { expiresAt: number; files: CanvasFileMeta[] } = {
  expiresAt: 0,
  files: [],
};

const canvasInfoCache = new Map<
  string,
  { expiresAt: number; file: CanvasFileMeta }
>();

function normalizeCanvas(file: any): CanvasFileMeta | null {
  if (!file?.id) {
    return null;
  }
  return {
    id: file.id,
    title: file.title || file.name || 'Untitled Canvas',
    permalink: file.permalink || file.permalink_public || file.url_private,
  };
}

export async function listCanvasFiles(
  client: WebClient,
  token?: string
): Promise<CanvasFileMeta[]> {
  const now = Date.now();
  if (canvasListCache.expiresAt > now) {
    return canvasListCache.files;
  }

  const response: any = await client.files.list({
    token,
    types: 'canvas',
    limit: 100,
  });

  const files: CanvasFileMeta[] = (response?.files || [])
    .map(normalizeCanvas)
    .filter(
      (file: CanvasFileMeta | null): file is CanvasFileMeta => Boolean(file)
    );

  canvasListCache = {
    expiresAt: now + LIST_CACHE_TTL_MS,
    files,
  };

  files.forEach((file) =>
    canvasInfoCache.set(file.id, {
      expiresAt: now + INFO_CACHE_TTL_MS,
      file,
    })
  );

  return files;
}

export function toSlackOption(file: CanvasFileMeta): PlainTextOption {
  return {
    text: {
      type: 'plain_text',
      text: file.title.slice(0, 75),
    },
    value: file.id,
  };
}

export function filterCanvasFiles(
  files: CanvasFileMeta[],
  query?: string
): CanvasFileMeta[] {
  if (!query) {
    return files;
  }
  const needle = query.toLowerCase();
  return files.filter((file) =>
    file.title.toLowerCase().includes(needle)
  );
}

export async function getCanvasFileById(
  client: WebClient,
  token: string | undefined,
  fileId: string
): Promise<CanvasFileMeta | undefined> {
  const now = Date.now();
  const cached = canvasInfoCache.get(fileId);
  if (cached && cached.expiresAt > now) {
    return cached.file;
  }

  const response: any = await client.files.info({
    token,
    file: fileId,
  });

  const file = normalizeCanvas(response?.file);
  if (file) {
    canvasInfoCache.set(file.id, {
      expiresAt: now + INFO_CACHE_TTL_MS,
      file,
    });
  }
  return file || undefined;
}

