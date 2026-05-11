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

import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: "build",
  },
  resolve: {
    alias: {
      "@root": resolve(__dirname, "."),
      "@src": resolve(__dirname, "src"),
      "@app": resolve(__dirname, "src/app"),
      "@assets": resolve(__dirname, "src/assets"),
      "@component": resolve(__dirname, "src/component"),
      "@config": resolve(__dirname, "src/config"),
      "@context": resolve(__dirname, "src/context"),
      "@layout": resolve(__dirname, "src/layout"),
      "@slices": resolve(__dirname, "src/slices"),
      "@view": resolve(__dirname, "src/view"),
      "@utils": resolve(__dirname, "src/utils"),
      "@/types": resolve(__dirname, "src/types"),
    },
  },
});
