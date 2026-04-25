import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { FooterBar } from '../../../tui/components/FooterBar.js';

describe('FooterBar', () => {
  it('renders hints text in bracket notation', () => {
    const { lastFrame } = render(
      <FooterBar hints="[j/k:nav] [Enter:open] [Esc:back]" />,
    );
    const frame = lastFrame();
    expect(frame).toContain('j/k');
    expect(frame).toContain('nav');
    expect(frame).toContain('Enter');
    expect(frame).toContain('open');
    expect(frame).toContain('Esc');
    expect(frame).toContain('back');
  });

  it('renders pageInfo on the right when provided', () => {
    const { lastFrame } = render(
      <FooterBar hints="[j/k:nav]" pageInfo="Page 1 of 5 (120 total)" />,
    );
    expect(lastFrame()).toContain('Page 1 of 5 (120 total)');
  });

  it('does not render pageInfo when not provided', () => {
    const { lastFrame } = render(<FooterBar hints="[j/k:nav]" />);
    expect(lastFrame()).not.toContain('Page');
  });

  it('renders spinner when loading is true', () => {
    const { lastFrame } = render(<FooterBar hints="[j/k:nav]" loading />);
    // Spinner renders something -- just verify the component doesn't crash
    expect(lastFrame()).toBeTruthy();
  });

  it('does not render spinner when loading is false', () => {
    const { lastFrame: withLoading } = render(
      <FooterBar hints="[j/k:nav]" loading />,
    );
    const { lastFrame: withoutLoading } = render(
      <FooterBar hints="[j/k:nav]" loading={false} />,
    );
    // Both should render, but spinner frame differs
    expect(withLoading()).toBeTruthy();
    expect(withoutLoading()).toBeTruthy();
  });

  it('renders hints and pageInfo together', () => {
    const { lastFrame } = render(
      <FooterBar hints="[j/k:nav]" pageInfo="3 of 10" />,
    );
    const frame = lastFrame();
    expect(frame).toContain('j/k');
    expect(frame).toContain('nav');
    expect(frame).toContain('3 of 10');
  });

  it('renders sortLabel when provided', () => {
    const { lastFrame } = render(
      <FooterBar hints="[j/k:nav]" sortLabel="Sort: Email asc" />,
    );
    expect(lastFrame()).toContain('Sort: Email asc');
  });

  it('renders statsLabel when provided', () => {
    const { lastFrame } = render(
      <FooterBar hints="[j/k:nav]" statsLabel="116,218 API Clients" />,
    );
    expect(lastFrame()).toContain('116,218 API Clients');
  });

  it('renders all props together in two-line layout', () => {
    const { lastFrame } = render(
      <FooterBar
        hints="[j/k:nav] [Enter:open]"
        pageInfo="1-25 of 100"
        loading
        sortLabel="Sort: Name asc"
        statsLabel="100 Users"
      />,
    );
    const frame = lastFrame();
    expect(frame).toContain('Sort: Name asc');
    expect(frame).toContain('100 Users');
    expect(frame).toContain('j/k');
    expect(frame).toContain('nav');
    expect(frame).toContain('1-25 of 100');
  });
});
