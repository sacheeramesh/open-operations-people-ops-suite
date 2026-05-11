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

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { BookOpen, HelpCircle, Shield, Zap } from "lucide-react";

const Help = () => {
  const items = [
    {
      icon: <Shield size={22} color="#FF7300" />,
      title: "What is a Candidate Passport?",
      desc: "Your Candidate Passport is a persistent professional profile that you build once and use to apply to any WSO2 job. No more filling out forms for every application.",
    },
    {
      icon: <Zap size={22} color="#3B82F6" />,
      title: "How do I apply for a job?",
      desc: "Navigate to Browse Jobs, find a position you like, and click Apply. Your Candidate Passport will be submitted automatically. You can choose which resume version to include.",
    },
    {
      icon: <BookOpen size={22} color="#10B981" />,
      title: "How do I improve my profile?",
      desc: "Visit My Profile to add skills, upload resume versions, and add portfolio links. A higher completion percentage increases your visibility to recruiters.",
    },
    {
      icon: <HelpCircle size={22} color="#8B5CF6" />,
      title: "How can I track my applications?",
      desc: "Visit My Applications to see the status of all your applications in real-time. Statuses include: Applied, Screening, Interview, Offer, and Rejected.",
    },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5} color="text.primary">
        Help & Support
      </Typography>
      <Typography color="text.secondary" fontSize="14px" mb={3}>
        Everything you need to know about the WSO2 Careers Platform.
      </Typography>

      <Stack gap={2}>
        {items.map((item, i) => (
          <Card
            key={i}
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px" }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" gap={2} alignItems="flex-start">
                <Box sx={{ mt: 0.25, flexShrink: 0 }}>{item.icon}</Box>
                <Box>
                  <Typography fontWeight={700} mb={0.75}>
                    {item.title}
                  </Typography>
                  <Typography color="text.secondary" fontSize="14px" lineHeight={1.7}>
                    {item.desc}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Box sx={{ mt: 4, p: 3, borderRadius: "12px", border: "1px solid", borderColor: "divider", backgroundColor: "action.hover" }}>
        <Typography fontWeight={600} mb={1}>
          Need more help?
        </Typography>
        <Typography fontSize="14px" color="text.secondary">
          Contact the People Operations team at{" "}
          <Box component="span" sx={{ color: "#FF7300", fontWeight: 600 }}>
            people-ops@wso2.com
          </Box>
        </Typography>
      </Box>
    </Box>
  );
};

export default Help;
