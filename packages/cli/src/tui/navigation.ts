import type { ViewEntry } from './types.js';

export interface NavStack {
  stack: ViewEntry[];
  current: ViewEntry;
  breadcrumbs: string[];
  canGoBack: boolean;
}

export function createNavStack(initial: ViewEntry): NavStack {
  return {
    stack: [initial],
    current: initial,
    breadcrumbs: [initial.label],
    canGoBack: false,
  };
}

export function pushNav(state: NavStack, entry: ViewEntry): NavStack {
  const stack = [...state.stack, entry];
  return {
    stack,
    current: entry,
    breadcrumbs: stack.map((e) => e.label),
    canGoBack: true,
  };
}

export function popNav(state: NavStack): NavStack {
  if (state.stack.length <= 1) return state;
  const stack = state.stack.slice(0, -1);
  return {
    stack,
    current: stack[stack.length - 1],
    breadcrumbs: stack.map((e) => e.label),
    canGoBack: stack.length > 1,
  };
}
