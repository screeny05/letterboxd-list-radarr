# 1.3.0

- Add support for user review lists (`/screeny05/reviews/`) (Thank you @benjroy)
- Add support for Studio filmographies (`/studio/a24/`, etc.)
- Only the default (most popular) page is returned. Further pagination is blocked by Cloudflare (see `lib/letterboxd/studio.ts`).
- Fix broken write-after-flush in chunkstreamer

# 1.2.3

- Add support for redis + TLS DSNs
- Skip redis cache if not available

# 1.2.2

- Fix selector for lists showing as grid per default, e.g. /actor/tom-hanks/

# 1.2.1

- Unify selectors for regular list and popular list (Thank you @benjroy)

# 1.2.0

- Throw 404 error on empty lists by default.
- Add `errorOnEmpty` query parameter to disable 404 error on empty lists.
- Implement fix for letterboxd list page structure change (Thank you @szymon-romanko)
