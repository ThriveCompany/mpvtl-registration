# Existing catalogue bootstrap and proposed WO-04

Inspection baseline: `710e7136d7c2f9686c527fdcfb155a7a72df0409`.
WO-03 does not change this implementation or its callers.

## VERIFIED dependencies and entry points

`lib/registration-catalog-bootstrap.ts` imports PrismaClient as a type only and
imports `lib/default-registration-catalog.json` as its catalogue data. Runtime
database access is supplied by the caller. It has no email, filesystem or payment
effect itself. Its module-scoped promise deduplicates concurrent calls within
one process, then resets on both success and failure; it is not a database lock.

All direct callers found across app/lib/prisma:

| Caller | Access boundary | Effect before response |
| --- | --- | --- |
| `app/api/registration-config/route.ts` GET | Public | Bootstrap, then read active courses/questions; errors become HTTP 200 with empty lists |
| `app/api/admin/courses/route.ts` GET | SUPER_ADMIN, no forced password change | Bootstrap, then catalogue reads |
| `app/api/admin/questions/route.ts` GET | SUPER_ADMIN, no forced password change | Bootstrap, then category/question reads |
| `app/api/admin/form-builder/route.ts` GET via readBuilderData | SUPER_ADMIN at route entry | Bootstrap then builder reads |

Public register client fetches `/api/registration-config`; admin UI depends on
the three admin endpoints. The unchanged staff seed separately writes defaults
and staff accounts; it is not a caller of this function. Prisma migrations also
contain historical catalogue/schema transformations. Neither seed nor migration
history has been executed by WO-03.

## VERIFIED database effects

1. Count categories, courses, category-linked verification questions, levels,
   fields and form questions in parallel. If all are nonzero, return without writes.
   Counts alone do not establish completeness, activation or valid relationships.
2. Otherwise upsert Basic/Intermediate/Advanced levels, JSON categories and fields.
   Upsert updates are empty, preserving existing rows at these steps.
3. If course count is zero, upsert JSON courses and associate default level/field.
4. If courses already exist, update matching JSON course names where either
   levelId or fieldId is null. **Both IDs are assigned**, potentially replacing
   the already populated counterpart. This is not a strictly missing-field-only repair.
5. If no category-linked verification questions exist, create missing category ×
   JSON question combinations. Presence is checked individually.
6. If no form questions exist, create field × question rows, level associations
   and nested options (yes/no, availability, reason-for-course and open questions).

Count, prerequisite-upsert, course-create and relationship-backfill failures
propagate. Verification/form-question failures are logged and swallowed, so the
caller may receive partial success. There is no encompassing transaction.
Two application processes can both observe zero counts and create duplicate
non-unique form questions. A later partial population may suppress further repair.

## Tests and limits

Synthetic tests exercise complete-catalogue no-op, default creation and option
mapping, relationship backfill, existing verification-question skip, same-process
concurrency, retry after rejection and partial-success/failure boundaries.
Route tests cover the public response and admin rejection before bootstrap.
These are behavioural unit tests, not proof of SQL constraints, cross-process
locking, complete API security or production data quality.

## Proposed WO-04: eliminate writes from GET

1. Inventory catalogue completeness with authorised metadata-only VPS access;
   define the desired repair rules and preserve existing admin edits/disabled rows.
2. Introduce an explicit, operator-invoked catalogue initialization/repair command
   with dry-run output limited to aggregate counts, transaction boundaries and
   database coordination. Keep staff provisioning entirely separate.
3. Test empty, complete and partially populated catalogues; preservation of
   existing non-null relationships; concurrent initialization; interrupted work;
   reruns; disabled records; every option format and all four caller contracts.
4. Make all public/admin GET handlers read-only. Define an intentional,
   observable not-initialized response instead of silent empty success.
5. Validate with a disposable PostgreSQL instance and synthetic fixtures. Prove
   that GET issues no INSERT/UPDATE/DELETE. Prepare a reviewed initialization
   and rollback runbook before separately authorised deployment.

No production initialization, cleanup, endpoint change or migration is approved
by this proposal. Never remove the GET call first and assume the legacy staff seed
is a safe replacement.
