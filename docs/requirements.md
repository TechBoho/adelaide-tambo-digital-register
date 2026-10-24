# Adelaide Tambo Public Library — System Requirements

## 1. Project Overview

Develop a web-based Digital Visitor Registration System to replace the library's existing paper visitor register. The system will support visitor self-registration on an iPad and enable an authorized administrator to monitor visitor statistics and generate reports.

## 2. User Roles

### Visitor
- Register using the library's iPad.
- Enter initials and surname.
- Enter the number of visitors represented by the registration.
- Select the applicable library activities.
- Submit the registration.
- Cannot access previous registrations or administrator information.

### Administrator
- Log in using secure administrator credentials.
- View registrations for a selected day.
- View daily, monthly and yearly visitor statistics.
- Generate and download monthly and yearly PDF reports.
- Log out securely.

## 3. Registration Fields

- Initials and surname — required.
- Number of visitors — required, positive whole number; may be greater than one.
- Use of public facilities — Study, Reading, Research.
- Use of IT facilities — Internet, Typing.
- Use of library facilities — Book borrowing, Booking, Enquiries, Programmes, Other approved services.
- Registration date and time — automatically recorded by the system.

## 4. Visitor Registration Interface

The digital register must closely match the existing paper form, including its headings and column arrangement.

The interface must be suitable for an iPad and allow visitors to complete registration without administrator assistance.

After successful submission, the application must display confirmation and clear the form before the next visitor.

## 5. Visitor Statistics

- Calculate total visitors using the number of visitors entered, rather than simply counting registration records.
- Calculate daily, monthly and yearly visitor totals.
- Provide statistics grouped by selected activities.
- Avoid counting the same visitors more than once in overall totals when multiple activities are selected.

## 6. Administrator Dashboard

The administrator dashboard must display:
- Daily visitor registration records.
- Daily visitor totals.
- Monthly visitor statistics.
- Yearly visitor statistics.
- Activity-based statistics.

Only authenticated administrators may access this information.

## 7. PDF Reports

- Generate monthly visitor statistics reports.
- Generate yearly visitor statistics reports.
- Use a report layout approved by the library supervisor.
- Allow the administrator to download the reports for submission to head office.

## 8. Scope Exclusions

The system will not replace the existing systems used for books issued, books returned, enquiries or library programmes.

These statistics are outside the current visitor registration scope.

## 9. Security and Privacy

- Protect administrator accounts with secure authentication.
- Restrict access to visitor records and statistics.
- Validate all registration data.
- Protect visitor information in transit and storage.
- Ensure visitors cannot access previous submissions.
- Confirm personal information retention and access requirements with library management.

## 10. Technical Stack (Proposed)

- Frontend: Flutter Web / Dart
- Backend: Node.js / Express / TypeScript
- Database: PostgreSQL
- API: REST
- Version Control: Git and GitHub

## 11. Pending Business Rules

- Confirm whether visitors may select multiple activities within or across categories.
- Confirm how activity counts should be allocated when one registration represents multiple people.
- Confirm the approved monthly and yearly PDF layouts.
- Confirm administrator correction permissions, hosting and data retention requirements.

## 12. Project Team

- Backend Developer: API development, database, authentication, statistics and PDF generation.
- Frontend Developer: Flutter visitor registration interface and administrator dashboard.
- Both Developers: Requirements, testing, documentation and integration.
