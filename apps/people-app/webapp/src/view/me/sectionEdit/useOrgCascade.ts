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

import { useCallback, useEffect, useRef } from "react";
import { useFormikContext } from "formik";

import { CreateEmployeeFormValues } from "@/types/types";
import { UNIT_CLEAR_SENTINEL } from "@slices/careerFunctionSlice/careerFunction";
import { useAppDispatch } from "@slices/store";
import {
  fetchBusinessUnits,
  fetchCareerFunctions,
  fetchCompanies,
  fetchDesignations,
  fetchEmploymentTypes,
  fetchHouses,
  fetchOffices,
  fetchSubTeams,
  fetchTeams,
  fetchUnits,
} from "@slices/organizationSlice/organization";
import { fetchEmployeesBasicInfo } from "@slices/employeeSlice/employee";

/**
 * Owns the dependent org-hierarchy dropdowns for the profile's inline section editors:
 * Business Unit -> Team -> Sub Team -> Unit, Career Function -> Designation, and
 * Company -> Office.
 *
 * The rules are carried over from the onboarding wizard's Job Info step. Selecting a
 * parent fetches its children and clears every descendant, so a stale child can never
 * be submitted under a new parent. Clearing a parent clears the descendants without
 * fetching. `unitId` clears to UNIT_CLEAR_SENTINEL rather than 0 because the payload
 * builder reads the sentinel as an explicit "no unit" instead of "not set".
 */
export const useOrgCascade = () => {
  const dispatch = useAppDispatch();
  const { values, setFieldValue } =
    useFormikContext<CreateEmployeeFormValues>();

  // Child lists are fetched once per level when an existing employee is loaded, so
  // re-renders don't re-request them. Cleared per level whenever its parent changes.
  const initialLoadRef = useRef({
    teams: false,
    subTeams: false,
    units: false,
    designations: false,
    offices: false,
  });

  useEffect(() => {
    dispatch(fetchBusinessUnits());
    dispatch(fetchCompanies());
    dispatch(fetchCareerFunctions());
    dispatch(fetchEmployeesBasicInfo());
    dispatch(fetchEmploymentTypes());
    dispatch(fetchHouses());
  }, [dispatch]);

  // Back-fill the child lists for the employee's existing selections, so the dropdowns
  // can render their current values rather than appearing empty until the admin
  // re-picks a parent.
  useEffect(() => {
    if (values.businessUnitId > 0 && !initialLoadRef.current.teams) {
      dispatch(fetchTeams({ id: values.businessUnitId }));
      initialLoadRef.current.teams = true;
    }
    if (values.teamId > 0 && !initialLoadRef.current.subTeams) {
      dispatch(fetchSubTeams({ id: values.teamId }));
      initialLoadRef.current.subTeams = true;
    }
    if (values.subTeamId > 0 && !initialLoadRef.current.units) {
      dispatch(fetchUnits({ id: values.subTeamId }));
      initialLoadRef.current.units = true;
    }
    if (values.careerFunctionId > 0 && !initialLoadRef.current.designations) {
      dispatch(
        fetchDesignations({ careerFunctionId: values.careerFunctionId }),
      );
      initialLoadRef.current.designations = true;
    }
    if (values.companyId > 0 && !initialLoadRef.current.offices) {
      dispatch(fetchOffices({ id: values.companyId }));
      initialLoadRef.current.offices = true;
    }
  }, [
    dispatch,
    values.businessUnitId,
    values.teamId,
    values.subTeamId,
    values.careerFunctionId,
    values.companyId,
  ]);

  const clearTeamDescendants = useCallback(() => {
    setFieldValue("teamId", 0);
    setFieldValue("subTeamId", 0);
    setFieldValue("unitId", UNIT_CLEAR_SENTINEL);
  }, [setFieldValue]);

  const handleBusinessUnitChange = useCallback(
    (newBusinessUnitId: number) => {
      const prev = values.businessUnitId;
      setFieldValue("businessUnitId", newBusinessUnitId);

      if (newBusinessUnitId > 0) {
        dispatch(fetchTeams({ id: newBusinessUnitId }));
        initialLoadRef.current.teams = true;

        if (prev !== newBusinessUnitId) {
          clearTeamDescendants();
          initialLoadRef.current.subTeams = false;
          initialLoadRef.current.units = false;
        }
      } else {
        clearTeamDescendants();
      }
    },
    [dispatch, setFieldValue, values.businessUnitId, clearTeamDescendants],
  );

  const handleTeamChange = useCallback(
    (newTeamId: number) => {
      const prev = values.teamId;
      setFieldValue("teamId", newTeamId);

      if (newTeamId > 0) {
        dispatch(fetchSubTeams({ id: newTeamId }));
        initialLoadRef.current.subTeams = true;

        if (prev !== newTeamId) {
          setFieldValue("subTeamId", 0);
          setFieldValue("unitId", UNIT_CLEAR_SENTINEL);
          initialLoadRef.current.units = false;
        }
      } else {
        setFieldValue("subTeamId", 0);
        setFieldValue("unitId", UNIT_CLEAR_SENTINEL);
      }
    },
    [dispatch, setFieldValue, values.teamId],
  );

  const handleSubTeamChange = useCallback(
    (newSubTeamId: number) => {
      const prev = values.subTeamId;
      setFieldValue("subTeamId", newSubTeamId);

      if (newSubTeamId > 0) {
        dispatch(fetchUnits({ id: newSubTeamId }));
        initialLoadRef.current.units = true;

        if (prev !== newSubTeamId) {
          setFieldValue("unitId", UNIT_CLEAR_SENTINEL);
        }
      } else {
        setFieldValue("unitId", UNIT_CLEAR_SENTINEL);
      }
    },
    [dispatch, setFieldValue, values.subTeamId],
  );

  const handleCareerFunctionChange = useCallback(
    (newCareerFunctionId: number) => {
      const prev = values.careerFunctionId;
      setFieldValue("careerFunctionId", newCareerFunctionId);

      if (newCareerFunctionId > 0) {
        dispatch(fetchDesignations({ careerFunctionId: newCareerFunctionId }));
        initialLoadRef.current.designations = true;

        if (prev !== newCareerFunctionId) {
          setFieldValue("designationId", 0);
        }
      } else {
        setFieldValue("designationId", 0);
      }
    },
    [dispatch, setFieldValue, values.careerFunctionId],
  );

  const handleCompanyChange = useCallback(
    (newCompanyId: number) => {
      const prev = values.companyId;
      setFieldValue("companyId", newCompanyId);

      if (newCompanyId > 0) {
        dispatch(fetchOffices({ id: newCompanyId }));
        initialLoadRef.current.offices = true;

        if (prev !== newCompanyId) {
          setFieldValue("officeId", 0);
          // Work location is constrained by the company's allowed locations, so a
          // location chosen under the previous company may no longer be valid.
          setFieldValue("workLocation", "");
        }
      } else {
        setFieldValue("officeId", 0);
        setFieldValue("workLocation", "");
      }
    },
    [dispatch, setFieldValue, values.companyId],
  );

  return {
    handleBusinessUnitChange,
    handleTeamChange,
    handleSubTeamChange,
    handleCareerFunctionChange,
    handleCompanyChange,
  };
};
