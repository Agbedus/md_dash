# Fast Dash API Documentation

**Version:** 1.2.0  
**Base URL:** `/api/v1`

## Changelog


### 2026-03-20

- Enhanced Announcements system with `type` classification (info, success, warning, error, critical).
- Added `creator` relationship to announcements for attribution.
- Updated WebSocket broadcast payload to include announcement type and creator ID.
- Improved Announcements UI with search filtering and color-coded priority levels.

### 2026-03-19

- Introduced Announcements system for system-wide broadcasts.
- Added CRUD endpoints for announcements under `/api/v1/announcements`.
- Implemented real-time announcement broadcasting via WebSocket at `/ws/announcements`.
- Restricted announcement management (Create, Update, Delete) to `SUPER_ADMIN`.
- Added automatic `creator_id` injection for announcements and other resources in admin-db.

### 2026-03-09

- Introduced Attendance & Presence tracking system.
- Added endpoints for real-time location updates and presence state evaluation.
- Implemented office location management and attendance policy configuration.
- Added support for attendance record overrides by managers.

### 2026-03-02

- Added Leave & Time-Off Management system.
- Implemented `/api/v1/time-off` endpoints for requests, approval, and rejection.
- Integrated leave availability checks into task assignment.
- Automated calendar blocking on approved time-off.

### 2026-02-19

- Simplified Task Timer: Removed `pause` endpoint as redundant; `start` now stops other active sessions automatically.
- Registered `TimeLog` CRUD endpoints under `/api/v1/timelogs`.
- Updated API documentation to reflect timer changes and new TimeLog resource.

### 2026-02-18

- Synchronized web view submit handlers with API notification triggers.
- Verified and updated model field documentation for Tasks, Projects, Notes, and Events.
- Refined permission model documentation to match implemented route guards (e.g., restricted task updates to `MANAGER|SUPER_ADMIN`).

### 2026-02-17

- Consolidated duplicated documentation into a single canonical document.
- Normalized endpoint coverage against implemented FastAPI routes.
- Added missing endpoint documentation for `PATCH /api/v1/user-admin/{user_id}`.
- Updated role model wording to match code (`USER`, `CLIENT`, `STAFF`, `MANAGER`, `SUPER_ADMIN`).
- Corrected auth and permission descriptions to match current route guards.
- Clarified current WebSocket notification auth caveat without changing route behavior.
- Rebuilt permission summary and common-pattern guidance to match implementation.

## Table of Contents

1. Overview
2. Authentication
3. Error Handling
4. Endpoints
   - System
   - Authentication
   - Users
   - Clients
   - Projects
   - Tasks
   - TimeLogs
   - Notes
   - Events
   - Leave & Time-Off
   - Attendance
   - Announcements
   - Decisions
   - Notifications
   - Admin
5. Permission Model
6. Common Patterns
7. Interactive API Docs

---

## Overview

Fast Dash is a project management API built with FastAPI.

Key points:

- JWT auth via bearer token and cookie fallback
- Role-based authorization using `USER`, `CLIENT`, `STAFF`, `MANAGER`, `SUPER_ADMIN`
- Ownership and sharing behavior for selected resources
- REST endpoints under `/api/v1`

---

## Authentication

### Supported auth modes

1. Bearer token in `Authorization: Bearer <token>`
2. HTTP-only cookie (`access_token`) for browser sessions

`get_current_user` checks bearer token first, then cookie.

### Register

- **POST** `/api/v1/auth/register`
- **Auth Required:** No

Payload:

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

Returns: created `User` object.

### Login

- **POST** `/api/v1/auth/login`
- **Auth Required:** No
- **Content Type:** form-data (`OAuth2PasswordRequestForm`)

Form fields:

```
username=user@example.com
password=securepassword123
```

Returns:

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

Also sets cookie:

- name: `access_token`
- value format: `Bearer <jwt>`
- `httponly=true`
- `samesite=lax`

### Logout

- **GET** `/api/v1/auth/logout`
- **Auth Required:** No

Behavior:

- deletes `access_token` cookie
- redirects to `/login`

---

## Error Handling

Standard error body:

```json
{
  "detail": "Error message"
}
```

Common status codes:

- `200` OK
- `201` Created
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `422` Validation Error
- `500` Internal Server Error

---

## Endpoints

## System Endpoints

### Health Check

- **GET** `/api/v1/health`
- **Auth Required:** No

Returns:

```json
{
  "status": "ok"
}
```

---

## Authentication Endpoints

### Register User

- **POST** `/api/v1/auth/register`

### Login

- **POST** `/api/v1/auth/login`

### Logout

- **GET** `/api/v1/auth/logout`

---

## Users Endpoints

Base path: `/api/v1/users`

### List Users

- **GET** `/api/v1/users`
- **Auth Required:** `MANAGER` or `SUPER_ADMIN`
- Query params: `skip`, `limit`

### Create User

- **POST** `/api/v1/users`
- **Auth Required:** `SUPER_ADMIN`

Payload shape (`UserCreate`):

```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "full_name": "New User",
  "roles": ["staff"],
  "avatar_url": "https://example.com/avatar.jpg"
}
```

### Get Current User

- **GET** `/api/v1/users/me`
- **Auth Required:** Any authenticated user

### Update Current User

- **PUT** `/api/v1/users/me`
- **Auth Required:** Any authenticated user

Updatable fields (`UserUpdate`):

- `email`
- `password`
- `full_name`
- `roles`
- `image`
- `avatar_url`
- `emailVerified`

### Get User by ID

- **GET** `/api/v1/users/{user_id}`
- **Auth Required:** self OR (`MANAGER`/`SUPER_ADMIN`)

### Update User by ID

- **PUT** `/api/v1/users/{user_id}`
- **Auth Required:** `SUPER_ADMIN`

### Delete User

- **DELETE** `/api/v1/users/{user_id}`
- **Auth Required:** `SUPER_ADMIN`
- Note: cannot delete yourself

