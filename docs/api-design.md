# API Design — Adelaide Tambo Digital Visitor Register

## 1. Overview

The backend will provide a REST API for the Flutter Web frontend.

**Proposed technologies:** Node.js, Express.js, TypeScript and PostgreSQL.

**Base URL (development):** `http://localhost:5000/api`

The production URL will be determined after deployment planning.

## 2. Public Endpoints

### GET /api/activities

Returns the list of available activities and their categories.

Example response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Study",
      "category": "Public facilities"
    },
    {
      "id": 4,
      "name": "Internet",
      "category": "IT facilities"
    }
  ]
}
```

The full response will include all approved activities.

### POST /api/registrations

Creates a new visitor registration.

Example request:

```json
{
  "initialsSurname": "T. Lebia",
  "visitorCount": 5,
  "activities": [
    {
      "activityId": 1,
      "visitorCount": 3
    },
    {
      "activityId": 4,
      "visitorCount": 2
    }
  ]
}
```

Validation rules:
- Initials and surname are required.
- Visitor count must be a positive whole number.
- At least one activity must be selected.
- Every activity must exist and be active.
- An activity cannot appear more than once in the same registration.
- Each activity visitor count must be positive and cannot exceed the registration visitor count.
- Activity counts may overlap.
- The backend generates the registration timestamp.
- Registration and activity records must be saved in one database transaction.
- The frontend should prevent repeated submissions; the backend should also support duplicate-submission protection.

Example successful response:

```json
{
  "success": true,
  "message": "Registration completed successfully",
  "data": {
    "id": "8e6a64c0-2c67-4b65-99b0-52ef06e3bb91",
    "visitorCount": 5,
    "registeredAt": "2026-10-21T11:30:00Z"
  }
}
```

Success status: `201 Created`.

## 3. Administrator Authentication

### POST /api/admin/login

Authenticates the administrator using approved credentials.

Request:

```json
{
  "username": "admin",
  "password": "example-password"
}
```

Successful authentication should establish a secure administrator session. The example password is a placeholder and must not be used as a real credential.

### POST /api/admin/logout

Ends the authenticated administrator session.

## 4. Protected Administrator Endpoints

All endpoints below require administrator authentication.

### GET /api/admin/registrations?date=2026-10-21

Returns registrations for a selected date, including the registered visitor count, timestamp and selected activities.

### GET /api/admin/statistics?period=daily&date=2026-10-21

Returns daily statistics.

Other supported reporting periods:
- `period=monthly&year=2026&month=10`
- `period=yearly&year=2026`

Statistics must distinguish total visitor counts from individual activity counts.

### GET /api/admin/reports/monthly?year=2026&month=10

Generates a downloadable monthly PDF report.

Response content type: `application/pdf`.

### GET /api/admin/reports/yearly?year=2026

Generates a downloadable yearly PDF report.

Response content type: `application/pdf`.

## 5. Error Handling

Recommended HTTP status codes:

| Code | Meaning |
|---|---|
| 200 | Request successful |
| 201 | Registration created |
| 400 | Invalid request data |
| 401 | Administrator not authenticated |
| 403 | Access forbidden |
| 404 | Resource not found |
| 409 | Duplicate submission or conflicting record |
| 429 | Too many requests |
| 500 | Internal server error |

Example validation error:

```json
{
  "success": false,
  "message": "Invalid registration data",
  "errors": [
    {
      "field": "activities[0].visitorCount",
      "message": "Activity count cannot exceed total visitors"
    }
  ]
}
```

## 6. Security Requirements

- Use HTTPS in production.
- Protect administrator routes using authentication middleware.
- Use secure password hashing.
- Prefer secure, HttpOnly session cookies for administrator authentication.
- Validate and sanitize all incoming data.
- Apply rate limiting to login and registration endpoints.
- Restrict cross-origin requests to approved frontend origins.
- Protect cookie-based authenticated requests against CSRF attacks.
- Never expose administrator passwords or sensitive registration records in public API responses.
- Use test data during development.

## 7. Frontend Integration

The Flutter frontend will:
1. Retrieve activity options using GET /api/activities.
2. Display the digital visitor registration form.
3. Send registrations using POST /api/registrations.
4. Display success or validation messages.
5. Clear the form after successful submission.
6. Provide a separate administrator login page.
7. Display administrator statistics and registration records.
8. Allow authorized PDF report downloads.

## 8. Outstanding Technical Decisions

- Confirm whether the registration form will allow an empty activity list.
- Confirm administrator session duration and deployment domain.
- Agree on PDF report layouts.
- Agree on request idempotency and retry handling.
- Confirm API response pagination for daily registration records.
- Confirm hosting, backup and data retention requirements.
