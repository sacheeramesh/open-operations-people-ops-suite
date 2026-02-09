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
import ballerina/constraint;
import ballerina/sql;
import ballerina/time;
import ballerinax/mysql;

# [Configurable] Database configs.
type DatabaseConfig record {|
    # If the MySQL server is secured, the username
    string user;
    # The password of the MySQL server for the provided username
    string password;
    # The name of the database
    string database;
    # Hostname of the MySQL server
    string host;
    # Port number of the MySQL server
    int port;
    # The `mysql:Options` configurations
    mysql:Options options?;
    # The `sql:ConnectionPool` configurations
    sql:ConnectionPool connectionPool?;
|};

# Database audit fields.
public type AuditFields record {|
    # Who created the visitor 
    string createdBy;
    # When the visitor was created 
    string createdOn;
    # Who updated the visitor
    string updatedBy;
    # When the visitor was updated
    string updatedOn;
|};

# Database record for Visitor.
public type Visitor record {|
    *AddVisitorPayload;
    *AuditFields;
|};

# [Database] Insert record for visitor.
public type AddVisitorPayload record {|
    # Hashed email or contact number of the visitor
    @constraint:String {
        pattern: {
            value: SHA256_REGEX,
            message: "The Id Hash should be a valid SHA-256 hash."
        }
    }
    string idHash;

    # First name of the visitor
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The first name should be a non-empty string with printable characters."
        }
    }
    string? firstName = ();

    # Last name of the visitor
    @constraint:String {
        pattern: {
            value: NONE_EMPTY_PRINTABLE_STRING_REGEX,
            message: "The last name should be a non-empty string with printable characters."
        }
    }
    string? lastName = ();

    # Working phone number of visitor
    @constraint:String {
        pattern: {
            value: INTERNATIONAL_CONTACT_NUMBER_REGEX,
            message: "The contact number should be in valid international format."
        }
    }
    string? contactNumber = ();

    # Email of the visitor
    @constraint:String {
        pattern: {
            value: EMAIL_REGEX,
            message: "The email should be a valid email address."
        }
    }
    string? email = ();
|};

# [Database] Floor record.
public type Floor record {|
    # Floor
    string floor;
    # Array of rooms
    string[] rooms;
|};

# [Database] Insert record for visit.
public type AddVisitPayload record {|
    # Email Hash of the visitor
    string emailHash;
    # Company name of visitor
    string? companyName = ();
    # Number in the tag given to visitor
    string? passNumber = ();
    # The person the visitor is supposed to meet
    string? whomTheyMeet = ();
    # Purpose of the visit
    string? purposeOfVisit = ();
    # The floors and rooms that the visitor can access
    Floor[]? accessibleLocations = ();
    # Time at which the visitor is supposed to check in [in UTC]
    time:Utc? timeOfEntry = ();
    # Time at which the visitor is supposed to check out [in UTC]
    time:Utc? timeOfDeparture = ();
    # Status of the visit
    Status? status = ();
    # Date of the visit [in UTC]
    string visitDate;
    # Unique identifier for the visit
    string uuid;
|};

# [Database] Visit record.
public type VisitRecord record {|
    *AuditFields;
    # Unique identifier for the visit
    int id;
    # First name of the visitor
    string? firstName;
    # Last name of the visitor
    string? lastName;
    # Working phone number of visitor
    string? contactNumber;
    # Email Hash of the visitor
    string emailHash;
    # Email of the visitor
    string email;
    # Company name of visitor
    string? companyName;
    # Number in the tag given to visitor
    string passNumber?;
    # The person the visitor is supposed to meet
    string? whomTheyMeet;
    # Purpose of the visit
    string? purposeOfVisit;
    # The floors and rooms that the visitor can access
    string? accessibleLocations = ();
    # Date of the visit [in UTC]
    string visitDate;
    # Time at which the visitor is supposed to check in [in UTC]
    string? timeOfEntry;
    # Time at which the visitor is supposed to check out [in UTC]
    string? timeOfDeparture;
    # Invitation ID associated with the visit
    int? invitationId;
    # Status of the visit
    Status status;
    # Total number of visits
    int totalCount;
|};

