# Tasks Tab Implementation Plan

## Scope
Implement complete residence tasks feature from web app into mobile app with all steps and features.

## Steps to Implement

###  Regular Residence Steps:
1. **Step 1** - Offer Letter
2. **Step 1A** - Offer Letter (S)
3. **Step 2** - Insurance
4. **Step 3** - Labour Card
5. **Step 4** - E-Visa
6. **Step 4A** - E-Visa (S)
7. **Step 5** - Change Status
8. **Step 6** - Medical
9. **Step 7** - EID (Emirates ID)
10. **Step 8** - Visa Stamping
11. **Step 9** - Completed

## Features for Each Step

### Common Features (All Steps):
- ✅ List view of tasks
- ✅ Search functionality
- ✅ Company filter
- ✅ Customer filter
- ✅ Task count badges
- ✅ Pagination
- ✅ Refresh

### Step-Specific Actions:
- **Step 1/1A**: Offer Letter modal
- **Step 2**: Insurance modal
- **Step 3**: Labour Card modal
- **Step 4/4A**: E-Visa modal
- **Step 5**: Change Status modal
- **Step 6**: Medical modal
- **Step 7**: Emirates ID modal
- **Step 8**: Visa Stamping modal

### Additional Features:
- View Attachments
- Add/View Remarks
- Tawjeeh modal
- ILOE modal
- Pending Payments
- Hide/Show residence
- Access company portal

## Implementation Approach

Given the complexity, I'll implement this in phases:

### Phase 1: Structure ✅ (Starting Now)
- Rename tab to "Tasks"
- Create sub-tabs for all steps
- Basic navigation

### Phase 2: Data Loading
- Service layer for API calls
- Load tasks for each step
- Filters and search

### Phase 3: Step Actions  
- Implement modals for each step
- Action buttons
- Form submissions

### Phase 4: Additional Features
- Attachments viewer
- Remarks system
- Payment tracking

---

**Note**: This is a large implementation. Due to the size, I'll create the core structure first with essential features, then we can enhance specific steps as needed.

Starting implementation now...
