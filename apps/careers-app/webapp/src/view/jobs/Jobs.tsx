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
  CircularProgress,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuthContext } from "@asgardeo/auth-react";

import ApplyModal from "@component/careers/ApplyModal";
import JobCard from "@component/careers/JobCard";
import JobFilters, { JobFilterValues } from "@component/careers/JobFilters";
import { State } from "@/types/types";
import { Job } from "@/types/types";
import { loadJobs, loadOrgStructure } from "@slices/careersSlice/careers";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";

const Jobs = () => {
  const dispatch = useAppDispatch();
  const { getAccessToken } = useAuthContext();
  const jobs = useAppSelector((state: RootState) => state.careers.jobs);
  const jobsState = useAppSelector((state: RootState) => state.careers.jobsState);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<JobFilterValues>({
    location: "",
    team: "",
    jobType: "",
  });
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  useEffect(() => {
    getAccessToken()
      .then((token) => {
        dispatch(loadJobs(token));
        dispatch(loadOrgStructure(token));
      })
      .catch(() => {
        dispatch({ type: "careers/loadJobs/rejected" });
      });
  }, [dispatch, getAccessToken]);

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        !search ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.team.toLowerCase().includes(search.toLowerCase());

      const matchesLocation =
        !filters.location ||
        job.country.some((c) => c.toLowerCase() === filters.location.toLowerCase());

      const matchesTeam = !filters.team || job.team === filters.team;

      const matchesJobType = !filters.jobType || job.jobType === filters.jobType;

      return matchesSearch && matchesLocation && matchesTeam && matchesJobType;
    });
  }, [jobs, search, filters]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5} color="text.primary">
        Browse Jobs
      </Typography>
      <Typography color="text.secondary" fontSize="14px" mb={3}>
        {jobs.length} open positions across all teams.
      </Typography>

      {/* Search & Filters */}
      <Stack gap={2} mb={3}>
        <TextField
          placeholder="Search by job title or team..."
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

      {/* Loading */}
      {jobsState === State.loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={32} sx={{ color: "#FF7300" }} />
        </Box>
      )}

      {/* Error */}
      {jobsState === State.failed && (
        <Box
          sx={{
            py: 8,
            textAlign: "center",
            border: "1px dashed",
            borderColor: "error.light",
            borderRadius: "12px",
          }}
        >
          <Typography color="error">Failed to load jobs. Please try again later.</Typography>
        </Box>
      )}

      {/* Results */}
      {jobsState === State.success && (
        <>
          <Typography fontSize="13px" color="text.secondary" mb={2}>
            Showing {filtered.length} of {jobs.length} jobs
          </Typography>

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
        </>
      )}

      <ApplyModal job={applyJob} open={!!applyJob} onClose={() => setApplyJob(null)} />
    </Box>
  );
};

export default Jobs;
