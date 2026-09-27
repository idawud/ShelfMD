# Chapter 6: Replication Basics

Replication stores copies of data on multiple nodes.

## Reasons to Replicate

- High availability
- Fault tolerance
- Reduced latency (geographic distribution)
- Read scalability

## Single-Leader Replication

One node (the leader) accepts all writes. Followers replicate:

1. Client sends write to leader
2. Leader appends to replication log
3. Followers apply changes from the log

## Multi-Leader Replication

Multiple nodes accept writes. Conflicts must be resolved.

## Leaderless Replication

Clients write to multiple replicas directly (e.g., Dynamo-style).

## Navigation

- [Previous](../ch05/README.md) | [Next](../ch07/README.md)
