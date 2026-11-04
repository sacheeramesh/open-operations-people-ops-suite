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

import ballerina/constraint;
import ballerina/test;

# Whether a personal-information update carrying these fields passes its constraints.
#
# + payload - Update payload to check
# + return - true when the payload is accepted
isolated function personalUpdateAccepted(UpdateEmployeePersonalInfoPayload payload) returns boolean {
    UpdateEmployeePersonalInfoPayload|error result = constraint:validate(payload);
    return result is UpdateEmployeePersonalInfoPayload;
}

@test:Config {}
isolated function testEmptyContactFieldsAreAcceptedAsAClear() {
    // updateEmployeePersonalInfoQuery turns "" into NULL, so "" is how a field is cleared.
    // The format rules used to refuse it before the request reached that code.
    test:assertTrue(personalUpdateAccepted({personalEmail: ""}), "an emptied personal email should clear it");
    test:assertTrue(personalUpdateAccepted({personalPhone: ""}), "an emptied personal phone should clear it");
    test:assertTrue(personalUpdateAccepted({residentNumber: ""}), "an emptied resident number should clear it");
}

@test:Config {}
isolated function testContactFieldFormatsAreStillEnforced() {
    test:assertTrue(personalUpdateAccepted({residentNumber: "+94 11 234 5678"}));
    test:assertFalse(personalUpdateAccepted({residentNumber: "N/A"}), "a resident number needs digits");
    test:assertFalse(personalUpdateAccepted({personalPhone: " "}), "a blank phone number is not a clear");
    test:assertFalse(personalUpdateAccepted({personalEmail: "not-an-email"}));
}

@test:Config {}
isolated function testEmailWithAnApostropheIsAccepted() {
    test:assertTrue(EMAIL_PATTERN.isFullMatch("o'brien@gmail.com"), "names like O'Brien appear in real addresses");
    test:assertTrue(personalUpdateAccepted({personalEmail: "o'brien@gmail.com"}));
}

@test:Config {}
isolated function testEmailPatternStillRefusesUnsupportedCharacters() {
    test:assertFalse(EMAIL_PATTERN.isFullMatch("jöhn@gmail.com"));
    test:assertFalse(EMAIL_PATTERN.isFullMatch("john#1@gmail.com"));
    test:assertFalse(EMAIL_PATTERN.isFullMatch("john@localhost"));
}

@test:Config {}
isolated function testZeroWidthNoBreakSpaceIsRefusedInAPhoneNumber() {
    // The browser's \s counts U+FEFF as whitespace and this pattern does not, which is why
    // the webapp strips it before sending. Pinned here so a change on either side shows up.
    test:assertFalse(personalUpdateAccepted({residentNumber: "011\u{FEFF}2345678"}));
}
