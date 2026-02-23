import { Task } from '@/types';

export interface QuickCaptureDefaults {
  quickCaptureDefaultPriority: Task['priority'];
  quickCaptureDefaultTag: string;
}

export const normalizeQuickCaptureTitle = (title: string): string =>
  title
    .trim()
    .replace(/\s+/g, ' ');

export const buildQuickCaptureTaskInput = (
  rawTitle: string,
  defaults: QuickCaptureDefaults
): Omit<Task, 'id' | 'userId' | 'createdAt'> | null => {
  const title = normalizeQuickCaptureTitle(rawTitle);
  if (!title) return null;

  const preferredTag = defaults.quickCaptureDefaultTag.trim();
  const tags = Array.from(
    new Set(['quick-capture', ...(preferredTag ? [preferredTag] : [])])
  );

  return {
    title,
    description: '',
    status: 'todo',
    priority: defaults.quickCaptureDefaultPriority,
    tags,
  };
};

