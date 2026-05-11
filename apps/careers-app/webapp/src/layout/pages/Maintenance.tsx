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

import { Box, Typography } from "@mui/material";

export default function MaintenancePage() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: 2,
        textAlign: "center",
        px: 3,
      }}
    >
      <Typography variant="h4" fontWeight={700}>
        Under Maintenance
      </Typography>
      <Typography color="text.secondary" maxWidth={400}>
        WSO2 Careers Platform is undergoing scheduled maintenance. Please check back shortly.
      </Typography>
    </Box>
  );
}
