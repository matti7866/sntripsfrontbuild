# Hidden Residences Feature

## Overview
This feature allows users to manage residences that have been moved to Step 0 and are hidden from the main tasks view. It provides a centralized interface to view all hidden residences and move them back to appropriate steps.

## Problem Solved
Previously, when using the "Move" feature to transfer residences between steps, some records were accidentally moved to Step 0, causing them to become hidden from all step views. This made it difficult to locate and recover these residences.

## Implementation

### Components Created
1. **HiddenResidencesModal.tsx**
   - Location: `/src/components/residence/HiddenResidencesModal.tsx`
   - A modal component that displays all residences in Step 0
   - Features:
     - Lists all hidden residences with full details
     - Checkbox selection (individual and select all)
     - Bulk move functionality to any step
     - Responsive table with sticky header
     - Real-time loading states
     - Success/error feedback

### Integration Points
1. **ResidenceTasks.tsx** - Updated to include:
   - Import of `HiddenResidencesModal` component
   - State management for modal visibility (`showHiddenResidencesModal`)
   - "Hidden" button in the header toolbar
   - Modal integration with reload callbacks

## Features

### 1. Access Hidden Residences
- **Button Location**: Header toolbar on the Residence Tasks page
- **Button Label**: "Hidden" with eye-slash icon
- **Button Style**: Info (blue) button

### 2. View Hidden Residences
The modal displays a comprehensive table with:
- Residence ID
- Creation Date
- Passenger Name with country flag
- Customer Name
- Company Name
- Passport Number
- Sale Price
- Paid Amount with percentage
- Current Step (always Step 0)

### 3. Select Residences
- **Individual Selection**: Click on any row or checkbox
- **Select All**: Use the checkbox in the table header
- **Visual Feedback**: Selected rows are highlighted
- **Counter**: Shows "Selected: X / Total"

### 4. Move Residences
- **Target Step Selector**: Dropdown to choose destination step (1-9)
- **Move Button**: Disabled until at least one residence is selected
- **Confirmation Dialog**: Confirms the move operation
- **Progress Indicator**: Shows loading state during move
- **Results Summary**: 
  - Success count
  - Error count (if any)
  - Detailed error messages for failed moves

### 5. Auto-Reload
- After successful move, the modal automatically reloads
- The main tasks view is also refreshed
- Selected residences are cleared

## User Workflow

1. **Access Feature**
   - Navigate to: `http://127.0.0.1:5174/residence/tasks`
   - Click the "Hidden" button in the header

2. **View Hidden Residences**
   - Modal opens showing all Step 0 residences
   - If none exist, shows success message

3. **Select Residences to Move**
   - Click on rows or use checkboxes to select
   - Or click "Select All" checkbox in header

4. **Choose Target Step**
   - Use the dropdown to select destination step (1-9)

5. **Execute Move**
   - Click "Move Selected" button
   - Confirm the operation in the dialog
   - Wait for completion

6. **View Results**
   - Success notification shows moved count
   - Error notification shows any failures
   - Modal refreshes to show remaining hidden residences

## Technical Details

### API Integration
- **Endpoint**: Uses existing `residenceService.getTasks()` with `step: '0'`
- **Move API**: Uses existing `residenceService.moveResidenceToStep()`
- **Cache Busting**: Includes timestamp parameter to ensure fresh data

### State Management
- Uses React hooks for local state
- Set-based selection tracking for performance
- Loading states prevent concurrent operations

### Error Handling
- Individual residence move errors are captured
- Partial success scenarios are handled gracefully
- User-friendly error messages via SweetAlert2

### Styling
- Follows existing modal pattern (`Modal.css`)
- Responsive design (works on all screen sizes)
- Sticky table header for large datasets
- Consistent with app's color scheme

## Benefits

1. **Recovery**: Easy recovery of accidentally hidden residences
2. **Visibility**: Clear view of all Step 0 residences
3. **Bulk Operations**: Move multiple residences at once
4. **User-Friendly**: Intuitive interface with clear feedback
5. **Safe**: Confirmation dialogs prevent accidental moves
6. **Reliable**: Comprehensive error handling and reporting

## Files Modified

### New Files
- `/src/components/residence/HiddenResidencesModal.tsx`

### Modified Files
- `/src/pages/residence/ResidenceTasks.tsx`
  - Added import for HiddenResidencesModal
  - Added state for modal visibility
  - Added "Hidden" button to header
  - Added modal component to JSX

## Testing Checklist

- [ ] Button appears in header and is clickable
- [ ] Modal opens and shows loading state
- [ ] Hidden residences are displayed correctly
- [ ] Individual selection works
- [ ] Select all/deselect all works
- [ ] Target step selector works
- [ ] Move button is disabled when nothing selected
- [ ] Move operation executes successfully
- [ ] Success message shows correct count
- [ ] Error handling works for failed moves
- [ ] Modal reloads after successful move
- [ ] Main tasks view refreshes
- [ ] Modal can be closed with X button or Close button

## Future Enhancements (Optional)

1. Add search/filter functionality in the modal
2. Add sorting capabilities for the table
3. Add pagination for large datasets
4. Export hidden residences list to CSV
5. Add reason/notes when moving residences
6. Add undo functionality for recent moves
7. Show move history for each residence

## Notes

- The feature uses Step 0 as the identifier for hidden residences
- No backend changes were required
- Compatible with existing move functionality
- Does not interfere with normal task flow

