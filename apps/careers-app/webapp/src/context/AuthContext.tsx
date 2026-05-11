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

import { useIdleTimer } from "react-idle-timer";

import React, { useCallback, useContext, useState } from "react";

import PreLoader from "@component/common/PreLoader";
import SessionWarningDialog from "@component/common/SessionWarningDialog";
import LoginScreen from "@component/ui/LoginScreen";
import { setUserAuthData } from "@slices/authSlice/auth";
import { useAppDispatch } from "@slices/store";
import { setUserInfo } from "@slices/userSlice/user";
import { mockCandidateProfile } from "@utils/mockData";

type AuthContextType = {
  appSignIn: () => void;
  appSignOut: () => void;
};

enum AppState {
  Unauthenticated = "unauthenticated",
  Authenticating = "authenticating",
  Authenticated = "authenticated",
}

const AuthContext = React.createContext<AuthContextType>({} as AuthContextType);

const timeout = 15 * 60 * 1000;
const promptBeforeIdle = 4_000;

const AppAuthProvider = (props: { children: React.ReactNode }) => {
  const [sessionWarningOpen, setSessionWarningOpen] = useState<boolean>(false);
  const [appState, setAppState] = useState<AppState>(AppState.Unauthenticated);

  const dispatch = useAppDispatch();

  const onPrompt = () => {
    appState === AppState.Authenticated && setSessionWarningOpen(true);
  };

  const { activate } = useIdleTimer({
    onPrompt,
    timeout,
    promptBeforeIdle,
    throttle: 500,
  });

  const handleContinue = () => {
    setSessionWarningOpen(false);
    activate();
  };

  const setupMockUser = useCallback(() => {
    dispatch(
      setUserAuthData({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userInfo: { username: mockCandidateProfile.email } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        decodedIdToken: { sub: mockCandidateProfile.personId } as any,
      }),
    );
    dispatch(
      setUserInfo({
        personId: mockCandidateProfile.personId,
        firstName: mockCandidateProfile.firstName,
        lastName: mockCandidateProfile.lastName,
        workEmail: mockCandidateProfile.email,
        employeeThumbnail: null,
        jobRole: mockCandidateProfile.currentRole,
      }),
    );
  }, [dispatch]);

  const appSignIn = useCallback(async () => {
    setAppState(AppState.Authenticating);
    // Simulate auth delay for demo realism
    await new Promise((r) => setTimeout(r, 1200));
    setupMockUser();
    setAppState(AppState.Authenticated);
  }, [setupMockUser]);

  const appSignOut = useCallback(() => {
    setAppState(AppState.Unauthenticated);
  }, []);

  const authContext: AuthContextType = { appSignIn, appSignOut };

  const renderContent = () => {
    switch (appState) {
      case AppState.Authenticating:
        return <PreLoader isLoading message="Setting up your Candidate Passport ..." />;

      case AppState.Authenticated:
        return <AuthContext.Provider value={authContext}>{props.children}</AuthContext.Provider>;

      case AppState.Unauthenticated:
      default:
        return (
          <AuthContext.Provider value={authContext}>
            <LoginScreen />
          </AuthContext.Provider>
        );
    }
  };

  return (
    <>
      <SessionWarningDialog
        open={sessionWarningOpen}
        handleContinue={handleContinue}
        appSignOut={appSignOut}
      />
      {renderContent()}
    </>
  );
};

const useAppAuthContext = (): AuthContextType => useContext(AuthContext);

export { useAppAuthContext };
export default AppAuthProvider;