---

## Clients Endpoints

Base path: `/api/v1/clients`

### List Clients

- **GET** `/api/v1/clients`
- **Auth Required:** `MANAGER` or `SUPER_ADMIN`

### Get Client

- **GET** `/api/v1/clients/{client_id}`
- **Auth Required:** `MANAGER` or `SUPER_ADMIN`

### Create Client

- **POST** `/api/v1/clients`
- **Auth Required:** `MANAGER` or `SUPER_ADMIN`

### Update Client

- **PATCH** `/api/v1/clients/{client_id}`
- **Auth Required:** `MANAGER` or `SUPER_ADMIN`

### Delete Client

- **DELETE** `/api/v1/clients/{client_id}`
- **Auth Required:** `SUPER_ADMIN`

---

## Projects Endpoints

Base path: `/api/v1/projects`

### List Projects

- **GET** `/api/v1/projects`
- **Auth Required:** Any authenticated user
- Behavior:
  - `SUPER_ADMIN` and `MANAGER`: all projects
  - others: only projects where `owner_id == current_user.id`

### Get Project

- **GET** `/api/v1/projects/{project_id}`
- **Auth Required:** Any authenticated user
- Behavior:
  - `SUPER_ADMIN` and `MANAGER`: any project
  - others: own project only

### Create Project

- **POST** `/api/v1/projects`
- **Auth Required:** Any authenticated user
- Note: `owner_id` defaults to current user if omitted

### Update Project

- **PATCH** `/api/v1/projects/{project_id}`
- **Auth Required:** `MANAGER` or `SUPER_ADMIN`

### Delete Project

- **DELETE** `/api/v1/projects/{project_id}`
- **Auth Required:** `SUPER_ADMIN`

---

## Tasks Endpoints

Base path: `/api/v1/tasks`

### List Tasks

- **GET** `/api/v1/tasks`
- **Auth Required:** Any authenticated user
- Query params: `skip`, `limit`, `project_id`
- Behavior:
  - `SUPER_ADMIN` and `MANAGER`: all tasks
  - others: tasks they created, tasks assigned to them, or tasks in projects they own

### Get Task

- **GET** `/api/v1/tasks/{task_id}`
- **Auth Required:** Any authenticated user
- Behavior follows same visibility model as list

### Create Task

- **POST** `/api/v1/tasks`
- **Auth Required:** Any authenticated user
- Payload is dynamic dict.
- Supported assignment field:
  - `assignees`: array of user IDs
- Note: `user_id` is forced to current user.

### Update Task

- **PATCH** `/api/v1/tasks/{task_id}`
- **Auth Required:** `MANAGER` or `SUPER_ADMIN`
- `assignees` behavior:
  - provide `[]` to clear all
  - omit to leave unchanged

### Delete Task

- **DELETE** `/api/v1/tasks/{task_id}`
- **Auth Required:** `SUPER_ADMIN`
- Note: cannot delete yourself

### Start Timer

- **POST** `/api/v1/tasks/{task_id}/timer/start`
- **Auth Required:** Any authenticated user
- **Behavior**: Stops any other active timer sessions for the current user across all tasks, then creates a new session for the target task. Automatically moves task to `IN_PROGRESS` if it's in `TODO`.

### Stop Timer

- **POST** `/api/v1/tasks/{task_id}/timer/stop`
- **Auth Required:** Any authenticated user

Task status enum:

- `TODO`
- `IN_PROGRESS`
- `QA`
- `REVIEW`
- `DONE`

---

## TimeLogs Endpoints

Base path: `/api/v1/timelogs`

### List TimeLogs

- **GET** `/api/v1/timelogs`
- **Auth Required:** Any authenticated user
- **Query params**: `skip`, `limit`, `task_id`
- **Behavior**:
  - `SUPER_ADMIN` and `MANAGER`: all logs
  - others: only their own logs

### Get TimeLog

- **GET** `/api/v1/timelogs/{log_id}`
- **Auth Required:** Any authenticated user
- **Visibility**: self OR (`MANAGER`/`SUPER_ADMIN`)

### Create TimeLog (Manual)

- **POST** `/api/v1/timelogs`
- **Auth Required:** Any authenticated user
- **Payload**: `TaskTimeLogCreate`
- **Notes**: `user_id` is forced to current user.

### Update TimeLog

- **PATCH** `/api/v1/timelogs/{log_id}`
- **Auth Required:** self OR (`MANAGER`/`SUPER_ADMIN`)

### Delete TimeLog

- **DELETE** `/api/v1/timelogs/{log_id}`
- **Auth Required:** self OR (`MANAGER`/`SUPER_ADMIN`)

---

## Notes Endpoints

Base path: `/api/v1/notes`

### List Notes

- **GET** `/api/v1/notes`
- **Auth Required:** Any authenticated user
- Query params: `skip`, `limit`, `task_id`
- Behavior:
  - `SUPER_ADMIN` and `MANAGER`: all notes
  - others: own notes OR notes shared with them

### Get Note

- **GET** `/api/v1/notes/{note_id}`
- **Auth Required:** Any authenticated user
- Behavior:
  - `SUPER_ADMIN` and `MANAGER`: any note
  - others: own note OR note shared with them

### Create Note

- **POST** `/api/v1/notes`
- **Auth Required:** Any authenticated user
- Payload is dynamic dict.
- Supported sharing field:
  - `shared_with`: array of user IDs
- Note: `user_id` defaults to current user.

### Update Note

- **PATCH** `/api/v1/notes/{note_id}`
- **Auth Required:** `MANAGER` or `SUPER_ADMIN`

### Delete Note

- **DELETE** `/api/v1/notes/{note_id}`
- **Auth Required:** `SUPER_ADMIN`

---

## Events Endpoints

Base path: `/api/v1/events`

### List Events

- **GET** `/api/v1/events`
- **Auth Required:** Any authenticated user
- Behavior:
  - `SUPER_ADMIN` and `MANAGER`: all events
  - others: own events only (`event.user_id == current_user.id`)

