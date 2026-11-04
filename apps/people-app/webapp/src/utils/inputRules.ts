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

/**
 * Input rules shared with the backend.
 *
 * A value is checked twice: by the form before it is sent, and by the backend when the
 * request arrives. Where the two rules differ, the form accepts something the backend then
 * refuses, and the save fails with a message about a field that looks fine. The patterns
 * here are the backend's own (backend/modules/database/types.bal), so both sides agree.
 */

/** The backend's EMAIL_PATTERN, character for character. */
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-']+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * The backend's PHONE_PATTERN: digits, spaces, + - ( ), with at least one digit.
 *
 * One difference remains between the two engines: the browser counts U+FEFF as a space and
 * the backend does not. Strip invisible characters before testing a value against this.
 */
export const PHONE_PATTERN = /^[0-9+\-()\s]*[0-9][0-9+\-()\s]*$/;

/**
 * Characters that are invisible in a field but can arrive with a paste: zero-width space,
 * zero-width non-joiner and joiner, word joiner, and the zero-width no-break space (U+FEFF,
 * which is also the byte order mark).
 */
const INVISIBLE_CHARACTERS = /[​-‍⁠﻿]/g;

/** Removes characters that are invisible in a field but would still be stored. */
export const stripInvisibleCharacters = (value: string): string =>
  value.replace(INVISIBLE_CHARACTERS, "");

/**
 * Yup transform form of {@link stripInvisibleCharacters}: cleans strings and passes
 * anything else (null, undefined) through, so the form validates what will be sent.
 */
export const withoutInvisibleCharacters = <T>(value: T): T =>
  typeof value === "string" ? (stripInvisibleCharacters(value) as T) : value;

/** Whether the backend will accept this as an email address. */
export const isValidEmail = (value: string): boolean => EMAIL_PATTERN.test(value);

/** The longest search the backend accepts (EmployeeSearchPayload.searchString). */
const SEARCH_MAX_LENGTH = 100;

/** Anything outside the backend's search alphabet: letters, marks, digits, spaces, @ . _ ' + - */
const SEARCH_DISALLOWED = /[^\p{L}\p{M}0-9\s@._'+-]/gu;

/** Curly single quotes, as pasted from documents and email for names like O’Brien. */
const CURLY_APOSTROPHES = /[‘’]/g;

/**
 * Turns what was typed in a search box into a search the backend accepts.
 *
 * The backend refuses the whole request if the text holds anything outside its alphabet,
 * so a stray comma or bracket would fail the search outright. Curly apostrophes become the
 * straight one, and any other refused character becomes a space: the search is matched
 * word by word, so "Smith,John" still looks for both names.
 */
export const toSearchString = (value: string): string =>
  Array.from(
    stripInvisibleCharacters(value)
      .replace(CURLY_APOSTROPHES, "'")
      .replace(SEARCH_DISALLOWED, " "),
  )
    .slice(0, SEARCH_MAX_LENGTH)
    .join("");

/**
 * A search request with its text passed through {@link toSearchString}.
 *
 * Applied where the request is sent rather than in the search box, so the box keeps
 * showing what was typed. Text with nothing searchable left is dropped from the request,
 * the same as an empty box.
 */
export const withSafeSearchString = <T extends { searchString?: string }>(
  request: T,
): T => {
  if (request.searchString === undefined) return request;
  const searchString = toSearchString(request.searchString);
  return {
    ...request,
    searchString: searchString.trim().length > 0 ? searchString : undefined,
  };
};
