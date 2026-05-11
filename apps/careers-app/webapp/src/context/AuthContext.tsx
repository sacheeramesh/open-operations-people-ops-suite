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

import { useAuthContext } from "@asgardeo/auth-react";
import { useIdleTimer } from "react-idle-timer";

import React, { useCallback, useContext, useEffect, useState } from "react";

import PreLoader from "@component/common/PreLoader";
import SessionWarningDialog from "@component/common/SessionWarningDialog";
import LoginScreen from "@component/ui/LoginScreen";
import { setUserAuthData } from "@slices/authSlice/auth";
import { useAppDispatch } from "@slices/store";
import { setUserInfo } from "@slices/userSlice/user";

type AuthContextType = {
  appSignIn: () => void;
  appSignOut: () => void;
};

const AuthContext = React.createContext<AuthContextType>({} as AuthContextType);

const timeout = 15 * 60 * 1000;
const promptBeforeIdle = 4_000;

const AppAuthProvider = (props: { children: React.ReactNode }) => {
  const { signIn, signOut, state, getBasicUserInfo, getDecodedIDToken } = useAuthContext();
  const isAuthenticated = state.isAuthenticated;
  const isLoading = state.isLoading;

  const [sessionWarningOpen, setSessionWarningOpen] = useState<boolean>(false);
  const [userLoaded, setUserLoaded] = useState<boolean>(false);

  const dispatch = useAppDispatch();

  const onPrompt = () => {
    isAuthenticated && setSessionWarningOpen(true);
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

  useEffect(() => {
    if (!isAuthenticated || userLoaded) return;

    const loadUser = async () => {
      try {
        const [userInfo, idToken] = await Promise.all([getBasicUserInfo(), getDecodedIDToken()]);
        dispatch(setUserAuthData({ userInfo, decodedIdToken: idToken }));
        dispatch(
          setUserInfo({
            personId: idToken.sub ?? "",
            firstName: (userInfo.givenName as string) ?? "",
            lastName: (userInfo.familyName as string) ?? "",
            workEmail: (userInfo.email as string) ?? "",
            employeeThumbnail: (userInfo.profile as string) ?? null,
            jobRole: null,
          }),
        );
        setUserLoaded(true);
      } catch {
        signOut();
      }
    };

    loadUser();
  }, [isAuthenticated, userLoaded, getBasicUserInfo, getDecodedIDToken, dispatch]);

  const appSignIn = useCallback(() => {
    signIn();
  }, [signIn]);

  const appSignOut = useCallback(() => {
    setUserLoaded(false);
    signOut();
  }, [signOut]);

  const authContext: AuthContextType = { appSignIn, appSignOut };

  if (isLoading) {
    return <PreLoader isLoading message="Setting up your Candidate Passport ..." />;
  }

  return (
    <AuthContext.Provider value={authContext}>
      <SessionWarningDialog
        open={sessionWarningOpen}
        handleContinue={handleContinue}
        appSignOut={appSignOut}
      />
      {isAuthenticated && userLoaded ? props.children : <LoginScreen />}
    </AuthContext.Provider>
  );
};

const useAppAuthContext = (): AuthContextType => useContext(AuthContext);

export { useAppAuthContext };
export default AppAuthProvider;
