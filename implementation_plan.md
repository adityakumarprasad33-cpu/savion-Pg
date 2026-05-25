# Room Leaving System Analysis & Implementation Plan

## Analysis of Current Flow

Currently, the room leaving system operates through the following sequence:

1. **Initiation (Tenant Dashboard)**
   - Tenant clicks "Initiate Vacate".
   - The system checks for any pending rent dues. If clear, it sets the booking `status` to `"notice_given"` and calculates the `moveOutDate` as exactly 7 days from today.
   - A notification is sent to the property owner.

2. **Approval/Rejection (Owner Dashboard)**
   - The owner sees the resident marked as "NOTICE GIVEN".
   - The owner can "Approve Checkout" (sets status to `"notice_approved"`) or "Stay Active" (rejects the notice, setting status back to `"confirmed"`).
   - Tenant receives a notification based on the decision.

3. **Revocation (Tenant Dashboard)**
   - The tenant has a "Recall Notice" button to cancel the move-out process at any time, reverting the status back to `"confirmed"`.

4. **The "Auto-Vanish" Execution (The Critical Flaw)**
   - Both `tenant/page.tsx` and `owner/pg/[id]/page.tsx` have a `setInterval` running every 60 seconds.
   - If the current local device time passes **5:00 PM on the moveOutDate**, the dashboards attempt to automatically check out the tenant.
   - **Owner Dashboard Action:** Tries to update the booking status to `"cancelled"` and contract status to `"terminated"`.
   - **Tenant Dashboard Action:** Restores room availability, *hard deletes* the contract, *hard deletes* all complaints, and *hard deletes* the booking itself.

### Identified Critical Issues
* **Client-Side Cron Jobs:** Relying on a user keeping a browser tab open at exactly 5:00 PM to execute database updates is highly unreliable. If neither the owner nor the tenant opens the app, the room remains occupied forever in the system.
* **Race Conditions & Data Loss:** If both dashboards are open, both scripts race to modify the database. The tenant's script completely destroys the booking and contract data, causing the owner to lose vital historical resident records.
* **Time Manipulation:** Because execution relies on the client's local system clock (`new Date()`), a user can easily bypass or prematurely trigger checkout by changing their computer's time.

---

## Proposed Changes (Implementation Plan)

To stabilize the system and ensure historical data is preserved, I propose removing the unpredictable auto-delete intervals and replacing them with a deterministic, manual checkout process that mirrors real-world key handover.

### 1. Remove Auto-Vanish Intervals
- Completely remove the `setInterval` auto-checkout logic from `test_Frontend/src/app/dashboard/tenant/page.tsx`.
- Completely remove the `setInterval` auto-checkout logic from `test_Frontend/src/app/dashboard/owner/pg/[id]/page.tsx` (and caretaker dashboard if applicable).

### 2. Standardize Checkout State & Preserve History
- Stop hard-deleting (`deleteDoc`) bookings and contracts. 
- When a checkout occurs, the booking status should be updated to `"past"` or `"completed"` (not "cancelled", as cancellation implies they never stayed).
- The contract status should be updated to `"terminated"`.
- Complaints can be preserved or marked as `"archived"` rather than deleted.

### 3. Implement "Finalize Checkout" Button for Owners/Caretakers
- Instead of the browser guessing when the tenant leaves, give the control to the Owner/Caretaker.
- When a booking is `"notice_approved"`, display a **"Finalize Move-Out & Free Room"** button in the Owner/Caretaker dashboard.
- Clicking this button will:
  1. Trigger the `restoreRoomAvailability` function to correctly add `+1` to the room's available count.
  2. Set the booking status to `"completed"`.
  3. Set the contract status to `"terminated"`.
- *Optional feature:* Disable the button until the actual `moveOutDate` is reached, preventing premature checkout.

### 4. Tenant UI Updates
- For the tenant, once their status is `"completed"`, their dashboard will show a "Past Stays" UI instead of the active Stay Terminal, prompting them to find a new property or view their past receipts/reviews.

## User Review Required

> [!WARNING]
> The current tenant dashboard script permanently deletes all contract and booking history upon checkout. My proposed plan preserves this history for the owner's records. 
> 
> Do you approve replacing the automatic 5:00 PM "Auto-Vanish" system with a manual **"Finalize Checkout"** button for the owner/caretaker, thereby preserving the booking history and safely restoring room availability?
