# Goals

- Reduce incident-response handoff time by giving on-call engineers a single verified runbook decision.
- Surface the safest next action from incident evidence without making any production change.

# Target user

On-call platform engineers during an active incident.

# Desired outcome

A verified, read-only incident handoff recommendation with an owner and next action.

# Differentiators

- Evidence must be traceable to the incident record.
- The workflow must not mutate infrastructure or notify external systems.

# Constraints

- Deliver a result in under five minutes.
- Keep all evidence in the incident workspace.

# Evidence

- Recent handoffs lose ownership context.
- On-call engineers need a judgeable, safe demo rather than another generic dashboard.
