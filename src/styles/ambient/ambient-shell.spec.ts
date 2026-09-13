/**
 * The shell's inset, measured.
 *
 * <p>The chrome is meant to float on the ambient canvas: an even margin on all
 * four sides, the same gap again between the rail and the content, and a corner
 * on every panel. All of that is geometry, and geometry is the one thing a
 * stylesheet can get wrong in a way no type checker and no unit test on the
 * TypeScript side would ever notice — the usual failure is a rule that quietly
 * stops matching and a layout that goes flush to the edge.</p>
 *
 * <p>Karma loads {@code src/styles.scss}, so what is measured here is the
 * cascade that ships.</p>
 */
describe('the shell inset (measured in the browser)', () => {
  let shell: HTMLElement;
  let sidebar: HTMLElement;
  let main: HTMLElement;
  let content: HTMLElement;
  let page: HTMLElement;

  /** The smallest shell that still exercises the real rules. */
  beforeEach(() => {
    shell = document.createElement('div');
    shell.className = 'amb-shell';
    // A fixed box, so the numbers do not depend on the Karma window's size.
    shell.style.width = '1280px';
    shell.style.height = '720px';

    sidebar = document.createElement('div');
    sidebar.className = 'amb-shell__sidebar';

    main = document.createElement('div');
    main.className = 'amb-shell__main';

    content = document.createElement('div');
    content.className = 'amb-shell__content';

    page = document.createElement('div');
    page.className = 'amb-page';

    content.appendChild(page);
    main.appendChild(content);
    shell.append(sidebar, main);
    document.body.appendChild(shell);
  });

  afterEach(() => shell.remove());

  function px(element: Element, property: string): number {
    return Number.parseFloat(getComputedStyle(element).getPropertyValue(property));
  }

  /**
   * Whether the docked rail is on screen at all.
   *
   * <p>The breakpoint is driven by the <em>browser window</em>, not by the box
   * under test, and the headless window is 800px wide — under the 900px nav
   * breakpoint, where the rail is {@code display: none} and becomes a drawer.
   * Measuring it there returns a zero-size rect and every geometry assertion
   * compares against nothing, which is worse than not asserting: it looks like
   * a pass on a machine with a wide window and a mystery on one without.</p>
   */
  function railIsDocked(): boolean {
    return getComputedStyle(sidebar).display !== 'none';
  }

  it('holds the chrome off all four edges by the same amount', () => {
    const inset = px(shell, 'padding-top');

    expect(inset).toBeGreaterThan(0);
    expect(px(shell, 'padding-right')).toBe(inset);
    expect(px(shell, 'padding-bottom')).toBe(inset);
    expect(px(shell, 'padding-left')).toBe(inset);
  });

  it('holds the content column off the top, right and bottom edges', () => {
    const shellBox = shell.getBoundingClientRect();
    const mainBox = main.getBoundingClientRect();
    const inset = px(shell, 'padding-left');

    expect(mainBox.top - shellBox.top).toBeCloseTo(inset, 0);
    expect(shellBox.right - mainBox.right).toBeCloseTo(inset, 0);
    expect(shellBox.bottom - mainBox.bottom).toBeCloseTo(inset, 0);
  });

  it('puts the same gap between the rail and the content', () => {
    if (!railIsDocked()) {
      // Below the nav breakpoint there is no gap to measure: the rail is a
      // drawer, and the content column takes the whole width.
      expect(main.getBoundingClientRect().left - shell.getBoundingClientRect().left).toBeCloseTo(
        px(shell, 'padding-left'),
        0
      );
      return;
    }

    const inset = px(shell, 'padding-left');
    const gap = main.getBoundingClientRect().left - sidebar.getBoundingClientRect().right;

    // Within a pixel: sub-pixel grid rounding is not a layout bug.
    expect(Math.abs(gap - inset)).toBeLessThanOrEqual(1);
  });

  // Both branches assert something real, rather than one of them being skipped:
  // which branch runs depends on the window the suite happens to open in, and a
  // test that quietly does nothing on the default headless window is worse than
  // no test at all.
  it('leaves canvas around the rail, or hides it and takes the width', () => {
    const shellBox = shell.getBoundingClientRect();
    const inset = px(shell, 'padding-left');

    if (!railIsDocked()) {
      // Under the nav breakpoint the rail is a drawer. The rule that hides it
      // is the thing under test here.
      expect(window.innerWidth).toBeLessThanOrEqual(900);
      expect(getComputedStyle(shell).gridTemplateColumns.split(' ').length).toBe(1);
      return;
    }

    const railBox = sidebar.getBoundingClientRect();

    expect(railBox.left - shellBox.left).toBeCloseTo(inset, 0);
    expect(railBox.top - shellBox.top).toBeCloseTo(inset, 0);
    expect(shellBox.bottom - railBox.bottom).toBeCloseTo(inset, 0);
  });

  // Not gated on the breakpoint: `display: none` hides the rail but does not
  // stop it computing a radius, and the drawer renders the same panel.
  it('rounds the rail, so it reads as a panel rather than a column', () => {
    expect(px(sidebar, 'border-top-left-radius')).toBeGreaterThan(0);
  });

  // The regression that would put the old double gutter back: the shell's inset
  // and the page's own padding both applying, so the first card sits twice as
  // far from the chrome as the cards sit from each other.
  it('does not add a second gutter inside the scroll area', () => {
    expect(px(page, 'padding-left')).toBe(0);
    expect(px(page, 'padding-right')).toBe(0);
    expect(px(page, 'padding-top')).toBe(0);
  });

  // The gap under the topbar has to fall inside the scroll container's padding
  // box, or the first card's hover halo is cut off in a straight line along the
  // top of the page.
  it('leaves room above the first card for a hover halo', () => {
    expect(px(content, 'padding-top')).toBeGreaterThanOrEqual(6);
  });

  it('still fits the viewport exactly, inset and all', () => {
    // border-box is what makes this true; without it the padding would be added
    // to the height and the shell would overflow by twice the inset.
    expect(shell.getBoundingClientRect().height).toBe(720);
    expect(shell.scrollHeight).toBeLessThanOrEqual(720);
  });
});
