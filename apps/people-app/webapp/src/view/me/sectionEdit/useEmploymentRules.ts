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

import dayjs from "dayjs";
import { useFormikContext } from "formik";
import { useCallback, useEffect, useMemo } from "react";

import { CreateEmployeeFormValues } from "@/types/types";
import { useAppSelector } from "@slices/store";
import {
  FIXED_TERM_EMPLOYMENT_TYPE,
  PROBATION_EMPLOYMENT_TYPE,
} from "@view/employees/onboarding/singleOnboarding/steps/JobInfo";

/**
 * Employment-type driven rules for the profile's General Information editor, carried
 * over from the onboarding wizard's Job Info step.
 *
 * Derives which employment type is selected, whether an agreement end date applies,
 * and the probation end date implied by the work location's configured probation
 * period.
 *
 * Auto-computation only ever fills an EMPTY probation date. A value already on the
 * record is left alone: it may have been corrected by hand, and silently recomputing
 * it when an admin edits an unrelated field in the same section would discard that
 * correction without telling anyone.
 */
export const useEmploymentRules = () => {
  const { values, setFieldValue } =
    useFormikContext<CreateEmployeeFormValues>();
  const { companies, employmentTypes } = useAppSelector(
    (state) => state.organization,
  );

  const selectedType = useMemo(
    () => employmentTypes.find((et) => et.id === values.employmentTypeId),
    [employmentTypes, values.employmentTypeId],
  );

  const typeName = selectedType?.name?.trim() ?? "";

  const isPermanent = useMemo(() => /^permanent$/i.test(typeName), [typeName]);

  const isProbationType = useMemo(
    () => (typeName ? PROBATION_EMPLOYMENT_TYPE.test(typeName) : false),
    [typeName],
  );

  const isFixedTerm = useMemo(
    () => (typeName ? FIXED_TERM_EMPLOYMENT_TYPE.test(typeName) : false),
    [typeName],
  );

  const showAgreementEndDate = useMemo(() => {
    if (!typeName) return false;
    return /\b(internship|consult(ancy|ant)?|fixed\s+term)\b/.test(
      typeName.toLowerCase(),
    );
  }, [typeName]);

  // Only active types are selectable, but keep the employee's current type even if it
  // has since been deactivated — otherwise the dropdown would render blank.
  const selectableEmploymentTypes = useMemo(
    () =>
      employmentTypes.filter(
        (t) => t.isActive || t.id === values.employmentTypeId,
      ),
    [employmentTypes, values.employmentTypeId],
  );

  const matchedProbationLocation = useMemo(() => {
    if (!values.companyId || !values.workLocation || !companies.length) {
      return null;
    }
    const company = companies.find((c) => c.id === values.companyId);
    return (
      company?.allowedLocations?.find(
        (item) =>
          item.location.trim().toUpperCase() ===
          values.workLocation.trim().toUpperCase(),
      ) ?? null
    );
  }, [values.companyId, values.workLocation, companies]);

  useEffect(() => {
    // isPermanent/isProbationType both read false against an empty list, which would
    // clear a loaded value before the preservation guard below gets a chance to run.
    if (employmentTypes.length === 0) return;

    // Only Permanent and Probation carry a probation end date at all.
    if (!isPermanent && !isProbationType) {
      if (values.probationEndDate) setFieldValue("probationEndDate", null);
      return;
    }

    // The record already has a date — never overwrite it.
    if (values.probationEndDate) return;

    if (!values.startDate || !matchedProbationLocation) return;

    const probationMonths = matchedProbationLocation.probationPeriod ?? null;
    if (probationMonths === null) return;

    const startDate = dayjs(values.startDate);
    if (!startDate.isValid()) return;

    setFieldValue(
      "probationEndDate",
      startDate.add(probationMonths, "month").format("YYYY-MM-DD"),
    );
    // values.probationEndDate is read above as the preservation guard but deliberately
    // excluded from the deps — including it re-fires this on every manual edit and
    // immediately overwrites what the admin just typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    employmentTypes.length,
    isPermanent,
    isProbationType,
    values.startDate,
    matchedProbationLocation,
    setFieldValue,
  ]);

  const handleEmploymentTypeChange = useCallback(
    (newEmploymentTypeId: number) => {
      setFieldValue("employmentTypeId", newEmploymentTypeId);

      const next = employmentTypes.find((e) => e.id === newEmploymentTypeId);
      const nextName = next?.name?.trim() ?? "";

      // Types that carry no agreement end date drop any value the previous type had,
      // so a stale date can't be submitted against a type that doesn't use one.
      const nextShowsAgreement =
        /\b(internship|consult(ancy|ant)?|fixed\s+term)\b/.test(
          nextName.toLowerCase(),
        );
      if (!nextShowsAgreement) {
        setFieldValue("agreementEndDate", null);
      }
    },
    [setFieldValue, employmentTypes],
  );

  return {
    isPermanent,
    isProbationType,
    isFixedTerm,
    showAgreementEndDate,
    selectableEmploymentTypes,
    matchedProbationLocation,
    handleEmploymentTypeChange,
  };
};
