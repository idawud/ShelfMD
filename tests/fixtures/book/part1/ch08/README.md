# Chapter 8: Transactions

Transactions provide ACID guarantees in distributed systems.

## ACID Properties

- **Atomicity**: All-or-nothing execution
- **Consistency**: Database invariants preserved
- **Isolation**: Concurrent transactions appear serialized
- **Durability**: Committed transactions survive failures

## Distributed Transactions

Two-Phase Commit (2PC):

1. **Prepare phase**: Coordinator asks all participants to prepare
2. **Commit phase**: If all prepared, coordinator sends commit; otherwise abort

## Navigation

- [Previous](../ch07/README.md) | [Part 2](../../part2/ch09/README.md)
