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

import { EmergencyContact, EmployeeStatus, State } from "@/types/types";
import { AppConfig } from "@config/config";
import {
  DEFAULT_LIMIT_VALUE,
  DEFAULT_OFFSET_VALUE,
  SnackMessage,
} from "@config/constant";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { APIService } from "@utils/apiService";
import { HttpStatusCode, isCancel } from "axios";

export interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail: string | null;
  secondaryJobTitle: string | null;
  jobRole: string | null;
  externalDesignation: string | null;
  epf: string;
  workLocation: string;
  startDate: string;
  managerEmail: string;
  managerName: string | null;
  additionalManagerEmails: string | null;
  gender: string | null;
  continuousServiceDate: string | null;
  jobBand: number | null;
  employeeStatus: EmployeeStatus;
  probationEndDate: string | null;
  agreementEndDate: string | null;
  resignationDate: string | null;
  finalDayInOffice: string | null;
  finalDayOfEmployment: string | null;
  resignationReason: string | null;
  employmentType: string;
  designation: string;
  company: string;
  office: string | null;
  businessUnit: string;
  team: string;
  subTeam: string | null;
  unit: string | null;
  subordinateCount: number;
  employmentTypeId: number;
  careerFunctionId: number;
  designationId: number;
  companyId: number;
  officeId: number | null;
  businessUnitId: number;
  teamId: number;
  subTeamId: number | null;
  unitId: number | null;
  house: string | null;
  houseId: number | null;
}

export interface EmployeeBasicInfo {
  employeeId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail?: string;
}

export interface Manager {
  employeeId: string;
  workEmail: string;
}

export type CreatePersonalInfoPayload = {
  nicOrPassport: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  title?: string;
  gender?: string;
  dob?: string;
  personalEmail?: string;
  personalPhone?: string;
  residentNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateOrProvince?: string;
  postalCode?: string;
  country?: string;
  nationality?: string;
  emergencyContacts?: EmergencyContact[];
};

export type FilteredEmployeesResponse = {
  employees: Employee[];
  totalCount: number;
};

export interface EmployeeQrInfo {
  employeeId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  employeeThumbnail: string | null;
  house: string | null;
  houseId: number | null;
  employeeStatus: EmployeeStatus;
}

export type QrEmployeesResponse = {
  employees: EmployeeQrInfo[];
  totalCount: number;
};

export type QrCodeSearchFilters = {
  employeeStatus?: EmployeeStatus;
};

export type QrCodeSearchPayload = {
  searchString?: string;
  filters: QrCodeSearchFilters;
  pagination: { limit: number; offset: number };
  sort: { sortField: string; sortOrder: string };
};

export type Filters = {
  businessUnitId?: number;
  teamId?: number;
  subTeamId?: number;
  unitId?: number;
  careerFunctionId?: number;
  designationId?: number;
  companyId?: number;
  officeId?: number;
  employmentTypeId?: number;
  employmentTypeIds?: number[];
  managerEmail?: string;
  gender?: string;
  employeeStatus?: EmployeeStatus;
  employeeStatuses?: EmployeeStatus[];
  directReports?: boolean;
  excludeFutureStartDate?: boolean;
  includeMarkedLeavers?: boolean;
};

export type Pagination = {
  limit?: number;
  offset?: number;
};

export type Sort = {
  sortField: string;
  sortOrder: "ASC" | "DESC";
};

export type EmployeeSearchPayload = {
  searchString?: string;
  filters: Filters;
  pagination: Pagination;
  sort: Sort;
  leadOnly?: boolean;
};

export type CreateEmployeePayload = {
  firstName: string;
  lastName: string;
  epf?: string;
  secondaryJobTitle?: string;
  jobRole?: string | null;
  externalDesignation?: string | null;
  workLocation: string;
  workEmail: string;
  startDate: string;
  managerEmail: string;
  additionalManagerEmails?: string[];
  employeeThumbnail?: string;
  subordinateCount?: number;
  probationEndDate?: string;
  agreementEndDate?: string;
  employmentTypeId?: number;
  employeeId?: string;
  designationId: number;
  companyId: number;
  officeId?: number;
  teamId: number;
  subTeamId?: number;
  businessUnitId: number;
  unitId?: number;
  houseId?: number;
  continuousServiceRecord?: string | null;
  personalInfo: CreatePersonalInfoPayload;
};

export type CreateEmployeeResponse = {
  employeeId: number;
  message: string;
  hasGroupAssignmentWarning: boolean;
};

