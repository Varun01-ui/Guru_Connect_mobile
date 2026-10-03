import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ChildrenSetup } from '../screens/ChildrenSetup';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
// The real picker keeps every card's option list mounted in the test renderer, so use a simple stand-in.
jest.mock('../../../components/ui/Select', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    Select: ({ label, options, value, onChange }: any) => (
      <View>
        <Text>{value ? options.find((o: any) => o.value === value)?.label : 'Choose'}</Text>
        {options.map((o: any) => (
          <Pressable key={o.value} testID={`${label}-${o.value}`} onPress={() => onChange(o.value)}>
            <Text>{`pick ${o.label}`}</Text>
          </Pressable>
        ))}
      </View>
    ),
  };
});
jest.mock('../../../lib/api', () => ({ ApiError: class ApiError extends Error { code = ''; } }));

const mockSave = jest.fn();
const existingChild = {
  id: 'c1',
  childName: 'Rahul',
  classId: 'k6',
  class: { id: 'k6', name: 'Class 6' },
  boardId: null,
  board: null,
  subjectIds: [],
  subjects: [],
  categoryIds: [],
  teacherCategories: [],
  preferredModeId: null,
  preferredMode: null,
  schoolName: null,
  sortOrder: 0,
  updatedAt: '2026-09-28T05:00:00.000Z',
};
const mockRefetch = jest.fn(async () => ({ data: [existingChild] }));

jest.mock('../hooks', () => ({
  useChildrenQuery: () => ({ refetch: mockRefetch }),
  useSaveChildrenMutation: () => ({ mutateAsync: mockSave, isPending: false }),
  useChildSwitcher: Object.assign((sel: any) => sel({ select: jest.fn() }), { getState: () => ({ selectedChildId: 'c1' }) }),
}));

jest.mock('../../platform/hooks', () => ({
  useBootstrapQuery: () => ({ data: { limits: { parentMaxChildren: 10 } } }),
  useMastersQuery: () => ({
    data: {
      classes: [
        { id: 'k6', name: 'Class 6', levelOrder: 6 },
        { id: 'k8', name: 'Class 8', levelOrder: 8 },
      ],
      subjects: [],
      boards: [{ id: 'b1', name: 'Central Board of Secondary Education', shortName: 'CBSE' }],
      teacherCategories: [],
      teachingModes: [],
    },
  }),
}));

const navigation: any = { goBack: jest.fn(), reset: jest.fn() };

async function open(mode: 'setup' | 'manage') {
  return await render(<ChildrenSetup navigation={navigation} route={{ key: 'k', name: 'ChildrenSetup', params: { mode } } as any} />);
}

beforeEach(() => {
  mockSave.mockReset();
  mockSave.mockResolvedValue({ children: [existingChild], previews: [], dropped: [] });
  mockRefetch.mockClear();
});

describe('ChildrenSetup', () => {
  it('loads the existing children fresh from the server and shows them', async () => {
    await open('manage');
    expect(await screen.findByDisplayValue('Rahul')).toBeTruthy();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('has no "how many children" tabs, just an add button', async () => {
    await open('manage');
    await screen.findByDisplayValue('Rahul');
    expect(screen.queryByText(/how many children/i)).toBeNull();
    expect(screen.getByText('+ Add another child')).toBeTruthy();
  });

  it('adds a second, empty child card that does not copy the first name', async () => {
    await open('manage');
    await screen.findByDisplayValue('Rahul');

    fireEvent.press(screen.getByText('+ Add another child'));

    expect(await screen.findByText('Child 2')).toBeTruthy();
    expect(screen.getAllByPlaceholderText('First name')).toHaveLength(2);
    const names = screen.getAllByPlaceholderText('First name').map((n) => n.props.value);
    expect(names).toEqual(['Rahul', '']);

    // and the new card can be removed again without touching the first one
    fireEvent.press(screen.getByLabelText('Remove child 2'));
    await waitFor(() => expect(screen.queryByText('Child 2')).toBeNull());
    expect(screen.getByDisplayValue('Rahul')).toBeTruthy();
  });

  it('saves the existing child (kept) plus the new one, and deletes nobody', async () => {
    await open('manage');
    await screen.findByDisplayValue('Rahul');
    fireEvent.press(screen.getByText('+ Add another child'));
    await screen.findByText('Child 2');

    const inputs = screen.getAllByPlaceholderText('First name');
    fireEvent.changeText(inputs[1], 'Riya');
    // Riya needs a class: open her class picker and choose Class 8.
    fireEvent.press(screen.getAllByTestId('Class-k8')[1]);
    await waitFor(() => expect(screen.queryByText('Choose a class first')).toBeNull());

    fireEvent.press(screen.getByText('Save'));

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    const { drafts, existing } = mockSave.mock.calls[0][0];
    expect(existing.map((c: any) => c.id)).toEqual(['c1']);
    expect(drafts.map((d: any) => [d.id ?? null, d.name])).toEqual([
      ['c1', 'Rahul'],
      [null, 'Riya'],
    ]);
    expect(drafts[1].classId).toBe('k8');
  });
});
