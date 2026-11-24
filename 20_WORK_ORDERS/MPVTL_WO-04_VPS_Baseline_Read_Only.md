# MPVTL | WO-04: Production VPS Baseline Verification — public copy

**Owner:** MPVTL Delivery Director. **Coordinator:** ChatGPT. **Engineer:** Codex.
**Scope:** Read-only inspection of the authorized registration and public website
VPS resources. No implementation or production changes.

This is a public-safe derivative of the authoritative work order with the same
relative path in the existing delivery handoff. It is not a new work order or
a replacement authorization. Infrastructure identifiers and sensitive execution
details are withheld. The original source remains unchanged locally.

**Authoritative source SHA-256:**
`5828c3c3e18c4784048bcfb9198edf5c6c4f7344f45640bfa472052a5e668504`.
This identifies the original source bytes, not this redacted derivative.

**Historical source baseline:** `ThriveCompany/mpvtl-registration`, WO-03 PR #1
reviewed at `0ee40045576447ed7453702753c5131e9e523a27`. The original work order
described that PR as draft and not deployed; this is not a fresh assertion of
its current GitHub status. Prior production candidate:
`710e7136d7c2f9686c527fdcfb155a7a72df0409`.

The original authority references the existing read-only VPS checklist, project
authority documents and ThriveBuild workflow. Newer management handover
decisions take precedence over superseded business facts.

## Objective

Establish evidenced relationships between the public endpoints, web-server
routing, application/PHP runtimes, working directories, source/build revisions,
WordPress files, migration metadata, recovery metadata and deployment boundaries.
Matching names or Git HEAD alone cannot establish deployment identity.

## Authorization and safety gate

Confirm the existing SSH target and account against explicit Delivery Director
authorization before connecting; a local alias is insufficient. Use existing
authorized configuration and credentials with trusted-host verification. Do not
prompt for passwords, bypass authentication, install an agent or change SSH
configuration. Stop if safe authorized access is unavailable.

Inspect using non-mutating commands and filtered outputs only. Do not publish
raw process/environment/configuration dumps, secrets, keys, tokens, logs,
personal information or business/student rows. No privilege escalation without
specific authorization. Stop immediately for unclear identity/authorization,
unexpected writes, exposure risk or required escalation; report the minimum
missing prerequisite rather than a workaround.

## Authorized read-only work

1. **Registration deployment identity:** Inspect only the selected web-server
   site and relevant includes; correlate its upstream to the actual process,
   supervisor, executable and working directory. Confirm an existing supervisor
   before any query. Inspect build metadata and Git root, branch, HEAD,
   credential-free origin and tracked/untracked status. Compare the two public
   source revisions above without changing the production checkout.
2. **Independent WordPress service:** Map its selected site, document root and
   PHP handler. Inventory core, themes, builder, commerce and plugin files by
   metadata without executing WordPress. Identify possible custom source,
   managed history, configuration mechanisms, backups and staging. Do not access
   users/private content. Verify shared infrastructure only where evidenced;
   do not presume shared schemas or pipelines.
3. **Runtime, data and access boundaries:** Record available runtime and engine
   version metadata. With an existing approved read-only database role only,
   inspect migration name/checksum, start/finish/rollback timestamps and applied
   step count, comparing source files. Exclude migration logs and all business
   tables. Review service separation, upload ownership/access, relevant exposure,
   retention and recovery metadata. Report SMTP presence only, without values.
   Do not copy or restore a backup.

## Prohibited actions

No production changes, service restarts/reloads, configuration or credential
changes, package installs, application starts/builds, database migrations/seeds,
WordPress execution with side effects, financial requests, exploits, scans,
backup creation/download/restore or raw configuration/log dumps. Do not invoke
the public registration-catalogue GET because its existing source can write to
the database. No production Git checkout, fetch, reset, stash, commit, push or
merge during inspection.

The original work order required a local-only report and withheld commit/push
until subsequent explicit authorization. The later coordinator publication
instruction carries Delivery Director authorization solely for public-safe
documentation on a new local development branch, a commit/push and a **draft PR
targeting main**. It does not permit production modification, database access
changes, implementation, deployment or merge.

## Required evidence and completion

The complete local report records date/operator, authorized target/account,
methods, both runtime graphs, provenance/drift, available versions and source
inventory, migration limits, recovery/security observations, evidence IDs,
VERIFIED/INFERRED/UNKNOWN labels, severity/owners, explicit blockers and safely
omitted inspections. Sensitive details stay local.

Completion requires at least one verified runtime-to-source relationship or a
clearly evidenced access blocker; both sites addressed where authorized; no
secrets/PII or production changes; facts separated from unknowns; and coordinator
review before follow-up implementation. A source migration match does not prove
applied database state, and an installed plugin does not prove activation.

The [public inspection report](../docs/reports/WO_04_VPS_BASELINE_REPORT.md)
documents the completed non-database inspection and remaining database-role
gate. It preserves the findings and limitations while withholding deployment
identifiers, detailed inventories and private operational metadata.

PRODUCTION CHANGES: NONE
MAIN BRANCH CHANGES: NONE
