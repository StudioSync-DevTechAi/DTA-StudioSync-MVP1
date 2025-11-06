# Sub-Events List Table Implementation

## Overview
This document describes the implementation of the `sub_events_list_table` for dynamically managing sub-event dropdown options in the PhotoBank module.

## Database Table

### `sub_events_list_table`
- **Primary Key**: `sub_event_id` (UUID)
- **Purpose**: Stores sub-event types for dropdown selection
- **Key Fields**:
  - `sub_event_name` (TEXT, UNIQUE) - The display name (e.g., "Engagement", "Bridal Shower")
  - `display_order` (INTEGER) - Order for dropdown display
  - `is_active` (BOOLEAN) - Allow disabling without deleting
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP, auto-updated)

### Initial Data
The table is pre-populated with:
1. Engagement (display_order: 1)
2. Bridal Shower (display_order: 2)
3. Reception (display_order: 3)
4. Mehendi and Sangeet (display_order: 4)

## SQL Script

**File**: `supabase/migrations/20250115000005_create_sub_events_list_table.sql`

### Features:
- Table creation with proper constraints
- RLS (Row Level Security) policies
- Indexes for performance
- Auto-update trigger for `updated_at`
- Helper function `get_active_sub_events()` for easy querying
- Initial data insertion with conflict handling

## Implementation Details

### API Function (`src/hooks/photobank/api/photobankApi.ts`)

**`fetchSubEventsList()`**
- Fetches active sub-events from `sub_events_list_table`
- Returns array of `SubEvent` objects
- Ordered by `display_order` then `sub_event_name`
- Only returns `is_active = true` records

**Type Definition:**
```typescript
export interface SubEvent {
  sub_event_id: string;
  sub_event_name: string;
  display_order: number;
}
```

### PhotoBank.tsx Changes

1. **State Management**
   - Added `subEventsList` state to store fetched sub-events
   - Added `isLoadingSubEvents` state for loading indicator

2. **Data Loading**
   - `useEffect` hook loads sub-events on component mount
   - Fetches from database using `fetchSubEventsList()`
   - Fallback to default values if database fetch fails
   - Shows warning toast if fetch fails

3. **Dropdown Updates**
   - Replaced hardcoded `SelectItem` components with dynamic mapping
   - Both main form and album form dropdowns now use `subEventsList`
   - Maintains "Other Sub-Event" option for custom entries

### Code Changes

**Before:**
```tsx
<SelectContent>
  <SelectItem value="Engagement">Engagement</SelectItem>
  <SelectItem value="Bridal shower">Bridal shower</SelectItem>
  <SelectItem value="Reception">Reception</SelectItem>
  <SelectItem value="Mehendi and Sangeet">Mehendi and Sangeet</SelectItem>
  <SelectItem value="Other">Other Sub-Event</SelectItem>
</SelectContent>
```

**After:**
```tsx
<SelectContent>
  {subEventsList.map((event) => (
    <SelectItem key={event.sub_event_id} value={event.sub_event_name}>
      {event.sub_event_name}
    </SelectItem>
  ))}
  <SelectItem value="Other">Other Sub-Event</SelectItem>
</SelectContent>
```

## Data Flow

```
1. PhotoBank page loads
   ↓
2. useEffect triggers loadSubEvents()
   ↓
3. fetchSubEventsList() called
   ↓
4. Query sub_events_list_table WHERE is_active = true
   ↓
5. Order by display_order, sub_event_name
   ↓
6. Store in subEventsList state
   ↓
7. Dropdowns render dynamically from subEventsList
```

## Benefits

1. **Dynamic Updates**: Sub-events can be added/modified in database without code changes
2. **Centralized Management**: All sub-events managed in one place
3. **Ordering Control**: `display_order` allows custom ordering
4. **Soft Delete**: `is_active` flag allows disabling without deletion
5. **Fallback Support**: Default values if database unavailable
6. **Consistent Data**: Same list used across all dropdowns

## Usage Examples

### Adding a New Sub-Event
```sql
INSERT INTO public.sub_events_list_table (sub_event_name, display_order, is_active)
VALUES ('Cocktail Party', 5, true);
```

### Disabling a Sub-Event
```sql
UPDATE public.sub_events_list_table
SET is_active = false
WHERE sub_event_name = 'Bridal Shower';
```

### Reordering Sub-Events
```sql
UPDATE public.sub_events_list_table
SET display_order = 1
WHERE sub_event_name = 'Reception';
```

## Error Handling

- If database fetch fails, falls back to default hardcoded values
- Shows warning toast to user
- Application continues to function with default values
- Error logged to console for debugging

## Future Enhancements

1. **Admin UI**: Create admin interface to manage sub-events
2. **Caching**: Implement client-side caching to reduce database calls
3. **Real-time Updates**: Use Supabase real-time subscriptions for live updates
4. **Validation**: Add validation to ensure sub-event names are unique
5. **Localization**: Support multiple languages for sub-event names

## Testing Checklist

- [x] Table creation script executes successfully
- [x] Initial data inserted correctly
- [x] Sub-events load on page mount
- [x] Dropdown displays all active sub-events
- [x] Dropdown maintains "Other" option
- [x] Fallback works if database unavailable
- [x] Both main form and album form dropdowns work
- [x] Ordering respects display_order
- [x] RLS policies work correctly

