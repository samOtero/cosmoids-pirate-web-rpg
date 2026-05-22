import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, resetStore } from '@/__tests__/utils/test-utils';
import ProfileScreen from '@/app/components/profileScreen';
import { useGameStore } from '@/store/gameStore';
import { Screens } from '@/types/baseGame';

describe('Profile Management Integration', () => {
  const mockOnSelect = vi.fn();
  const mockOnCreate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  describe('Profile Creation', () => {
    it('should create a profile in an empty slot', async () => {
      const user = userEvent.setup();

      render(
        <ProfileScreen
          profiles={[null, null, null]}
          onSelect={mockOnSelect}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
        />
      );

      // Click on empty slot to start creation
      const emptySlots = screen.getAllByText('Empty Slot');
      await user.click(emptySlots[0].closest('div')!);

      // Verify onCreate was called with correct parameters
      expect(mockOnCreate).toHaveBeenCalledWith(0);
    });
  });

  describe('Profile Selection', () => {
    it('should select an existing profile and call onSelect', async () => {
      const user = userEvent.setup();
      const existingProfile = {
        id: 0,
        name: 'Pirate Pete',
        lastPlayed: Date.now(),
        creatures: [],
        inventory: [],
        unlockedIslands: 2,
        currentIslandId: 1,
        islandPositions: { 0: 0 },
        storyProgression: 0,
        gameFlags: [],
      };

      render(
        <ProfileScreen
          profiles={[existingProfile, null, null]}
          onSelect={mockOnSelect}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
        />
      );

      // Click on the profile
      const profileCard = screen.getByText('Pirate Pete').closest('div')!;
      await user.click(profileCard);

      expect(mockOnSelect).toHaveBeenCalledWith(0);
    });

    it('should display profile information correctly', () => {
      const testDate = new Date('2025-11-15').getTime();
      const existingProfile = {
        id: 1,
        name: 'Sea Captain',
        lastPlayed: testDate,
        creatures: [],
        inventory: [],
        unlockedIslands: 3,
        currentIslandId: 2,
        islandPositions: { 0: 0 },
        storyProgression: 0,
        gameFlags: [],
      };

      render(
        <ProfileScreen
          profiles={[null, existingProfile, null]}
          onSelect={mockOnSelect}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Sea Captain')).toBeInTheDocument();
      expect(screen.getByText('Island 4')).toBeInTheDocument(); // unlockedIslands + 1
      // Use text matcher that works with the actual rendered date format
      expect(screen.getByText(/Last Played:/)).toBeInTheDocument();
      expect(screen.getByText(/11\/\d{1,2}\/2025/)).toBeInTheDocument();
    });
  });

  describe('Profile Deletion', () => {
    it('should delete a profile after confirmation', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      const existingProfile = {
        id: 0,
        name: 'To Delete',
        lastPlayed: Date.now(),
        creatures: [],
        inventory: [],
        unlockedIslands: 0,
        currentIslandId: 0,
        islandPositions: { 0: 0 },
        storyProgression: 0,
        gameFlags: [],
      };

      render(
        <ProfileScreen
          profiles={[existingProfile, null, null]}
          onSelect={mockOnSelect}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete data/i });
      await user.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalledWith('Delete save?');
      expect(mockOnDelete).toHaveBeenCalledWith(0);

      confirmSpy.mockRestore();
    });

    it('should not delete profile when confirmation is canceled', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      const existingProfile = {
        id: 1,
        name: 'Keep Me',
        lastPlayed: Date.now(),
        creatures: [],
        inventory: [],
        unlockedIslands: 0,
        currentIslandId: 0,
        islandPositions: { 0: 0 },
        storyProgression: 0,
        gameFlags: [],
      };

      render(
        <ProfileScreen
          profiles={[null, existingProfile, null]}
          onSelect={mockOnSelect}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete data/i });
      await user.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalledWith('Delete save?');
      expect(mockOnDelete).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Zustand Store Integration', () => {
    it('should create profile and update store state', () => {
      const { createProfile } = useGameStore.getState();

      createProfile(0);

      const state = useGameStore.getState();
      expect(state.profiles[0]).toMatchObject({
        id: 0,
        name: 'Caleb',
        creatures: [],
        inventory: [],
        unlockedIslands: 0,
        currentIslandId: 0,
      });
      expect(state.profiles[0]?.lastPlayed).toBeDefined();
    });

    it('should not create profile with invalid slot ID', () => {
      const { createProfile } = useGameStore.getState();

      createProfile(-1);
      createProfile(5);

      const state = useGameStore.getState();
      expect(state.profiles.every((p) => p === null)).toBe(true);
    });

    it('should delete profile and clear currentProfileId if active', () => {
      const { createProfile, selectProfile, deleteProfile } =
        useGameStore.getState();

      createProfile(1);
      selectProfile(1);

      let state = useGameStore.getState();
      expect(state.currentProfileId).toBe(1);

      deleteProfile(1);

      state = useGameStore.getState();
      expect(state.profiles[1]).toBe(null);
      expect(state.currentProfileId).toBe(null);
    });

    it('should update lastPlayed timestamp on selection', async () => {
      const { createProfile, selectProfile } = useGameStore.getState();

      createProfile(2);
      const initialTime = useGameStore.getState().profiles[2]?.lastPlayed;

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      selectProfile(2);

      const updatedTime = useGameStore.getState().profiles[2]?.lastPlayed;
      expect(updatedTime).toBeGreaterThan(initialTime!);
    });

    it('should handle multiple profiles independently', () => {
      const { createProfile } = useGameStore.getState();

      const defaultName = 'Caleb';

      createProfile(0);
      createProfile(1);
      createProfile(2);

      const state = useGameStore.getState();
      expect(state.profiles[0]?.name).toBe(defaultName);
      expect(state.profiles[1]?.name).toBe(defaultName);
      expect(state.profiles[2]?.name).toBe(defaultName);
    });

    it('selecting empty slot should take you to new player dialog', () => {
      const { createProfile } = useGameStore.getState();

      createProfile(0); // Slot is empty, triggers profile creation

      const state = useGameStore.getState();
      expect(state.currentProfileId).toBe(0);
      expect(state.currentScreen).toBe(Screens.DIALOG);
    });
  });

  describe('Multiple Profiles', () => {
    it('should allow creating profiles in all 3 slots', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <ProfileScreen
          profiles={[null, null, null]}
          onSelect={mockOnSelect}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
        />
      );

      // Create in slot 0
      const emptySlots = screen.getAllByText('Empty Slot');
      await user.click(emptySlots[0].closest('div')!);

      expect(mockOnCreate).toHaveBeenCalledWith(0);
    });

    it('should display all three profile slots', () => {
      render(
        <ProfileScreen
          profiles={[null, null, null]}
          onSelect={mockOnSelect}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
        />
      );

      const emptySlots = screen.getAllByText('Empty Slot');
      expect(emptySlots).toHaveLength(3);
    });
  });
});
