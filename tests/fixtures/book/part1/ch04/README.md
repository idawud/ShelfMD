# Chapter 4: Failure Models

Understanding how systems fail is the first step to building fault-tolerant distributed systems.
This chapter provides a comprehensive taxonomy of failure modes and their implications.

## Types of Failures

### Crash Failures

A crash failure occurs when a node stops executing and does not recover. This is the simplest
failure model to reason about. Key properties:

- The node stops sending messages
- The node stops processing requests
- Detection is possible via timeouts (eventually)
- Recovery may or may not occur

Crash failures are sometimes called **fail-stop** failures when we assume the failure is
permanent and detectable.

### Omission Failures

An omission failure occurs when a node fails to send or receive some messages:

- **Send omission**: The node fails to send a message it should have sent
- **Receive omission**: The node fails to receive a message that was sent to it
- **Channel omission**: Messages are lost in the network

Omission failures are more subtle than crash failures because the node continues to operate,
just incompletely.

### Timing Failures

A timing failure occurs when a response arrives outside the expected time bounds:

- Too slow: Response arrives after the timeout
- Too fast: Response arrives before other dependencies are met

In synchronous systems, timing failures can be detected. In asynchronous systems,
distinguishing a slow node from a crashed node is impossible.

### Byzantine Failures

Byzantine failures are the most general and difficult failure model. A byzantine node can:

- Send arbitrary messages to different nodes
- Lie about its state
- Collude with other byzantine nodes
- Selectively send messages

The term comes from the Byzantine Generals Problem proposed by Lamport, Shostak, and Pease.

## Failure Detectors

Since perfect failure detection is impossible in asynchronous systems (FLP impossibility),
we use unreliable failure detectors with two properties:

### Completeness
- **Strong completeness**: Every faulty process is eventually suspected by all correct processes
- **Weak completeness**: Every faulty process is eventually suspected by some correct process

### Accuracy
- **Strong accuracy**: No correct process is ever suspected
- **Weak accuracy**: Some correct process is never suspected

### Classes of Failure Detectors

| Class | Completeness | Accuracy |
|-------|-------------|----------|
| Perfect (P) | Strong | Strong |
| Strong (S) | Strong | Weak |
| Weak (W) | Weak | Weak |
| Eventually Perfect | Strong | Eventually Strong |
| Eventually Weak | Weak | Eventually Weak |

## Fault Tolerance Strategies

### Redundancy

The primary strategy for fault tolerance is redundancy:

1. **Hardware redundancy**: Multiple power supplies, RAID storage, redundant NICs
2. **Software redundancy**: Multiple processes performing the same computation
3. **Data redundancy**: Replication across multiple nodes
4. **Time redundancy**: Retry operations that fail

### Replication

Replication is the most common strategy in distributed systems:

- **Primary-backup**: One primary handles writes, backups replicate
- **Multi-master**: Multiple nodes handle writes, conflict resolution needed
- **Quorum-based**: Writes/reads require acknowledgment from a quorum of replicas

### Checkpointing

Checkpointing saves the state of a computation periodically:

- **Coordinated checkpointing**: All processes take a checkpoint simultaneously
- **Uncoordinated checkpointing**: Each process checkpoints independently
- **Message logging**: Combine checkpoints with message logs for fine-grained recovery

## The Two Generals Problem

The Two Generals Problem illustrates the fundamental impossibility of achieving certainty
over an unreliable channel:

Two armies must coordinate an attack. They can only communicate via messengers that may
be captured. No matter how many acknowledgments are exchanged, neither general can be
certain the other will attack.

This maps to: no protocol can guarantee atomic commitment over an unreliable network
without the possibility of an indefinitely blocking state.

## Practice with Failure Analysis

When designing a distributed system, analyze each component:

1. What failure modes can occur?
2. How does each failure mode manifest?
3. What is the probability and impact of each failure?
4. What mitigations are in place?
5. What is the recovery procedure?

## Navigation

- [Previous Chapter](../ch03/README.md)
- [Next Chapter](../ch05/README.md)
- [See Exercises](exercises.md)
- [Back to Part 1](../ch01/README.md)
