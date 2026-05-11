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

import { Box, Button, Card, CardContent, Grid, Typography } from "@mui/material";
import { BookmarkBorderOutlined } from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ApplyModal from "@component/careers/ApplyModal";
import JobCard from "@component/careers/JobCard";
import { Job } from "@/types/types";
import { RootState, useAppSelector } from "@slices/store";

const SavedJobs = () => {
  const navigate = useNavigate();
  const jobs = useAppSelector((state: RootState) => state.careers.jobs);
  const savedJobIds = useAppSelector((state: RootState) => state.careers.savedJobIds);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  const savedJobs = jobs.filter((j) => savedJobIds.includes(j.id));

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5} color="text.primary">
        Saved Jobs
      </Typography>
      <Typography color="text.secondary" fontSize="14px" mb={3}>
        Jobs you&apos;ve bookmarked for later.
      </Typography>

      {savedJobs.length === 0 ? (
        <Card
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px" }}
        >
          <CardContent sx={{ py: 8, textAlign: "center" }}>
            <BookmarkBorderOutlined sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" fontWeight={600} mb={1} color="text.primary">
              No Saved Jobs
            </Typography>
            <Typography color="text.secondary" mb={3} fontSize="14px">
              Save jobs you&apos;re interested in by clicking the bookmark icon on any job card.
            </Typography>
            <Button variant="contained" onClick={() => navigate("/jobs")}>
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {savedJobs.map((job) => (
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

export default SavedJobs;
