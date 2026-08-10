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

import { ResignationReasons } from "../../../../../config/constant";

/**
 * Finds the canonical spelling of a reason, matching case-insensitively.
 * Returns undefined when the text is not one of the predefined reasons.
 */
const findPredefinedReason = (trimmed: string): string | undefined =>
  ResignationReasons.find(
    (reason) => reason.toLowerCase() === trimmed.toLowerCase(),
  );

/**
 * Normalizes a typed or selected resignation reason before it is stored.
 *
 * Empty and whitespace-only input becomes null, matching how the field
 * behaved when it was a plain text input. Text matching a predefined
 * reason is stored with the list's canonical casing so the resignation
 * report does not accumulate casing variants. Anything else is a custom
 * reason and is kept as typed, minus surrounding whitespace.
 */
export const canonicalizeReason = (input: string | null): string | null => {
  const trimmed = (input ?? "").trim();
  if (trimmed === "") return null;
  return findPredefinedReason(trimmed) ?? trimmed;
};

/**
 * Whether the dropdown should offer an explicit `Add "..."` row for the
 * current input. Off-list text only — matching a predefined reason (in any
 * casing) must not offer a duplicate custom entry.
 */
export const shouldOfferCustomReason = (input: string): boolean => {
  const trimmed = input.trim();
  if (trimmed === "") return false;
  return findPredefinedReason(trimmed) === undefined;
};
