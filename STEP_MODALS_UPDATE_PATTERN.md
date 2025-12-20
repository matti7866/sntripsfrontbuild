# Step Modals - Credit Card Integration Pattern

## Pattern to Apply to Each Modal

For each modal (Labour Card, E-Visa, Change Status, Medical, Emirates ID, Visa Stamping, Contract Submission):

### 1. Update Function Signature
**FROM:**
```typescript
export function ModalName({ isOpen, onClose, residenceId, onSuccess, currencies, accounts, suppliers }: BaseStepModalProps)
```

**TO:**
```typescript
export function ModalName({ isOpen, onClose, residenceId, onSuccess, currencies, accounts, creditCards, suppliers }: BaseStepModalProps)
```

### 2. Update formData State
**ADD** `paymentType: 'account'` field:

```typescript
const [formData, setFormData] = useState({
  // ... existing fields ...
  [fieldName]ChargeOn: '1',
  [fieldName]PaymentType: 'account', // ADD THIS
  [fieldName]ChargeAccount: '',
  [fieldName]ChargeSupplier: ''
});
```

### 3. Update useEffect
**ADD** paymentType initialization:

```typescript
useEffect(() => {
  if (isOpen && residenceId && currencies.length > 0) {
    setFormData({
      // ... existing fields ...
      [fieldName]PaymentType: 'account', // ADD THIS
      [fieldName]ChargeAccount: '',
      [fieldName]ChargeSupplier: ''
    });
  }
}, [isOpen, residenceId, currencies]);
```

### 4. Update Account Selection UI
**REPLACE** single account dropdown with TWO dropdowns:

**FROM:**
```tsx
{formData.[fieldName]ChargeOn === '1' && (
  <div className="col-md-12 mb-3">
    <label>Charge Account *</label>
    <select
      name="[fieldName]ChargeAccount"
      className={`form-select ${errors.[fieldName]ChargeAccount ? 'is-invalid' : ''}`}
      value={formData.[fieldName]ChargeAccount}
      onChange={(e) => { setFormData(prev => ({ ...prev, [fieldName]ChargeAccount: e.target.value })); }}
    >
      <option value="">Select Account</option>
      {accounts.map((a) => <option key={a.account_ID} value={a.account_ID}>{a.account_Name}</option>)}
    </select>
  </div>
)}
```

**TO:**
```tsx
{formData.[fieldName]ChargeOn === '1' && (
  <>
    <div className="col-md-4 mb-3">
      <label>Payment Method *</label>
      <select
        name="[fieldName]PaymentType"
        className="form-select"
        value={formData.[fieldName]PaymentType}
        onChange={(e) => { 
          setFormData(prev => ({ ...prev, [fieldName]PaymentType: e.target.value, [fieldName]ChargeAccount: '' })); 
          setErrors(prev => ({ ...prev, [fieldName]ChargeAccount: '' })); 
        }}
      >
        <option value="account">Account</option>
        <option value="creditCard">Credit Card</option>
      </select>
    </div>
    <div className="col-md-8 mb-3">
      <label>
        {formData.[fieldName]PaymentType === 'creditCard' ? '💳 Select Credit Card' : 'Select Account'} *
      </label>
      <select
        name="[fieldName]ChargeAccount"
        className={`form-select ${errors.[fieldName]ChargeAccount ? 'is-invalid' : ''}`}
        value={formData.[fieldName]ChargeAccount}
        onChange={(e) => { setFormData(prev => ({ ...prev, [fieldName]ChargeAccount: e.target.value })); setErrors(prev => ({ ...prev, [fieldName]ChargeAccount: '' })); }}
      >
        <option value="">{formData.[fieldName]PaymentType === 'creditCard' ? 'Select Credit Card' : 'Select Account'}</option>
        {formData.[fieldName]PaymentType === 'creditCard' 
          ? creditCards.map((c) => <option key={c.account_ID} value={c.account_ID}>💳 {c.account_Name}</option>)
          : accounts.map((a) => <option key={a.account_ID} value={a.account_ID}>{a.account_Name}</option>)
        }
      </select>
      {errors.[fieldName]ChargeAccount && <div className="invalid-feedback">{errors.[fieldName]ChargeAccount}</div>}
    </div>
  </>
)}
```

## Field Names by Modal

| Modal | Field Prefix |
|-------|-------------|
| Labour Card | `labourCard` |
| E-Visa | `eVisa` |
| Change Status | `changeStatus` |
| Medical | `medical` |
| Emirates ID | `emiratesID` |
| Visa Stamping | `visaStamping` |
| Contract Submission | `contractSubmission` |

## Example: Complete Labour Card Modal Update

**Step 1:** Function signature
```typescript
export function LabourCardModal({ isOpen, onClose, residenceId, onSuccess, currencies, accounts, creditCards, suppliers }: BaseStepModalProps & { labourCardNumber?: string })
```

**Step 2:** Add to formData
```typescript
const [formData, setFormData] = useState({
  labourCardNumber: '',
  labourCardCost: '1210',
  labourCardCurrency: '',
  labourCardChargeOn: '1',
  labourCardPaymentType: 'account', // NEW
  labourCardChargeAccount: '',
  labourCardChargeSupplier: ''
});
```

**Step 3:** Update useEffect
```typescript
useEffect(() => {
  if (isOpen && residenceId && currencies.length > 0) {
    setFormData(prev => ({
      ...prev,
      labourCardCurrency: currencies[0].currencyID.toString(),
      labourCardPaymentType: 'account', // NEW
      labourCardNumber: (onSuccess as any)?.labourCardNumber || ''
    }));
  }
}, [isOpen, residenceId, currencies]);
```

**Step 4:** Update UI (replace the single dropdown section)

## Files Already Updated

✅ **Backend:** `/api/residence/lookups.php`
- Separates accounts and creditCards

✅ **ResidenceTasks.tsx**
- Adds creditCards to lookups state
- Passes creditCards to all modals

✅ **Insurance Modal** - Already updated as example

## Files Pending Update

❌ Labour Card Modal
❌ E-Visa Modal
❌ Change Status Modal
❌ Medical Modal
❌ Emirates ID Modal
❌ Visa Stamping Modal
❌ Contract Submission Modal

## Testing Steps

After updating all modals:

1. Go to `/residence/tasks`
2. Click on a residence
3. Click each step
4. Verify:
   - "Payment Method" dropdown appears with "Account" and "Credit Card" options
   - When "Account" selected → shows regular accounts
   - When "Credit Card" selected → shows credit cards with 💳 emoji
   - Both lists load correctly
   - Selection works
   - Form submission includes correct account_ID

