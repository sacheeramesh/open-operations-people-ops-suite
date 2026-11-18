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
import visitor.authorization;
import visitor.calendar;
import visitor.database;
import visitor.email;
import visitor.people;
import visitor.sms;

import ballerina/cache;
import ballerina/http;
import ballerina/lang.regexp;
import ballerina/log;
import ballerina/random;
import ballerina/time;

configurable string webAppUrl = ?;

final cache:Cache cache = new ({
    capacity: 2000,
    defaultMaxAge: 1800.0,
    cleanupInterval: 900.0
});

@display {
    label: "Visitor Service",
    id: "people-ops-suite/visitor-service"
}

service http:InterceptableService / on new http:Listener(9090) {

    # Request interceptor.
    #
    # + return - authorization:JwtInterceptor, BadRequestInterceptor
    public function createInterceptors() returns http:Interceptor[] =>
        [new authorization:JwtInterceptor(), new BadRequestInterceptor()];

    # Fetch logged-in user's details.
    #
    # + return - User information or InternalServerError
    resource function get user\-info(http:RequestContext ctx) returns UserInfo|http:InternalServerError {
        // User information header.
        authorization:CustomJwtPayload|error userInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if userInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, userInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        // Check if the employees are already cached.
        if cache.hasKey(userInfo.email) {
            UserInfo|error cachedUserInfo = cache.get(userInfo.email).ensureType();
            if cachedUserInfo is UserInfo {
                return cachedUserInfo;
            }
        }

        people:Employee user;

        // If the user has only the external user role, bypass fetching employee details and return with basic user info.
        if authorization:checkPermissions([authorization:authorizedRoles.EXTERNAL_USER_ROLE], userInfo.groups) {
            user = {
                firstName: userInfo.firstName ?: userInfo.email,
                lastName: userInfo.lastName ?: "",
                workEmail: userInfo.email,
                jobRole: "External User",
                employeeId: "N/A"
            };
        } else if authorization:receptionUserEmails.indexOf(userInfo.email) !is () {
            // Shared reception accounts are authorized via roles but are not real employees,
            // so bypass fetching employee details and return with basic user info.
            user = {
                firstName: "Choreo Labs",
                lastName: "Reception",
                workEmail: userInfo.email,
                jobRole: "Reception",
                employeeId: "N/A"
            };
        } else { // For internal users, fetch employee details from the user store.
            people:Employee|error? employee = people:fetchEmployee(userInfo.email);
            if employee is error {
                string customError = string `Error occurred while fetching user information: ${userInfo.email}`;
                log:printError(customError, employee);
                return <http:InternalServerError>{
                    body: customError
                };
            }
            if employee is () {
                log:printError(string `No employee information found for the user: ${userInfo.email}`);
                return <http:InternalServerError>{
                    body: {
                        message: "No information found for the user!"
                    }
                };
            }
            user = employee;
        }

        // Fetch the user's privileges based on the roles.
        int[] privileges = [];
        if authorization:checkPermissions(authorization:authorizedRoles.EMPLOYEE_ROLE, userInfo.groups) {
            privileges.push(authorization:EMPLOYEE_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], userInfo.groups) {
            privileges.push(authorization:SECURITY_ADMIN_PRIVILEGE);
        }
        if authorization:checkPermissions([authorization:authorizedRoles.EXTERNAL_USER_ROLE], userInfo.groups) {
            privileges.push(authorization:EXTERNAL_USER_PRIVILEGE);
        }

        UserInfo userInfoResponse = {...user, privileges};

        error? cacheError = cache.put(userInfo.email, userInfoResponse);
        if cacheError is error {
            log:printError("An error occurred while writing user info to the cache", cacheError);
        }
        return userInfoResponse;
    }

    # Fetches a specific visitor by hashed email or contact number.
    #
    # + idHash - Hashed Email or contact number of the visitor
    # + return - Visitor or error
    resource function get visitors/[string idHash](http:RequestContext ctx)
        returns database:Visitor|http:InternalServerError|http:NotFound {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        database:Visitor|error? visitor = database:fetchVisitor(idHash);
        if visitor is error {
            string customError = "Error occurred while fetching visitor!";
            log:printError(customError, visitor);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if visitor is () {
            log:printError(string `No visitor information found for the Id Hash: ${idHash}!`);
            return <http:NotFound>{
                body: {
                    message: "No visitor found!"
                }
            };
        }

        // Only return the identifier that was actually searched for: hide the contact number
        // when the caller searched by email, and hide the email when the caller searched by
        // contact number, by re-deriving each hash from the stored value and comparing it to
        // the requested idHash.
        string? storedEmail = visitor.email;
        string? storedContactNumber = visitor.contactNumber;

        if storedEmail is string && database:computeIdHash(storedEmail) == idHash {
            visitor.contactNumber = ();
        }
        if storedContactNumber is string && database:computeIdHash(storedContactNumber) == idHash {
            visitor.email = ();
        }

        // Hide audit metadata from external users.
        if authorization:checkPermissions([authorization:authorizedRoles.EXTERNAL_USER_ROLE], invokerInfo.groups) {
            visitor.createdBy = SANITIZED_VALUE;
            visitor.createdOn = SANITIZED_VALUE;
            visitor.updatedBy = SANITIZED_VALUE;
            visitor.updatedOn = SANITIZED_VALUE;
        }

        return visitor;
    }

    # Create a new visitor.
    #
    # + payload - Payload containing the visitor details
    # + return - Successfully created or error
    resource function post visitors(http:RequestContext ctx, database:AddVisitorPayload payload)
        returns http:Created|http:InternalServerError|http:BadRequest {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if payload.email !is string && payload.contactNumber !is string {
            return <http:BadRequest>{
                body: {
                    message: "At least one of email or contact number should be provided!"
                }
            };
        }

        error? visitorError = database:addVisitor(payload, invokerInfo.email);
        if visitorError is error {
            string customError = "Error occurred while adding visitor!";
            log:printError(customError, visitorError);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        return <http:Created>{
            body: {
                message: "Visitor added successfully!"
            }
        };
    }

    # Create a new visit.
    #
    # + payload - Payload containing the visit details
    # + return - Successfully created or error
    resource function post visits(http:RequestContext ctx, AddVisitPayload payload)
        returns http:Created|http:InternalServerError|http:BadRequest|http:Forbidden {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        boolean isExternalUser = authorization:checkPermissions(
                [authorization:authorizedRoles.EXTERNAL_USER_ROLE], invokerInfo.groups);

        // External users can only create visits where they themselves are the host being visited.
        if isExternalUser && payload.whomTheyMeet != invokerInfo.email {
            return <http:Forbidden>{
                body: {
                    message: "External users can only create visits where they themselves are the host!"
                }
            };
        }

        // Internal users can only create visits where the host is a verified employee, so that the
        // host is never an arbitrary, unverified address used later as an email recipient.
        if !isExternalUser {
            people:Employee|error? hostEmployee = people:fetchEmployee(payload.whomTheyMeet);
            if hostEmployee is error {
                string customError = "An error occurred while verifying the host employee!";
                log:printError(customError, hostEmployee);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }
            if hostEmployee is () {
                return <http:BadRequest>{
                    body: {
                        message: "Whom they meet should be a valid employee!"
                    }
                };
            }
        }

        string? timeOfEntry = payload.timeOfEntry;
        string? timeOfDeparture = payload.timeOfDeparture;

        time:Utc|error? idealEntryTime = ();
        time:Utc|error? idealDepartureTime = ();

        if timeOfEntry is string {
            idealEntryTime = time:utcFromString(timeOfEntry);
        }

        if timeOfDeparture is string {
            idealDepartureTime = time:utcFromString(timeOfDeparture);
        }

        if idealEntryTime is error || idealDepartureTime is error {
            string customError = "Error occurred while parsing the visit entry/departure time!";
            log:printError(customError);
            return <http:BadRequest>{
                body: {
                    message: customError
                }
            };
        }

        // Verify existing visitor.
        database:Visitor|error? existingVisitor = database:fetchVisitor(payload.visitorIdHash);
        if existingVisitor is error {
            string customError = "Error occurred while fetching existing visitor!";
            log:printError(customError, existingVisitor);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if existingVisitor is () {
            return <http:BadRequest>{
                body: {
                    message: "No visitor found with the provided visitor ID hash!"
                }
            };

        }

        int|error visitId = database:addVisit({
                                                  visitorIdHash: payload.visitorIdHash,
                                                  companyName: payload.companyName,
                                                  passNumber: payload.passNumber,
                                                  whomTheyMeet: payload.whomTheyMeet,
                                                  purposeOfVisit: payload.purposeOfVisit,
                                                  accessibleLocations: payload.accessibleLocations,
                                                  timeOfEntry: timeOfEntry is string ? idealEntryTime : (),
                                                  timeOfDeparture: timeOfDeparture is string ? idealDepartureTime : (),
                                                  status: database:REQUESTED,
                                                  visitDate: payload.visitDate,
                                                  uuid: payload.uuid
                                              }, invokerInfo.email, invokerInfo.email);
        if visitId is error {
            string customError = "Error occurred while adding visit!";
            log:printError(customError, visitId);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        string|error? formattedFromDate = ();
        if timeOfEntry is string {
            formattedFromDate = formatDateTime(timeOfEntry, "Asia/Colombo", false);
            if formattedFromDate is error {
                string customError = "Error occurred while formatting the visit start time!";
                log:printError(customError, formattedFromDate);
            }
        }

        string|error? formattedToDate = ();
        if timeOfDeparture is string {
            formattedToDate = formatDateTime(timeOfDeparture, "Asia/Colombo", false);
            if formattedToDate is error {
                string customError = "Error occurred while formatting the visit end time!";
                log:printError(customError, formattedToDate);
            }
        }
        string? visitorEmail = existingVisitor.email;
        string? contactNumber = existingVisitor.contactNumber;

        // Sent the QR only if the visitor email is available.
        if visitorEmail is string {
            string? lastName = existingVisitor.lastName;
            string? purposeOfVisit = payload.purposeOfVisit is string ? escapeHtml(<string>payload.purposeOfVisit) : ();
            string? whomTheyMeet = payload.whomTheyMeet;
            database:Floor[]? accessibleLocations = payload.accessibleLocations;
            string? accessibleLocationString = accessibleLocations is database:Floor[] ?
                organizeLocations(accessibleLocations) : ();

            if whomTheyMeet is string {
                // External users are the host themselves, so their details are already known
                // from the token and there is no HR record to look up.
                if isExternalUser {
                    string? invokerFirstName = invokerInfo.firstName;
                    string invokerLastName = invokerInfo.lastName ?: "";
                    whomTheyMeet = invokerFirstName is string ?
                        invokerFirstName + (invokerLastName != "" ? " " + invokerLastName : "") +
                            " [" + invokerInfo.email + "]" :
                        invokerInfo.email;
                } else {
                    people:Employee|error? hostEmployee = people:fetchEmployee(whomTheyMeet);
                    if hostEmployee is error {
                        string customError = "An error occurred while fetching host employee details!";
                        log:printError(customError, hostEmployee);
                    }
                    if hostEmployee is () {
                        string customError = string `No employee information found for the host: ${whomTheyMeet}!`;
                        log:printError(customError);
                    }
                    if hostEmployee is people:Employee {
                        whomTheyMeet = hostEmployee.firstName + " " + hostEmployee.lastName + " [" + hostEmployee.workEmail + "]";
                    }
                }
                whomTheyMeet = escapeHtml(<string>whomTheyMeet);
            }
            string|error content = email:bindKeyValues(
                    email:inviteTemplate,
                    {
                        CONTENT_ID: visitId.toString(),
                        FIRST_NAME: existingVisitor.firstName,
                        NAME: existingVisitor.firstName + (lastName is string ? string ` ${lastName}` : ""),
                        VISIT_DATE: payload.visitDate,
                        TIME_OF_ENTRY: timeOfEntry is string && formattedFromDate is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Entry :</strong>
                                  <span>${formattedFromDate}</span>
                                </p>
                              </li>` : "",
                        TIME_OF_DEPARTURE: timeOfDeparture is string && formattedToDate is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Departure :</strong>
                                  <span>${formattedToDate}</span>
                                </p>
                              </li>` : "",
                        PURPOSE_OF_VISIT: purposeOfVisit is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Purpose of Visit :</strong>
                                  <span>${purposeOfVisit}</span>
                                </p>
                              </li>` : "",
                        WHO_THEY_MEET: whomTheyMeet is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Host :</strong>
                                  <span>${whomTheyMeet}</span>
                                </p>
                              </li>` : "",
                        ALLOWED_FLOORS: accessibleLocationString is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Allowed Floors :</strong>
                                </p>
                                <ul>
                                  ${accessibleLocationString}
                                </ul>
                              </li>` : "",
                        CONTACT_EMAIL: email:contactUsEmail,
                        YEAR: time:utcToCivil(time:utcNow()).year.toString()
                    }
            );

            if content is error {
                string customError = "An error occurred while binding values to the email template!";
                log:printError(customError, content);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            string[] ccList = [email:receptionEmail, invokerInfo.email];
            string? whoTheyMeetEmail = payload.whomTheyMeet;
            if whoTheyMeetEmail is string {
                ccList.push(whoTheyMeetEmail);
            }
            error? emailError = email:sendEmail({
                                                    attachments: [
                                                        {
                                                            attachment: payload.qrCode,
                                                            contentName: "visitor-pass.png",
                                                            contentType: "image/png",
                                                            contentId: visitId.toString()
                                                        }
                                                    ],
                                                    to: [visitorEmail],
                                                    'from: email:fromEmailAddress,
                                                    subject: email:VISIT_INVITATION_SUBJECT,
                                                    template: content,
                                                    cc: ccList
                                                });

            if emailError is error {
                string customError = "Error occurred while sending the email!";
                log:printError(customError, emailError);
            }
        }

        // Send the SMS only if the contact number is available.
        if contactNumber is string {
            boolean isUniqueCode = false;
            int maxRetries = 5;
            int retryCount = 0;
            int|error verificationCode = error("Uninitialized verification code");
            while !isUniqueCode && retryCount <= maxRetries {
                retryCount += 1;
                // Generate a random 6-digit code for SMS content.
                verificationCode = random:createIntInRange(100000, 1000000);
                if verificationCode is error {
                    string customError = "Error occurred while generating the random code for SMS!";
                    log:printError(customError, verificationCode);
                    continue;
                }

                // Check if the generated code is unique in the database.
                error? visit = database:updateVisit(visitId, {smsVerificationCode: verificationCode}, invokerInfo.email);
                if visit is error {
                    if visit is database:DuplicateEntryError {
                        log:printError("Generated SMS verification code is not unique, regenerating...");
                        continue;
                    }
                    string customError = "Error occurred while inserting visit with the SMS verification code!";
                    log:printError(customError, visit);
                }
                isUniqueCode = true;
            }

            if verificationCode is int {
                //Send the SMS with the generated code.
                error? sendSms = sms:sendSms(
                        {
                            phoneNumber: contactNumber,
                            message: sms:generateMessage(verificationCode,
                                        formattedFromDate is string ? formattedFromDate : payload.visitDate)
                        }
                );

                if sendSms is error {
                    string customError = "Error occurred while sending the SMS!";
                    log:printError(customError, sendSms);
                }
            }

        }

        return <http:Created>{
            body: {
                message: "Visit added successfully!"
            }
        };
    }

    # Fetches visits based on the given filters.
    #
    # + inviter - The email of the inviter (employee)
    # + statusArray - Filter :  status array of the visits (Pending, Accepted, Rejected, Completed)
    # + 'limit - Limit number of visits to fetch
    # + offset - Offset for pagination
    # + return - Array of visits or error
    resource function get visits(http:RequestContext ctx, string? inviter, database:Status[]? statusArray,
            int? 'limit, int? offset) returns database:VisitsResponse|http:Forbidden|http:InternalServerError {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        string? filterInviter = inviter;
        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], invokerInfo.groups) {
            if inviter is string && inviter != invokerInfo.email {
                string customError = "Non-admin users cannot access visits of other employees!";
                log:printError(customError);
                return <http:Forbidden>{
                    body: {
                        message: customError
                    }
                };
            }
            // Non-admins can only ever see their own visits, whether or not inviter was provided.
            filterInviter = invokerInfo.email;
        }

        database:VisitsResponse|error visitsResponse =
            database:fetchVisits({inviter: filterInviter, statusArray, 'limit, offset});

        if visitsResponse is error {
            string customError = "Error occurred while fetching visits!";
            log:printError(customError, visitsResponse);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return visitsResponse;
    }

    # Update visit details of existing visit.
    #
    # + visitId - ID of the visit to be updated
    # + action - Action to be performed on the visit (ACCEPTED, REJECTED, COMPLETED)
    # + payload - Payload containing the visit details to be updated
    # + return - Successfully updated or error
    resource function post visits/[int visitId]/[Action action](http:RequestContext ctx, ActionPayload payload)
        returns http:Ok|http:BadRequest|http:InternalServerError|http:Forbidden {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], invokerInfo.groups) {
            string customError = string `Non-admin users cannot ${action} visits!`;
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        database:Visit|error? visit = database:fetchVisit(visitId);
        if visit is () {
            return <http:BadRequest>{
                body: {
                    message: "Invalid visit ID!"
                }
            };
        }
        if visit is error {
            string customError = "Error occurred while fetching visit!";
            log:printError(customError, visit);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        // Get visitor email for sending notifications
        string? visitorEmail = visit.email;
        string? visitorLastName = visit.lastName;

        // Approve a visit.
        if action == APPROVE {
            if visit.status != database:REQUESTED {
                return <http:BadRequest>{
                    body: {
                        message: "The visit is not in the approvable state!"
                    }
                };
            }

            string? passNumber = payload.passNumber is string ? escapeHtml(<string>payload.passNumber) : ();
            database:Floor[]? accessibleLocations = payload.accessibleLocations ?: visit.accessibleLocations;
            string? accessibleLocationString = accessibleLocations is database:Floor[] ?
                organizeLocations(accessibleLocations) : ();
            string? purposeOfVisit = visit.purposeOfVisit is string ? escapeHtml(<string>visit.purposeOfVisit) : ();
            string|error checkInTime = formatDateTime(time:utcToString(time:utcNow()), "Asia/Colombo", false);
            if checkInTime is error {
                string customError = "Error occurred while formatting the check-in time!";
                log:printError(customError, checkInTime);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            // Validate the visit date.
            if visit.visitDate != formatDate(time:utcToString(time:utcNow()), "Asia/Colombo", false) {
                return <http:BadRequest>{
                    body: {
                        message: "Visit date should be the current date for approval!"
                    }
                };
            }

            string? hostEmail = visit.whomTheyMeet;
            people:Employee|error? hostEmployee = ();
            if hostEmail is string {
                // The host employee lookup is only used to personalize the arrival notification
                // email below, so a failure here (e.g. the host is an external user, not present
                // in HR) should not block the approval itself.
                hostEmployee = people:fetchEmployee(hostEmail);
                if hostEmployee is error {
                    string customError = "Error occurred while fetching host employee details!";
                    log:printError(customError, hostEmployee);
                }
            }

            error? response = database:updateVisit(visitId,
                    {
                        status: database:APPROVED,
                        passNumber: payload.passNumber,
                        accessibleLocations: accessibleLocations,
                        actionedBy: invokerInfo.email,
                        timeOfEntry: time:utcNow()
                    }, invokerInfo.email);

            if response is error {
                string customError = "Error occurred while approving the visit!";
                log:printError(customError, response);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            // Send notification to the visitor about visit approval
            if visitorEmail is string {
                // https://github.com/wso2-open-operations/people-ops-suite/pull/31#discussion_r2414681918
                string? timeOfEntry = visit.timeOfEntry;
                string|error formattedFromDate = "N/A";
                if timeOfEntry is string {
                    formattedFromDate = formatDateTime(regexp:split(re `\.`, time:utcToString(time:utcNow()))[0], "Asia/Colombo");
                    if formattedFromDate is error {
                        string customError = "Error occurred while formatting the visit start time!";
                        log:printError(customError, formattedFromDate);
                    }
                }

                string? timeOfDeparture = visit.timeOfDeparture;
                string|error formattedToDate = "N/A";
                if timeOfDeparture is string {
                    formattedToDate = formatDateTime(timeOfDeparture, "Asia/Colombo");
                    if formattedToDate is error {
                        string customError = "Error occurred while formatting the visit end time!";
                        log:printError(customError, formattedToDate);
                    }
                }
                string|error content = email:bindKeyValues(email:visitorApproveTemplate,
                        {
                            TIME: time:utcToEmailString(time:utcNow()),
                            EMAIL: visitorEmail,
                            FIRST_NAME: visit.firstName,
                            NAME: visit.firstName + (visitorLastName is string ? string ` ${visitorLastName}` : ""),
                            TIME_OF_ENTRY: timeOfEntry is string && formattedFromDate is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Entry :</strong>
                                  <span>${formattedFromDate}</span>
                                </p>
                              </li>` : "",
                            TIME_OF_DEPARTURE: timeOfDeparture is string && formattedToDate is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Departure :</strong>
                                  <span>${formattedToDate}</span>
                                </p>
                              </li>` : "",
                            ALLOWED_FLOORS: accessibleLocationString is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Allowed Floors :</strong>
                                </p>
                                <ul>
                                  ${accessibleLocationString}
                                </ul>
                              </li>` : "",
                            PASS_NUMBER: passNumber is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Pass Number :</strong>
                                  <span>${passNumber}</span>
                                </p>
                              </li>` : "",
                            CONTACT_EMAIL: email:contactUsEmail,
                            YEAR: time:utcToCivil(time:utcNow()).year.toString()
                        });
                if content is error {
                    string customError = "An error occurred while binding values to the email template!";
                    log:printError(customError, content);
                } else {
                    error? emailError = email:sendEmail(
                            {
                                to: [visitorEmail],
                                'from: email:fromEmailAddress,
                                subject: email:VISIT_ACCEPTED_SUBJECT,
                                template: content,
                                cc: [email:receptionEmail]
                            });
                    if emailError is error {
                        string customError = "An error occurred while sending the approval email!";
                        log:printError(customError, emailError);
                    }
                }
            }

            // Send notification to the host about visitor arrival. Falls back to the raw email
            // as the display name when the host has no HR record (e.g. an external user host).
            string? hostName = hostEmployee is people:Employee ? hostEmployee.firstName : (hostEmail is string ? escapeHtml(hostEmail) : ());
            if hostName is string && hostEmail is string {
                string|error content = email:bindKeyValues(email:employeeVisitorArrivalTemplate,
                        {
                            HOST_NAME: hostName,
                            VISITOR_NAME: visit.firstName + (visitorLastName is string ? string ` ${visitorLastName}` : ""),
                            CHECK_IN_TIME: checkInTime,
                            LOCATION: accessibleLocationString is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Accessible Locations :</strong>
                                </p>
                                <ul>
                                  ${accessibleLocationString}
                                </ul>` : "",
                            PURPOSE_OF_VISIT: purposeOfVisit is string ? string `<li>
                                <p
                                  style="
                                    font-family:
                                      &quot;Roboto&quot;, Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Purpose of Visit :</strong>
                                  <span>${purposeOfVisit}</span>
                                </p>
                              </li>` : "",
                            CONTACT_EMAIL: email:contactUsEmail,
                            YEAR: time:utcToCivil(time:utcNow()).year.toString()
                        });

                if content is error {
                    string customError = "An error occurred while binding values to the email template!";
                    log:printError(customError, content);
                } else {
                    error? emailError = email:sendEmail(
                            {
                                to: [hostEmail],
                                cc: [email:receptionEmail],
                                'from: email:fromEmailAddress,
                                subject: email:EMPLOYEE_VISITOR_ARRIVAL_SUBJECT,
                                template: content
                            });
                    if emailError is error {
                        string customError = "An error occurred while sending the host notification email!";
                        log:printError(customError, emailError);
                    }
                }
            }

            return <http:Ok>{
                body: {
                    message: "Visit approved successfully!"
                }
            };

        }

        // Reject a visit.
        if action == REJECT {
            if payload.rejectionReason is () || payload.rejectionReason == "" {
                return <http:BadRequest>{
                    body: {
                        message: "Rejection reason is required when rejecting a visit!"
                    }
                };
            }
            if visit.status != database:REQUESTED {
                return <http:BadRequest>{
                    body: {
                        message: "The visit is not in the rejectable state!"
                    }
                };
            }
            error? response = database:updateVisit(
                    visitId,
                    {
                        status: database:REJECTED,
                        rejectionReason: payload.rejectionReason,
                        actionedBy: invokerInfo.email,
                        smsVerificationCode: null
                    }, invokerInfo.email);

            if response is error {
                string customError = "Error occurred while rejecting the visits!";
                log:printError(customError, response);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            // The rejection email goes to the host and to whoever created the visit (once, if they are the
            // same person), with reception in CC. The visitor is not emailed.
            string[] recipients = [];
            string? hostEmail = visit.whomTheyMeet;
            if hostEmail is string && hostEmail.trim() != "" {
                recipients.push(hostEmail);
            }
            string creatorEmail = visit.createdBy;
            string hostKey = hostEmail is string ? hostEmail.toLowerAscii() : "";
            if creatorEmail.trim() != "" && creatorEmail.toLowerAscii() != hostKey {
                recipients.push(creatorEmail);
            }

            if recipients.length() == 0 {
                log:printWarn(string `Visit ${visitId} has no host or creator email; rejection email not sent.`);
            } else {
                string? timeOfEntry = visit.timeOfEntry;
                string|error formattedFromDate = "N/A";
                if timeOfEntry is string {
                    formattedFromDate = formatDateTime(timeOfEntry, "Asia/Colombo");
                    if formattedFromDate is error {
                        string customError = "Error occurred while formatting the visit start time!";
                        log:printError(customError, formattedFromDate);
                    }
                }

                string? timeOfDeparture = visit.timeOfDeparture;
                string|error formattedToDate = "N/A";
                if timeOfDeparture is string {
                    formattedToDate = formatDateTime(timeOfDeparture, "Asia/Colombo");
                    if formattedToDate is error {
                        string customError = "Error occurred while formatting the visit end time!";
                        log:printError(customError, formattedToDate);
                    }
                }
                string? lastName = visit.lastName;
                string? companyName = visit.companyName;
                string rejectionReason = payload.rejectionReason ?: "";
                string|error content = email:bindKeyValues(email:hostVisitRejectionTemplate,
                        {
                            NAME: escapeHtml(visit.firstName + (lastName is string ? string ` ${lastName}` : "")),
                            COMPANY_NAME: companyName is string && companyName.trim() != "" ?
                                escapeHtml(companyName) : "N/A",
                            REJECTED_BY: escapeHtml(invokerInfo.email),
                            REJECTION_REASON: escapeHtml(rejectionReason),
                            TIME_OF_ENTRY: timeOfEntry is string && formattedFromDate is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Entry :</strong>
                                  <span>${formattedFromDate}</span>
                                </p>
                              </li>` : "",
                            TIME_OF_DEPARTURE: timeOfDeparture is string && formattedToDate is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Departure :</strong>
                                  <span>${formattedToDate}</span>
                                </p>
                              </li>` : "",
                            CONTACT_EMAIL: email:contactUsEmail,
                            YEAR: time:utcToCivil(time:utcNow()).year.toString()
                        });
                if content is error {
                    string customError = "An error occurred while binding values to the email template!";
                    log:printError(customError, content);
                } else {
                    error? emailError = email:sendEmail(
                                {
                                to: recipients,
                                'from: email:fromEmailAddress,
                                subject: email:VISIT_REJECTED_SUBJECT,
                                template: content,
                                cc: [email:receptionEmail]
                            });
                    if emailError is error {
                        string customError = "An error occurred while sending the rejection email!";
                        log:printError(customError, emailError);
                    }
                }
            }
            return <http:Ok>{
                body: {
                    message: "Visit rejected successfully!"
                }
            };
        }

        // Complete a visit.
        if action == COMPLETE {
            if visit.status != database:APPROVED {
                return <http:BadRequest>{
                    body: {
                        message: "The visit is not in the completable state!"
                    }
                };
            }
            error? response = database:updateVisit(visitId,
                    {
                        status: database:COMPLETED,
                        actionedBy: invokerInfo.email,
                        timeOfDeparture: time:utcNow(),
                        smsVerificationCode: null
                    }, invokerInfo.email);

            if response is error {
                string customError = "Error occurred while completing the visits!";
                log:printError(customError, response);
                return <http:InternalServerError>{
                    body: {
                        message: customError
                    }
                };
            }

            if visitorEmail is string {
                database:Floor[]? accessibleLocations = visit.accessibleLocations;
                if accessibleLocations is () {
                    string customError = "No accessible locations found for the visit!";
                    log:printError(customError);

                }

                string? passNumber = visit.passNumber is string ? escapeHtml(<string>visit.passNumber) : ();
                string? accessibleLocationString = accessibleLocations is database:Floor[] ?
                    organizeLocations(accessibleLocations) : ();

                string? timeOfEntry = visit.timeOfEntry;
                string|error formattedFromDate = "N/A";
                if timeOfEntry is string {
                    formattedFromDate = formatDateTime(timeOfEntry, "Asia/Colombo");
                    if formattedFromDate is error {
                        string customError = "Error occurred while formatting the visit start time!";
                        log:printError(customError, formattedFromDate);
                    }
                }

                string? timeOfDeparture = visit.timeOfDeparture;
                string|error formattedToDate = "N/A";
                if timeOfDeparture is string {
                    formattedToDate = formatDateTime(regexp:split(re `\.`, time:utcToString(time:utcNow()))[0], "Asia/Colombo");
                    if formattedToDate is error {
                        string customError = "Error occurred while formatting the visit end time!";
                        log:printError(customError, formattedToDate);
                    }
                }
                string? lastName = visit.lastName;
                string|error content = email:bindKeyValues(email:visitorCompletionTemplate,
                        {
                            TIME: time:utcToEmailString(time:utcNow()),
                            EMAIL: visitorEmail,
                            FIRST_NAME: visit.firstName,
                            NAME: visit.firstName + (lastName is string ? string ` ${lastName}` : ""),
                            TIME_OF_ENTRY: timeOfEntry is string && formattedFromDate is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Entry :</strong>
                                  <span>${formattedFromDate}</span>
                                </p>
                              </li>` : "",
                            TIME_OF_DEPARTURE: timeOfDeparture is string && formattedToDate is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Departure :</strong>
                                  <span>${formattedToDate}</span>
                                </p>
                              </li>` : "",
                            ALLOWED_FLOORS: accessibleLocationString is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Allowed Floors :</strong>
                                </p>
                                <ul>
                                  ${accessibleLocationString}
                                </ul>
                              </li>` : "",
                            PASS_NUMBER: passNumber is string ? string `<li>
                                <p
                                  style="
                                    font-family: 'Roboto', Helvetica, sans-serif;
                                    font-size: 17px;
                                    color: #465868;
                                    text-align: left;
                                  "
                                >
                                  <strong>Pass Number :</strong>
                                  <span>${passNumber}</span>
                                </p>
                              </li>` : "",
                            CONTACT_EMAIL: email:contactUsEmail,
                            YEAR: time:utcToCivil(time:utcNow()).year.toString()
                        });
                if content is error {
                    string customError = "An error occurred while binding values to the email template!";
                    log:printError(customError, content);
                } else {
                    string? hostEmail = visit.whomTheyMeet;
                    string[] ccList = [email:receptionEmail];
                    if hostEmail is string {
                        ccList.push(hostEmail);
                    }
                    error? emailError = email:sendEmail(
                            {
                                to: [visitorEmail],
                                'from: email:fromEmailAddress,
                                subject: email:VISIT_COMPLETION_SUBJECT,
                                template: content,
                                cc: ccList
                            });

                    if emailError is error {
                        string customError = "An error occurred while sending the completion email!";
                        log:printError(customError, emailError);
                    }
                }
            }

            return <http:Ok>{
                body: {
                    message: "Visit completed successfully!"
                }
            };
        }
    }

    # Fetch a visit by its UUID.
    #
    # + uuid - UUID of the visit to be fetched
    # + return - Visit object or error
    resource function get visits/[string uuid](http:RequestContext ctx)
        returns database:Visit|http:NotFound|http:InternalServerError|http:Forbidden {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        if !authorization:checkPermissions([authorization:authorizedRoles.ADMIN_ROLE], invokerInfo.groups) {
            string customError = "You are not authorized to access visit details!";
            log:printError(customError);
            return <http:Forbidden>{
                body: {
                    message: customError
                }
            };
        }

        int|error smsVerificationCode = int:fromString(uuid);
        database:Visit|error? visit = error("Uninitialized visit retrieval");
        if smsVerificationCode is error {
            visit = database:fetchVisit(uuid = uuid);
        } else {
            visit = database:fetchVisit(smsVerificationCode = smsVerificationCode);
        }

        if visit is error {
            string customError = "Error occurred while fetching visit by UUID!";
            log:printError(customError, visit);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }
        if visit is () {
            return <http:NotFound>{
                body: {
                    message: "No visit found with the provided UUID!"
                }
            };
        }

        if visit.status == database:REQUESTED || visit.status == database:APPROVED {
            return visit;
        } else {
            return <http:NotFound>{
                body: {
                    message: "No visit found with the provided UUID!"
                }
            };
        }
    }

    # Retrieve the work email list of the subordinates.
    #
    # + ctx - Request context containing user information
    # + search - Search term used to filter employees
    # + offset - Pagination offset
    # + limit - Maximum number of employees to return
    # + return - Custom error or employee email object
    resource function get employees(http:RequestContext ctx, string search = "", int offset = 0, int 'limit = 1000)
        returns people:EmployeeBasic[]|http:InternalServerError|http:Forbidden {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        // External users will retrieve only own details from this endpoint.
        if authorization:checkPermissions([authorization:authorizedRoles.EXTERNAL_USER_ROLE], invokerInfo.groups) {
            return [
                {
                    firstName: invokerInfo.firstName ?: invokerInfo.email,
                    lastName: invokerInfo.lastName ?: "",
                    workEmail: invokerInfo.email
                }
            ];
        }

        people:EmployeeBasic[]|error allEmployees = people:fetchEmployees(search, 'limit, offset);
        if allEmployees is error {
            string customError = "Error occurred while fetching employees!";
            log:printError(customError, allEmployees);
            return <http:InternalServerError>{
                body: {
                    message: customError
                }
            };
        }

        return allEmployees;
    }

    # Get building resources.
    #
    # + ctx - Request context
    # + return - Building resources or error
    resource function get building\-resources(http:RequestContext ctx)
        returns calendar:FilteredCalendarResource[]|http:InternalServerError {

        authorization:CustomJwtPayload|error invokerInfo = ctx.getWithType(authorization:HEADER_USER_INFO);
        if invokerInfo is error {
            log:printError(USER_INFO_HEADER_NOT_FOUND_ERROR, invokerInfo);
            return <http:InternalServerError>{
                body: {
                    message: USER_INFO_HEADER_NOT_FOUND_ERROR
                }
            };
        }

        calendar:FilteredCalendarResource[]|error result = calendar:getBuildingResources();
        if result is error {
            string customError = "Error retrieving building resources";
            log:printError(customError, result);
            return <http:InternalServerError>{
                body: {message: customError}
            };
        }

        return result;
    }
}
