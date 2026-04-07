# Attendance System Logic & Geofencing Rules

This document outlines the core validation and synchronization rules for the MD Platform Attendance System.

## 1. Geofencing & Location Validation

### Office Perimeter
- **Default Radius**: 200 meters.
- **Validation Source**: Front-end location calculation (Haversine formula) in the `LocationProvider`.
- **Enforcement**: 
    - **Automatic**: System triggers a check-in/out when entering or exiting the 200m perimeter.
    - **Manual**: Users can only clock in manually if their current coordinates are validated within the 200m radius of the office location.

### GPS Accuracy Thresholds
- **High Sensitivity**: < 50m accuracy required for automatic pings.
- **Low Signal Handling**: If accuracy is > 100m, the system will mark the location as "Estimated" and may require manual confirmation for sensitive operations.

## 2. Clock-In / Clock-Out Workflows

### Manual Clock-In
- **Rule**: Must be within the designated office perimeter.
- **Verification**: The front-end calculates the distance from the office *before* allowing the UI button to activate.
- **Feedback**: Instant UI update upon successful API response.

### Manual Clock-Out
- **Rule**: Can be performed from any location.
- **Optimization**: Redundant GPS accuracy and distance checks are bypassed for Clock-Out to ensure immediate feedback to the employee.

## 3. Real-time Synchronization

### UI State Management
- **Optimistic Updates**: The UI assumes success and updates the primary status indicator immediately.
- **SWR Mutations**: Successful actions trigger a global mutation on the `attendance/history` and `attendance/status` endpoints to refresh all dashboard components (History, Team Grid, TopNav).

### Background Sync
- All geolocation pings are queued and sent asynchronously to ensure the UI remains responsive even in low-data environments.
- Logs of "Position Unavailable" are suppressed unless persistent over 30 seconds.
