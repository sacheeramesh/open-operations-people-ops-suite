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

import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Form, Formik, FormikProps } from "formik";
import { useMemo, useRef, useState } from "react";

import { CreateEmployeeFormValues } from "@/types/types";
import { Employee } from "@slices/employeeSlice/employee";
import { EmployeePersonalInfo } from "@slices/employeeSlice/employeePersonalInfo";
import { useAppSelector } from "@slices/store";
import { toFormValues } from "@view/employees/onboarding/EmployeeForm";
import { createJobInfoValidationSchema } from "@view/employees/onboarding/singleOnboarding/steps/JobInfo";

import SectionEditHeader from "@view/me/sectionEdit/SectionEditHeader";
import {
  EditableSection as SectionKey,
  useSectionEdit,
} from "@view/me/sectionEdit/SectionEditProvider";
import { useSectionSave } from "@view/me/sectionEdit/useSectionSave";

/**
 * The fields each section validates. General Information is validated in full: it owns
 * most of the record, and the leaver fields it reveals are validated with it so a
 * status change cannot be saved without them.
 */
const SECTION_VALIDATED_FIELDS: Partial<Record<SectionKey, string[]>> = {
  resignation: [
    "finalDayInOffice",
    "finalDayOfEmployment",
    "resignationReason",
    // employeeStatus is not edited here, but the leaver fields' conditional rules
    // read it, so it has to stay in the picked subset for them to resolve.
    "employeeStatus",
  ],
};

/**
 * An accordion profile section that can be switched between a read-only rendering and
 * an inline editing form.
 *
 * The Formik context is seeded from the employee record the same way the onboarding
 * wizard seeds its edit mode, and is torn down on cancel — remounting on the next Edit
 * so a cancelled edit can never leave stale values behind. Saving diffs against the
 * seed values and patches only this section's fields.
 */
const EditableSection = ({
  title,
  section,
  employee,
  personalInfo,
  employeeId,
  canEdit,
  defaultExpanded = false,
  renderReadOnly,
  renderFields,
}: {
  title: string;
  section: SectionKey;
  employee: Employee | null;
  personalInfo: EmployeePersonalInfo | null;
  employeeId: string | undefined;
  canEdit: boolean;
  defaultExpanded?: boolean;
  renderReadOnly: () => React.ReactNode;
  renderFields: (isSaving: boolean) => React.ReactNode;
}) => {
  const { editingSection, endEdit, setDirty } = useSectionEdit();
  const { save, isSaving } = useSectionSave(employeeId);
  const { employmentTypes } = useAppSelector((state) => state.organization);

  const isEditing = editingSection === section;
  const [expanded, setExpanded] = useState(defaultExpanded);

  const initialValues = useMemo(
    () => toFormValues(employee, personalInfo),
    [employee, personalInfo],
  );

  // Formik's submit is driven from the section header, which sits outside the <Form>.
  const formikRef = useRef<FormikProps<CreateEmployeeFormValues> | null>(null);

  // The shared schema covers every job-info field, but a section only renders its own.
  // Validating the whole thing would block a save on a field the admin cannot see —
  // an employee missing, say, a work location could never have their resignation
  // dates corrected. Each section is validated against its own fields only.
  const validationSchema = useMemo(() => {
    const full = createJobInfoValidationSchema(employmentTypes);
    const fields = SECTION_VALIDATED_FIELDS[section];
    return fields ? full.pick(fields) : full;
  }, [employmentTypes, section]);

  return (
    <Accordion
      // Expansion is controlled rather than left to defaultExpanded: entering edit mode
      // has to force the section open, and a half-controlled Accordion ignores that.
      expanded={isEditing || expanded}
      onChange={(_, isExpanded) => {
        // An open editor must stay visible — collapsing it would hide fields that are
        // mid-edit while the header still offered Save.
        if (isEditing) return;
        setExpanded(isExpanded);
      }}
      sx={{
        borderRadius: 2,
        mb: 2,
        boxShadow: 0,
        border: 1,
        borderColor: "divider",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ borderRadius: 2, backgroundColor: "background.paper" }}
      >
        <SectionEditHeader
          title={title}
          section={section}
          canEdit={canEdit}
          isSaving={isSaving}
          onSave={() => formikRef.current?.submitForm()}
          onCancel={() => {
            formikRef.current?.resetForm();
            endEdit();
          }}
        />
      </AccordionSummary>
      <AccordionDetails>
        {isEditing ? (
          <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            validationSchema={validationSchema}
            enableReinitialize={false}
            onSubmit={async (values) => {
              const ok = await save(section, initialValues, values);
              if (ok) endEdit();
            }}
          >
            {({ dirty }) => (
              <Form
                // Keep the header's Save enabled/disabled in step with the form.
                onChange={() => setDirty(true)}
              >
                <DirtyReporter dirty={dirty} onChange={setDirty} />
                {renderFields(isSaving)}
              </Form>
            )}
          </Formik>
        ) : (
          renderReadOnly()
        )}
      </AccordionDetails>
    </Accordion>
  );
};

/**
 * Bridges Formik's `dirty` into the section-edit context so the header's Save button
 * and the discard-changes prompt can react to it. Renders nothing.
 */
const DirtyReporter = ({
  dirty,
  onChange,
}: {
  dirty: boolean;
  onChange: (dirty: boolean) => void;
}) => {
  const last = useRef<boolean | null>(null);
  if (last.current !== dirty) {
    last.current = dirty;
    // Defer so the parent is not updated during this component's render.
    queueMicrotask(() => onChange(dirty));
  }
  return null;
};

export default EditableSection;
