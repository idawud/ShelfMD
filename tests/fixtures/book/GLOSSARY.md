# Glossary

**A**

- **Availability**: In the CAP theorem, the guarantee that every request receives a response.
- **Atomic broadcast**: A protocol ensuring all nodes deliver the same messages in the same order.

**B**

- **Byzantine fault**: A fault where a node behaves arbitrarily, including sending conflicting messages.
- **Broadcast**: Sending a message to all nodes in a group.

**C**

- **CAP theorem**: States that a distributed system can guarantee at most two of: Consistency, Availability, Partition tolerance.
- **Causality**: The relationship between events where one event directly influences another.
- **Consensus**: Agreement among distributed nodes on a single value.
- **CRDTs**: Conflict-free Replicated Data Types — data structures that automatically resolve conflicts.

**D**

- **Deadlock**: A situation where two or more processes are waiting for each other indefinitely.
- **Durability**: The guarantee that committed transactions survive failures.

**E**

- **Epoch**: A period of time during which a single leader is recognized.
- **Exactly-once delivery**: The guarantee that a message is delivered exactly once.

**F**

- **Fault tolerance**: The ability of a system to continue operating despite failures.
- **FLP impossibility**: The impossibility result showing no deterministic consensus in async systems with faults.

**G**

- **Gossip protocol**: A peer-to-peer communication pattern where nodes randomly exchange information.

**H**

- **Heartbeat**: A periodic signal sent to indicate that a node is alive.
- **Hinted handoff**: A technique where a node stores data temporarily for an unavailable replica.

**I**

- **Idempotency**: A property where an operation can be applied multiple times without changing the result.
- **Isolation**: In ACID, the guarantee that concurrent transactions appear serialized.

**J**

- **Jitter**: Random variation in timing, often used to prevent thundering herd problems.

**K**

- **Key-value store**: A simple storage system that maps keys to values.

**L**

- **Lamport clock**: A logical clock that provides a partial ordering of events.
- **Lease**: A time-limited grant of exclusive access to a resource.
- **Log-structured storage**: Storage that appends all writes to a log.

**M**

- **Majority quorum**: A quorum requiring more than half the nodes to agree.
- **Merkle tree**: A hash tree used to efficiently verify data integrity.
- **Multi-Paxos**: An extension of Paxos optimized for a sequence of consensus rounds.

**N**

- **Network partition**: A failure that splits a network into isolated groups.
- **Nonce**: A number used once, often in cryptographic protocols.

**O**

- **Optimistic concurrency control**: A technique that assumes conflicts are rare and checks at commit time.

**P**

- **Paxos**: A consensus algorithm proposed by Leslie Lamport.
- **Partition tolerance**: In CAP, the ability to continue operating despite network partitions.
- **Primary-backup replication**: A replication strategy with one primary and one or more backups.

**Q**

- **Quorum**: The minimum number of nodes that must agree for an operation to succeed.

**R**

- **Raft**: A consensus algorithm designed to be more understandable than Paxos.
- **Read repair**: A technique to fix stale replicas during a read operation.
- **Replication**: Keeping copies of data on multiple nodes for fault tolerance.

**S**

- **Serializability**: The strongest isolation level, equivalent to serial execution.
- **Sharding**: Partitioning data across multiple nodes.
- **Split-brain**: A scenario where two nodes both believe they are the leader.
- **State machine replication**: Replicating a deterministic state machine across nodes.

**T**

- **Two-phase commit (2PC)**: An atomic commitment protocol for distributed transactions.
- **Two-phase locking (2PL)**: A concurrency control protocol.

**U**

- **UUID**: Universally Unique Identifier, used to avoid coordination when generating IDs.

**V**

- **Vector clock**: A mechanism to capture causality between events in distributed systems.
- **Version vector**: Similar to vector clocks, used in distributed databases.

**W**

- **WAL (Write-Ahead Log)**: A log that records changes before they are applied.
- **Write quorum**: The minimum number of nodes that must acknowledge a write.

**Z**

- **ZooKeeper**: A distributed coordination service.
- **Zab**: The atomic broadcast protocol used in ZooKeeper.
