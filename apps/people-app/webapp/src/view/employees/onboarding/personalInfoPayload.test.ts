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

import {
  CreateEmployeeFormValues,
  emptyCreateEmployeeValues,
} from "@/types/types";

import { toPersonalUpdatePayload } from "./EmployeeForm";
import { personalInfoValidationSchema } from "./singleOnboarding/steps/PersonalInfo";

const withPersonal = (
  overrides: Partial<CreateEmployeeFormValues["personalInfo"]>,
): CreateEmployeeFormValues => ({
  ...emptyCreateEmployeeValues,
  personalInfo: { ...emptyCreateEmployeeValues.personalInfo, ...overrides },
});

describe("toPersonalUpdatePayload", () => {
  // null tells the backend to leave a field alone, so sending it for a field the admin
  // emptied kept the old value while the editor reported success.
  it("sends an emptied optional field as an empty string, which the backend clears", () => {
    const payload = toPersonalUpdatePayload(
      withPersonal({
        personalEmail: "",
        personalPhone: null,
        residentNumber: "",
        addressLine1: "",
        addressLine2: null,
        city: "",
        stateOrProvince: null,
        postalCode: "",
        country: null,
      }),
    );

    expect(payload.personalEmail).toBe("");
    expect(payload.personalPhone).toBe("");
    expect(payload.residentNumber).toBe("");
    expect(payload.addressLine1).toBe("");
    expect(payload.addressLine2).toBe("");
    expect(payload.city).toBe("");
    expect(payload.stateOrProvince).toBe("");
    expect(payload.postalCode).toBe("");
    expect(payload.country).toBe("");
  });

  it("removes invisible characters from phone numbers and the email", () => {
    const payload = toPersonalUpdatePayload(
      withPersonal({
        personalEmail: "﻿john@gmail.com",
        personalPhone: "077​1234567",
        residentNumber: "011﻿2345678",
      }),
    );

    expect(payload.personalEmail).toBe("john@gmail.com");
    expect(payload.personalPhone).toBe("0771234567");
    expect(payload.residentNumber).toBe("0112345678");
  });

  it("keeps filled values as entered", () => {
    const payload = toPersonalUpdatePayload(
      withPersonal({ residentNumber: "+94 11 234 5678", city: "Colombo" }),
    );

    expect(payload.residentNumber).toBe("+94 11 234 5678");
    expect(payload.city).toBe("Colombo");
  });
});

describe("personalInfoValidationSchema", () => {
  const check = (field: string, value: string) =>
    personalInfoValidationSchema.validateAt(
      `personalInfo.${field}`,
      withPersonal({ [field]: value }),
    );

  it("accepts a pasted number carrying an invisible character, since it is cleaned before sending", async () => {
    await expect(check("residentNumber", "011﻿2345678")).resolves.toBe(
      "0112345678",
    );
    await expect(check("personalPhone", "077​1234567")).resolves.toBe(
      "0771234567",
    );
  });

  it("accepts an email with an apostrophe", async () => {
    await expect(check("personalEmail", "o'brien@gmail.com")).resolves.toBe(
      "o'brien@gmail.com",
    );
  });

  it("refuses an email the backend would refuse", async () => {
    await expect(check("personalEmail", "jöhn@gmail.com")).rejects.toThrow(
      "Invalid email format",
    );
    await expect(check("personalEmail", "john#1@gmail.com")).rejects.toThrow(
      "Invalid email format",
    );
  });
});
