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

import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import SendIcon from "@mui/icons-material/Send";
import LoadingButton from "@mui/lab/LoadingButton";
import { IconButton, Stack } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import * as React from "react";
import { useContext, useState } from "react";

import { ConfirmationType } from "@/types/types";

type UseConfirmationDialogShowReturnType = {
  show: boolean;
  setShow: (value: boolean) => void;
  onHide: () => void;
};

const useDialogShow = (): UseConfirmationDialogShowReturnType => {
  const [show, setShow] = useState(false);
  return { show, setShow, onHide: () => setShow(false) };
};

type ConfirmationDialogContextType = {
  showConfirmation: (
    title: string,
    message: string | React.ReactNode,
    type: ConfirmationType,
    action: () => void,
    okText?: string,
    cancelText?: string,
  ) => void;
};

type ConfirmationModalContextProviderProps = {
  children: React.ReactNode;
};

const ConfirmationModalContext = React.createContext<ConfirmationDialogContextType | null>(null);

const ConfirmationModalContextProvider: React.FC<ConfirmationModalContextProviderProps> = (
  props,
) => {
  const { setShow, show, onHide } = useDialogShow();

  const [content, setContent] = useState<{
    title: string;
    message: string | React.ReactNode;
    type: ConfirmationType;
    action: () => void;
    okText?: string;
    cancelText?: string;
  }>({
    title: "",
    message: "",
    type: ConfirmationType.send,
    action: () => {},
  });

  const handleShow = (
    title: string,
    message: string | React.ReactNode,
    type: ConfirmationType,
    action: () => void,
    okText?: string,
    cancelText?: string,
  ) => {
    setContent({ title, message, type, action, okText, cancelText });
    setShow(true);
  };

  const dialogContext: ConfirmationDialogContextType = { showConfirmation: handleShow };

  const handleOk = () => {
    content && content.action();
    onHide();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ConfirmationModalContext.Provider value={dialogContext}>
        {props.children}
        <Dialog
          open={show}
          sx={{
            ".MuiDialog-paper": { maxWidth: 350, borderRadius: 3 },
            backdropFilter: "blur(10px)",
          }}
        >
          <DialogTitle
            variant="h5"
            sx={{ fontWeight: "bold", borderBottom: 1, borderColor: "divider", mb: 1 }}
          >
            {content?.title}
          </DialogTitle>
          <IconButton
            aria-label="close"
            onClick={onHide}
            sx={{ position: "absolute", right: 8, top: 8, color: (t) => t.palette.secondary.dark }}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent sx={{ p: 0, m: 0, paddingX: 2 }}>
            <DialogContentText variant="body2">{content?.message}</DialogContentText>
          </DialogContent>
          <DialogActions sx={{ pb: 2, pt: 0, mt: 0, paddingX: 2 }}>
            <Stack flexDirection="row" sx={{ mt: 1 }} gap={1}>
              <Button sx={{ borderRadius: 2 }} onClick={onHide} variant="outlined" size="small">
                {content?.cancelText ?? "No"}
              </Button>
              <LoadingButton
                type="submit"
                sx={{ borderRadius: 2, boxShadow: "none", border: 0.5, borderColor: "divider" }}
                variant="contained"
                size="small"
                onClick={handleOk}
                loadingPosition="start"
                startIcon={
                  content.type === "update" ? (
                    <SaveAltIcon />
                  ) : content.type === "send" ? (
                    <SendIcon />
                  ) : (
                    <DoneIcon />
                  )
                }
              >
                {content?.okText ?? "Yes"}
              </LoadingButton>
            </Stack>
          </DialogActions>
        </Dialog>
      </ConfirmationModalContext.Provider>
    </LocalizationProvider>
  );
};

const useConfirmationModalContext = (): ConfirmationDialogContextType => {
  const context = useContext(ConfirmationModalContext);
  if (!context) {
    throw new Error(
      "useConfirmationModalContext must be used within a ConfirmationModalContextProvider",
    );
  }
  return context;
};

export { useConfirmationModalContext, useDialogShow };
export default ConfirmationModalContextProvider;
