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
import ballerina/sql;

# Fetch Visitor.
#
# + idHash - Filter :  hashed email or hashed contact number of the visitor
# + return - Visitor object or error if so
public isolated function fetchVisitor(string idHash) returns Visitor|error? {
    Visitor|error visitor = databaseClient->queryRow(fetchVisitorByIdHashQuery(idHash));
    if visitor is error {
        return visitor is sql:NoRowsError ? () : visitor;
    }

    string? first_name = visitor.firstName;
    string? last_name = visitor.lastName;
    string? contact_number = visitor.contactNumber;
    string? email = visitor.email;

    if first_name is string {
        visitor.firstName = check decrypt(first_name);
    }
    if last_name is string {
        visitor.lastName = check decrypt(last_name);
    }
    if contact_number is string {
        visitor.contactNumber = check decrypt(contact_number);
    }

    if email is string {
        visitor.email = check decrypt(email);
    }

    return visitor;
}

# Add new visitor.
#
# + payload - Payload containing the visitor details  
# + createdBy - Person who is creating the visitor
# + return - Error if the insertion failed
public isolated function addVisitor(AddVisitorPayload payload, string createdBy) returns error? {
    string? firstName = payload.firstName;
    string? lastName = payload.lastName;
    string? contactNumber = payload.contactNumber;
    string? email = payload.email;

    payload.firstName = firstName is string ? check encrypt(firstName) : ();
    payload.lastName = lastName is string ? check encrypt(lastName) : ();
    payload.contactNumber = contactNumber is string ? check encrypt(contactNumber) : ();
    payload.email = email is string ? check encrypt(email) : ();

    _ = check databaseClient->execute(addVisitorQuery(payload, createdBy));
}

# Create a new invitation.
#
# + payload - Payload containing the invitation details
# + createdBy - Person who is creating the invitation
# + encodeString - Encoded uuid value
# + return - Error if the insertion failed
public isolated function addInvitation(AddInvitationPayload payload, string createdBy, string encodeString)
    returns error? {

    _ = check databaseClient->execute(addInvitationQuery(payload, createdBy, encodeString));
}

# Fetch invitation by encoded value.
#
# + encodeValue - Encoded uuid value
# + return - Invitation object or error
public isolated function fetchInvitation(string encodeValue) returns Invitation|error? {
    InvitationRecord|error invitationRecord = databaseClient->queryRow(fetchInvitationQuery(encodeValue));
    if invitationRecord is error {
        return invitationRecord is sql:NoRowsError ? () : invitationRecord;
    }

    string? visitInfo = invitationRecord.visitInfo;
    return {
        invitationId: invitationRecord.invitationId,
        inviteeEmail: invitationRecord.inviteeEmail,
        noOfVisitors: invitationRecord.noOfVisitors,
        visitInfo: visitInfo is string ? check visitInfo.fromJsonStringWithType() : (),
        active: invitationRecord.active,
        'type: invitationRecord.'type,
        createdBy: invitationRecord.createdBy,
        createdOn: invitationRecord.createdOn,
        updatedBy: invitationRecord.updatedBy,
        updatedOn: invitationRecord.updatedOn
    };
}

# Update invitation details.
#
# + invitationId - ID of the invitation to update
# + payload - Payload containing the fields to update  
# + updatedBy - Person who is updating the invitation
# + return - Error if the update failed or no rows were affected
public isolated function updateInvitation(int invitationId, UpdateInvitationPayload payload, string updatedBy)
    returns error? {

    sql:ExecutionResult executionResult = check databaseClient->execute(updateInvitationQuery(
            invitationId, payload, updatedBy));

    if executionResult.affectedRowCount < 1 {
        return error("No row was updated!");
    }
}

# Add new visit.
#
# + payload - Payload containing the visit details  
# + invitedBy - The person who invited the visitor  
# + createdBy - Person who is creating the visit  
# + invitationId - Invitation ID associated with the visit
# + return - Error if the insertion failed
public isolated function addVisit(AddVisitPayload payload, string invitedBy, string createdBy, int? invitationId = ())
    returns error? {

    _ = check databaseClient->execute(addVisitQuery(payload, invitedBy, createdBy, invitationId));
}

