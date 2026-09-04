import { TAG_COLOR_CHOICES, readableTextOn } from './tag.model';

/**
 * Unit tests for the tag colour helpers.
 *
 * <p>`readableTextOn` is what lets a tag chip use the user's own colour as its
 * background without the label disappearing. The naive version of this function
 * averages the RGB channels; these tests exist to catch a regression back to it,
 * because an average is wrong in exactly the cases that matter — the eye is far more
 * sensitive to green than to blue, so a mid-blue and a mid-yellow average to the same
 * number while needing opposite text colours.</p>
 */
describe('readableTextOn', () => {
  it('puts light text on a dark background', () => {
    expect(readableTextOn('#000000')).toBe('#ffffff');
    expect(readableTextOn('#184f95')).toBe('#ffffff');
  });

  it('puts dark text on a light background', () => {
    expect(readableTextOn('#ffffff')).toBe('#111827');
    expect(readableTextOn('#cde2fb')).toBe('#111827');
  });

  it('weights green over blue, so yellow and blue are treated differently', () => {
    // Pure blue and pure yellow have the same channel average but very different
    // perceived brightness. An RGB average would give both the same answer.
    expect(readableTextOn('#0000ff')).toBe('#ffffff');
    expect(readableTextOn('#ffff00')).toBe('#111827');
  });

  it('handles a malformed value without throwing', () => {
    expect(readableTextOn('nonsense')).toBe('#ffffff');
    expect(readableTextOn('#fff')).toBe('#ffffff');
    expect(readableTextOn('')).toBe('#ffffff');
  });

  it('tolerates a missing leading hash', () => {
    expect(readableTextOn('ffffff')).toBe('#111827');
  });

  it('gives every colour in the tag palette a readable label', () => {
    for (const color of TAG_COLOR_CHOICES) {
      const text = readableTextOn(color);
      expect(['#ffffff', '#111827'])
        .withContext(`text colour for ${color}`)
        .toContain(text);
    }
  });
});

describe('TAG_COLOR_CHOICES', () => {
  it('offers eight distinct, well-formed hex colours', () => {
    expect(TAG_COLOR_CHOICES.length).toBe(8);
    expect(new Set(TAG_COLOR_CHOICES).size).toBe(8);
    for (const color of TAG_COLOR_CHOICES) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
