import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HELGA_CALL_BUTTON_ENABLED } from "./helga.ts";

describe("Helga call button", () => {
  it("ships hidden", () => {
    assert.equal(HELGA_CALL_BUTTON_ENABLED, false);
  });
});
