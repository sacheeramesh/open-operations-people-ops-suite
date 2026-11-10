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
  PHONE_PATTERN,
  isValidEmail,
  stripInvisibleCharacters,
  toSearchString,
  withSafeSearchString,
  withoutInvisibleCharacters,
} from "./inputRules";

describe("stripInvisibleCharacters", () => {
  it("removes the zero-width characters a paste can carry along", () => {
    expect(stripInvisibleCharacters("\uFEFF011 234 5678")).toBe("011 234 5678");
    expect(stripInvisibleCharacters("011\u200B234\u200C5678\u200D")).toBe(
      "0112345678",
    );
    expect(stripInvisibleCharacters("011\u20602345678")).toBe("0112345678");
  });

  it("keeps ordinary and non-breaking spaces, which the backend accepts", () => {
    expect(stripInvisibleCharacters("+94 11 234 5678")).toBe(
      "+94 11 234 5678",
    );
  });
});

describe("withoutInvisibleCharacters", () => {
  it("cleans strings and passes anything else through untouched", () => {
    expect(withoutInvisibleCharacters("\uFEFF0112345678")).toBe("0112345678");
    expect(withoutInvisibleCharacters(null)).toBeNull();
    expect(withoutInvisibleCharacters(undefined)).toBeUndefined();
  });
});

describe("PHONE_PATTERN", () => {
  it("accepts the formats people type", () => {
    for (const value of ["0112345678", "+94 11 234 5678", "(011) 234-5678"]) {
      expect(PHONE_PATTERN.test(value)).toBe(true);
    }
  });

  it("refuses a value with no digits", () => {
    for (const value of ["", "N/A", "+-()"]) {
      expect(PHONE_PATTERN.test(value)).toBe(false);
    }
  });

  // The backend does not treat U+FEFF as a space but the browser's \s does, so a number
  // carrying one must be cleaned before it is checked and before it is sent.
  it("passes a number carrying U+FEFF only once it is cleaned", () => {
    const pasted = "011\uFEFF2345678";
    expect(PHONE_PATTERN.test(stripInvisibleCharacters(pasted))).toBe(true);
  });
});

describe("isValidEmail", () => {
  it("accepts ordinary addresses, including an apostrophe", () => {
    for (const value of [
      "john@gmail.com",
      "o'brien@gmail.com",
      "J.Doe+tag@mail.example.lk",
    ]) {
      expect(isValidEmail(value)).toBe(true);
    }
  });

  // Each of these passes Yup's .email() but is refused by the backend.
  it("refuses what the backend refuses", () => {
    for (const value of [
      "jöhn@gmail.com",
      "john#1@gmail.com",
      "john&jane@gmail.com",
      "john@gmäil.com",
      "\uFEFFjohn@gmail.com",
    ]) {
      expect(isValidEmail(value)).toBe(false);
    }
  });

  it("refuses an address without a domain suffix, or nothing at all", () => {
    expect(isValidEmail("john@localhost")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("toSearchString", () => {
  it("leaves a search the backend accepts unchanged", () => {
    expect(toSearchString("john.doe@wso2.com")).toBe("john.doe@wso2.com");
    expect(toSearchString("Nuwan Perera")).toBe("Nuwan Perera");
    expect(toSearchString("José")).toBe("José");
  });

  it("turns curly apostrophes into the straight one", () => {
    expect(toSearchString("O’Brien")).toBe("O'Brien");
    expect(toSearchString("O‘Brien")).toBe("O'Brien");
  });

  // Search matches word by word, so a disallowed character becomes a space rather than
  // being dropped: "Smith,John" still searches for both names.
  it("replaces characters the backend refuses with a space", () => {
    expect(toSearchString("Smith,John")).toBe("Smith John");
    expect(toSearchString("(011) 234/5678")).toBe(" 011  234 5678");
    expect(toSearchString("R&D")).toBe("R D");
  });

  it("removes invisible characters", () => {
    expect(toSearchString("\uFEFFjohn\u200B")).toBe("john");
  });

  it("caps the search at the backend's 100 characters", () => {
    expect(toSearchString("a".repeat(150))).toHaveLength(100);
  });
});

describe("withSafeSearchString", () => {
  const filters = { employeeStatus: ["Active"] };

  it("cleans the search text and keeps the rest of the request", () => {
    expect(
      withSafeSearchString({ searchString: "O’Brien,", filters }),
    ).toEqual({ searchString: "O'Brien ", filters });
  });

  it("leaves the search out when nothing searchable remains", () => {
    expect(
      withSafeSearchString({ searchString: "(( ))", filters }).searchString,
    ).toBeUndefined();
  });

  it("leaves a request without search text as it is", () => {
    const request: { searchString?: string; filters: typeof filters } = {
      filters,
    };
    expect(withSafeSearchString(request)).toBe(request);
  });
});