### Get Event

- **GET** `/api/v1/events/{event_id}`
- **Auth Required:** Any authenticated user
- Visibility follows list behavior.

### Create Event

- **POST** `/api/v1/events`
- **Auth Required:** Any authenticated user
- Request schema: `EventCreate`
- Note: `user_id` defaults to current user.

### Update Event

- **PATCH** `/api/v1/events/{event_id}`
- **Auth Required:** `MANAGER` or `SUPER_ADMIN`
- Request schema: `EventUpdate`

### Delete Event

- **DELETE** `/api/v1/events/{event_id}`
- **Auth Required:** `SUPER_ADMIN`

Event enum values:

- status: `tentative`, `confirmed`, `cancelled`
- privacy: `public`, `private`, `confidential`
- recurrence: `none`, `daily`, `weekly`, `monthly`, `yearly`

---

## Leave & Time-Off Endpoints

Base path: `/api/v1/time-off`

### List Time-Off Requests

- **GET** `/api/v1/time-off`
- **Auth Required:** Any authenticated user
- **Query params**: `skip`, `limit`
- **Behavior**:
  - `SUPER_ADMIN` and `MANAGER`: all requests
  - others: only their own requests

### Create Time-Off Request

- **POST** `/api/v1/time-off`
- **Auth Required:** `STAFF` or above
- **Payload**: `TimeOffCreate`
- **Constraints**:
  - `leave` type is limited to 15 days per year total.
  - `off`, `sick`, and `other` types require a `justification`.

### Get Request by ID

- **GET** `/api/v1/time-off/{request_id}`
- **Auth Required:** self OR (`MANAGER`/`SUPER_ADMIN`)

### Approve Request

- **POST** `/api/v1/time-off/{request_id}/approve`
- **Auth Required:** `SUPER_ADMIN`
- **Behavior**: Sets status to `approved` and automatically creates a confirmed calendar `Event` for the user. Flags user as unavailable for task assignments during this period.

### Reject Request

- **POST** `/api/v1/time-off/{request_id}/reject`
- **Auth Required:** `SUPER_ADMIN`

### Delete Request

- **DELETE** `/api/v1/time-off/{request_id}`
- **Auth Required:** Owner
- **Constraint**: Only pending requests can be deleted by the owner.

Time-Off Type enum:

- `leave` (limited to 15 days)
- `off`
- `sick`
- `other`

Time-Off Status enum:

- `pending`
- `approved`
- `rejected`

---

## Attendance Endpoints

Base path: `/api/v1/attendance`

### Frontend Implementation Notes

- **Background Location Tracking**: The mobile/web client should periodically send the user's GPS coordinates (`latitude`, `longitude`, `accuracy_meters`) and `office_location_id` to `POST /api/v1/attendance/location-update` when the user is expected to be working.
- **Automatic Transitions**: The backend automatically handles clock-ins, transitions, and clock-outs based on the derived zone calculate in `location-update`. The frontend does not need manual clock-in/out buttons.
- **Accuracy Jitter Avoidance**: The backend ignores location updates with accuracy worst than 30m when evaluating exiting an office zone. Always pass the device's native `accuracy_meters` so the algorithm can function correctly.
- **Admin & Manager Dashboards**: High-level team views should use `/team/today` to list the current status of the team. Super Admins have access to the `/admin/*` routes for detailed debugging logs (such as raw location logs and presence state histories).
- **Overrides**: Use `POST /api/v1/attendance/{attendance_record_id}/override` to correct mistakes. This logs who made the override and what the original states were.
- **Office Configuration CRUD**: The frontend database explorer natively handles full Create, Read, Update, and Delete operations for `office_locations` and `attendance_policies` by using the generic `/api/v1/admin-db/*` endpoints. Super admins can completely construct and adjust policy details here.

### Standard User & Real-time Location

#### Update Location & Presence
- **POST** `/api/v1/attendance/location-update`
- **Auth Required:** `STAFF` or above
- **Behavior**: Evaluates current presence zone based on distance from office, updates presence state (e.g., `IN_OFFICE` -> `TEMPORARILY_OUT`), and manages automatic clock-in/out transitions.

#### Get My Attendance Today
- **GET** `/api/v1/attendance/me/today`
- **Auth Required:** `STAFF` or above
- **Returns**: Current day's `AttendanceRecord` or `null`.

#### Get My Attendance History
- **GET** `/api/v1/attendance/me/history`
- **Auth Required:** `STAFF` or above
- **Returns**: List of `AttendanceRecord` for the current user, newest first.

### Manager & Admin Data Access

#### List Team Attendance Today
- **GET** `/api/v1/attendance/team/today`
- **Auth Required:** `MANAGER` or `SUPER_ADMIN`
- **Returns**: List of all `AttendanceRecord` for today.

#### Get User Attendance History
- **GET** `/api/v1/attendance/{user_id}/history`
- **Auth Required:** `MANAGER` or `SUPER_ADMIN`
- **Returns**: List of `AttendanceRecord` for the specified user.

#### Override Attendance Record
- **POST** `/api/v1/attendance/{attendance_record_id}/override`
- **Auth Required:** `MANAGER` or `SUPER_ADMIN`
- **Payload**: `AttendanceOverrideRequest`
- **Behavior**: Manually sets clock-in/out times. Adjusts `attendance_state` automatically and creates an `AttendanceOverride` log.

### Super Admin Raw Data & Configuration

#### Office Locations Configuration
- **GET** `/api/v1/attendance/office-locations` (Auth: `STAFF` or above)
- **POST** `/api/v1/attendance/office-locations` (Auth: `SUPER_ADMIN` only)
- **PATCH** `/api/v1/attendance/office-locations/{id}` (Auth: `SUPER_ADMIN` only)

