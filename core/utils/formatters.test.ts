import { describe, it, expect } from 'vitest';
import { formatDuration, parseDuration, smartFormatTime } from './formatters';

describe('formatDuration', () => {
  it('formats seconds into MM:SS', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(3600)).toBe('60:00');
    expect(formatDuration('90')).toBe('01:30');
  });

  it('returns "-" for invalid values', () => {
    expect(formatDuration(NaN)).toBe('-');
    expect(formatDuration('abc')).toBe('-');
  });
});

describe('parseDuration', () => {
  it('parses pure seconds', () => {
    expect(parseDuration('45')).toBe(45);
    expect(parseDuration('120')).toBe(120);
  });

  it('parses MM:SS format', () => {
    expect(parseDuration('01:30')).toBe(90);
    expect(parseDuration('05:00')).toBe(300);
  });

  it('parses HH:MM:SS format', () => {
    expect(parseDuration('01:00:00')).toBe(3600);
    expect(parseDuration('01:02:03')).toBe(3723);
  });

  it('handles empty or malformed inputs safely', () => {
    expect(parseDuration('')).toBe(0);
    expect(parseDuration('abc')).toBe(0);
  });
});

describe('smartFormatTime', () => {
  it('formats digits for cardio as minutes:00', () => {
    expect(smartFormatTime('15', 'Cardio')).toBe('15:00');
  });

  it('formats digits for static as 00:seconds', () => {
    expect(smartFormatTime('45', 'Statique')).toBe('00:45');
    expect(smartFormatTime('5', 'Statique')).toBe('00:05');
  });

  it('preserves existing colon format with zero-padding', () => {
    expect(smartFormatTime('1:30', 'Cardio')).toBe('01:30');
    expect(smartFormatTime('1.30', 'Cardio')).toBe('01:30');
  });
});
