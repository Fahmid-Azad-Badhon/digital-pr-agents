import crypto from 'crypto';

export function createWeakEtag(source: string): string {
  const hash = crypto.createHash('sha1').update(source).digest('hex');
  return `W/"${hash}"`;
}

export function wasNotModified(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) {
    return false;
  }
  return ifNoneMatch === etag;
}
