import { describe, test, expect } from 'vitest';
import { isBelowKkm, formatScore, getKkmHighlightClass } from '../utils';

describe('isBelowKkm', () => {
    test('returns true when score is below KKM', () => {
        expect(isBelowKkm(65, 10, { 10: { kkm_value: 70 } })).toBe(true);
    });
    
    test('returns false when score is above KKM', () => {
        expect(isBelowKkm(75, 10, { 10: { kkm_value: 70 } })).toBe(false);
    });
    
    test('returns false when score equals KKM', () => {
        expect(isBelowKkm(70, 10, { 10: { kkm_value: 70 } })).toBe(false);
    });
    
    test('returns false for zero score', () => {
        expect(isBelowKkm(0, 10, { 10: { kkm_value: 70 } })).toBe(false);
    });
    
    test('returns false for string zero score', () => {
        expect(isBelowKkm('0', 10, { 10: { kkm_value: 70 } })).toBe(false);
    });
    
    test('uses default KKM of 70 when not set', () => {
        expect(isBelowKkm(65, 10, {})).toBe(true);
    });
    
    test('uses default KKM of 70 when kkms is undefined', () => {
        expect(isBelowKkm(65, 10, undefined)).toBe(true);
    });
    
    test('uses default KKM of 70 when mapel_id not in kkms', () => {
        expect(isBelowKkm(65, 10, { 20: { kkm_value: 80 } })).toBe(true);
    });
    
    test('returns false for dash string', () => {
        expect(isBelowKkm('-', 10, { 10: { kkm_value: 70 } })).toBe(false);
    });
    
    test('returns false for null score', () => {
        expect(isBelowKkm(null, 10, { 10: { kkm_value: 70 } })).toBe(false);
    });
    
    test('returns false for undefined score', () => {
        expect(isBelowKkm(undefined, 10, { 10: { kkm_value: 70 } })).toBe(false);
    });
    
    test('returns false for empty string', () => {
        expect(isBelowKkm('', 10, { 10: { kkm_value: 70 } })).toBe(false);
    });
    
    test('returns false for NaN string', () => {
        expect(isBelowKkm('abc', 10, { 10: { kkm_value: 70 } })).toBe(false);
    });
    
    test('handles string numbers correctly', () => {
        expect(isBelowKkm('65', 10, { 10: { kkm_value: 70 } })).toBe(true);
        expect(isBelowKkm('75', 10, { 10: { kkm_value: 70 } })).toBe(false);
    });
    
    test('handles decimal scores', () => {
        expect(isBelowKkm(69.5, 10, { 10: { kkm_value: 70 } })).toBe(true);
        expect(isBelowKkm(70.5, 10, { 10: { kkm_value: 70 } })).toBe(false);
    });
});

describe('formatScore', () => {
    test('returns dash for null', () => {
        expect(formatScore(null)).toBe('-');
    });
    
    test('returns dash for undefined', () => {
        expect(formatScore(undefined)).toBe('-');
    });
    
    test('returns dash for dash string', () => {
        expect(formatScore('-')).toBe('-');
    });
    
    test('returns "0" for zero number', () => {
        expect(formatScore(0)).toBe('0');
    });
    
    test('returns integer as string for whole numbers', () => {
        expect(formatScore(85)).toBe('85');
        expect(formatScore(100)).toBe('100');
    });
    
    test('returns decimal with one place for decimal numbers', () => {
        expect(formatScore(85.5)).toBe('85.5');
        expect(formatScore(85.75)).toBe('85.8');
    });
    
    test('handles string numbers', () => {
        expect(formatScore('85')).toBe('85');
        expect(formatScore('85.5')).toBe('85.5');
    });
    
    test('returns original value for NaN strings', () => {
        expect(formatScore('abc')).toBe('abc');
        expect(formatScore('N/A')).toBe('N/A');
    });
    
    test('handles edge case of 0.0', () => {
        expect(formatScore(0.0)).toBe('0');
    });
    
    test('rounds decimal to one place', () => {
        expect(formatScore(85.123)).toBe('85.1');
        expect(formatScore(85.999)).toBe('86.0');
    });
});

describe('getKkmHighlightClass', () => {
    test('returns red bold classes when score is below KKM', () => {
        expect(getKkmHighlightClass(65, 10, { 10: { kkm_value: 70 } }))
            .toBe('text-red-600 font-bold');
    });
    
    test('returns empty string when score is above KKM', () => {
        expect(getKkmHighlightClass(75, 10, { 10: { kkm_value: 70 } }))
            .toBe('');
    });
    
    test('returns empty string when score equals KKM', () => {
        expect(getKkmHighlightClass(70, 10, { 10: { kkm_value: 70 } }))
            .toBe('');
    });
    
    test('returns empty string for zero score', () => {
        expect(getKkmHighlightClass(0, 10, { 10: { kkm_value: 70 } }))
            .toBe('');
    });
    
    test('returns empty string for dash', () => {
        expect(getKkmHighlightClass('-', 10, { 10: { kkm_value: 70 } }))
            .toBe('');
    });
    
    test('returns empty string for null', () => {
        expect(getKkmHighlightClass(null, 10, { 10: { kkm_value: 70 } }))
            .toBe('');
    });
    
    test('returns empty string for undefined', () => {
        expect(getKkmHighlightClass(undefined, 10, { 10: { kkm_value: 70 } }))
            .toBe('');
    });
    
    test('uses default KKM when not set', () => {
        expect(getKkmHighlightClass(65, 10, {}))
            .toBe('text-red-600 font-bold');
        expect(getKkmHighlightClass(75, 10, {}))
            .toBe('');
    });
    
    test('handles string numbers', () => {
        expect(getKkmHighlightClass('65', 10, { 10: { kkm_value: 70 } }))
            .toBe('text-red-600 font-bold');
        expect(getKkmHighlightClass('75', 10, { 10: { kkm_value: 70 } }))
            .toBe('');
    });
});
