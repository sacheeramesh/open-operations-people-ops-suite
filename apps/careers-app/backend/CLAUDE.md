# CLAUDE.md — Ballerina REST API + MySQL Backend

## Stack

- **Language**: Ballerina (latest)
- **Role**: REST API backend consumed by a React + MUI frontend
- **Database**: MySQL via `ballerinax/mysql` client
- **Format**: JSON over HTTP

---

## Before Implementing Anything

**Always ask clarifying questions first. Do not write a single line of code until the following are clear:**

- What resource/entity is being operated on?
- What HTTP method and route?
- What are the expected request payload fields and types?
- What are the expected response fields and types?
- What are the error cases (not found, conflict, validation failure)?
- Are there any auth or permission requirements?
- Does this affect any existing endpoints or DB schema?

Only proceed once all of the above are confirmed.

---

## Project Structure

```
my-service/
├── Ballerina.toml
├── Config.toml              ← local config (gitignored)
├── service.bal              ← HTTP service, resource functions only
├── types.bal                ← all record types (request/response/DB)
├── db.bal                   ← all database operations
├── utils.bal                ← helper functions (validation, mapping)
└── tests/
    └── service_test.bal
```

For larger projects, split into modules:

```
modules/
  db/          ← database layer
  model/       ← shared types
  util/        ← helpers
```

---

## Service Layer Rules (`service.bal`)

- Resource functions handle HTTP only: parse input, call db functions, return responses.
- No SQL or business logic inside resource functions — delegate to `db.bal`.
- Always specify the HTTP method explicitly: `resource function get`, `post`, `put`, `delete`, `patch`.
- Use path parameters for resource IDs: `resource function get users/[int id]`.
- Always return typed response records, never raw `json` or `anydata`.

```ballerina
// ✅ Good
resource function get users/[int id](http:Caller caller) returns UserResponse|http:NotFound|error {
    UserResponse|error user = db:getUserById(id);
    if user is error {
        return <http:NotFound>{body: {message: "User not found"}};
    }
    return user;
}

// ❌ Bad — SQL inside resource function, untyped response
resource function get users/[int id]() returns json {
    var result = dbClient->query(`SELECT * FROM users WHERE id = ${id}`);
    return result;
}
```

---

## Database Layer Rules (`db.bal`)

- All SQL goes here. No SQL anywhere else.
- Use parameterized queries always — never string-interpolated SQL.
- Use `sql:ParameterizedQuery` with `backtick` template literals.
- Always close streams after use.
- Return typed records or `error`, never raw `sql:ResultStream`.
- Use `check` for error propagation; let the service layer handle HTTP error mapping.

```ballerina
// ✅ Good — parameterized, typed, stream closed
public function getUserById(int id) returns UserRecord|error {
    sql:ParameterizedQuery query = `SELECT id, name, email FROM users WHERE id = ${id}`;
    UserRecord|error result = dbClient->queryRow(query);
    return result;
}

// ❌ Bad — string interpolation (SQL injection risk)
public function getUserById(int id) returns UserRecord|error {
    var result = dbClient->queryRow("SELECT * FROM users WHERE id = " + id.toString());
    return result;
}
```

---

## Types (`types.bal`)

- Define all record types here. No inline anonymous records in function signatures.
- Use **closed records** (`record {|...|}`} by default for DB rows and internal types.
- Use **open records** (`record {...}`) only for request payloads where extra fields are acceptable.
- Separate request types, response types, and DB types — don't reuse the same record for all three.

```ballerina
// Request type (open — tolerates extra fields from client)
public type CreateUserRequest record {
    string name;
    string email;
    string password;
};

// Response type (closed — explicit contract with frontend)
public type UserResponse record {|
    int id;
    string name;
    string email;
    string createdAt;
|};

// DB row type (closed — maps exactly to DB schema)
type UserRow record {|
    int id;
    string name;
    string email;
    string password_hash;
    string created_at;
|};
```

---

## Error Handling Pattern — Bubble Up, Log at Service

This is a strict architectural rule. Follow it in every file.

### The pattern

| Layer | Responsibility |
|---|---|
| `db.bal`, `utils.bal`, modules | Use `check` to propagate errors. **No logging. No custom errors.** |
| `service.bal` | Catch errors, log them, create custom/typed errors, map to HTTP responses. |

