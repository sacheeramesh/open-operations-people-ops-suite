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

import { DEFAULT_LIMIT_VALUE, PAGE_SIZE_OPTIONS } from "@config/constant";
import { alpha, Avatar, Box, Chip, Skeleton, Tooltip, useTheme } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortItem,
  GridSortModel,
} from "@mui/x-data-grid";
import { EmployeeStatus } from "@/types/types";
import {
  Employee,
  EmployeeSearchPayload,
  fetchFilteredEmployees,
} from "@slices/employeeSlice/employee";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { State } from "@src/types/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MyTeamSearchForm } from "./MyTeamSearchForm";
import { formatDate, getEmployeeStatusColor } from "@utils/utils";

export default function MyTeamTable() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const employeeState = useAppSelector((state) => state.employee);
  const navigate = useNavigate();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: DEFAULT_LIMIT_VALUE,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([]);

  const [filterState, setFilterState] = useState<Pick<EmployeeSearchPayload, "filters" | "searchString">>({
    filters: {
      employeeStatuses: [EmployeeStatus.Active, EmployeeStatus.MarkedLeaver],
      directReports: false,
      excludeFutureStartDate: true,
    },
    searchString: undefined,
  });

  const [filtersAppliedOnce, setFiltersAppliedOnce] = useState(false);

  const [teamActiveCount, setTeamActiveCount] = useState<number | null>(null);

  const sortConfig = useMemo(() => {
    if (sortModel.length === 0) return { sortField: "employeeId", sortOrder: "ASC" as const };
    const sortItem: GridSortItem = sortModel[0];
    return {
      sortField: sortItem.field,
      sortOrder: sortItem.sort?.toUpperCase() === "ASC" ? ("ASC" as const) : ("DESC" as const),
    };
  }, [sortModel]);

  const appliedFilter = useMemo<EmployeeSearchPayload>(
    () => ({
      filters: filterState.filters,
      searchString: filterState.searchString,
      pagination: {
        limit: paginationModel.pageSize,
        offset: paginationModel.page * paginationModel.pageSize,
      },
      sort: sortConfig,
      leadOnly: true,
    }),
    [filterState, paginationModel, sortConfig],
  );

  const handleFilterChange = useCallback(
    (patch: Partial<EmployeeSearchPayload>) => {
      setFilterState((prev) => ({
        filters: patch.filters !== undefined ? patch.filters : prev.filters,
        searchString: "searchString" in patch ? patch.searchString : prev.searchString,
      }));
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    },
    [],
  );

  useEffect(() => {
    dispatch(fetchFilteredEmployees(appliedFilter));
  }, [dispatch, appliedFilter]);

  // Capture team count when only the baseline (Active + Marked leaver) filter is applied.
  // directReports is intentionally excluded: toggling it should still refresh the count.
  const isBaselineFilter = useMemo(() => {
    const { employeeStatuses, directReports: _dr, excludeFutureStartDate, ...rest } = filterState.filters;
    const statuses = employeeStatuses ?? [];
    return (
      excludeFutureStartDate === true &&
      statuses.length === 2 &&
      statuses.includes(EmployeeStatus.Active) &&
      statuses.includes(EmployeeStatus.MarkedLeaver) &&
      !Object.values(rest).some(Boolean) &&
      !filterState.searchString?.trim()
    );
  }, [filterState]);

  useEffect(() => {
    if (!isBaselineFilter) return;
    const count = employeeState.filteredEmployeesResponse.totalCount;
    if (typeof count === "number") {
      setTeamActiveCount(count);
    }
  }, [employeeState.filteredEmployeesResponse.totalCount, isBaselineFilter]);

  const rows: Employee[] = employeeState.filteredEmployeesResponse.employees ?? [];
  const isLoading: boolean = employeeState.filteredEmployeesResponseState === State.loading;

  function getFullName(firstName: string, lastName: string) {
    return `${firstName || ""} ${lastName || ""}`.trim();
  }

  const columns: GridColDef<Employee>[] = useMemo(
    () => [
      {
        field: "employeeId",
        headerName: "Employee ID",
        flex: 0.5,
        width: 100,
        resizable: false,
      },
      {
        field: "fullName",
        headerName: "Employee",
        flex: 1,
        minWidth: 200,
        valueGetter: (_value, row) => getFullName(row.firstName, row.lastName),
        resizable: false,
        renderCell: (params: GridRenderCellParams<Employee>) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
            <Avatar
              src={params.row.employeeThumbnail ?? undefined}
              alt={getFullName(params.row.firstName, params.row.lastName)}
              imgProps={{ referrerPolicy: "no-referrer" }}
              sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}
            >
              {params.row.firstName?.[0]?.toUpperCase() || "E"}
            </Avatar>
            <Box
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {params.value}
            </Box>
          </Box>
        ),
      },
      {
        field: "workEmail",
        headerName: "Email",
        flex: 1,
        minWidth: 220,
        resizable: false,
        renderCell: (params: GridRenderCellParams<Employee>) => (
          <Tooltip title={params.value || ""} arrow>
            <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: theme.palette.text.primary }}>
              {params.value}
            </Box>
          </Tooltip>
        ),
      },
      {
        field: "designation",
        headerName: "Designation",
        flex: 0.8,
        minWidth: 140,
        resizable: false,
        renderCell: (params: GridRenderCellParams<Employee>) => (
          <Tooltip title={params.value || "N/A"} arrow>
            <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: theme.palette.text.primary }}>
              {params.value || "N/A"}
            </Box>
          </Tooltip>
        ),
      },
      {
        field: "externalDesignation",
        headerName: "External Designation",
        flex: 0.8,
        minWidth: 140,
        resizable: false,
        renderCell: (params: GridRenderCellParams<Employee>) => (
          <Tooltip title={params.value || "N/A"} arrow>
            <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: theme.palette.text.primary }}>
              {params.value || "N/A"}
            </Box>
          </Tooltip>
        ),
      },
      {
        field: "employmentType",
        headerName: "Employment Type",
        flex: 0.8,
        minWidth: 120,
        resizable: false,
        renderCell: (params: GridRenderCellParams<Employee>) => (
          <Tooltip title={params.value || "N/A"} arrow>
            <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: theme.palette.text.primary }}>
              {params.value || "N/A"}
            </Box>
          </Tooltip>
        ),
      },
      {
        field: "startDate",
        headerName: "Start Date",
        width: 120,
        resizable: false,
        valueGetter: (_value, row) => formatDate(row.startDate, "-"),
        renderCell: (params: GridRenderCellParams<Employee>) => (
          <Box sx={{ color: theme.palette.text.primary }}>{params.value}</Box>
        ),
      },
      {
        field: "employeeStatus",
        headerName: "Status",
        width: 110,
        resizable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams<Employee>) => (
          <Chip
            label={params.value || "Unknown"}
            variant="outlined"
            size="small"
            color={getEmployeeStatusColor(params.value)}
            sx={{ fontWeight: 700, fontSize: "0.7rem", height: 24, borderRadius: 2, border: 1 }}
          />
        ),
      },
    ],
    [theme],
  );

  const SkeletonRowsOverlay = useMemo(() => {
    return function Overlay() {
      return (
        <Box sx={{ width: "100%", pb: 1 }}>
          {Array.from({ length: paginationModel.pageSize }).map((_, index) => (
            <Box
              key={index}
              sx={{
                display: "grid",
                gridTemplateColumns: columns
                  .map((col) => (col.width ? `${col.width}px` : col.flex ? `${col.flex}fr` : "1fr"))
                  .join(" "),
                alignItems: "center",
                height: 52,
                px: 2,
                gap: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              {columns.map((col, colIndex) => {
                if (col.field === "employeeId") {
                  return (
                    <Box key={colIndex}>
                      <Skeleton variant="rectangular" height={20} width="80%" sx={{ borderRadius: 3 }} />
                    </Box>
                  );
                }
                if (col.field === "fullName") {
                  return (
                    <Box key={colIndex} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Skeleton variant="circular" width={28} height={28} />
                      <Skeleton variant="rectangular" width="60%" height={20} sx={{ borderRadius: 3 }} />
                    </Box>
                  );
                }
                if (col.field === "employeeStatus") {
                  return (
                    <Box key={colIndex} sx={{ display: "flex", justifyContent: "center" }}>
                      <Skeleton variant="rounded" width={80} height={22} sx={{ borderRadius: 3 }} />
                    </Box>
                  );
                }
                return (
                  <Box key={colIndex}>
                    <Skeleton variant="rectangular" width="75%" height={20} sx={{ borderRadius: 3 }} />
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      );
    };
  }, [columns, paginationModel.pageSize, theme.palette.divider]);

  return (
    <Box sx={{ height: "100%", width: "100%", overflow: "auto" }}>
      <Box sx={{ px: 2 }}>
        <MyTeamSearchForm
          filterPayload={appliedFilter}
          filtersAppliedOnce={filtersAppliedOnce}
          teamActiveCount={teamActiveCount}
          onFilterChange={handleFilterChange}
          onFiltersAppliedOnce={setFiltersAppliedOnce}
        />
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr", px: 2, pb: 2 }}>
        <DataGrid
          columns={columns}
          rows={isLoading ? [] : rows}
          getRowId={(row: Employee) => row.employeeId}
          localeText={{ noRowsLabel: "No employees" }}
          pagination
          paginationMode="server"
          rowCount={employeeState.filteredEmployeesResponse.totalCount ?? 0}
          loading={isLoading}
          paginationModel={paginationModel}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPaginationModelChange={(model) => setPaginationModel({ page: model.page, pageSize: model.pageSize })}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={(model) => {
            setSortModel(model);
            setPaginationModel((prev) => ({ ...prev, page: 0 }));
          }}
          onRowClick={(params) => navigate(`/employees/${params.row.employeeId}`, { state: { fromMyTeam: true } })}
          autoHeight={false}
          slots={{ loadingOverlay: SkeletonRowsOverlay }}
          sx={{
            width: "100%",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor:
                theme.palette.mode === "dark" ? theme.palette.grey[800] : theme.palette.grey[100],
              fontSize: "0.875rem",
              fontWeight: 700,
              color: theme.palette.text.primary,
              borderBottom: `0px solid ${theme.palette.divider}`,
              minHeight: "56px !important",
              maxHeight: "56px !important",
            },
            "& .MuiDataGrid-columnHeader": {
              borderBottom: 0,
              backgroundColor: theme.palette.background.paper,
              "&:focus, &:focus-within": { outline: "none" },
            },
            "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
            "& .MuiDataGrid-virtualScroller": {
              ...(isLoading && { minHeight: `${paginationModel.pageSize * 52}px !important` }),
            },
            "& .MuiDataGrid-cell": {
              display: "flex",
              alignItems: "center",
              fontSize: "0.875rem",
              py: 1.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
              borderTop: 0,
              "&:focus, &:focus-within": { outline: "none" },
            },
            "& .MuiDataGrid-row": {
              cursor: "pointer",
              backgroundColor: alpha(theme.palette.background.paper, 0.5),
              transition: "background-color 0.2s ease",
              "&:hover": { backgroundColor: theme.palette.action.hover },
              "&.Mui-selected": {
                backgroundColor: theme.palette.action.selected,
                "&:hover": { backgroundColor: theme.palette.action.focus },
              },
            },
            "& .MuiDataGrid-filler": { display: "none" },
            "& .MuiDataGrid-footerContainer": {
              backgroundColor: theme.palette.background.paper,
              border: 0,
              borderRadius: "0 0 0.25rem 0.25rem",
              minHeight: "52px",
            },
          }}
          slotProps={{ pagination: { labelRowsPerPage: "Rows per page:" } }}
        />
      </Box>
    </Box>
  );
}
