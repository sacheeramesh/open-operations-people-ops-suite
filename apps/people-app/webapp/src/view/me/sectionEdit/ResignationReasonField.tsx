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

import { Autocomplete, TextField } from "@mui/material";

import { ResignationReasons } from "@config/constant";
import {
  canonicalizeReason,
  shouldOfferCustomReason,
} from "@view/employees/onboarding/singleOnboarding/steps/resignationReason.utils";

/**
 * The synthetic `Add "..."` row. An object rather than a marker string so it can never
 * collide with text an admin actually typed.
 */
interface AddCustomReasonOption {
  addCustom: true;
  value: string;
}

/**
 * Resignation reason picker: the predefined reasons, plus an explicit row for entering
 * an off-list one.
 *
 * Carried over from the onboarding wizard's Job Info step so both surfaces store
 * reasons identically — the report groups on this text, so a stray casing variant or a
 * half-typed option silently saved would fragment it.
 */
const ResignationReasonField = ({
  value,
  disabled,
  error,
  helperText,
  onChange,
  onBlur,
}: {
  value: string | null;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  /** Receives the value to store; already canonicalized where appropriate. */
  onChange: (value: string | null) => void;
  onBlur?: () => void;
}) => (
  <Autocomplete<string | AddCustomReasonOption, false, false, true>
    freeSolo
    disabled={disabled}
    options={ResignationReasons}
    value={value ?? ""}
    onChange={(_event, newValue) => {
      // newValue is a plain string for a predefined pick or a freeSolo Enter-key
      // commit, or the Add-row sentinel when that synthetic row is clicked. The
      // sentinel itself must never be stored — only its clean `value`.
      const raw =
        typeof newValue === "string" ? newValue : newValue ? newValue.value : null;
      onChange(canonicalizeReason(raw));
    }}
    onInputChange={(_event, newInputValue, changeReason) => {
      // Ignore the reset MUI fires while committing a selection; onChange has
      // already stored the canonical value for that path.
      if (changeReason === "reset") return;
      onChange(newInputValue || null);
    }}
    onBlur={() => {
      onChange(canonicalizeReason(value ?? null));
      onBlur?.();
    }}
    filterOptions={(_options, state) => {
      const input = state.inputValue;
      // Filter the predefined list directly rather than the generic `_options`,
      // which also covers the non-string sentinel and has no `.toLowerCase`.
      const filtered: (string | AddCustomReasonOption)[] = ResignationReasons.filter(
        (option) => option.toLowerCase().includes(input.trim().toLowerCase()),
      );
      // Make off-list entry deliberate: a half-typed option like "Retire" gets an
      // explicit Add row rather than being silently saved.
      if (shouldOfferCustomReason(input)) {
        filtered.push({ addCustom: true, value: input.trim() });
      }
      return filtered;
    }}
    // The stored value is always the bare text; only the visible row reads `Add "..."`.
    getOptionLabel={(option) =>
      typeof option === "string" ? option : option.value
    }
    renderOption={(props, option) => {
      const { key, ...optionProps } = props;
      return (
        <li key={key} {...optionProps}>
          {typeof option === "string" ? option : `Add "${option.value}"`}
        </li>
      );
    }}
    renderInput={(params) => (
      <TextField
        {...params}
        fullWidth
        size="small"
        label="Resignation Reason"
        name="resignationReason"
        error={error}
        helperText={helperText ?? "Select a reason or type a custom one"}
        inputProps={{ ...params.inputProps, maxLength: 300 }}
      />
    )}
  />
);

export default ResignationReasonField;
