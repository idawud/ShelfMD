# Chapter 5: Consistency Models

Consistency models define the guarantees provided by a distributed storage system.

## Strong Consistency

### Linearizability

Linearizability is the strongest consistency model:
- Every operation appears to take effect instantaneously at some point between its invocation and completion
- All operations see the effects of preceding operations

### Sequential Consistency

Sequential consistency requires:
- Operations of each process appear in order
- All processes see the same interleaving of operations

## Weak Consistency

### Eventual Consistency

Eventual consistency guarantees that, if no new updates are made, all replicas will eventually converge.

### Causal Consistency

Causal consistency ensures that causally related operations are seen in order by all processes.

## Navigation

- [Previous](../ch04/README.md) | [Next](../ch06/README.md)
