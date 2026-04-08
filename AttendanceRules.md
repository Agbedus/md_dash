# Attendance System Logic & Geofencing Rules

This document outlines the core validation and synchronization rules for the MD Platform Attendance System.

## 📡 Monitoring Strategy

*   **GPS Polling**: Active tracking occurs every **5 minutes** to maintain presence accuracy while preserving battery life.
*   **Accuracy Jitter**: Readings with accuracy > 30m are ignored for automatic transitions to prevent phantom check-outs.
*   **Infrastructure Caching**: Office locations and attendance policies are cached on the frontend for **6 hours** to ensure high performance and offline-ready rule evaluation.

## 🏢 Presence Zones (Radii)

Zones are defined per office location with descriptive clarity:

- **In-Office**: The strict geofence (e.g., 200m) where a user is considered present and can clock in.
- **Tem-Out (Temporarily Out)**: The grace perimeter where a user's clock remains active, but they are flagged as stepped out.
- **Out**: The boundary beyond which a user is considered out of office.

## 🕒 Transition Rules

### Manual Clock-In
Validates the following before confirming:
1.  **GPS Signal**: High-precision GPS lock confirmed.
2.  **Proximity**: User must be within the **In-Office** radius.
3.  **Arrival Window**: Current time must be between `check-in-open` and `check-in-close`.
4.  **Auto-Out Protection**: Cannot clock in after the defined `auto-clock-out` time.

### Manual Clock-Out
Refined flow designed to prevent accidental data loss:
1.  **Context Check**: Uses cached policy data to evaluate status.
2.  **Active Warning**: If the user is still **In-Office** or the current shift (`work-start` to `work-end`) has not finished, a warning is triggered.
3.  **User Confirmation**: An explicit confirmation is required to proceed with a clock-out during active periods.

## 🔄 Synchronization & Enforcement

- **Optimistic UX**: The frontend evaluates rules locally for immediate feedback.
- **Multi-Layer Validation**: All rules are re-enforced at the Server Action / Backend layer to ensure data integrity regardless of client state.