# Fetch visit by ID or UUID.
#
# + visitId - ID of the visit to fetch
# + uuid - UUID of the visit to fetch
# + return - Visit object or error
public isolated function fetchVisit(int? visitId = (), string? uuid = ()) returns Visit|error? {
    if visitId is () && uuid is () {
        return error("Either visitId or uuid must be provided.");
    }

    VisitRecord|error visit = databaseClient->queryRow(fetchVisitsQuery({visitId, uuid}));
    if visit is error {
        return visit is sql:NoRowsError ? () : visit;
    }

    string? firstName = visit.firstName;
    string? lastName = visit.lastName;
    string? contactNumber = visit.contactNumber;
    string? timeOfEntry = visit.timeOfEntry;
    string? timeOfDeparture = visit.timeOfDeparture;
    string? accessibleLocations = visit.accessibleLocations;

    return {
        id: visit.id,
        emailHash: visit.emailHash,
        companyName: visit.companyName,
        passNumber: visit.passNumber,
        whomTheyMeet: visit.whomTheyMeet,
        purposeOfVisit: visit.purposeOfVisit,
        accessibleLocations: accessibleLocations is string ?
            check accessibleLocations.fromJsonStringWithType() : null,
        visitDate: visit.visitDate,
        timeOfEntry: timeOfEntry is string ?
                timeOfEntry.endsWith(".0") ? timeOfEntry.substring(0, timeOfEntry.length() - 2) : timeOfEntry : (),
        timeOfDeparture: timeOfDeparture is string ?
                timeOfDeparture.endsWith(".0") ? timeOfDeparture.substring(0, timeOfDeparture.length() - 2) :
                timeOfDeparture : (),
        status: visit.status,
        firstName: firstName is string ? check decrypt(firstName) : (),
        lastName: lastName is string ? check decrypt(lastName) : (),
        contactNumber: contactNumber is string ? check decrypt(contactNumber) : (),
        email: check decrypt(visit.email),
        invitationId: visit.invitationId,
        createdBy: visit.createdBy,
        createdOn: visit.createdOn,
        updatedBy: visit.updatedBy,
        updatedOn: visit.updatedOn
    };
}

# Fetch visits with pagination.
#
# + filters - Filters for fetching visits
# + return - Array of visits objects or error
public isolated function fetchVisits(VisitFilters filters) returns VisitsResponse|error {
    stream<VisitRecord, sql:Error?> resultStream = databaseClient->query(fetchVisitsQuery(filters));

    int totalCount = 0;
    Visit[] visits = [];
    check from VisitRecord visit in resultStream
        do {
            string? accessibleLocations = visit.accessibleLocations;
            string? timeOfEntry = visit.timeOfEntry;
            string? timeOfDeparture = visit.timeOfDeparture;
            string? firstName = visit.firstName;
            string? lastName = visit.lastName;
            string? contactNumber = visit.contactNumber;
            totalCount = visit.totalCount;
            visits.push({
                id: visit.id,
                timeOfEntry: timeOfEntry is string ?
                        timeOfEntry.endsWith(".0") ? timeOfEntry.substring(0, timeOfEntry.length() - 2) : timeOfEntry : (),
                timeOfDeparture: timeOfDeparture is string ?
                        timeOfDeparture.endsWith(".0") ? timeOfDeparture.substring(0, timeOfDeparture.length() - 2) : timeOfDeparture : (),
                passNumber: visit.passNumber,
                emailHash: visit.emailHash,
                firstName: firstName is string ? check decrypt(firstName) : (),
                lastName: lastName is string ? check decrypt(lastName) : (),
                email: check decrypt(visit.email),
                contactNumber: contactNumber is string ? check decrypt(contactNumber) : (),
                companyName: visit.companyName,
                whomTheyMeet: visit.whomTheyMeet,
                purposeOfVisit: visit.purposeOfVisit,
                accessibleLocations: accessibleLocations is string ?
                    check accessibleLocations.fromJsonStringWithType() : null,
                visitDate: visit.visitDate,
                invitationId: visit.invitationId,
                status: visit.status,
                createdBy: visit.createdBy,
                createdOn: visit.createdOn,
                updatedBy: visit.updatedBy,
                updatedOn: visit.updatedOn
            });
        };

    return {totalCount, visits};
}

# Update visit details.
#
# + visitId - ID of the visit to update
# + payload - Payload containing the fields to update
# + updatedBy - Person who is updating the visit
# + return - Error if the update failed or no rows were affected
public isolated function updateVisit(int visitId, UpdateVisitPayload payload, string updatedBy) returns error? {
    sql:ExecutionResult executionResult = check databaseClient->execute(updateVisitQuery(visitId, payload, updatedBy));
    if executionResult.affectedRowCount < 1 {
        return error("No row was updated!");
    }
}
