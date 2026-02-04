# Manage Residences Feature (Step 0 / NULL / 2)

## Overview
This feature allows users to manage residences that are in Step 0, have NULL steps, or are in Step 2 (Insurance). It provides a centralized interface to view these residences and move them to appropriate steps.

## Problem Solved
Previously, when using the "Move" feature to transfer residences between steps, some records were accidentally moved to Step 0 or ended up with NULL steps, causing them to become hidden from all step views. Additionally, this feature provides quick access to Step 2 (Insurance) residences for bulk management. This made it difficult to locate and manage these residences.

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

### 2. View Residences
The modal displays a comprehensive table with:
- Residence ID
- Creation Date
- Passenger Name with country flag
- Customer Name
- Company Name
- Passport Number
- Sale Price
- Paid Amount with percentage
- Current Step (Step 0, NULL, or Step 2)

### 3. Select Residences
- **Individual Selection**: Click on any row or checkbox
- **Select All**: Use the checkbox in the table header
- **Visual Feedback**: Selected rows are highlighted
- **Counter**: Shows "Selected: X / Total"

### 4. Move Residences
- **Target Step Selector**: Dropdown to choose destination step (1-9)
- **Move Button**: Disabled until at least one residence is selected
- **Validation**: Automatically checks each residence for completed steps with financial transactions
- **Smart Filtering**: Prevents moving to steps that already have saved transactions
- **Confirmation Dialog**: 
  - Shows count of residences that can be moved
  - Shows count and list of residences that will be skipped (if any)
  - Explains why residences are blocked
- **Progress Indicator**: Shows loading state during validation and move
- **Results Summary**: 
  - Successfully moved count
  - Failed count (if any)
  - Skipped count (residences with transactions)
  - Detailed error messages for failed moves

### 5. Auto-Reload
- After successful move, the modal automatically reloads
- The main tasks view is also refreshed
- Selected residences are cleared

## User Workflow

1. **Access Feature**
   - Navigate to: `http://127.0.0.1:5174/residence/tasks`
   - Click the "Hidden" button in the header

2. **View Residences**
   - Modal opens showing all Step 0, NULL, and Step 2 residences
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
- **Endpoint**: Uses existing `residenceService.getTasks()` with `step: '0,null,2'` to fetch Step 0, NULL, and Step 2 residences
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
2. **Visibility**: Clear view of all Step 0, NULL, and Step 2 residences
3. **Bulk Operations**: Move multiple residences at once
4. **User-Friendly**: Intuitive interface with clear feedback
5. **Safe**: 
   - Confirmation dialogs prevent accidental moves
   - Automatic validation prevents data corruption
   - Blocks moves to steps with saved financial transactions
6. **Smart Validation**: 
   - Checks each residence individually
   - Skips blocked residences automatically
   - Shows detailed reasons for blocked moves
7. **Reliable**: Comprehensive error handling and reporting
8. **Data Protection**: Prevents moving to steps with existing transactions to avoid financial data inconsistency

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

- The feature displays residences in Step 0, NULL, and Step 2 (Insurance)
- No backend changes were required
- Compatible with existing move functionality
- Does not interfere with normal task flow
- The API call includes: `step: '0,null,2'`
- Step 2 is included for quick bulk management of Insurance step residences

