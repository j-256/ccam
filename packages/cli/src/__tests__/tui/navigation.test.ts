import { describe, it, expect } from 'vitest';
import {
  createNavStack,
  pushNav,
  popNav,
} from '../../tui/navigation.js';
import type { ViewEntry } from '../../tui/types.js';

const home: ViewEntry = { view: 'resource-picker', label: 'Home' };

describe('navigation', () => {
  describe('createNavStack', () => {
    it('creates a stack with the initial entry', () => {
      const nav = createNavStack(home);
      expect(nav.current).toEqual(home);
      expect(nav.breadcrumbs).toEqual(['Home']);
      expect(nav.canGoBack).toBe(false);
    });
  });

  describe('pushNav', () => {
    it('pushes an entry onto the stack', () => {
      const nav = createNavStack(home);
      const next: ViewEntry = { view: 'org-list', label: 'Orgs' };
      const updated = pushNav(nav, next);
      expect(updated.current).toEqual(next);
      expect(updated.breadcrumbs).toEqual(['Home', 'Orgs']);
      expect(updated.canGoBack).toBe(true);
    });

    it('supports multiple pushes', () => {
      let nav = createNavStack(home);
      nav = pushNav(nav, { view: 'org-list', label: 'Orgs' });
      nav = pushNav(nav, { view: 'org-detail', label: 'Acme', params: { id: '1' } });
      expect(nav.breadcrumbs).toEqual(['Home', 'Orgs', 'Acme']);
      expect(nav.current.view).toBe('org-detail');
      expect(nav.current.params).toEqual({ id: '1' });
    });
  });

  describe('popNav', () => {
    it('pops the top entry', () => {
      let nav = createNavStack(home);
      nav = pushNav(nav, { view: 'org-list', label: 'Orgs' });
      nav = popNav(nav);
      expect(nav.current).toEqual(home);
      expect(nav.canGoBack).toBe(false);
    });

    it('does not pop past the initial entry', () => {
      const nav = createNavStack(home);
      const popped = popNav(nav);
      expect(popped.current).toEqual(home);
      expect(popped.canGoBack).toBe(false);
    });

    it('preserves remaining stack after pop', () => {
      let nav = createNavStack(home);
      nav = pushNav(nav, { view: 'org-list', label: 'Orgs' });
      nav = pushNav(nav, { view: 'org-detail', label: 'Acme' });
      nav = popNav(nav);
      expect(nav.current.view).toBe('org-list');
      expect(nav.breadcrumbs).toEqual(['Home', 'Orgs']);
      expect(nav.canGoBack).toBe(true);
    });
  });
});
