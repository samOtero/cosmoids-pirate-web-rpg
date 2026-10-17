import { describe, expect, it } from 'vitest';
import { validateDefinitionRegistry } from '@/utils/definitionRegistry';

describe('permanent definition IDs', () => {
  it('accepts explicit sparse assignments independent of registry order', () => {
    expect(() =>
      validateDefinitionRegistry(
        'test',
        { FIRST: 3, NEXT: 50 },
        {
          50: { id: 50 },
          3: { id: 3 },
        }
      )
    ).not.toThrow();
  });
  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid assignment %s',
    (id) => {
      expect(() =>
        validateDefinitionRegistry('test', { FIRST: id }, {})
      ).toThrow('invalid ID');
    }
  );
  it('detects duplicate assignments even after computed keys overwrite one another', () => {
    expect(() =>
      validateDefinitionRegistry(
        'test',
        { FIRST: 3, SECOND: 3 },
        { 3: { id: 3 } }
      )
    ).toThrow('duplicate ID');
  });
  it('rejects a missing definition', () => {
    expect(() => validateDefinitionRegistry('test', { FIRST: 3 }, {})).toThrow(
      'missing'
    );
  });
  it('rejects a mismatched registry key', () => {
    expect(() =>
      validateDefinitionRegistry('test', { FIRST: 3 }, { 3: { id: 50 } })
    ).toThrow('mismatched');
  });
  it('rejects unassigned definitions', () => {
    expect(() =>
      validateDefinitionRegistry('test', {}, { 3: { id: 3 } })
    ).toThrow('unassigned');
  });
});
