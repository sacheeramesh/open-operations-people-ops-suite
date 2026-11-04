// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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

import { ServiceLength } from "@src/types/types";
import { DATE_FMT, EX_EMPLOYEE_EMAIL, FUTURE_JOINER_EMAIL } from "@config/constant";
import { stripInvisibleCharacters } from "@utils/inputRules";
import { addDays } from "date-fns/addDays";
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import { differenceInMonths } from "date-fns/differenceInMonths";
import { differenceInYears } from "date-fns/differenceInYears";
import { isAfter } from "date-fns/isAfter";
import { isBefore } from "date-fns/isBefore";
import { isMatch } from "date-fns/isMatch";
import { isValid } from "date-fns/isValid";
import { parse } from "date-fns/parse";
import { format } from "date-fns/format";

export const isIncludedRole = (a: string[], b: string[]): boolean => {
  return [...getCrossItems(a, b), ...getCrossItems(b, a)].length > 0;
};

function getCrossItems<Role>(a: Role[], b: Role[]): Role[] {
  return a.filter((element) => {
    return b.includes(element);
  });
}

export const markAllFieldsTouched = (errors: any) => {
  const touched: any = {};
  const markTouched = (obj: any, touchedObj: any) => {
    Object.keys(obj).forEach((key) => {
      if (
        typeof obj[key] === "object" &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        touchedObj[key] = {};
        markTouched(obj[key], touchedObj[key]);
      } else if (Array.isArray(obj[key])) {
        touchedObj[key] = obj[key].map((item: any) =>
          typeof item === "object" && item !== null ? {} : true,
        );
        obj[key].forEach((item: any, index: number) => {
          if (typeof item === "object" && item !== null) {
            markTouched(item, touchedObj[key][index]);
          }
        });
      } else {
        touchedObj[key] = true;
      }
    });
  };
  markTouched(errors, touched);
  return touched;
};

const parseStrictYyyyMmDd = (s: string): Date | null => {
  const v = s.trim();
  if (!isMatch(v, DATE_FMT)) return null;

  const d = parse(v, DATE_FMT, new Date());
  return isValid(d) ? d : null;
};

export const calculateAge = (
  dob: string,
  now: Date = new Date(),
): number | null => {
  const d = parseStrictYyyyMmDd(dob);
  if (!d || isAfter(d, now)) return null;
  return differenceInYears(now, d);
};

/**
 * Length of service from startDate up to endDate or now, whichever is earlier,
 * so a leaver's service stops at their final day of employment. The final day is
 * a day worked, so it counts towards the service.
 */
export const calculateServiceLength = (
  startDate: string,
  endDate?: string | null,
  now: Date = new Date(),
): ServiceLength | null => {
  const start = parseStrictYyyyMmDd(startDate);
  if (!start || isAfter(start, now)) return null;

  const end = endDate ? parseStrictYyyyMmDd(endDate) : null;
  const until = end && isBefore(end, now) ? addDays(end, 1) : now;
  if (isAfter(start, until)) return null;

  const totalMonths = differenceInMonths(until, start);

  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  };
};

export const formatServiceLength = (length: ServiceLength | null): string => {
  if (!length) return "—";

  const { years, months } = length;
  if (years === 0 && months === 0) return "Less than 1 month";

  if (years > 0 && months > 0) {
    return `${years} ${years === 1 ? "year" : "years"} ${months} ${
      months === 1 ? "month" : "months"
    }`;
  }

  if (years > 0) return `${years} ${years === 1 ? "year" : "years"}`;
  return `${months} ${months === 1 ? "month" : "months"}`;
};

export const formatDate = (
  isoDate?: string | null,
  fallback?: string | null,
): string | null => {
  if (!isoDate) return fallback ?? null;
  const parsedDate = parseStrictYyyyMmDd(isoDate);
  if (!parsedDate) return fallback ?? null;
  return format(parsedDate, "d MMM yyyy");
};

export const isPresentOrFuture = (isoDate?: string | null): boolean => {
  if (!isoDate) return false;
  const parsedDate = parseStrictYyyyMmDd(isoDate);
  if (!parsedDate) return false;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate >= todayStart;
};

/**
 * Human-readable distance to an upcoming date, e.g. "in 35 days", "tomorrow", "today".
 * Returns null for past dates, unparseable input, or no input — callers render nothing.
 */
