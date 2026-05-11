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
  Box,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import ApplyModal from "@component/careers/ApplyModal";
import JobCard from "@component/careers/JobCard";
import JobFilters, { JobFilterValues } from "@component/careers/JobFilters";
import { Job } from "@/types/types";
import { RootState, useAppSelector } from "@slices/store";

const Jobs = () => {
  const jobs = useAppSelector((state: RootState) => state.careers.jobs);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<JobFilterValues>({
    location: "",
    department: "",
    experienceLevel: "",
  });
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        !search ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.department.toLowerCase().includes(search.toLowerCase());

      const matchesLocation =
        !filters.location ||
        job.location.toLowerCase().includes(filters.location.toLowerCase()) ||
        (filters.location === "Remote" && job.isRemote);

      const matchesDept = !filters.department || job.department === filters.department;

      const matchesExp = !filters.experienceLevel || job.experienceLevel === filters.experienceLevel;

      return matchesSearch && matchesLocation && matchesDept && matchesExp;
    });
  }, [jobs, search, filters]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5} color="text.primary">
        Browse Jobs
      </Typography>
      <Typography color="text.secondary" fontSize="14px" mb={3}>
        {jobs.length} open positions across all departments.
      </Typography>

      {/* Search & Filters */}
      <Stack gap={2} mb={3}>
        <TextField
          placeholder="Search by job title or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color="#9CA3AF" />
              </InputAdornment>
            ),
            sx: { borderRadius: "10px" },
          }}
        />
        <JobFilters filters={filters} onChange={setFilters} />
      </Stack>

      {/* Results count */}
      <Typography fontSize="13px" color="text.secondary" mb={2}>
        Showing {filtered.length} of {jobs.length} jobs
      </Typography>

      {/* Job Grid */}
      {filtered.length === 0 ? (
        <Box
          sx={{
            py: 8,
            textAlign: "center",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: "12px",
          }}
        >
          <Typography color="text.secondary">
            No jobs match your search. Try adjusting the filters.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((job) => (
            <Grid key={job.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <JobCard job={job} onApply={setApplyJob} />
            </Grid>
          ))}
        </Grid>
      )}

      <ApplyModal job={applyJob} open={!!applyJob} onClose={() => setApplyJob(null)} />
    </Box>
  );
};

export default Jobs;
