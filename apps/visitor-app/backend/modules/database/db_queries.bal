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
import ballerina/time;

# Build query to fetch a visitor by hashed email or hashed contact number.
#
# + idHash - Filter : Hashed email or hashed contact number of the visitor
# + return - sql:ParameterizedQuery - Select query for the visitor based on the hashed email or hashed contact number
isolated function fetchVisitorByIdHashQuery(string idHash) returns sql:ParameterizedQuery
    => `
        SELECT         
            first_name as firstName,
            last_name as lastName,
            contact_number as contactNumber,
            id_hash as idHash,
            email,
            created_by as createdBy,
            created_on as createdOn,
            updated_by as updatedBy,
            updated_on as updatedOn
        FROM 
            visitor
        WHERE 
            id_hash = ${idHash};
        `;

# Build query to persist a visitor.
#
# + payload - Payload containing the visitor details
# + createdBy - Person who is creating the visitor
# + return - sql:ParameterizedQuery - Insert query for the new visitor
isolated function addVisitorQuery(AddVisitorPayload payload, string createdBy) returns sql:ParameterizedQuery
    => `
        INSERT INTO visitor
        (
            first_name,
            last_name,
            email_hash,
            email,
            contact_number,
            created_by,
            updated_by
        )
        VALUES
        (
            ${payload.firstName},
            ${payload.lastName},
            ${payload.idHash},
            ${payload.email},
            ${payload.contactNumber},
            ${createdBy},
            ${createdBy}
        )
        ON DUPLICATE KEY UPDATE
            first_name = COALESCE(${payload.firstName}, first_name),
            last_name = COALESCE(${payload.lastName}, last_name),
            contact_number = COALESCE(${payload.contactNumber}, contact_number),
            updated_by = ${createdBy}
        ;`;

# Build query to create a new invitation.
#
# + payload - Payload containing the invitation details
# + createdBy - Person who is creating the invitation
# + encodeString - Encoded uuid value
# + return - sql:ParameterizedQuery - Insert query for the new invitation
isolated function addInvitationQuery(AddInvitationPayload payload, string createdBy, string encodeString)
    returns sql:ParameterizedQuery
    
    => `
        INSERT INTO visit_invitation
        (
            encode_value,
            invitee_email,
            no_of_visitors,
            is_active,
            created_by,
            updated_by
        )
        VALUES
        (
            ${encodeString},
            ${payload.inviteeEmail},
            ${payload.noOfVisitors},
            ${payload.isActive},
            ${createdBy},
            ${createdBy}
        );`;

# Build query to fetch an invitation.
#
# + encodeValue - Encoded uuid value
# + return - sql:ParameterizedQuery - Select query for the invitation based on the encoded value
isolated function fetchInvitationQuery(string encodeValue) returns sql:ParameterizedQuery => `
        SELECT
            invitation_id AS invitationId,
            invitee_email AS inviteeEmail,
            is_active AS active,
            no_of_visitors AS noOfVisitors,
            visit_info AS visitInfo,
            type,
            created_by AS createdBy,
            created_on AS createdOn,
            updated_by AS updatedBy,
            updated_on AS updatedOn
        FROM 
            visit_invitation
        WHERE 
            encode_value = ${encodeValue};
    `;

# Build query to persist a visit.
#
# + payload - Payload containing the visit details
# + invitedBy - Person who is inviting the visitor
# + createdBy - Person who is creating the visit
# + invitationId - Invitation ID associated with the visit
# + return - sql:ParameterizedQuery - Insert query for the new visit
isolated function addVisitQuery(AddVisitPayload payload, string invitedBy, string createdBy, int? invitationId)
    returns sql:ParameterizedQuery

    => `
        INSERT INTO visit
        (
            uuid,
            email_hash,
            pass_number,
            company_name,
            whom_they_meet,
            purpose_of_visit,
            accessible_locations,
            visit_date,
            time_of_entry,
            time_of_departure,
            invitation_id,
            invited_by,
            status,
            created_by,
            updated_by
        )
        VALUES
        (
            ${payload.uuid},
            ${payload.emailHash},
            ${payload.passNumber},
            ${payload.companyName},
            ${payload.whomTheyMeet},
            ${payload.purposeOfVisit},
            ${payload.accessibleLocations is Floor[] ? payload.accessibleLocations.toJsonString() : null},
            ${payload.visitDate},
            ${payload.timeOfEntry},
            ${payload.timeOfDeparture},
            ${invitationId},
            ${invitedBy},
            ${payload.status},
            ${createdBy},
            ${createdBy}
        );`;

