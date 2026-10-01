# PostgreSQL High Availability & Standby Replication Runbook
## Chapter 4: Mitigating Standby Recovery Conflicts
Read replicas configured with hot standby can experience replication lag when long-running read queries hold snapshots on rows that the primary instance has already vacuumed or modified.

### Key Configuration Parameters
- hot_standby_feedback = on: Informs the primary of standby read requirements, preventing premature dead row cleanup.
- max_standby_streaming_delay = 60s: Allows replication to proceed after delay threshold.
- Partition high-frequency write tables to limit vacuum lock contention.
