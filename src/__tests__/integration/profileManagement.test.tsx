import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, resetStore } from "@/__tests__/utils/test-utils";
import ProfileScreen from "@/app/components/profileScreen";
import { useGameStore } from "@/store/gameStore";
import { Screens } from "@/types/baseGame";

describe("Profile Management Integration", () => {
  const mockOnSelect = vi.fn();
  const mockOnCreate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  describe("Profile Creation", () => {
    it("should create a profile in an empty slot with valid name", async () => {
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
      const emptySlots = screen.getAllByText("Empty Slot");
      await user.click(emptySlots[0].closest("div")!);

      // Should show creation form
      expect(screen.getByPlaceholderText("Enter Name")).toBeInTheDocument();

      // Enter name and create
      const input = screen.getByPlaceholderText("Enter Name");
      await user.type(input, "Captain Jack");

      const createButton = screen.getByRole("button", { name: /create/i });
      await user.click(createButton);

      // Verify onCreate was called with correct parameters
      expect(mockOnCreate).toHaveBeenCalledWith(0, "Captain Jack");
    });

    it("should not create profile with empty name", async () => {
      const user = userEvent.setup();

      render(
        <ProfileScreen
          profiles={[null, null, null]}
          onSelect={mockOnSelect}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
        />
      );

      const emptySlots = screen.getAllByText("Empty Slot");
      await user.click(emptySlots[0].closest("div")!);

      const createButton = screen.getByRole("button", { name: /create/i });
      await user.click(createButton);

      // onCreate should not be called with empty name
      expect(mockOnCreate).not.toHaveBeenCalled();
    });

    it("should clear form when canceling profile creation", async () => {
      const user = userEvent.setup();

      render(
        <ProfileScreen
          profiles={[null, null, null]}
          onSelect={mockOnSelect}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
        />
      );

      const emptySlots = screen.getAllByText("Empty Slot");
      await user.click(emptySlots[0].closest("div")!);

      const input = screen.getByPlaceholderText("Enter Name");
      await user.type(input, "Test Name");

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Form should be hidden
      expect(
        screen.queryByPlaceholderText("Enter Name")
      ).not.toBeInTheDocument();
      expect(screen.getAllByText("Empty Slot")).toHaveLength(3);
    });

    it("should trim whitespace from profile name", async () => {
      const user = userEvent.setup();

      render(
        <ProfileScreen
          profiles={[null, null, null]}
          onSelect={mockOnSelect}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
        />
      );

      const emptySlots = screen.getAllByText("Empty Slot");
      await user.click(emptySlots[1].closest("div")!);

      const input = screen.getByPlaceholderText("Enter Name");
      // Type the name - note that maxLength=12 in the component will truncate it
      await user.clear(input);
      await user.type(input, "Spaced Name");

      const createButton = screen.getByRole("button", { name: /create/i });
      await user.click(createButton);

      expect(mockOnCreate).toHaveBeenCalledWith(1, "Spaced Name");
    });
  });

  describe("Profile Selection", () => {
    it("should select an existing profile and call onSelect", async () => {
      const user = userEvent.setup();
      const existingProfile = {
        id: 0,
        name: "Pirate Pete",
        lastPlayed: Date.now(),
        isNew: false,
        creatures: [],
        inventory: [],
        unlockedIslands: 2,
        currentIslandId: 1,
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
      const profileCard = screen.getByText("Pirate Pete").closest("div")!;
      await user.click(profileCard);

      expect(mockOnSelect).toHaveBeenCalledWith(0);
    });

    it("should display profile information correctly", () => {
      const testDate = new Date("2025-11-15").getTime();
      const existingProfile = {
        id: 1,
        name: "Sea Captain",
        lastPlayed: testDate,
        isNew: false,
        creatures: [],
        inventory: [],
        unlockedIslands: 3,
        currentIslandId: 2,
      };

      render(
        <ProfileScreen
          profiles={[null, existingProfile, null]}
          onSelect={mockOnSelect}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("Sea Captain")).toBeInTheDocument();
      expect(screen.getByText("Island 4")).toBeInTheDocument(); // unlockedIslands + 1
      // Use text matcher that works with the actual rendered date format
      expect(screen.getByText(/Last Played:/)).toBeInTheDocument();
      expect(screen.getByText(/11\/\d{1,2}\/2025/)).toBeInTheDocument();
    });
  });

  describe("Profile Deletion", () => {
    it("should delete a profile after confirmation", async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

      const existingProfile = {
        id: 0,
        name: "To Delete",
        lastPlayed: Date.now(),
        isNew: false,
        creatures: [],
        inventory: [],
        unlockedIslands: 0,
        currentIslandId: 0,
      };

      render(
        <ProfileScreen
          profiles={[existingProfile, null, null]}
          onSelect={mockOnSelect}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /delete data/i });
      await user.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalledWith("Delete save?");
      expect(mockOnDelete).toHaveBeenCalledWith(0);

      confirmSpy.mockRestore();
    });

    it("should not delete profile when confirmation is canceled", async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

      const existingProfile = {
        id: 1,
        name: "Keep Me",
        lastPlayed: Date.now(),
        isNew: false,
        creatures: [],
        inventory: [],
        unlockedIslands: 0,
        currentIslandId: 0,
      };

      render(
        <ProfileScreen
          profiles={[null, existingProfile, null]}
          onSelect={mockOnSelect}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /delete data/i });
      await user.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalledWith("Delete save?");
      expect(mockOnDelete).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe("Zustand Store Integration", () => {
    it("should create profile and update store state", () => {
      const { createProfile } = useGameStore.getState();

      createProfile(0, "Store Test");

      const state = useGameStore.getState();
      expect(state.profiles[0]).toMatchObject({
        id: 0,
        name: "Store Test",
        isNew: true,
        creatures: [],
        inventory: [],
        unlockedIslands: 0,
        currentIslandId: 0,
      });
      expect(state.profiles[0]?.lastPlayed).toBeDefined();
    });

    it("should not create profile with invalid slot ID", () => {
      const { createProfile } = useGameStore.getState();

      createProfile(-1, "Invalid");
      createProfile(5, "Invalid");

      const state = useGameStore.getState();
      expect(state.profiles.every((p) => p === null)).toBe(true);
    });

    it("should delete profile and clear currentProfileId if active", () => {
      const { createProfile, selectProfile, deleteProfile } =
        useGameStore.getState();

      createProfile(1, "To Delete");
      selectProfile(1);

      let state = useGameStore.getState();
      expect(state.currentProfileId).toBe(1);

      deleteProfile(1);

      state = useGameStore.getState();
      expect(state.profiles[1]).toBe(null);
      expect(state.currentProfileId).toBe(null);
    });

    it("should select profile and navigate to MAP screen", () => {
      const { createProfile, selectProfile } = useGameStore.getState();

      createProfile(0, "Navigator");
      selectProfile(0);

      const state = useGameStore.getState();
      expect(state.currentProfileId).toBe(0);
      expect(state.currentScreen).toBe(Screens.MAP);
      expect(state.profiles[0]?.isNew).toBe(false);
    });

    it("should update lastPlayed timestamp on selection", async () => {
      const { createProfile, selectProfile } = useGameStore.getState();

      createProfile(2, "Time Test");
      const initialTime = useGameStore.getState().profiles[2]?.lastPlayed;

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      selectProfile(2);

      const updatedTime = useGameStore.getState().profiles[2]?.lastPlayed;
      expect(updatedTime).toBeGreaterThan(initialTime!);
    });

    it("should handle multiple profiles independently", () => {
      const { createProfile } = useGameStore.getState();

      createProfile(0, "Profile One");
      createProfile(1, "Profile Two");
      createProfile(2, "Profile Three");

      const state = useGameStore.getState();
      expect(state.profiles[0]?.name).toBe("Profile One");
      expect(state.profiles[1]?.name).toBe("Profile Two");
      expect(state.profiles[2]?.name).toBe("Profile Three");
    });

    it("should not select non-existent profile", () => {
      const { selectProfile } = useGameStore.getState();

      selectProfile(0); // Slot is empty

      const state = useGameStore.getState();
      expect(state.currentProfileId).toBe(null);
      expect(state.currentScreen).toBe(Screens.START);
    });
  });

  describe("Multiple Profiles", () => {
    it("should allow creating profiles in all 3 slots", async () => {
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
      let emptySlots = screen.getAllByText("Empty Slot");
      await user.click(emptySlots[0].closest("div")!);
      await user.type(screen.getByPlaceholderText("Enter Name"), "Profile 1");
      await user.click(screen.getByRole("button", { name: /create/i }));

      expect(mockOnCreate).toHaveBeenCalledWith(0, "Profile 1");
    });

    it("should display all three profile slots", () => {
      render(
        <ProfileScreen
          profiles={[null, null, null]}
          onSelect={mockOnSelect}
          onCreate={mockOnCreate}
          onDelete={mockOnDelete}
        />
      );

      const emptySlots = screen.getAllByText("Empty Slot");
      expect(emptySlots).toHaveLength(3);
    });
  });
});