# Visit record.
public type Visit record {|
    *AuditFields;
    # Unique identifier for the visit
    int id;
    # Email Hash of the visitor
    string emailHash;
    # Company name of visitor
    string? companyName = ();
    # Number in the tag given to visitor
    string passNumber?;
    # The person the visitor is supposed to meet
    string? whomTheyMeet = ();
    # Purpose of the visit
    string? purposeOfVisit = ();
    # The floors and rooms that the visitor can access
    Floor[]? accessibleLocations = ();
    # Date of the visit [in UTC]
    string visitDate;
    # Time at which the visitor is supposed to check in [in UTC]
    string? timeOfEntry = ();
    # Time at which the visitor is supposed to check out [in UTC]
    string? timeOfDeparture = ();
    # Status of the visit
    Status status;
    # First name of the visitor
    string? firstName = ();
    # Last name of the visitor
    string? lastName = ();
    # Working phone number of visitor
    string? contactNumber = ();
    # Email of the visitor
    string email;
    # Invitation ID associated with the visit
    int? invitationId = ();
|};

# Response Record for Visits.
public type VisitsResponse record {|
    # The total count of visits
    int totalCount;
    # Array of visits
    Visit[] visits;
|};

# [Database] Insert record for visit invitation.
public type AddInvitationPayload record {|
    # invitations count
    int noOfVisitors;
    # invitation status
    boolean isActive;
    # invitee email
    string inviteeEmail;
|};

# [Database] Invitation record.
public type InvitationRecord record {|
    *AuditFields;
    # Id of the invitation
    int invitationId;
    # Email of the invitee
    string inviteeEmail;
    # Validity of the invitation
    boolean active;
    # No of invitations
    int noOfVisitors;
    # Visit details in the invitation
    string? visitInfo = ();
    # Who invited the visitor
    AddVisitorPayload[] invitees?;
    # Types of the invitation
    string 'type;
|};

# Invitation.
public type Invitation record {|
    *AuditFields;
    # Id of the invitation
    int invitationId;
    # Email of the invitee
    string inviteeEmail;
    # Validity of the invitation
    boolean active;
    # No of invitations
    int noOfVisitors;
    # Visit details in the invitation
    VisitInfo? visitInfo = ();
    # Who invited the visitor
    AddVisitorPayload[] invitees?;
    # Types of the invitation
    string 'type;
|};

# Visit information of invitation.
public type VisitInfo record {|
    # Name of company
    string? companyName = ();
    # Person they meet
    string whomTheyMeet;
    # Purpose of visit
    string purposeOfVisit;
    # Time of entry
    string timeOfEntry;
    # Time of departure
    string timeOfDeparture;
|};

# Payload to update visit details.
public type UpdateVisitPayload record {|
    # Number in the tag given to visitor
    string? passNumber = ();
    # Status of the visit
    Status? status = ();
    # Reason for rejecting the visit
    string? rejectionReason = ();
    # The floors and rooms that the visitor can access
    Floor[]? accessibleLocations = ();
    # Who actioned the visit
    string? actionedBy = ();
    # Time of entry
    time:Utc? timeOfEntry = ();
    # Time of departure
    time:Utc? timeOfDeparture = ();
|};

# Payload to update Invitation details.
public type UpdateInvitationPayload record {|
    # Visit details in the invitation
    VisitInfo? visitInfo = ();
    # Validity of the invitation
    boolean? active = ();
|};

// Filter Types.
# Filters for the visits.
public type VisitFilters record {|
    # Email of the inviter
    string? inviter = ();
    # ID of the visit
    int? visitId = ();
    # Invitation ID associated with the visit
    int? invitationId = ();
    # Status array of the visits
    Status[]? statusArray = ();
    # Limit number of visits to fetch
    int? 'limit = DEFAULT_LIMIT;
    # Offset for pagination
    int? offset = ();
    # UUID of the visit
    string? uuid = ();
|};
