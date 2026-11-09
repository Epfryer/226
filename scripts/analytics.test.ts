import assert from "node:assert/strict";
import { test } from "node:test";
import { trackEvent } from "../client/src/lib/analytics";

test("analytics is safe without a browser or injected tracker and forwards flat data", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  try {
    Reflect.deleteProperty(globalThis, "window");
    assert.doesNotThrow(() => trackEvent("project_expanded", { project_id: "example" }));
    Object.defineProperty(globalThis, "window", { value: {}, configurable: true, writable: true });
    assert.doesNotThrow(() => trackEvent("project_expanded"));
    const events: unknown[] = [];
    window.umami = { track: (name, data) => { events.push({ name, data }); } };
    trackEvent("publication_reader_action", { publication: "public-book", action: "dock", side: "left" });
    assert.deepEqual(events, [{
      name: "publication_reader_action",
      data: { publication: "public-book", action: "dock", side: "left" },
    }]);
    window.umami = { track: () => { throw new Error("Tracker unavailable"); } };
    assert.doesNotThrow(() => trackEvent("project_expanded"));
    window.umami = { track: () => Promise.reject(new Error("Network unavailable")) };
    assert.doesNotThrow(() => trackEvent("project_expanded"));
    await new Promise(resolve => setImmediate(resolve));
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
