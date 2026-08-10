// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import {
  canonicalizeReason,
  shouldOfferCustomReason,
} from "./resignationReason.utils";

describe("canonicalizeReason", () => {
  it("returns null for null input", () => {
    expect(canonicalizeReason(null)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(canonicalizeReason("")).toBeNull();
  });

  it("returns null for whitespace-only input", () => {
    expect(canonicalizeReason("   ")).toBeNull();
  });

  it("returns a predefined reason unchanged", () => {
    expect(canonicalizeReason("Retirement")).toBe("Retirement");
  });

  it("canonicalizes casing to the predefined spelling", () => {
    expect(canonicalizeReason("retirement")).toBe("Retirement");
    expect(canonicalizeReason("RETIREMENT")).toBe("Retirement");
  });

  it("canonicalizes a multi-word reason regardless of casing", () => {
    expect(canonicalizeReason("personal reasons")).toBe("Personal Reasons");
    expect(canonicalizeReason("joining another company - local")).toBe(
      "Joining another company - Local",
    );
  });

  it("trims surrounding whitespace before matching", () => {
    expect(canonicalizeReason("  Retirement  ")).toBe("Retirement");
  });

  it("preserves a custom reason that is not on the list", () => {
    expect(canonicalizeReason("Moving abroad")).toBe("Moving abroad");
  });

  it("trims a custom reason but keeps its casing", () => {
    expect(canonicalizeReason("  moving abroad  ")).toBe("moving abroad");
  });
});

describe("shouldOfferCustomReason", () => {
  it("is false for empty input", () => {
    expect(shouldOfferCustomReason("")).toBe(false);
  });

  it("is false for whitespace-only input", () => {
    expect(shouldOfferCustomReason("   ")).toBe(false);
  });

  it("is false when the input matches a predefined reason", () => {
    expect(shouldOfferCustomReason("Retirement")).toBe(false);
  });

  it("is false when the input matches a predefined reason case-insensitively", () => {
    expect(shouldOfferCustomReason("retirement")).toBe(false);
    expect(shouldOfferCustomReason("PERSONAL REASONS")).toBe(false);
  });

  it("is true for off-list text", () => {
    expect(shouldOfferCustomReason("Moving abroad")).toBe(true);
  });

  it("is true for a partially typed predefined reason", () => {
    expect(shouldOfferCustomReason("Retire")).toBe(true);
  });
});