# Build query to fetch visits with optional filters and pagination.
#
# + filters - Filters for fetching visits
# + return - sql:ParameterizedQuery - Select query for visits based on the provided filters and pagination
isolated function fetchVisitsQuery(VisitFilters filters) returns sql:ParameterizedQuery {

    sql:ParameterizedQuery mainQuery = `
        SELECT 
            v.visit_id as id,
            v.time_of_entry as timeOfEntry,
            v.time_of_departure as timeOfDeparture,
            v.invitation_id as invitationId,
            v.pass_number as passNumber,
            v.email_hash as emailHash,
            vs.first_name as firstName,
            vs.last_name as lastName,
            vs.email,
            vs.contact_number as contactNumber,
            v.company_name as companyName,
            v.whom_they_meet as whomTheyMeet,
            v.purpose_of_visit as purposeOfVisit,
            v.accessible_locations as accessibleLocations,
            v.visit_date as visitDate,
            v.status,
            v.created_by as createdBy,
            v.created_on as createdOn,
            v.updated_by as updatedBy,
            v.updated_on as updatedOn,
            COUNT(*) OVER() AS totalCount
        FROM 
            visit v
        LEFT JOIN
            visitor vs
        ON
            v.email_hash = vs.email_hash
    `;

    // Setting the filters based on the inputs.
    sql:ParameterizedQuery[] filterQueries = [];
    if filters.inviter is string {
        filterQueries.push(` v.invited_by = ${filters.inviter}`);
    }
    if filters.invitationId is int {
        filterQueries.push(` v.invitation_id = ${filters.invitationId}`);
    }

    Status[]? statusArray = filters.statusArray;
    if statusArray is Status[] {
        sql:ParameterizedQuery arrayFlattenQuery = sql:arrayFlattenQuery(from Status status in statusArray
                    select status.toString());

        filterQueries.push(sql:queryConcat(` v.status IN (`, arrayFlattenQuery, `) `));
    }

    if filters.visitId is int {
        filterQueries.push(` v.visit_id = ${filters.visitId}`);
    }

    if filters.uuid is string {
        filterQueries.push(` v.uuid = ${filters.uuid}`);
    }

    // Build main query with the filters.
    mainQuery = buildSqlSelectQuery(mainQuery, filterQueries);

    // Sorting the result by created_on.
    mainQuery = sql:queryConcat(mainQuery, ` ORDER BY v.created_on DESC`);

    // Setting the limit and offset.
    if filters.'limit is int {
        mainQuery = sql:queryConcat(mainQuery, ` LIMIT ${filters.'limit}`);
        if filters.offset is int {
            mainQuery = sql:queryConcat(mainQuery, ` OFFSET ${filters.offset}`);
        }
    } else {
        mainQuery = sql:queryConcat(mainQuery, ` LIMIT ${DEFAULT_LIMIT}`);
    }

    return mainQuery;
}

# Build query to update a visit.
#
# + visitId - ID of the visit to update
# + payload - Payload containing the visit update details
# + updatedBy - Person who is updating the visit
# + return - sql:ParameterizedQuery - Update query for the visit
isolated function updateVisitQuery(int visitId, UpdateVisitPayload payload, string updatedBy) returns sql:ParameterizedQuery {
    sql:ParameterizedQuery mainQuery = `
        UPDATE visit
        SET
    `;

    sql:ParameterizedQuery subQuery = `
        WHERE visit_id = ${visitId}
    `;

    // Setting the filters based on the visit status and inputs.
    sql:ParameterizedQuery[] filters = [];

    if payload.status is Status {
        filters.push(`status = ${payload.status}`);
    }

    if payload.passNumber is string {
        filters.push(`pass_number = ${payload.passNumber}`);
    }

    if payload.accessibleLocations is Floor[] {
        filters.push(`accessible_locations = ${payload.accessibleLocations.toJsonString()}`);
    }

    if payload.rejectionReason is string {
        filters.push(`rejection_reason = ${payload.rejectionReason}`);
    }

    if payload.actionedBy is string {
        filters.push(`actioned_by = ${payload.actionedBy}`);
    }

    if payload.timeOfEntry is time:Utc {
        filters.push(`time_of_entry = ${payload.timeOfEntry}`);
    }

    if payload.timeOfDeparture is time:Utc {
        filters.push(`time_of_departure = ${payload.timeOfDeparture}`);
    }

    // Setting the updated_by field to record who performed the update, for audit purposes.
    filters.push(`updated_by = ${updatedBy}`);

    mainQuery = buildSqlUpdateQuery(mainQuery, filters);

    return sql:queryConcat(mainQuery, subQuery);
}

# Build query to update a invitation.
#
# + invitationId - ID of the invitation to update
# + payload - Payload containing the invitation update details
# + updatedBy - Person who is updating the invitation
# + return - sql:ParameterizedQuery - Update query for the invitation
isolated function updateInvitationQuery(int invitationId, UpdateInvitationPayload payload, string updatedBy)
    returns sql:ParameterizedQuery {

    sql:ParameterizedQuery mainQuery = `
        UPDATE visit_invitation
        SET
    `;

    sql:ParameterizedQuery subQuery = `
        WHERE invitation_id = ${invitationId}
    `;

    // Setting the filters based on the visit status and inputs.
    sql:ParameterizedQuery[] filters = [];

    if payload.visitInfo is VisitInfo {
        filters.push(`visit_info = ${payload.visitInfo.toJsonString()}`);
    }

    if payload.active is boolean {
        filters.push(`is_active = ${payload.active}`);
    }

    filters.push(`updated_by = ${updatedBy}`);
    mainQuery = buildSqlUpdateQuery(mainQuery, filters);
    return sql:queryConcat(mainQuery, subQuery);
}
