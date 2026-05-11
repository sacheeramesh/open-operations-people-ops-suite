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
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { AssignmentOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import ApplicationStatusBadge from "@component/careers/ApplicationStatusBadge";
import { RootState, useAppSelector } from "@slices/store";

const Applications = () => {
  const navigate = useNavigate();
  const applications = useAppSelector((state: RootState) => state.careers.applications);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5} color="text.primary">
        My Applications
      </Typography>
      <Typography color="text.secondary" fontSize="14px" mb={3}>
        Track the status of all your job applications.
      </Typography>

      {applications.length === 0 ? (
        <Card
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px" }}
        >
          <CardContent sx={{ py: 8, textAlign: "center" }}>
            <AssignmentOutlined sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" fontWeight={600} mb={1} color="text.primary">
              No Applications Yet
            </Typography>
            <Typography color="text.secondary" mb={3} fontSize="14px">
              You haven&apos;t applied to any positions. Start exploring open roles!
            </Typography>
            <Button variant="contained" onClick={() => navigate("/jobs")}>
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px" }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, fontSize: "13px", py: 1.5 } }}>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Applied Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.map((app) => (
                  <TableRow
                    key={app.id}
                    sx={{
                      "&:hover": { backgroundColor: "action.hover" },
                      "& td": { fontSize: "13px", py: 1.75 },
                    }}
                  >
                    <TableCell>
                      <Typography fontWeight={600} fontSize="14px">
                        {app.jobTitle}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{app.department}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{app.appliedDate}</TableCell>
                    <TableCell>
                      <ApplicationStatusBadge status={app.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => navigate(`/jobs/${app.jobId}`)}
                        sx={{ fontSize: "12px", fontWeight: 600 }}
                      >
                        View Job
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontSize="13px" color="text.secondary">
                Total: {applications.length} application{applications.length !== 1 ? "s" : ""}
              </Typography>
            </Stack>
          </Box>
        </Card>
      )}
    </Box>
  );
};

export default Applications;
