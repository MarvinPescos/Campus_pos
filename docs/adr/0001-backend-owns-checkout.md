# Backend owns checkout

The FastAPI backend serves the Product catalog and owns checkout: `POST /api/transactions` receives Order Lines and the Payment Method, recomputes the Total from its own prices, rejects insufficient Cash Tendered, computes Change, issues the Transaction Reference, and returns the Receipt. The frontend holds the Order only until checkout and its Total is display-only. We chose this over a catalog-only backend so the money rules and reference uniqueness live in one authoritative place, and over server-held Orders because the exam needs no server-side Order state.
