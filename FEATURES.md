# MD Dashboard: Features & Capabilities

MD Dash is a premium, AI-powered productivity platform designed for high-level management. It integrates project tracking, task management, and intelligent scheduling with a focus on data privacy through local LLM integration.

---

## 1. AI-Powered Command Center (Dashboard)

The central hub providing a proactive, intelligent overview of your professional life. Instead of just displaying raw data, it pushes actionable insights to help you start your day with clarity.

- **Proactive Daily Briefings**: Upon opening the dashboard, a local LLM generates a natural language summary of your day. It analyzes your calendar, pending tasks, and urgent notifications to provide a briefing like: _"Good morning. You have 3 critical meetings today. I recommend finalizing the 'Q3 Strategy' deck before your 11 AM session, as it's currently flagged as high priority."_
- **Real-time Analytics & Key Performance Indicators**:
  - **Productivity Tracking**: Visualized trends of completed vs. pending work.
  - **Workload Overview**: Distribution of tasks across different projects and team members.
  - **Time Allocation**: A breakdown of where your time is spent (e.g., meetings vs. deep work).
- **Intelligent Prioritization (The "Top 3")**: The AI analyzes your task list based on language cues, deadlines, and project links to suggest three items you should focus on today, providing a brief justification for each.
- **Focus Mode Integration**: A dedicated, distraction-free environment for deep work. It includes a structured timer that automatically moves the associated task to "In Progress" and mutes non-critical notifications.

## 2. Advanced Calendar & Timeline System

A sophisticated scheduling engine designed to handle both granular daily tasks and high-level project milestones in a single, unified interface.

- **Multi-Dimensional Views**:
  - **Month/Week/Day**: Standard scheduling views optimized with high-density layouts for quick scanning.
  - **Timeline (Gantt) View**: A specialized view for projects and long-term initiatives, allowing you to see overlapping timelines and resource allocation at a glance.
- **Intelligent Grouped Filters**: A custom-built toolbar that organizes filters into logical groups to prevent UI clutter:
  - **Main Calendar Group**: Toggles for granular items like **Events** and **Individual Tasks**.
  - **Timeline Group**: Toggles for high-level items like **Project Milestones** and **Organizational Time Off**.
- **Visual Status Indicators**:
  - **Task Progress**: Tasks on the calendar are color-coded based on status (Todo, In Progress, Completed).
  - **Time-Off States**: Leave requests are visually distinct based on their approval status (Pending = Amber, Approved = Emerald, Rejected = Rose).
  - **Privacy Markers**: Events are marked as Public, Private, or Confidential with subtle visual cues.

## 3. Leave & Time-Off Management System

A professional-grade system for managing availability that is deeply integrated into the project planning workflow.

- **Automated Workflow**:
  - **Request & Approval**: A structured process for users to request various types of time off (`Leave`, `Sick`, `Other`).
  - **Manager Dashboard**: Managers and Admins have a central view to review and approve/reject requests with one click.
- **Intelligent Syncing**: Once a request is approved, the system automatically creates a confirmed entry on the user's calendar and flags the period as "Unavailable."
- **Assignment Guards**: The API prevents managers from assigning high-priority tasks to users during their approved time-off periods, ensuring realistic project timelines.
- **Justification & Tracking**: All non-standard leave requests require a written justification, which is stored securely for administrative review. The system also tracks annual leave limits (e.g., 15 days/year).

## 4. Intelligent Task & Project Ecosystem

Moving beyond simple checklists to a robust system that handles the cognitive load of project management.

- **AI Task Decomposition**: For complex objectives like "Launch Q4 Marketing Campaign," the LLM can automatically generate a detailed checklist of sub-tasks, saving manual planning time.
- **Granular Permission Model (RBAC)**: A robust security layer ensuring data access is strictly controlled:
  - **Super Admin**: Total system control and user management.
  - **Manager**: Project oversight and team task assignment.
  - **Staff/User**: Focus on personal tasks and project contributions.
  - **Client**: Restricted "view-only" access to specific project progress.
- **Integrated Time Tracking**: Native timers built into every task. Starting a timer automatically updates the task status and creates a `TimeLog` entry for accurate billing or productivity analysis.
- **Real-time WebSocket Notifications**: Instant alerts for task assignments, mentions, and project updates, ensuring you never miss a critical change.

## 5. Privacy-First "Local-AI" Architecture

The cornerstone of the MD Dash philosophy: total privacy and data sovereignty for high-level executives.

- **The Ollama Engine**: All AI capabilities are powered by industry-leading open-source models (Llama 3, Mistral, or Phi-3) running **locally** via Ollama.
- **Identity-as-a-Service**: Secure authentication flow using NextAuth.js with JWT and secure cookie handling.
- **Zero-Cloud Footprint**: No sensitive data is ever sent to external AI providers or third-party cloud analytics services. Your strategy notes, meeting briefs, and financial tasks remain on your hardware.
- **Bespoke Customization**: Because the models run locally, they can be fine-tuned or configured to understand your specific professional context and vocabulary over time.

---

_Version 1.1.0 — Empowering Proactive Management_