##### Attendance Policy (Office Link)
- **GET** `/api/v1/attendance-policy/{office_location_id}` (Auth: `SUPER_ADMIN` only)
- **PATCH** `/api/v1/attendance-policy/{office_location_id}` (Auth: `SUPER_ADMIN` only)
- **Note**: Convenient endpoints for accessing a policy via its office ID.

#### Attendance Policy (Full REST CRUD)
These endpoints allow direct management of policy objects by their unique ID.
- **GET** `/api/v1/attendance/admin/all-policies` (Auth: `SUPER_ADMIN` only)
- **POST** `/api/v1/attendance/policies` (Auth: `SUPER_ADMIN` only)
- **GET** `/api/v1/attendance/policies/{id}` (Auth: `SUPER_ADMIN` only)
- **PATCH** `/api/v1/attendance/policies/{id}` (Auth: `SUPER_ADMIN` only)
- **DELETE** `/api/v1/attendance/policies/{id}` (Auth: `SUPER_ADMIN` only)

##### Attendance Policy Schema
| Field | Type | Description | Required on Create |
| :--- | :--- | :--- | :--- |
| `id` | `int` | Primary key. | No |
| `office_location_id` | `int` | Foreign key to `office_locations`. | **Yes** |
| `check_in_open_time` | `time` | Earliest time user can be "first seen" (e.g., `07:30:00`). | No (Default: 07:30) |
| `check_in_close_time` | `time` | Latest time for window-based check-in. | No (Default: 10:00) |
| `work_start_time` | `time` | Target start time for lateness check. | No (Default: 08:30) |
| `work_end_time` | `time` | Target end time. | No (Default: 18:00) |
| `auto_clock_out_time` | `time` | Automatic clock out trigger time. | No (Default: 18:00) |
| `temporarily_out_grace_minutes` | `int` | Minutes allowed in `TEMPORARILY_OUT`. | No (Default: 5) |
| `out_of_office_grace_minutes` | `int` | Minutes allowed in `OUT_OF_OFFICE`. | No (Default: 10) |
| `return_to_office_confirmation_minutes` | `int` | Duration for return confirmation. | No (Default: 2) |

##### Implementation Notes
- **Permissions**: All policy management is strictly restricted to `SUPER_ADMIN`.
- **Unique Constraint**: Each office location can have only **one** policy. Personalize policies per location.
- **Auto-Provisioning**: Creating an `office_location` via `POST /api/v1/attendance/office-locations` automatically creates a default policy.
- **Time String Format**: Use `HH:MM:SS` for all time fields (e.g., `"09:00:00"`).

#### Raw Analytics & Logs
- **GET** `/api/v1/attendance/admin/all-records` (Auth: `SUPER_ADMIN` only)
- **GET** `/api/v1/attendance/admin/all-logs` (Auth: `SUPER_ADMIN` only)
- **GET** `/api/v1/attendance/admin/all-presence-history` (Auth: `SUPER_ADMIN` only)
- **GET** `/api/v1/attendance/admin/all-overrides` (Auth: `SUPER_ADMIN` only)

### Enums

Presence State enum:
- `IN_OFFICE`: Within `in_office_radius_meters`.
- `TEMPORARILY_OUT`: Within `temporarily_out_radius_meters`.
- `OUT_OF_OFFICE`: Beyond `out_of_office_radius_meters`.

Attendance State enum:
- `NOT_CLOCKED_IN`
- `CLOCKED_IN`
- `CLOCKED_OUT`

---

## Announcements Endpoints

Base path: `/api/v1/announcements`

### Real-time WebSocket

- **WS** `/ws/announcements`
- **Auth Required:** Any authenticated user
- **Behavior**: Broadcasts new announcements in real-time. Clients should connect here to receive live updates.

### List Announcements

- **GET** `/api/v1/announcements`
- **Auth Required:** Any authenticated user
- **Behavior**:
  - `SUPER_ADMIN`: all announcements (including inactive)
  - others: only active announcements

### Create Announcement

- **POST** `/api/v1/announcements`
- **Auth Required:** `SUPER_ADMIN`
- **Payload (`AnnouncementCreate`):**
  ```json
  {
    "title": "System Maintenance",
    "content": "The system will be down for maintenance on Sunday at 2 AM.",
    "type": "INFO",
    "is_active": true
  }
  ```
- **Note**: `creator_id` is automatically set to the current user.

### Update Announcement

- **PUT** `/api/v1/announcements/{id}`
- **Auth Required:** `SUPER_ADMIN`
- **Payload (`AnnouncementUpdate`):**
  - `title` (optional string)
  - `content` (optional string)
  - `type` (optional `AnnouncementType`)
  - `is_active` (optional boolean)

### Delete Announcement

- **DELETE** `/api/v1/announcements/{id}`
- **Auth Required:** `SUPER_ADMIN`

### Enums

**AnnouncementType:**
- `INFO`
- `SUCCESS`
- `WARNING`
- `ERROR`
- `CRITICAL`

---

## Decisions Endpoints

Base path: `/api/v1/decisions`

### List Decisions

- **GET** `/api/v1/decisions`
- **Auth Required:** Any authenticated user
- Behavior:
  - `SUPER_ADMIN` and `MANAGER`: all decisions
  - others: own decisions only

### Get Decision

- **GET** `/api/v1/decisions/{decision_id}`
- **Auth Required:** Any authenticated user
- Behavior follows list visibility.

### Create Decision

- **POST** `/api/v1/decisions`
- **Auth Required:** Any authenticated user
- Note: `user_id` defaults to current user.

### Update Decision

- **PATCH** `/api/v1/decisions/{decision_id}`
- **Auth Required:** `MANAGER` or `SUPER_ADMIN`

### Delete Decision

- **DELETE** `/api/v1/decisions/{decision_id}`
- **Auth Required:** `SUPER_ADMIN`

---

## Notifications Endpoints

Base path: `/api/v1/notifications`

### Real-time WebSocket

- **WS** `/api/v1/notifications/ws/{user_id}`
- **Current Implementation Note:** endpoint currently does not enforce token/session auth in handler.
- Recommended production behavior: enforce authenticated identity and user-id match.