export type UpdateEmployeeJobInfoPayload = {
  epf?: string | null;
  workLocation?: string;
  workEmail?: string;
  startDate?: string;
  secondaryJobTitle?: string;
  jobRole?: string | null;
  externalDesignation?: string | null;
  managerEmail?: string;
  additionalManagerEmails?: string[];
  employeeThumbnail?: string | null;
  probationEndDate?: string | null;
  agreementEndDate?: string | null;
  employmentTypeId?: number | null;
  designationId?: number | null;
  companyId?: number | null;
  officeId?: number | null;
  teamId?: number | null;
  subTeamId?: number | null;
  businessUnitId?: number | null;
  unitId?: number | null;
  houseId?: number | null;
  continuousServiceRecord?: string | null;
  employeeStatus?: EmployeeStatus | null;
  finalDayInOffice?: string | null;
  finalDayOfEmployment?: string | null;
  resignationReason?: string | null;
};

export interface ContinuousServiceRecordInfo {
  employeeId: string;
  firstName: string | null;
  lastName: string | null;
  workLocation: string;
  startDate: string;
  managerEmail: string;
  additionalManagerEmails?: string | null;
  designation: string;
  secondaryJobTitle?: string | null;
  company: string;
  office?: string | null;
  businessUnit: string;
  team: string;
  subTeam: string | null;
  unit?: string | null;
}

interface EmployeesState {
  state: State;
  employeeBasicInfoState: State;
  managers: Manager[];
  managersState: State;
  employeeFilter: EmployeeSearchPayload;
  filteredEmployeesResponseState: State;
  filterAppliedOnce: boolean;
  stateMessage: string | null;
  errorMessage: string | null;
  employee: Employee | null;
  employeesBasicInfo: EmployeeBasicInfo[];
  filteredEmployeesResponse: FilteredEmployeesResponse;
  continuousServiceRecord: ContinuousServiceRecordInfo[];
  updateJobInfoState: State;
  updateJobInfoMessage: string | null;
  totalActiveEmployeeCount: number | null;
  qrCodeUrl: string | null;
  qrCodeState: State;
}

const initialState: EmployeesState = {
  state: State.idle,
  employeeBasicInfoState: State.idle,
  managers: [],
  managersState: State.idle,
  employeeFilter: {
    filters: {
      employeeStatuses: [EmployeeStatus.Active, EmployeeStatus.MarkedLeaver],
      excludeFutureStartDate: true,
    },
    pagination: {
      limit: DEFAULT_LIMIT_VALUE,
      offset: DEFAULT_OFFSET_VALUE,
    },
    sort: {
      sortField: "employeeId",
      sortOrder: "ASC",
    },
  },
  filteredEmployeesResponseState: State.idle,
  filterAppliedOnce: false,
  stateMessage: null,
  errorMessage: null,
  employee: null,
  employeesBasicInfo: [],
  filteredEmployeesResponse: {
    employees: [],
    totalCount: 0,
  },
  continuousServiceRecord: [],
  updateJobInfoState: State.idle,
  updateJobInfoMessage: null,
  totalActiveEmployeeCount: null,
  qrCodeUrl: null,
  qrCodeState: State.idle,
};

export const fetchEmployee = createAsyncThunk(
  "employees/fetchEmployee",
  async (employeeId: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().get(
        AppConfig.serviceUrls.employee(employeeId),
      );
      return response.data as Employee;
    } catch (error: any) {
      if (isCancel(error)) return rejectWithValue("cancelled");
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? SnackMessage.error.fetchEmployee
          : error.response?.data?.message ||
            "An unknown error occurred while fetching employee information.";

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );

      return rejectWithValue(errorMessage);
    }
  },
);

export const fetchEmployeesBasicInfo = createAsyncThunk(
  "employees/fetchEmployeesBasicInfo",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const resp = await APIService.getInstance().get(
        `${AppConfig.serviceUrls.employeesBasicInfo}`,
      );
      return resp.data as EmployeeBasicInfo[];
    } catch (error: any) {
      if (isCancel(error)) return rejectWithValue("cancelled");
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? "Error fetching employees' basic information"
          : error.response?.data?.message ||
            "An unknown error occurred while fetching employees' basic information.";
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );

      return rejectWithValue(errorMessage);
    }
  },
);

export const fetchManagers = createAsyncThunk<Manager[]>(
  "employees/fetchManagers",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const resp = await APIService.getInstance().get(
        `${AppConfig.serviceUrls.managers}`,
      );
      return resp.data as Manager[];
    } catch (error: any) {
      if (isCancel(error)) return rejectWithValue("cancelled");
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? "Error fetching manager emails"
          : error.response?.data?.message ||
            "An unknown error occurred while fetching manager emails.";
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      return rejectWithValue(errorMessage);
    }
  },
);

