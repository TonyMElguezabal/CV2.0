---
title: Order-processing microservices migration
company: acme-corp
skills:
  - cloud-migrations
  - technical-leadership
metrics:
  - "Deployment frequency increased from biweekly to daily"
  - "P95 checkout latency dropped 38%"
---

**Problem.** Acme Corp's order-processing monolith could no longer scale
with the business — deploys were biweekly and risky, and a single team
owned code that three product lines depended on. Feature delivery for
those product lines was slowing every quarter as the monolith grew.

**Approach.** Jose led the migration to eight independently deployable
microservices, sequencing the decomposition around bounded contexts
rather than rewriting the system wholesale. Each service shipped behind
a strangler-fig routing layer, so the monolith and the new services ran
side by side until each bounded context was fully cut over — no
customer-facing outage at any point in the migration.

**Outcome.** Deployment frequency moved from biweekly to daily, and P95
checkout latency dropped 38% as the new services were tuned
independently of the monolith's shared resource contention.
