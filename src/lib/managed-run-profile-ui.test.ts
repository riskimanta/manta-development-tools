import { describe, expect, it } from "vitest";

import {
  applyManagedRunProfileBootSessionId,
  canRestartManagedRunProfile,
  canStartManagedRunProfile,
  canStopManagedRunProfile,
  managedRunProfileStatusLabel,
  resolveManagedRunProfileActionMessage,
  resolveManagedRunProfileStatus,
  shouldPollManagedRunProfileSnapshot,
  shouldShowManagedRunProfileStaleNotice,
} from "./managed-run-profile-ui";

describe("resolveManagedRunProfileStatus", () => {
  it("returns idle when status is null or undefined", () => {
    expect(resolveManagedRunProfileStatus(null)).toBe("idle");
    expect(resolveManagedRunProfileStatus(undefined)).toBe("idle");
  });

  it("returns the provided status", () => {
    expect(resolveManagedRunProfileStatus("running")).toBe("running");
  });
});

describe("shouldPollManagedRunProfileSnapshot", () => {
  it("polls while starting, running, or stopping", () => {
    expect(shouldPollManagedRunProfileSnapshot("starting")).toBe(true);
    expect(shouldPollManagedRunProfileSnapshot("running")).toBe(true);
    expect(shouldPollManagedRunProfileSnapshot("stopping")).toBe(true);
  });

  it("does not poll for terminal or idle statuses", () => {
    expect(shouldPollManagedRunProfileSnapshot("idle")).toBe(false);
    expect(shouldPollManagedRunProfileSnapshot("stopped")).toBe(false);
    expect(shouldPollManagedRunProfileSnapshot("failed")).toBe(false);
    expect(shouldPollManagedRunProfileSnapshot("exited")).toBe(false);
  });
});

describe("managed process button availability", () => {
  it("allows start when idle or terminal", () => {
    expect(canStartManagedRunProfile("idle")).toBe(true);
    expect(canStartManagedRunProfile("stopped")).toBe(true);
    expect(canStartManagedRunProfile("failed")).toBe(true);
    expect(canStartManagedRunProfile("exited")).toBe(true);
    expect(canStartManagedRunProfile("running")).toBe(false);
    expect(canStartManagedRunProfile("starting")).toBe(false);
    expect(canStartManagedRunProfile("stopping")).toBe(false);
  });

  it("allows stop while starting or running", () => {
    expect(canStopManagedRunProfile("starting")).toBe(true);
    expect(canStopManagedRunProfile("running")).toBe(true);
    expect(canStopManagedRunProfile("idle")).toBe(false);
    expect(canStopManagedRunProfile("stopping")).toBe(false);
  });

  it("allows restart when running or terminal", () => {
    expect(canRestartManagedRunProfile("running")).toBe(true);
    expect(canRestartManagedRunProfile("stopped")).toBe(true);
    expect(canRestartManagedRunProfile("failed")).toBe(true);
    expect(canRestartManagedRunProfile("exited")).toBe(true);
    expect(canRestartManagedRunProfile("idle")).toBe(false);
    expect(canRestartManagedRunProfile("starting")).toBe(false);
  });
});

describe("managedRunProfileStatusLabel", () => {
  it("maps known statuses to labels", () => {
    expect(managedRunProfileStatusLabel("running")).toBe("Running");
    expect(managedRunProfileStatusLabel("idle")).toBe("Idle");
  });
});

describe("shouldShowManagedRunProfileStaleNotice", () => {
  it("does not show on first boot session id", () => {
    expect(shouldShowManagedRunProfileStaleNotice(null, "boot-a")).toBe(false);
    expect(shouldShowManagedRunProfileStaleNotice(undefined, "boot-a")).toBe(
      false,
    );
  });

  it("does not show when boot session id is unchanged", () => {
    expect(shouldShowManagedRunProfileStaleNotice("boot-a", "boot-a")).toBe(
      false,
    );
  });

  it("shows when boot session id changes after a prior value was seen", () => {
    expect(shouldShowManagedRunProfileStaleNotice("boot-a", "boot-b")).toBe(
      true,
    );
  });

  it("does not show when next boot session id is missing", () => {
    expect(shouldShowManagedRunProfileStaleNotice("boot-a", null)).toBe(false);
    expect(shouldShowManagedRunProfileStaleNotice("boot-a", undefined)).toBe(
      false,
    );
  });
});

describe("applyManagedRunProfileBootSessionId", () => {
  it("stores the next boot session id and flags stale state on change", () => {
    expect(
      applyManagedRunProfileBootSessionId(null, "boot-a"),
    ).toEqual({
      bootSessionId: "boot-a",
      showStaleNotice: false,
    });

    expect(
      applyManagedRunProfileBootSessionId("boot-a", "boot-b"),
    ).toEqual({
      bootSessionId: "boot-b",
      showStaleNotice: true,
    });
  });

  it("keeps the previous boot session id when next is missing", () => {
    expect(
      applyManagedRunProfileBootSessionId("boot-a", undefined),
    ).toEqual({
      bootSessionId: "boot-a",
      showStaleNotice: false,
    });
  });
});

describe("resolveManagedRunProfileActionMessage", () => {
  it("returns the action message when stale notice is not shown", () => {
    expect(
      resolveManagedRunProfileActionMessage({
        showStaleStateNotice: false,
        actionMessage: "Process is running.",
        status: "running",
      }),
    ).toBe("Process is running.");
  });

  it("omits stale action text when stale notice is shown and status is idle", () => {
    expect(
      resolveManagedRunProfileActionMessage({
        showStaleStateNotice: true,
        actionMessage: "Process is running.",
        status: "idle",
      }),
    ).toBeNull();
  });

  it("shows current action text after restart when status is active again", () => {
    expect(
      resolveManagedRunProfileActionMessage({
        showStaleStateNotice: true,
        actionMessage: "Process is starting.",
        status: "starting",
      }),
    ).toBe("Process is starting.");
  });

  it("returns null for blank action messages", () => {
    expect(
      resolveManagedRunProfileActionMessage({
        showStaleStateNotice: false,
        actionMessage: "   ",
        status: "idle",
      }),
    ).toBeNull();
  });
});
