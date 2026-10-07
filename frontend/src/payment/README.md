# Payment Method and Cash entry

PaymentMethodScreen accepts a positive whole-peso total, an onBack callback to return to Order Summary, and an onConfirm callback. The parent owns the Order and checkout submission.

onConfirm receives either { paymentMethod: 'cash', cashTendered } or { paymentMethod: 'qr' | 'card' }. Cash confirmation is disabled until the entered whole-peso amount covers the Total. Values outside the safe integer range cannot be entered. The screen displays live Change or the shortfall.

Back from a payment choice returns to Payment Method and clears cash. Back from Payment Method invokes onBack. The screen never edits the Order. Mount a fresh screen for each new Order. QR/Card selection hands off to later simulation screens; this slice does not process payments or create Transactions.

App currently hosts an explicitly labeled preview with a fixed example Order totaling ₱285 because the branch has no Order flow. Replace the preview with the real Order Summary and wire onConfirm to checkout when those slices are available. The handoff message is preview feedback, not Payment Successful.

Validation: npm run build and npm run lint. The agreed parent spec excludes UI/rendering tests; this slice does not change the tested Order reducer or backend HTTP API seams.