export const fetchFilteredEmployees = createAsyncThunk<
  FilteredEmployeesResponse,
  EmployeeSearchPayload
>(
  "employees/fetchFilteredEmployees",
  async (
    filterAttributes: EmployeeSearchPayload,
    { dispatch, rejectWithValue },
  ) => {
    try {
      const response = await APIService.getInstance().post(
        AppConfig.serviceUrls.searchEmployees,
        filterAttributes,
      );
      return response.data as FilteredEmployeesResponse;
    } catch (error: any) {
      if (isCancel(error)) return rejectWithValue("cancelled");
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? SnackMessage.error.fetchEmployees
          : error.response?.data?.message ||
            "An unknown error occurred while fetching employees.";

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );

      return rejectWithValue(errorMessage);
    }
  },
);

export const fetchQrCodeEmployees = createAsyncThunk<
  QrEmployeesResponse,
  QrCodeSearchPayload
>(
  "employees/fetchQrCodeEmployees",
  async (filterAttributes, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().post(
        AppConfig.serviceUrls.qrCodesSearch,
        filterAttributes,
      );
      return response.data as QrEmployeesResponse;
    } catch (error: any) {
      if (isCancel(error)) return rejectWithValue("cancelled");
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? SnackMessage.error.fetchEmployees
          : error.response?.data?.message ||
            "An unknown error occurred while fetching employees.";
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      return rejectWithValue(errorMessage);
    }
  },
);

export const createEmployee = createAsyncThunk(
  "employees/createEmployee",
  async (payload: CreateEmployeePayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().post(
        AppConfig.serviceUrls.employees,
        payload,
      );
      const data = response.data as CreateEmployeeResponse;
      const employeeId = data.employeeId;
      const message = data.message || "Employee created successfully!";
      const messageType = data.hasGroupAssignmentWarning ? "warning" : "success";
      dispatch(
        enqueueSnackbarMessage({
          message,
          type: messageType,
        }),
      );
      return employeeId;
    } catch (error: any) {
      if (isCancel(error)) return rejectWithValue("cancelled");
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? SnackMessage.error.addEmployee
          : error.response?.data?.message ||
            "Failed to create employee. Please try again.";
      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );
      return rejectWithValue(errorMessage);
    }
  },
);

export const updateEmployeeJobInfo = createAsyncThunk(
  "employees/updateEmployeeJobInfo",
  async (
    params: { employeeId: string; payload: UpdateEmployeeJobInfoPayload },
    { dispatch, rejectWithValue },
  ) => {
    try {
      await APIService.getInstance().patch(
        AppConfig.serviceUrls.jobInfo(params.employeeId),
        params.payload,
      );

      dispatch(
        enqueueSnackbarMessage({
          message: "Job information updated successfully!",
          type: "success",
        }),
      );

      return;
    } catch (error: any) {
      if (isCancel(error)) return rejectWithValue("cancelled");
      const errorMessage =
        error.response?.status === HttpStatusCode.InternalServerError
          ? "Failed to update employee job information"
          : error.response?.data?.message ||
            "An unknown error occurred while updating job information.";

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );

      return rejectWithValue(errorMessage);
    }
  },
);

export const downloadEmployeeReportByStatus = createAsyncThunk(
  "employee/downloadEmployeeReportByStatus",
  async (
    { filters, columns }: { filters: Filters; columns?: string[] },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const response = await APIService.getInstance().post(
        AppConfig.serviceUrls.reportsEmployees,
        { filters, ...(columns && columns.length > 0 ? { columns } : {}) },
        { responseType: "text" },
      );
      return response.data as string;
    } catch (error: any) {
      if (isCancel(error)) return rejectWithValue("cancelled");
      const errorMessage =
        error.response?.data?.message ?? "Failed to download report";
      dispatch(
        enqueueSnackbarMessage({ message: errorMessage, type: "error" }),
      );
      return rejectWithValue(errorMessage);
    }
  },
);

export const fetchContinuousServiceRecord = createAsyncThunk(
  "employees/fetchContinuousServiceRecord",
  async (workEmail: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().get(
        `${
          AppConfig.serviceUrls.continuousServiceRecord
        }?workEmail=${encodeURIComponent(workEmail)}`,
      );
      return response.data as ContinuousServiceRecordInfo[];
    } catch (error: any) {
      if (isCancel(error)) return rejectWithValue("cancelled");
      const status = error.response?.status;
      const errorMessage =
        status === HttpStatusCode.InternalServerError
          ? "Error fetching continuous service record"
          : error.response?.data?.message ||
            "An unknown error occurred while fetching continuous service record";

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );

      return rejectWithValue(errorMessage);
    }
  },
);

