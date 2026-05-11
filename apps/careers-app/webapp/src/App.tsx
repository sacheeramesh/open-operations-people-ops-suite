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

import AppHandler from "@app/AppHandler";
import { StyledEngineProvider, ThemeProvider, createTheme } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import { Provider } from "react-redux";

import { createContext, useEffect, useMemo, useState } from "react";

import { APP_NAME } from "@config/config";
import AppAuthProvider from "@context/AuthContext";
import { store } from "@slices/store";
import { themeSettings } from "@src/theme";
import { ThemeMode } from "@utils/types";

import "./index.css";

export const ColorModeContext = createContext({
  mode: ThemeMode.Light,
  toggleColorMode: () => {},
});

function App() {
  document.title = APP_NAME || "WSO2 Careers";

  const processLocalThemeMode = (): ThemeMode => {
    try {
      const savedTheme = localStorage.getItem("careers-app-theme");
      if (savedTheme === ThemeMode.Light || savedTheme === ThemeMode.Dark) {
        return savedTheme;
      }
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const systemTheme = prefersDark ? ThemeMode.Dark : ThemeMode.Light;
      localStorage.setItem("careers-app-theme", systemTheme);
      return systemTheme;
    } catch (err) {
      return ThemeMode.Light;
    }
  };

  const [mode, setMode] = useState<ThemeMode>(processLocalThemeMode());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        const newMode = mode === ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light;
        localStorage.setItem("careers-app-theme", newMode);
        setMode(newMode);
        document.documentElement.setAttribute("data-theme", newMode);
      },
    }),
    [mode],
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <StyledEngineProvider injectFirst>
        <SnackbarProvider maxSnack={3} preventDuplicate>
          <ThemeProvider theme={theme}>
            <Provider store={store}>
              <AppAuthProvider>
                <AppHandler />
              </AppAuthProvider>
            </Provider>
          </ThemeProvider>
        </SnackbarProvider>
      </StyledEngineProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
