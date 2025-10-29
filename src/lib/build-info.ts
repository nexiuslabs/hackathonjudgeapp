declare const __BUILD_VERSION__: string | undefined;

const fallbackVersion =
  typeof import.meta !== 'undefined' && 'env' in import.meta
    ? import.meta.env.MODE
    : 'dev';

const versionValue =
  typeof __BUILD_VERSION__ === 'string' && __BUILD_VERSION__.length > 0
    ? __BUILD_VERSION__
    : fallbackVersion ?? 'dev';

const parsedDate = Number.isNaN(Date.parse(versionValue))
  ? null
  : new Date(versionValue);

export const buildInfo = {
  version: versionValue,
  readable: parsedDate?.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }),
};
