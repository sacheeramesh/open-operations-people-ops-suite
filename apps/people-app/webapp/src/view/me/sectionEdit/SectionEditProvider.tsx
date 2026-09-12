// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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

import { createContext, useContext, useMemo, useState } from "react";

/**
 * Tracks which profile section is currently being edited.
 *
 * Only one section may be open at a time: the sections share the same underlying
 * employee record, so two concurrent edits could each patch a stale copy and silently
 * overwrite one another. Opening a section while another has unsaved changes is
 * blocked by the header, which asks the admin to save or cancel first.
 */
export type EditableSection = "general" | "resignation" | "personal";

interface SectionEditState {
  /** The section currently in edit mode, or null when the profile is read-only. */
  editingSection: EditableSection | null;
  /** True when the open section has changes the admin has not saved yet. */
  isDirty: boolean;
  beginEdit: (section: EditableSection) => void;
  endEdit: () => void;
  setDirty: (dirty: boolean) => void;
}

const SectionEditContext = createContext<SectionEditState | null>(null);

export const SectionEditProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [editingSection, setEditingSection] = useState<EditableSection | null>(
    null,
  );
  const [isDirty, setIsDirty] = useState(false);

  const value = useMemo<SectionEditState>(
    () => ({
      editingSection,
      isDirty,
      beginEdit: (section) => {
        setEditingSection(section);
        setIsDirty(false);
      },
      endEdit: () => {
        setEditingSection(null);
        setIsDirty(false);
      },
      setDirty: setIsDirty,
    }),
    [editingSection, isDirty],
  );

  return (
    <SectionEditContext.Provider value={value}>
      {children}
    </SectionEditContext.Provider>
  );
};

export const useSectionEdit = (): SectionEditState => {
  const ctx = useContext(SectionEditContext);
  if (!ctx) {
    throw new Error("useSectionEdit must be used within a SectionEditProvider");
  }
  return ctx;
};