### WebSocket/Notifications Access

Current access behavior:

- WebSocket endpoint accepts connections by `user_id` path param and does not currently verify token/session in-handler.
- `GET /api/v1/notifications` returns notifications only for `current_user.id`.
- `PUT /api/v1/notifications/{notification_id}/read` allows only the notification recipient.

Current notification delivery patterns (from service usage):

- **New user registration:** sent to `SUPER_ADMIN` users.
- **User login:** sent to `SUPER_ADMIN` users.
- **Project create/update:** sent to `MANAGER` and `SUPER_ADMIN` users.
- **Task create/update:** sent to `MANAGER` and `SUPER_ADMIN` users.
- **Task assigned/assignment updated:** sent to assigned users.
- **Note create/update:** sent to `MANAGER` and `SUPER_ADMIN` users.
- **Note shared/sharing updated:** sent to shared users.
- **Event create/update:** sent to `MANAGER` and `SUPER_ADMIN` users.
- **Time-Off Request created:** sent to `MANAGER` and `SUPER_ADMIN` users.
- **Time-Off Request updated (approved/rejected):** sent to the request owner.

Access matrix (current implementation):

| Action                                   | Super Admin                                 | Manager                                     | Staff                                       | Client/User                                 |
| ---------------------------------------- | ------------------------------------------- | ------------------------------------------- | ------------------------------------------- | ------------------------------------------- |
| Connect WS `/notifications/ws/{user_id}` | Allowed (no enforced auth check in handler) | Allowed (no enforced auth check in handler) | Allowed (no enforced auth check in handler) | Allowed (no enforced auth check in handler) |
| List own notifications                   | Yes                                         | Yes                                         | Yes                                         | Yes                                         |
| Mark own notification read               | Yes                                         | Yes                                         | Yes                                         | Yes                                         |
| Read others' notifications               | No                                          | No                                          | No                                          | No                                          |

Message shape:

```json
{
  "id": "uuid-string",
  "title": "Task Assigned",
  "message": "You have been assigned",
  "type": "info",
  "resource_type": "task",
  "resource_id": "123",
  "is_read": false,
  "created_at": "2026-02-12T10:00:00Z"
}
```

### List Notifications

- **GET** `/api/v1/notifications`
- **Auth Required:** Any authenticated user
- Query params: `skip`, `limit`
- Returns only current user's notifications.

### Mark Notification as Read

- **PUT** `/api/v1/notifications/{notification_id}/read`
- **Auth Required:** Any authenticated user (recipient only)

---

## Admin Endpoints

### Legacy User Admin

Base path: `/api/v1/user-admin`

#### Create User (legacy)

- **POST** `/api/v1/user-admin/create`
- **Auth Required:** `SUPER_ADMIN`

#### Update User (legacy)

- **PATCH** `/api/v1/user-admin/{user_id}`
- **Auth Required:** `SUPER_ADMIN`

### Generic Admin DB

Base path: `/api/v1/admin-db`

#### Generic Table Update

- **PATCH** `/api/v1/admin-db/tables/{table_name}/{pk_column}/{pk_value}`
- **Auth Required:** `SUPER_ADMIN`

#### Generic Table Create

- **POST** `/api/v1/admin-db/tables/{table_name}`
- **Auth Required:** `SUPER_ADMIN`

#### Generic Table Delete

- **DELETE** `/api/v1/admin-db/tables/{table_name}/{pk_column}/{pk_value}`
- **Auth Required:** `SUPER_ADMIN`

---

## Frontend Payload Contracts

This section is frontend-focused and lists concrete request/response payloads for commonly used endpoints.

### Auth payload contracts

#### `POST /api/v1/auth/register`