### In `db.bal` and all non-service files

- Use `check` to propagate — never catch and swallow errors.
- Never call `log:printError()` or create custom error types here.
- Never return a generic `error` with a hand-crafted message — just let it bubble.

```ballerina
// ✅ Good — error propagates naturally
public function getUserById(int id) returns UserRecord|error {
    sql:ParameterizedQuery query = `SELECT id, name, email FROM users WHERE id = ${id}`;
    return check dbClient->queryRow(query);
}

// ❌ Bad — logging and custom error in db layer
public function getUserById(int id) returns UserRecord|error {
    sql:ParameterizedQuery query = `SELECT id, name, email FROM users WHERE id = ${id}`;
    UserRecord|error result = dbClient->queryRow(query);
    if result is error {
        log:printError("DB error", result);           // ❌ not here
        return error("User fetch failed");            // ❌ not here
    }
    return result;
}
```

### In `service.bal`

- This is the only place that logs errors (`log:printError`).
- This is the only place that creates custom error messages returned to the client.
- Inspect the bubbled-up error here and map it to the correct HTTP response.

```ballerina
// ✅ Good — logging and custom error only at service level
resource function post users(CreateUserRequest req) returns UserResponse|http:Conflict|http:InternalServerError|error {
    UserResponse|error result = db:createUser(req);
    if result is error {
        log:printError("Failed to create user", result, email = req.email);
        if result.message().includes("Duplicate") {
            return <http:Conflict>{body: {message: "A user with this email already exists."}};
        }
        return <http:InternalServerError>{body: {message: "An unexpected error occurred."}};
    }
    return result;
}
```

### Summary rules

- `check` in `db.bal`, `utils.bal`, and all modules — always.
- `log:printError` only in `service.bal` — never elsewhere.
- Custom error messages for the client only in `service.bal` — never elsewhere.
- Never suppress an error silently in any layer (`_ = ...` on an error is always wrong).

---

## Configuration (`Config.toml`)

- All secrets and environment-specific values go in `Config.toml`. Never hardcode.
- `Config.toml` is gitignored. Provide a `Config.toml.example` with placeholder values.
- Access via `configurable` variables at the top of the relevant `.bal` file.

```ballerina
configurable string dbHost = ?;
configurable int dbPort = 3306;
configurable string dbName = ?;
configurable string dbUser = ?;
configurable string dbPassword = ?;
```

---

## MySQL Connection

- Initialize the `mysql:Client` once as a module-level variable, not inside functions.
- Configure connection pooling explicitly.
- Always handle the client init error at startup.

```ballerina
final mysql:Client dbClient = check new (
    host = dbHost,
    port = dbPort,
    database = dbName,
    user = dbUser,
    password = dbPassword,
    connectionPool = {maxOpenConnections: 10}
);
```

---

## Naming Conventions

- Files: `snake_case.bal`
- Functions: `camelCase`
- Types/Records: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Variables: `camelCase`
- REST routes: `kebab-case` (`/user-profiles`, not `/userProfiles`)

---

## HTTP Standards

- Use correct HTTP status codes: `200` (ok), `201` (created), `204` (no content), `400` (bad request), `404` (not found), `409` (conflict), `500` (internal error).
- Always version the API: routes start with `/v1/`.
- Resource names are plural nouns: `/v1/users`, `/v1/orders`.
- Use `PATCH` for partial updates, `PUT` for full replacement.
- Error response body always includes a `message` string field.

---

## Testing

- Test files go in `tests/` as `*_test.bal`.
- Test every resource function: happy path + each error case.
- Use mock DB clients for unit tests, not a real DB connection.
- Run tests with: `bal test`

---

## Code Quality

- Run `bal format` before presenting any code.
- Run `bal build` to confirm no compile errors.
- No functions over 40 lines — split into helpers in `utils.bal`.
- Prefer early returns over nested `if` blocks.
- Add `// Doc comment` above every public function describing its purpose, params, and return.
- Wrap lines at 120 characters.

---

## Claude Behavior

- **Ask clarifying questions before writing any code** (see top of file).
- After clarifying, state the approach: which files are affected, what types are needed, what SQL will run.
- After implementing, self-check: parameterized queries? typed returns? errors mapped to correct HTTP codes? config values externalized?
- Do not introduce new dependencies without flagging them explicitly and explaining why.
