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
public const DEFAULT_LIMIT = 500;
public const HEX_DIGITS = "0123456789abcdef";

public final string:RegExp NONE_EMPTY_PRINTABLE_STRING_REGEX = re `^(?:.*\S)[ -~]+$`;
public final string:RegExp INTERNATIONAL_CONTACT_NUMBER_REGEX = re `^\+[1-9]\d{1,14}$`;
public final string:RegExp PRINTABLE_NUMERIC_STRING_REGEX = re `^[0-9 ]+$`;
public final string:RegExp EMAIL_REGEX = re `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`;
public final string:RegExp UTC_TIMESTAMP_REGEX =
    re `^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d{1,3})?Z$`;
public final string:RegExp NONE_EMPTY_ACCESSIBLE_LOCATION_REGEX = re `^\s*\[\s*\{\s*"floor"\s*:\s*"\d+"\s*,\s*"rooms"\s*:\s*\[\s*(?:"\d+"\s*(?:,\s*"\d+"\s*)*)?\]\s*\}(?:\s*,\s*\{\s*"floor"\s*:\s*"\d+"\s*,\s*"rooms"\s*:\s*\[\s*(?:"\d+"\s*(?:,\s*"\d+"\s*)*)?\]\s*\})*\s*\]\s*$`;
public final string:RegExp DATE_REGEX = re `^(?:(?:19|20)\d{2}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|02-(?:0[1-9]|1\d|2[0-8]))|(?:19|20)(?:0[48]|[2468][048]|[13579][26])-02-29)$`;
public final string:RegExp SHA256_REGEX = re `^[a-fA-F0-9]{64}$`;
