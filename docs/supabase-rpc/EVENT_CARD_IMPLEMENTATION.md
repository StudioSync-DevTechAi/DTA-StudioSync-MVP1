# Event Card Implementation Guide

## Overview
This document describes the Event Card model and API implementation for saving events from Page 2 to the `events_details_table`.

## Field Mapping

| UI Field (Left) | Database Column (Right) | Type | Notes |
|----------------|------------------------|------|-------|
| Type Of Event | `event_name` | TEXT | Max 20 chars (check constraint) |
| Event Start Date | `event_start_date` | TIMESTAMP WITH TIME ZONE | Combined date+time |
| Event Start Time | `event_start_time` | TIME WITH TIME ZONE | Separate time field |
| Photographer (selected) | `event_photo_coordinator_phno` | TEXT (FK) | References `photographers_details_table` |
| Videographer (selected) | `event_video_coordinator_phno` | TEXT (FK) | References `videographers_details_table` |
| Photographers Count | `event_photographers_count` | INTEGER | Must be >= 0 |
| Videographers Count | `event_videographers_count` | INTEGER | Must be >= 0 |
| Event Deliverables Notes | `event_deliverables_notes_json` | TEXT | Max 10000 chars |
| Event Prep Checklist | `event_prep_checklist_json` | JSONB | Array of checklist items |
| Project_UUID (from state) | `project_uuid` | UUID (FK) | References `project_estimation_table` |
| Photography_Owner_phNo (from state) | `photography_eventowner_phno` | TEXT (FK) | References `photographers_details_table` |

## EventPackage Interface

```typescript
interface EventPackage {
  id: string; // Local UI ID
  event_uuid?: string; // Database UUID (set after saving)
  eventType: string; // Maps to event_name
  photographersCount: string; // Maps to event_photographers_count
  videographersCount: string; // Maps to event_videographers_count
  startDate?: Date; // Maps to event_start_date
  startHour?: string; // Maps to event_start_time
  startMinute?: string; // Maps to event_start_time
  photographyCoordinatorId?: string; // Maps to event_photo_coordinator_phno
  videographyCoordinatorId?: string; // Maps to event_video_coordinator_phno
  deliverablesNotes?: string; // Maps to event_deliverables_notes_json
  savedDeliverablesNotes?: string; // Saved version of notes
  isEditingDeliverablesNotes?: boolean;
  hasSavedDeliverablesNotes?: boolean;
  prepChecklist?: ChecklistItem[]; // Maps to event_prep_checklist_json
  isSaved?: boolean; // Track if this event has been saved to database
}
```

## RPC Function: `create_event`

**File**: `supabase/migrations/20250125000005_create_event_rpc.sql`

**Parameters**:
- `p_event_name` - Type of event
- `p_event_start_date` - Event start date (DATE)
- `p_event_start_time` - Event start time (TIME)
- `p_event_photo_coordinator_phno` - Photography coordinator phone number
- `p_event_video_coordinator_phno` - Videography coordinator phone number
- `p_event_photographers_count` - Number of photographers
- `p_event_videographers_count` - Number of videographers
- `p_event_deliverables_notes_json` - Deliverables notes (TEXT)
- `p_event_prep_checklist_json` - Prep checklist (JSONB)
- `p_project_uuid` - Project UUID (FK)
- `p_photography_eventowner_phno` - Photography owner phone number
- `p_event_client_phno` - Client phone number
- `p_event_uuid` - Optional: If provided, updates existing event; otherwise creates new

**Returns**:
```json
{
  "event_uuid": "uuid-here",
  "success": true,
  "message": "Event created successfully" or "Event updated successfully"
}
```

## Save Behavior

### When Events Are Saved:

1. **Adding New Event Card**: 
   - When user clicks "Add Event", the previous event card is automatically saved (if it has `eventType` and `startDate`)

2. **Moving to Page 3**:
   - All unsaved events are saved when clicking "Next" on Page 2

3. **Event Modification**:
   - When user modifies important fields (eventType, startDate, coordinators, counts, notes, checklist), the event is marked as `isSaved: false`
   - It will be saved again on the next save operation

### Save Function: `saveEventToDatabase`

- Validates required fields (`eventType`, `startDate`)
- Converts coordinator IDs to phone numbers
- Formats date and time
- Converts checklist to JSONB format
- Calls RPC function `create_event`
- Updates event package with `event_uuid` and `isSaved: true`

## Coordinator ID to Phone Number Conversion

The UI uses coordinator IDs (e.g., "photo-1", "video-2"), but the database requires phone numbers. The `getCoordinatorPhone()` function:
- Looks up the coordinator in `mockPhotographers` or `mockVideographers`
- Extracts the `contactNumber`
- Removes spaces for storage

**Note**: Currently using mock data. In production, this should fetch from `photographers_details_table` and `videographers_details_table`.

## Checklist Format

The checklist is stored as JSONB with this structure:
```json
[
  {
    "id": "string",
    "text": "string",
    "checked": boolean
  }
]
```

## Setup Instructions

1. **Run the RPC function migration**:
   ```sql
   -- Run supabase/migrations/20250125000005_create_event_rpc.sql
   ```

2. **Verify the function exists**:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'create_event';
   ```

3. **Test the function**:
   ```sql
   SELECT public.create_event(
     'wedding',
     '2025-02-01'::DATE,
     '10:00:00'::TIME,
     '+919876543210',
     '+919876543211',
     5,
     2,
     'Some notes',
     '[{"id":"1","text":"Check item","checked":false}]'::jsonb,
     'project-uuid-here'::UUID,
     '+919876543210',
     '+919876543211',
     NULL
   );
   ```

## Error Handling

The RPC function handles:
- Foreign key violations (invalid UUIDs or phone numbers)
- Check constraint violations (name length, counts, notes length)
- General SQL errors

All errors are returned in the response JSON with `success: false`.