Request JSON:

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe"
}
```

Response 200/201 (User object):

```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "full_name": "John Doe",
  "roles": ["user"],
  "avatar_url": null,
  "image": null,
  "emailVerified": null,
  "created_at": "2026-02-17T02:00:00Z"
}
```

#### `POST /api/v1/auth/login`

Request form-data:

```
username=user@example.com
password=securepassword123
```

Response JSON:

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

### Users payload contracts

#### `POST /api/v1/users`

Request JSON (`UserCreate`):

```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "full_name": "New User",
  "roles": ["staff"],
  "avatar_url": "https://example.com/avatar.jpg",
  "image": null,
  "emailVerified": null
}
```

Response JSON (`UserRead`):

```json
{
  "id": "uuid-string",
  "email": "newuser@example.com",
  "full_name": "New User",
  "roles": ["staff"],
  "avatar_url": "https://example.com/avatar.jpg",
  "image": null,
  "emailVerified": null,
  "created_at": "2026-02-17T02:00:00Z"
}
```

#### `PUT /api/v1/users/me` and `PUT /api/v1/users/{user_id}`

Request JSON (`UserUpdate`, partial allowed):

```json
{
  "full_name": "Updated Name",
  "password": "new-password",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

Response JSON: same `UserRead` shape above.

### Clients payload contracts

#### `POST /api/v1/clients`

Request JSON:

```json
{
  "company_name": "Acme Corp",
  "contact_person_name": "Jane Doe",
  "contact_email": "jane@acme.com",
  "website_url": "https://acme.com"
}
```

Response JSON:

```json
{
  "id": "uuid-string",
  "company_name": "Acme Corp",
  "contact_person_name": "Jane Doe",
  "contact_email": "jane@acme.com",
  "website_url": "https://acme.com",
  "created_at": "2026-02-17T02:00:00Z"
}
```

#### `PATCH /api/v1/clients/{client_id}`

Request JSON (partial):

```json
{
  "company_name": "Acme Corporation",
  "contact_person_name": "John Doe"
}
```

Response JSON: updated Client object (same shape as above).

### Projects payload contracts

#### `POST /api/v1/projects`

Request JSON:

```json
{
  "name": "Website Redesign",
  "key": "PROJ-001",
  "description": "Landing page redesign",
  "status": "planning",
  "priority": "high",
  "tags": "[\"frontend\", \"priority\"]",
  "client_id": "client-uuid",
  "start_date": "2026-02-20",
  "end_date": "2026-05-20",
  "budget": 50000,
  "spent": 0,
  "currency": "USD",
  "billing_type": "non_billable",
  "is_archived": 0
}
```

Response JSON: Project object with `id`, `created_at`, `updated_at`.

#### `PATCH /api/v1/projects/{project_id}`

Request JSON (partial):

```json
{
  "status": "in_progress",
  "spent": 12000,
  "priority": "medium"
}
```

Response JSON: updated Project object.

### Tasks payload contracts

#### `POST /api/v1/tasks`

Request JSON (dynamic dict):

```json
{
  "name": "Implement auth UI",
  "description": "Build login and register screens",
  "due_date": "2026-03-01",
  "priority": "high",
  "status": "TODO",
  "qa_required": false,
  "review_required": true,
  "depends_on_id": null,
  "project_id": 1,
  "assignees": ["user-uuid-1", "user-uuid-2"]
}
```

Response JSON (`TaskReadWithTimeLogs`):

```json
{
  "id": 12,
  "name": "Implement auth UI",
  "description": "Build login and register screens",
  "due_date": "2026-03-01",
  "priority": "high",
  "status": "TODO",
  "qa_required": false,
  "review_required": true,
  "depends_on_id": null,
  "project_id": 1,
  "user_id": "creator-uuid",
  "created_at": "2026-02-17T02:00:00Z",
  "updated_at": "2026-02-17T02:00:00Z",
  "task_assignees": [
    { "task_id": 12, "user_id": "user-uuid-1" },
    { "task_id": 12, "user_id": "user-uuid-2" }
  ],
  "time_logs": [],
  "total_hours": 0.0
}
```

#### `PATCH /api/v1/tasks/{task_id}`

Request JSON (partial):

```json
{
  "status": "IN_PROGRESS",
  "assignees": ["user-uuid-3"]
}
```

Response JSON: updated `TaskReadWithTimeLogs` object.

#### Timer endpoints

- `POST /api/v1/tasks/{task_id}/timer/start`
- `POST /api/v1/tasks/{task_id}/timer/stop`

Response JSON (`TaskTimeLog`):

```json
{
  "id": 101,
  "task_id": 12,
  "user_id": "user-uuid-1",
  "start_time": "2026-02-17T02:10:00Z",
  "end_time": "2026-02-17T02:35:00Z"
}
```

### TimeLogs payload contracts

#### `POST /api/v1/timelogs`

Request JSON (`TaskTimeLogCreate`):

```json
{
  "task_id": 12,
  "start_time": "2026-02-17T02:10:00Z",
  "end_time": "2026-02-17T02:35:00Z"
}
```

Response JSON (`TaskTimeLogRead`):

```json
{
  "id": 105,
  "task_id": 12,
  "user_id": "user-uuid-1",
  "start_time": "2026-02-17T02:10:00Z",
  "end_time": "2026-02-17T02:35:00Z"
}
```

### Notes payload contracts

#### `POST /api/v1/notes`

Request JSON (dynamic dict):

```json
{
  "title": "Sprint Notes",
  "content": "Decisions and action items",
  "type": "note",
  "tags": ["sprint", "meeting"],
  "is_pinned": 1,
  "is_archived": 0,
  "is_favorite": 0,
  "task_id": 12,
  "shared_with": ["user-uuid-2", "user-uuid-3"]
}
```

Response JSON (`NoteReadWithShared`):

```json
{
  "id": 55,
  "title": "Sprint Notes",
  "content": "Decisions and action items",
  "type": "note",
  "tags": "[\"sprint\", \"meeting\"]",
  "is_pinned": 1,
  "is_archived": 0,
  "is_favorite": 0,
  "user_id": "owner-uuid",
  "task_id": 12,
  "created_at": "2026-02-17T02:00:00Z",
  "updated_at": "2026-02-17T02:00:00Z",
  "shared_with": [
    {
      "id": "user-uuid-2",
      "email": "u2@example.com",
      "full_name": "User Two",
      "roles": ["staff"],
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

#### `PATCH /api/v1/notes/{note_id}`

Request JSON (partial):

```json
{
  "content": "Updated content",
  "shared_with": []
}
```

Response JSON: updated `NoteReadWithShared` object.

### Events payload contracts

#### `POST /api/v1/events`

Request JSON (`EventCreate`):

```json
{
  "title": "Sprint Planning",
  "description": "Planning meeting",
  "start": "2026-02-20T10:00:00Z",
  "end": "2026-02-20T11:00:00Z",
  "all_day": false,
  "location": "Zoom",
  "organizer": "lead@example.com",
  "attendees": ["user1@example.com", "user2@example.com"],
  "status": "confirmed",
  "privacy": "private",
  "recurrence": "none",
  "reminders": [{ "days": 0, "hours": 0, "minutes": 30 }],
  "color": "#22c55e"
}
```

Response JSON (`EventRead`):

```json
{
  "id": 8,
  "title": "Sprint Planning",
  "description": "Planning meeting",
  "start": "2026-02-20T10:00:00Z",
  "end": "2026-02-20T11:00:00Z",
  "all_day": 0,
  "location": "Zoom",
  "organizer": "lead@example.com",
  "attendees": ["user1@example.com", "user2@example.com"],
  "status": "confirmed",
  "privacy": "private",
  "recurrence": "none",
  "reminders": [{ "days": 0, "hours": 0, "minutes": 30 }],
  "color": "#22c55e",
  "user_id": "creator-uuid",
  "created_at": "2026-02-17T02:00:00Z",
  "updated_at": "2026-02-17T02:00:00Z"
}
```

#### `PATCH /api/v1/events/{event_id}`

Request JSON (`EventUpdate`, partial):

```json
{
  "title": "Sprint Planning (Updated)",
  "status": "cancelled"
}
```

Response JSON: updated `EventRead` object.

### Decisions payload contracts

#### `POST /api/v1/decisions`

Request JSON:

```json
{
  "name": "Choose hosting provider",
  "due_date": "2026-03-10"
}
```

Response JSON:

```json
{
  "id": 21,
  "name": "Choose hosting provider",
  "due_date": "2026-03-10",
  "user_id": "owner-uuid"
}
```

#### `PATCH /api/v1/decisions/{decision_id}`

Request JSON (partial):

```json
{
  "name": "Choose AWS region",
  "due_date": "2026-03-12"
}
```

Response JSON: updated Decision object.

### Leave & Time-Off payload contracts

#### `POST /api/v1/time-off`

Request JSON (`TimeOffCreate`):

```json
{
  "type": "leave",
  "start_date": "2026-03-10",
  "end_date": "2026-03-12",
  "justification": "Visiting family"
}
```

Response JSON (`TimeOffRead`):

```json
{
  "id": 12,
  "user_id": "user-uuid",
  "type": "leave",
  "start_date": "2026-03-10",
  "end_date": "2026-03-12",
  "status": "pending",
  "justification": "Visiting family",
  "requested_at": "2026-03-02T10:00:00Z"
}
```

#### `POST /api/v1/time-off/{request_id}/approve`

Request body: none.

Response JSON (`TimeOffRead`): same as above with `status: "approved"`.

### Notifications payload contracts

#### `GET /api/v1/notifications`

Response JSON:

```json
[
  {
    "id": "uuid-string",
    "recipient_id": "user-uuid",
    "sender_id": "user-uuid-or-null",
    "title": "Task Assigned",
    "message": "You have been assigned to task 'Implement auth UI'",
    "type": "info",
    "is_read": false,
    "created_at": "2026-02-17T02:00:00Z"
  }
]
```

#### `PUT /api/v1/notifications/{notification_id}/read`

Request body: none.

Response JSON (`NotificationRead`):

```json
{
  "id": "uuid-string",
  "recipient_id": "user-uuid",
  "sender_id": null,
  "title": "Task Assigned",
  "message": "You have been assigned to task 'Implement auth UI'",
  "type": "info",
  "is_read": true,
  "created_at": "2026-02-17T02:00:00Z"
}
```

### Announcements payload contracts

#### `POST /api/v1/announcements`

Request JSON (`AnnouncementCreate`):

```json
{
  "title": "System Maintenance",
  "content": "Scheduled maintenance on Saturday at 10 PM.",
  "type": "info",
  "is_active": true
}
```

- **type**: One of `info`, `success`, `warning`, `error`, `critical`. Defaults to `info`.

Response JSON (`AnnouncementRead`):

```json
{
  "id": 1,
  "title": "System Maintenance",
  "content": "Scheduled maintenance on Saturday at 10 PM.",
  "type": "info",
  "is_active": true,
  "creator_id": "user-uuid",
  "created_at": "2026-03-19T10:00:00Z",
  "updated_at": "2026-03-19T10:00:00Z"
}
```

#### `WS /ws/announcements`

Broadcast Message Shape:

```json
{
  "type": "new_announcement",
  "data": {
    "id": 1,
    "title": "System Maintenance",
    "content": "Scheduled maintenance on Saturday at 10 PM.",
    "type": "info",
    "creator_id": "user-uuid",
    "created_at": "2026-03-19T10:00:00Z"
  }
}
```

### Admin payload contracts

#### `POST /api/v1/user-admin/create`

Request JSON: same as `POST /api/v1/users` (`UserCreate`).
Response JSON: `UserRead` object.

#### `PATCH /api/v1/user-admin/{user_id}`

Request JSON: same as `UserUpdate` partial.
Response JSON: `UserRead` object.

#### `PATCH /api/v1/admin-db/tables/{table_name}/{pk_column}/{pk_value}`

Request JSON:

```json
{
  "column_name_1": "new_value",
  "column_name_2": 123
}
```

Response JSON:

```json
{
  "status": "success",
  "rows_affected": 1
}
```

#### `POST /api/v1/admin-db/tables/{table_name}`

Request JSON: dynamic table fields.
Response JSON:

```json
{
  "status": "success",
  "detail": "Record created"
}
```

#### `DELETE /api/v1/admin-db/tables/{table_name}/{pk_column}/{pk_value}`

Request body: none.
Response JSON:

```json
{
  "status": "success",
  "detail": "Record deleted"
}
```

---

## Permission Model

### Roles (current code)

- `USER`
- `CLIENT`
- `STAFF`
- `MANAGER`
- `SUPER_ADMIN`

### Effective access summary

| Resource      | View                                       | Create               | Update                       | Delete      |
| ------------- | ------------------------------------------ | -------------------- | ---------------------------- | ----------- |
| Users         | Self, Manager, Super Admin                 | Super Admin          | Self (`/me`) or Super Admin  | Super Admin |
| Clients       | Manager, Super Admin                       | Manager, Super Admin | Manager, Super Admin         | Super Admin |
| Projects      | Any auth (scoped by role/owner)            | Any auth             | Manager, Super Admin         | Super Admin |
| Tasks         | Any auth (scoped by role/owner/assignment) | Any auth             | Manager, Super Admin         | Super Admin |
| TimeLogs      | Self, Manager, Super Admin                 | Any auth (manual)    | Self, Manager, Super Admin   | Super Admin |
| Notes         | Any auth (scoped by role/owner/share)      | Any auth             | Manager, Super Admin         | Super Admin |
| Events        | Any auth (scoped by role/owner)            | Any auth             | Manager, Super Admin         | Super Admin |
| Time-Off      | Scoped by role/owner                       | Staff or above       | Super Admin (Approve/Reject) | Owner       |
| Announcements | Any auth (active only for non-admins)      | Super Admin          | Super Admin                  | Super Admin |
| Decisions     | Any auth (scoped by role/owner)            | Any auth             | Manager, Super Admin         | Super Admin |
| Notifications | Recipient only                             | System/service       | Recipient only (`mark read`) | Not exposed |

---

## Common Patterns

### Pagination

List endpoints typically support:

- `skip` (default `0`)
- `limit` (default `100`)

### Filtering

Supported filters include:

- `GET /api/v1/tasks?project_id=<id>`
- `GET /api/v1/notes?task_id=<id>`

### Partial updates

PATCH endpoints expect only changed fields.

### Multi-user fields

- Tasks: `assignees` (array of user IDs)
- Notes: `shared_with` (array of user IDs)

Behavior:

- send `[]` to clear associations
- omit field to keep existing associations

### JSON string array fields (storage-level)

- `Project.tags`
- `Event.attendees`
- `Event.reminders`
- `Note.tags`

API may accept list input for some endpoints (`EventCreate/EventUpdate`, note/task dynamic payload handlers), then serialize internally.

### Date/time formats

- Dates: `YYYY-MM-DD`
- Datetimes: ISO 8601 strings

### Currency

Budget/spent are stored as smallest currency unit (for example cents).

### Attendance payload contracts

#### `POST /api/v1/attendance/location-update`

Request (`LocationUpdateRequest`):

```json
{
  "office_location_id": 1,
  "latitude": 5.1234,
  "longitude": -0.1234,
  "accuracy_meters": 10.5,
  "recorded_at": "2026-03-09T10:00:00Z"
}
```

Response (`LocationUpdateResponse`):

```json
{
  "distance_from_office_meters": 12.5,
  "derived_zone": "IN_OFFICE",
  "presence_state": "IN_OFFICE",
  "attendance_state": "CLOCKED_IN",
  "clock_in_at": "2026-03-09T08:30:00Z",
  "clock_out_at": null
}
```

#### `GET /api/v1/attendance/me/today`

Response JSON (`AttendanceRecord`):

```json
{
  "id": 1,
  "user_id": "user-uuid",
  "office_location_id": 1,
  "work_date": "2026-03-09",
  "attendance_state": "CLOCKED_IN",
  "clock_in_at": "2026-03-09T08:30:00Z",
  "clock_out_at": null,
  "first_seen_in_office_at": "2026-03-09T08:30:00Z",
  "last_seen_in_office_at": "2026-03-09T10:00:00Z"
}
```

#### `POST /api/v1/attendance/{record_id}/override`

Request (`AttendanceOverrideRequest`):

```json
{
  "new_clock_in_at": "2026-03-09T08:45:00Z",
  "new_clock_out_at": "2026-03-09T17:30:00Z",
  "reason": "Forgot to bring phone to office"
}
```

#### `POST /api/v1/attendance/office-locations`

Request (`OfficeLocationCreate`):

```json
{
  "name": "Main Office",
  "latitude": 5.1234,
  "longitude": -0.1234,
  "in_office_radius_meters": 10,
  "temporarily_out_radius_meters": 30,
  "out_of_office_radius_meters": 50,
  "is_active": true
}
```

#### `PATCH /api/v1/attendance-policy/{office_location_id}`

Request (`AttendancePolicyUpdate`, partial):

```json
{
  "check_in_open_time": "08:00:00",
  "check_in_close_time": "10:30:00",
  "work_start_time": "09:00:00",
  "work_end_time": "18:00:00",
  "auto_clock_out_time": "18:30:00",
  "temporarily_out_grace_minutes": 10,
  "out_of_office_grace_minutes": 20
}
```

---

## Attendance Logic Overview

The attendance system uses a combination of geolocation tracking and policy-driven state management.

### Geolocation & Presence

- **Distance Calculation**: Uses the Haversine formula to determine distance from the office.
- **Presence States**:
  - `IN_OFFICE`: User is within the office radius.
  - `TEMPORARILY_OUT`: User is slightly outside the office radius (e.g., in the parking lot).
  - `OUT_OF_OFFICE`: User is far from the office.
- **Grace Periods**: State transitions are not immediate. A user must consistently be in a new zone for a period defined in the `AttendancePolicy` before their `presence_state` is updated.
- **Accuracy Filtering**: High-accuracy (e.g., GPS) is preferred. Updates with an accuracy radius > 30m are logged but ignored for transitioning *out* of an office zone to prevent false exits due to signal drift inside buildings.

### Automatic Clock-In/Out

- **Clock-In**: A user is automatically clocked in if they are detected `IN_OFFICE` (confirmed after the grace period) during the `check_in_open_time` to `check_in_close_time` window.
- **Clock-Out**: A user is automatically clocked out at the `auto_clock_out_time` if they were previously clocked in.
- **Manual Overrides**: Managers can override any record to fix errors or account for missed updates.

---

## Interactive API Docs

- Swagger UI: `/docs`
- ReDoc: `/redoc`


---

## Notes for Frontend Developers

### Announcements System Implementation

#### 1. Real-time Updates (WebSocket)
Connect to `ws://[host]/ws/announcements` to receive real-time broadcasts. 
The payload includes `type` and `creator_id` for immediate styling and attribution without needing a secondary fetch.

#### 2. Visual Representation by `type`
Map the `type` field to consistent UI colors and icons:
- `info`: Blue / Megaphone icon
- `success`: Green / Check circle icon
- `warning`: Amber / Alert triangle icon
- `error`: Rose / X circle icon
- `critical`: Purple / Alert octagon icon (high emphasis)

#### 3. Filtering and Search
Implement local client-side filtering on the `title` and `content` fields. The system expects regular users to only see `is_active=true` announcements.

#### 4. Permission Handling
Buttons for Create, Toggle (Update), and Delete should only be rendered if the current user has the `SUPER_ADMIN` role. 
Check `current_user.roles.includes("super_admin")`.
---

## Notes

This documentation reflects current route and guard behavior in code and does not alter route design.
