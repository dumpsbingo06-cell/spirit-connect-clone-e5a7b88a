# Link Popular BINs to Their Categories

## What will change
- Make every Popular BIN card open the public category where that BIN was added.
- Enrich category BIN listings with scheme, brand, card type, level, bank, country, flag, currency, and the admin note.
- Replace the basic table with a clearer responsive layout that remains easy to scan on phones and desktops.
- Keep private lookup-cache fields hidden and expose only the safe card details needed by these public pages.

## Technical details
- Extend the public Popular BIN data with its category slug and name.
- Add a narrowly scoped read function for category BIN details, joining category entries to cached lookup data without opening the cache table publicly.
- Update the typed data helpers and both affected interfaces.
- Verify links, category details, mobile layout, and the current build.
