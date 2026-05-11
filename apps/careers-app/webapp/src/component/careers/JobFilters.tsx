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

import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  type SelectChangeEvent,
} from "@mui/material";

import { JOB_TYPES } from "@config/constant";
import { RootState, useAppSelector } from "@slices/store";

export interface JobFilterValues {
  location: string;
  team: string;
  jobType: string;
}

interface JobFiltersProps {
  filters: JobFilterValues;
  onChange: (filters: JobFilterValues) => void;
}

const JobFilters = ({ filters, onChange }: JobFiltersProps) => {
  const { locations, teams } = useAppSelector((state: RootState) => state.careers.orgStructure);

  const handleChange = (key: keyof JobFilterValues) => (e: SelectChangeEvent) => {
    onChange({ ...filters, [key]: e.target.value });
  };

  const handleReset = () => {
    onChange({ location: "", team: "", jobType: "" });
  };

  return (
    <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center">
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Location</InputLabel>
        <Select
          value={filters.location}
          label="Location"
          onChange={handleChange("location")}
          sx={{ borderRadius: "8px" }}
        >
          <MenuItem value="">All Locations</MenuItem>
          {locations.map((l) => (
            <MenuItem key={l} value={l}>
              {l}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Team</InputLabel>
        <Select
          value={filters.team}
          label="Team"
          onChange={handleChange("team")}
          sx={{ borderRadius: "8px" }}
        >
          <MenuItem value="">All Teams</MenuItem>
          {teams.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Job Type</InputLabel>
        <Select
          value={filters.jobType}
          label="Job Type"
          onChange={handleChange("jobType")}
          sx={{ borderRadius: "8px" }}
        >
          <MenuItem value="">All Types</MenuItem>
          {JOB_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {(filters.location || filters.team || filters.jobType) && (
        <Button
          variant="text"
          size="small"
          onClick={handleReset}
          sx={{ fontSize: "12px", color: "text.secondary" }}
        >
          Clear filters
        </Button>
      )}
    </Stack>
  );
};

export default JobFilters;