export const validateEpf = createAsyncThunk(
  "employees/validateEpf",
  async (epf: string, { dispatch, rejectWithValue }) => {
    try {
      const resp = await APIService.getInstance().post(
        AppConfig.serviceUrls.validateEpf,
        { epf },
      );
      return (resp?.data?.epfExists ?? false) as boolean;
    } catch (error: any) {
      if (isCancel(error)) return rejectWithValue("cancelled");
      const status = error.response?.status;
      const errorMessage =
        status === HttpStatusCode.InternalServerError
          ? "Error validating EPF"
          : error.response?.data?.message || "Failed to validate EPF";

      dispatch(
        enqueueSnackbarMessage({
          message: errorMessage,
          type: "error",
        }),
      );

      return rejectWithValue(errorMessage);
    }
  },
);

export const fetchEmployeeQrCode = createAsyncThunk(
  "employee/fetchEmployeeQrCode",
  async (employeeId: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await APIService.getInstance().get(
        AppConfig.serviceUrls.employeeQrCode(employeeId),
        { responseType: "blob" },
      );
      return URL.createObjectURL(response.data as Blob);
    } catch (error: any) {
      if (isCancel(error)) return rejectWithValue("cancelled");
      const errorMessage =
        error.response?.data?.message ?? "Failed to generate QR code";
      dispatch(
        enqueueSnackbarMessage({ message: errorMessage, type: "error" }),
      );
      return rejectWithValue(errorMessage);
    }
  },
);

const EmployeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    setEmployeeFilter(state, action: PayloadAction<EmployeeSearchPayload>) {
      state.employeeFilter = action.payload;
    },
    setFilterAppliedOnce(state, action: PayloadAction<boolean>) {
      state.filterAppliedOnce = action.payload;
    },
    resetSubmitState(state) {
      state.state = State.idle;
    },
    resetEmployee(state) {
      state.state = State.idle;
      state.stateMessage = null;
      state.errorMessage = null;
      state.employee = null;
      state.employeesBasicInfo = [];
      state.continuousServiceRecord = [];
      state.updateJobInfoState = State.idle;
      state.updateJobInfoMessage = null;
    },
    resetCreateEmployeeState(state) {
      state.state = State.idle;
      state.stateMessage = null;
      state.errorMessage = null;
    },
    resetUpdateEmployeeJobInfoState(state) {
      state.updateJobInfoState = State.idle;
      state.updateJobInfoMessage = null;
    },
    resetContinuousService(state) {
      state.continuousServiceRecord = [];
      state.state = State.idle;
      state.stateMessage = null;
      state.errorMessage = null;
    },
    clearFilteredEmployees(state) {
      state.filteredEmployeesResponse = { employees: [], totalCount: 0 };
      state.filteredEmployeesResponseState = State.idle;
    },
    resetQrCode(state) {
      if (state.qrCodeUrl) URL.revokeObjectURL(state.qrCodeUrl);
      state.qrCodeUrl = null;
      state.qrCodeState = State.idle;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployee.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching employee data...";
      })
      .addCase(fetchEmployee.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched employee information!";
        state.employee = action.payload;
        state.errorMessage = null;
      })
      .addCase(fetchEmployee.rejected, (state, action) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch employee information!";
        state.errorMessage = action.payload as string;
        state.employee = null;
      })
      .addCase(fetchEmployeesBasicInfo.pending, (state) => {
        state.employeeBasicInfoState = State.loading;
        state.stateMessage = "Fetching employees' basic information...";
        state.errorMessage = null;
      })
      .addCase(fetchEmployeesBasicInfo.fulfilled, (state, action) => {
        state.employeesBasicInfo = action.payload;
        state.employeeBasicInfoState = State.success;
        state.stateMessage =
          "Employees' basic information fetched successfully";
        state.errorMessage = null;
      })
      .addCase(fetchEmployeesBasicInfo.rejected, (state, action) => {
        state.employeeBasicInfoState = State.failed;
        state.errorMessage = action.payload as string;
        state.stateMessage = null;
      })
      .addCase(fetchFilteredEmployees.pending, (state, action) => {
        state.filteredEmployeesResponseState = State.loading;
        state.stateMessage = "Fetching filtered employees...";
        state.errorMessage = null;
      })
      .addCase(fetchFilteredEmployees.fulfilled, (state, action) => {
        state.filteredEmployeesResponse = action.payload;
        state.filteredEmployeesResponseState = State.success;
        state.stateMessage = "Filtered employees fetched successfully";
        state.errorMessage = null;
        const { searchString, filters } = action.meta.arg;
        // Capture the baseline count on the default query (Active + Marked leaver, no other filters).
        const statuses = filters.employeeStatuses ?? [];
        const isBaselineQuery =
          !searchString &&
          filters.excludeFutureStartDate === true &&
          statuses.length === 2 &&
          statuses.includes(EmployeeStatus.Active) &&
          statuses.includes(EmployeeStatus.MarkedLeaver) &&
          Object.entries(filters).every(([key, value]) => {
            return key === "employeeStatuses" || key === "excludeFutureStartDate" || value === undefined;
          });
        if (isBaselineQuery) {
          state.totalActiveEmployeeCount = action.payload.totalCount;
        }
      })
      .addCase(fetchFilteredEmployees.rejected, (state, action) => {
        state.filteredEmployeesResponseState = State.failed;
        state.errorMessage = action.payload as string;
        state.stateMessage = null;
      })
      .addCase(createEmployee.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Creating employee...";
        state.errorMessage = null;
      })
      .addCase(
        createEmployee.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.state = State.success;
          state.stateMessage = "Employee created successfully!";
          state.errorMessage = null;
        },
      )
      .addCase(createEmployee.rejected, (state, action) => {
        state.state = State.failed;
        state.stateMessage = "Failed to create employee.";
        state.errorMessage = action.payload as string;
      })
      .addCase(updateEmployeeJobInfo.pending, (state) => {
        state.updateJobInfoState = State.loading;
        state.updateJobInfoMessage = "Updating job information...";
        state.errorMessage = null;
      })
      .addCase(updateEmployeeJobInfo.fulfilled, (state) => {
        state.updateJobInfoState = State.success;
        state.updateJobInfoMessage = "Job information updated successfully!";
        state.errorMessage = null;
      })
      .addCase(updateEmployeeJobInfo.rejected, (state, action) => {
        state.updateJobInfoState = State.failed;
        state.updateJobInfoMessage = "Failed to update job information!";
        state.errorMessage = action.payload as string;
      })
      .addCase(fetchManagers.pending, (state) => {
        state.managersState = State.loading;
        state.errorMessage = null;
      })
      .addCase(fetchManagers.fulfilled, (state, action) => {
        state.managersState = State.success;
        state.managers = action.payload;
        state.errorMessage = null;
      })
      .addCase(fetchManagers.rejected, (state, action) => {
        state.managersState = State.failed;
        state.managers = [];
        state.errorMessage = action.payload as string;
      })
      .addCase(fetchContinuousServiceRecord.pending, (state) => {
        state.state = State.loading;
        state.stateMessage = "Fetching continuous service record...";
        state.errorMessage = null;
      })
      .addCase(fetchContinuousServiceRecord.fulfilled, (state, action) => {
        state.state = State.success;
        state.stateMessage = "Successfully fetched continuous service record!";
        state.continuousServiceRecord = action.payload;
        state.errorMessage = null;
      })
      .addCase(fetchContinuousServiceRecord.rejected, (state, action) => {
        state.state = State.failed;
        state.stateMessage = "Failed to fetch continuous service record!";
        state.errorMessage = action.payload as string;
        state.continuousServiceRecord = [];
      })
      .addCase(fetchEmployeeQrCode.pending, (state) => {
        if (state.qrCodeUrl) URL.revokeObjectURL(state.qrCodeUrl);
        state.qrCodeUrl = null;
        state.qrCodeState = State.loading;
      })
      .addCase(fetchEmployeeQrCode.fulfilled, (state, action) => {
        state.qrCodeState = State.success;
        state.qrCodeUrl = action.payload as string;
      })
      .addCase(fetchEmployeeQrCode.rejected, (state) => {
        if (state.qrCodeUrl) URL.revokeObjectURL(state.qrCodeUrl);
        state.qrCodeState = State.failed;
        state.qrCodeUrl = null;
      });
  },
});

export const {
  setEmployeeFilter,
  setFilterAppliedOnce,
  resetSubmitState,
  resetEmployee,
  resetCreateEmployeeState,
  resetUpdateEmployeeJobInfoState,
  resetContinuousService,
  clearFilteredEmployees,
  resetQrCode,
} = EmployeeSlice.actions;
export default EmployeeSlice.reducer;
