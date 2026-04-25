import { describe, it, expect } from 'vitest';
import type { ContentResponse, PagedResponse, SortDirection } from '../types/common.js';

describe('common types', () => {
  it('ContentResponse has content and links', () => {
    const response: ContentResponse<{ id: string }> = {
      content: [{ id: 'abc' }],
      links: [{ rel: 'self', href: 'https://example.com' }],
    };
    expect(response.content).toHaveLength(1);
    expect(response.links[0].rel).toBe('self');
  });

  it('PagedResponse extends ContentResponse with page metadata', () => {
    const response: PagedResponse<{ id: string }> = {
      content: [{ id: 'abc' }],
      page: { number: 0, size: 25, totalElements: 1, totalPages: 1 },
      links: [{ rel: 'self', href: 'https://example.com' }],
    };
    expect(response.content).toHaveLength(1);
    expect(response.page.totalElements).toBe(1);
    expect(response.links[0].rel).toBe('self');

    // PagedResponse is assignable to ContentResponse
    const asContent: ContentResponse<{ id: string }> = response;
    expect(asContent.content).toHaveLength(1);
  });

  it('SortDirection values are correct', () => {
    const asc: SortDirection = 'asc';
    const desc: SortDirection = 'desc';
    expect(asc).toBe('asc');
    expect(desc).toBe('desc');
  });
});
