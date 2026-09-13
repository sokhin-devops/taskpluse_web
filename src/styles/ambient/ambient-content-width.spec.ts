import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AmbientTopbarComponent } from '../../app/ambient/ambient-topbar.component';

/**
 * The topbar and the page under it are two panels with visible edges, and those
 * edges have to line up. Nothing in TypeScript can assert that — it is the
 * product of a max-width, a centring rule, and whatever the scroll container
 * reserves for its scrollbar, resolved by the browser. So it is measured.
 */
@Component({
  imports: [AmbientTopbarComponent],
  template: `
    <div class="amb-shell" style="width: 1280px; height: 600px">
      <div class="amb-shell__sidebar"></div>
      <div class="amb-shell__main">
        <!-- The shape the shell actually renders: the bar above the scroll
             container, in a slot that reserves the same gutter the container
             does, so the page never passes behind it and the two still line up. -->
        <div class="amb-shell__topbar-slot">
          <amb-topbar title="Dashboard" />
        </div>
        <div class="amb-shell__content">
          <div class="amb-page">
            <!-- Tall enough to force the scroll container to show a scrollbar,
                 which is what knocked the two out of line. -->
            <div style="height: 2000px"></div>
          </div>
        </div>
      </div>
    </div>
  `
})
class ShellHost {}

describe('content width (measured in the browser)', () => {
  let topbar: HTMLElement;
  let page: HTMLElement;
  let content: HTMLElement;

  beforeEach(() => {
    const fixture = TestBed.configureTestingModule({ imports: [ShellHost] }).createComponent(
      ShellHost
    );
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    topbar = root.querySelector('amb-topbar')!;
    page = root.querySelector('.amb-page')!;
    content = root.querySelector('.amb-shell__content')!;

    // Karma renders the fixture off in a corner; attach it so layout is real.
    document.body.appendChild(root);
  });

  afterEach(() => TestBed.resetTestingModule());

  // The slot above the container gives up exactly what the container reserves.
  // If that ever stops being true the bar and the page drift apart by a
  // scrollbar's width, which is what the edge assertions below catch.
  it('reserves the same gutter above the container as inside it', () => {
    const slot = document.querySelector<HTMLElement>('.amb-shell__topbar-slot')!;
    const inContainer = content.getBoundingClientRect().width - content.clientWidth;
    const inSlot = slot.getBoundingClientRect().width - slot.clientWidth;

    expect(inContainer).toBeGreaterThan(0);
    expect(inSlot).withContext('the slot is not reserving a gutter').toBe(inContainer);
  });

  // At 1280px both the bar and the page hit the `--amb-content-width` cap, so
  // they are the same width whatever the container does. A laptop is narrower
  // than the cap, which is where the container's own reservations start to
  // show — and where most people actually are.
  it('lines them up below the content-width cap too', () => {
    const shell: HTMLElement = document.querySelector('.amb-shell')!;
    shell.style.width = '1100px';

    const bar = topbar.getBoundingClientRect();
    const col = page.getBoundingClientRect();

    expect(Math.abs(col.left - bar.left))
      .withContext(`left: bar ${bar.left}, page ${col.left}`)
      .toBeLessThanOrEqual(1);
    expect(Math.abs(col.right - bar.right))
      .withContext(`right: bar ${bar.right}, page ${col.right}`)
      .toBeLessThanOrEqual(1);
  });

  // A scroll container clips at its padding box, so an interactive card at the
  // very top of a page had its hover halo cut off in a straight line. The room
  // it paints into is the container's own top padding — inside the clip box —
  // rather than a gap above the container, which would be outside it.
  it('leaves room for the first card to paint a hover halo', () => {
    const style = getComputedStyle(content);

    // The halo is a 4px spread over a 1-2px lift.
    expect(Number.parseFloat(style.paddingTop)).toBeGreaterThanOrEqual(6);

    const roomInsideTheClipBox =
      page.getBoundingClientRect().top - content.getBoundingClientRect().top;
    expect(roomInsideTheClipBox).toBeCloseTo(Number.parseFloat(style.paddingTop), 0);
  });

  // The page scrolls below the bar, never behind it. That is only true while
  // the bar is outside the scroll container — put it inside and stick it, and
  // cards slide under a translucent surface and stay readable through it.
  it('never lets the page pass behind the bar', () => {
    expect(content.contains(topbar))
      .withContext('the bar must sit above the scroll container, not inside it')
      .toBe(false);
    expect(getComputedStyle(topbar).position).not.toBe('sticky');

    // `instant`, because the container sets `scroll-behavior: smooth` and a
    // plain `scrollTop =` would only start an animation.
    content.scrollTo({ top: 400, behavior: 'instant' });

    expect(content.scrollTop).withContext('the container did not scroll').toBe(400);
    expect(content.getBoundingClientRect().top)
      .withContext('scrolled content reaches above the bar')
      .toBeGreaterThanOrEqual(topbar.getBoundingClientRect().bottom - 1);
  });

  it('lines the page up with the bar above it, on both edges', () => {
    const bar = topbar.getBoundingClientRect();
    const col = page.getBoundingClientRect();

    expect(Math.abs(col.left - bar.left))
      .withContext(`left: bar ${bar.left}, page ${col.left}`)
      .toBeLessThanOrEqual(1);
    expect(Math.abs(col.right - bar.right))
      .withContext(`right: bar ${bar.right}, page ${col.right}`)
      .toBeLessThanOrEqual(1);
  });
});
