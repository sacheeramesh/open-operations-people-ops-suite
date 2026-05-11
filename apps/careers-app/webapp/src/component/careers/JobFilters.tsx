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

import { Department, ExperienceLevel } from "@config/constant";

export interface JobFilterValues {
  location: string;
  department: string;
  experienceLevel: string;
}

interface JobFiltersProps {
  filters: JobFilterValues;
  onChange: (filters: JobFilterValues) => void;
}

const locations = ["All Locations", "Sri Lanka", "Remote", "USA", "UK"];

const JobFilters = ({ filters, onChange }: JobFiltersProps) => {
  const handleChange = (key: keyof JobFilterValues) => (e: SelectChangeEvent) => {
    onChange({ ...filters, [key]: e.target.value });
  };

  const handleReset = () => {
    onChange({ location: "", department: "", experienceLevel: "" });
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
          {locations.slice(1).map((l) => (
            <MenuItem key={l} value={l}>
              {l}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Department</InputLabel>
        <Select
          value={filters.department}
          label="Department"
          onChange={handleChange("department")}
          sx={{ borderRadius: "8px" }}
        >
          <MenuItem value="">All Departments</MenuItem>
          {Object.values(Department).map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Experience Level</InputLabel>
        <Select
          value={filters.experienceLevel}
          label="Experience Level"
          onChange={handleChange("experienceLevel")}
          sx={{ borderRadius: "8px" }}
        >
          <MenuItem value="">All Levels</MenuItem>
          {Object.values(ExperienceLevel).map((e) => (
            <MenuItem key={e} value={e}>
              {e}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {(filters.location || filters.department || filters.experienceLevel) && (
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
