# Temporary Employee ID Allocation System

This project implements a simple temporary employee ID allocation system using Next.js, React, and SQLite.

## Features

*   **Temporary ID Allocation:** Employees can click a "Clock In" button to get a temporary employee ID within the range of 644100-644400.
*   **IP Address Logging:** The system records the computer's IP address along with the allocated ID and allocation time.
*   **ID Release (Clock Out):** Employees can click a "Clock Out" button to release their allocated ID.
*   **Automatic ID Expiration:** Allocated IDs are automatically released at 24:00 (midnight) on the day they were allocated.
*   **ID Reapplication:** An "Reapply" button allows employees to release their current ID and request a new one.
*   **ID Availability Check:** The system prevents allocation if all IDs are currently in use.
*   **Persistence:** Allocated IDs and their details are stored in a SQLite database, ensuring data persists across server restarts.

## Setup and Installation

To set up and run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [repository-url]
    cd [project-directory]
    ```
2.  **Install dependencies:**
    This project uses `pnpm` as the package manager.
    ```bash
    pnpm install
    ```
3.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    The application will be accessible at `http://localhost:3000`.

## Usage

Open your browser and navigate to `http://localhost:3000`.

*   Click the "**Clock In**" button to get a temporary employee ID. The allocated ID and current time will be displayed.
*   Click the "**Clock Out**" button to release your current ID.
*   Click the "**Reapply**" button to release your current ID and get a new one.
*   Error messages will be displayed if all IDs are in use or if there are other issues.

## Technical Details

### Frontend

*   **Framework:** Next.js (React)
*   **Language:** TypeScript
*   **Component:** `app/id-allocation-ui.tsx` handles the user interface and interacts with the backend API.

### Backend

*   **Framework:** Next.js API Routes
*   **Database:** SQLite (`better-sqlite3`)
*   **Database File:** `employee_ids.db` (created in the project root)
*   **Database Initialization:** Handled by `app/db.ts` on server startup.
*   **ID Allocation Logic:** `app/id-allocation-service.ts` contains the core logic for managing ID allocation, release, and cleanup.

### API Endpoints

*   **`/api/id-allocation` (GET)**
    *   **Description:** Retrieves a list of currently allocated IDs. Also triggers cleanup of expired IDs.
    *   **Response:** `{ allocatedIds: number[] }`
*   **`/api/id-allocation` (POST)**
    *   **Description:** Handles allocation and release of IDs.
    *   **Request Body:**
        ```json
        {
          "action": "allocate",
          "ipAddress": "string"
        }
        ```
        or
        ```json
        {
          "action": "release",
          "id": "number"
        }
        ```
    *   **Response:** `{ success: boolean, id?: number, uniqueId?: string, error?: string }`

### ID Range and Expiration

*   **ID Range:** 644100 to 644400 (inclusive).
*   **Expiration:** Each allocated ID expires at 24:00 (midnight) on the day it was allocated. A cleanup function runs on every GET request to the API to release expired IDs.

### Employee Pool Upload

### Supported File Formats
*   **Text File (.txt):** Each line should contain a single employee ID.

### How to Upload
1.  Navigate to the main page.
2.  Click the "Upload Pool" button.
3.  Select a text file containing employee IDs (one ID per line).
4.  The system will automatically process and import the valid IDs.

### File Content Requirements
*   Each line should contain a valid integer ID within the range of 644100-644400.
*   IDs must be unique and not already allocated.
*   Empty lines are ignored.

### Notes
*   **File Format:** Ensure the file is saved as plain text (.txt).
*   **ID Range:** Only IDs within 644100-644400 are accepted.
*   **File Size:** There is no strict limit, but excessively large files may take longer to process.
*   **Upload Feedback:** After upload, the system will display the number of successfully imported IDs.