export const formatDaysUntil = (isoDate?: string | null): string | null => {
  if (!isoDate) return null;
  const parsedDate = parseStrictYyyyMmDd(isoDate);
  if (!parsedDate) return null;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  parsedDate.setHours(0, 0, 0, 0);
  const days = differenceInCalendarDays(parsedDate, todayStart);
  if (days < 0) return null;
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
};

export const toSentenceCase = (value: string): string => {
  if (!value) return value;
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const sortAndFormatOptions = <T>(
  options: T[],
  getLabel: (option: T) => string,
): T[] => {
  return [...options].sort((a, b) => {
    const aLabel = getLabel(a);
    const bLabel = getLabel(b);
    return aLabel.localeCompare(bLabel, undefined, { sensitivity: "base" });
  });
};

export function getEmployeeStatusColor(
  status: string,
): "default" | "success" | "warning" | "error" | "info" {
  switch (status?.toLowerCase()) {
    case "active":
      return "success";
    case "marked leaver":
      return "warning";
    case "new joiner":
      return "info";
    case "left":
      return "error";
    default:
      return "default";
  }
}

// Escapes a string for safe inclusion in a CSV cell, handling commas, quotes, and newlines.
export const escapeCsvCell = (value: string): string => {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

// Parses CSV text into a 2D array of strings, correctly handling quoted cells with commas and newlines.
export const parseCsvRows = (csvText: string): string[][] => {
  const rows: string[][] = [];
  let cell = "";
  let inQuotes = false;
  let currentRow: string[] = [];

  for (let i = 0; i < csvText.length; i += 1) {
    const ch = csvText[i];
    if (inQuotes) {
      if (ch === '"') {
        if (csvText[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"' && cell.length === 0) {
      inQuotes = true;
    } else if (ch === '"') {
      cell += ch;
    } else if (ch === ",") {
      currentRow.push(cell);
      cell = "";
    } else if (ch === "\n") {
      currentRow.push(cell);
      rows.push(currentRow);
      currentRow = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }

  if (cell.length > 0 || currentRow.length > 0) {
    currentRow.push(cell);
    rows.push(currentRow);
  }

  return rows;
};

// Counts the number of non-empty data rows in a CSV, excluding the header and any completely empty rows.
export const countCsvDataRows = (rows: string[][]): number => {
  if (rows.length <= 1) return 0;
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim().length > 0)).length;
};

// Strips the Byte Order Mark (BOM) from the beginning of a string if it exists.
export const stripBom = (text: string): string =>
  text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

/**
 * Normalises an email address for storage.
 *
 * Addresses are case-insensitive in practice, and the backend already compares them with
 * LOWER(), but whatever case was typed is what gets stored — so the same person could be
 * recorded as TEST@wso2.com in one place and test@wso2.com in another. Lowercasing at the
 * input keeps what is written consistent.
 *
 * Surrounding whitespace is dropped too, since a trailing space from a paste is invisible
 * in the field but survives into the record — as are zero-width characters, which the
 * backend's email rule refuses.
 */
export const normalizeEmail = (value: string): string =>
  stripInvisibleCharacters(value).trim().toLowerCase();

/** Whether a work email is one of the shared placeholders rather than a person's own address. */
export const isPlaceholderWorkEmail = (value: string): boolean => {
  const email = normalizeEmail(value);
  return email === FUTURE_JOINER_EMAIL || email === EX_EMPLOYEE_EMAIL;
};

/**
 * Whether a departure's two dates are in a possible order.
 *
 * An employee's final day of employment cannot fall before their last day in office —
 * employment does not end before someone stops coming in. The same day is valid: a last
 * office day that is also the final day of employment is ordinary.
 *
 * Either date missing is treated as valid here; requiredness is a separate rule.
 */
export const isResignationDateOrderValid = (
  finalDayInOffice: string | null | undefined,
  finalDayOfEmployment: string | null | undefined,
): boolean => {
  if (!finalDayInOffice || !finalDayOfEmployment) return true;
  return finalDayOfEmployment >= finalDayInOffice;
};

/** The message shown when the two departure dates are the wrong way round. */
export const RESIGNATION_DATE_ORDER_MESSAGE =
  "Final day of employment cannot be before the last day in office";
