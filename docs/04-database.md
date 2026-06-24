# Database Design

Database: PostgreSQL

Schemas:

- registry
- gst
- document
- scheduler
- audit
- iam
- tenant
- event

Core Tables:

registry.modules

registry.providers

registry.sources

gst.hsn_master

gst.gst_rates

gst.rate_history

gst.notifications

gst.state_rules

document.documents

scheduler.jobs

audit.audit_log

event.events

Indexes:

hsn_code

notification_number

effective_date

state_code

Search Requirements:

- Exact HSN
- Partial HSN
- Description Search
- Fuzzy Search

