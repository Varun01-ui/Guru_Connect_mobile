import { emptyChild, keepOfferedSubjects, subjectsForClass, toggleId, validateChild } from '../rules';

const masters = {
  classes: [
    { id: 'c5', name: 'Class 5', levelOrder: 5 },
    { id: 'c10', name: 'Class 10', levelOrder: 10 },
  ],
  subjects: [
    { id: 'evs', name: 'EVS', minClassOrder: 1, maxClassOrder: 5 },
    { id: 'phy', name: 'Physics', minClassOrder: 9, maxClassOrder: null },
    { id: 'eng', name: 'English', minClassOrder: null, maxClassOrder: null },
  ],
};

describe('subjectsForClass', () => {
  it('offers only subjects whose range covers the class level', () => {
    expect(subjectsForClass(masters, 'c5').map((s) => s.id)).toEqual(['evs', 'eng']);
    expect(subjectsForClass(masters, 'c10').map((s) => s.id)).toEqual(['phy', 'eng']);
  });

  it('is empty until a class is chosen', () => {
    expect(subjectsForClass(masters, '')).toEqual([]);
  });

  it('offers everything when classes carry no level information', () => {
    const noLevels = { classes: [{ id: 'c5', name: 'Class 5' }], subjects: masters.subjects };
    expect(subjectsForClass(noLevels, 'c5')).toHaveLength(3);
  });

  it('copes with a masters payload that has no subjects at all', () => {
    expect(subjectsForClass({ classes: masters.classes }, 'c5')).toEqual([]);
  });
});

describe('keepOfferedSubjects', () => {
  it('drops subjects that no longer fit the new class', () => {
    expect(keepOfferedSubjects(masters, 'c10', ['evs', 'eng'])).toEqual(['eng']);
  });
});

describe('validateChild', () => {
  const ok = { ...emptyChild(), name: 'Aarav', classId: 'c5' };

  it('accepts a first name and a class', () => {
    expect(validateChild(ok)).toEqual({});
  });

  it('requires a name made of letters and spaces', () => {
    expect(validateChild({ ...ok, name: '' }).name).toBeDefined();
    expect(validateChild({ ...ok, name: 'Aarav 2' }).name).toBeDefined();
    expect(validateChild({ ...ok, name: 'Mary Ann' }).name).toBeUndefined();
    expect(validateChild({ ...ok, name: 'आरव' }).name).toBeUndefined();
    expect(validateChild({ ...ok, name: 'आर्यन' }).name).toBeUndefined();
  });

  it('requires a class and caps subjects and teacher types', () => {
    expect(validateChild({ ...ok, classId: '' }).classId).toBe('Choose a class.');
    expect(validateChild({ ...ok, subjectIds: ['1', '2', '3', '4', '5', '6', '7'] }).subjectIds).toBe('Choose up to 6 subjects.');
    expect(validateChild({ ...ok, categoryIds: ['1', '2', '3', '4', '5'] }).categoryIds).toBe('Choose up to 4 teacher types.');
  });
});

describe('toggleId', () => {
  it('adds and removes', () => {
    expect(toggleId(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleId(['a', 'b'], 'a')).toEqual(['b']);
  });
});
