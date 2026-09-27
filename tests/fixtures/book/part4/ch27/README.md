# Chapter 27: Amazon DynamoDB

This chapter covers **Amazon DynamoDB** in depth.

## Overview

Amazon DynamoDB is a fundamental concept in distributed systems. Understanding it is essential for
building reliable, scalable systems.

## Key Concepts

1. **Core idea**: The fundamental principle behind Amazon DynamoDB
2. **Algorithm**: Step-by-step description of how it works
3. **Properties**: What guarantees it provides
4. **Trade-offs**: What it sacrifices for those guarantees
5. **Use cases**: When to apply Amazon DynamoDB

## Algorithm Details

The algorithm operates as follows:

```
Initialize state
For each round:
  1. Leader proposes value
  2. Followers vote
  3. If majority agrees, commit
  4. Otherwise, retry with next leader
```

## Formal Properties

- **Safety**: Nothing bad ever happens
- **Liveness**: Something good eventually happens
- **Termination**: The algorithm eventually terminates

## Implementation Notes

When implementing Amazon DynamoDB, consider:

- Network partition handling
- Leader election
- Log compaction
- Membership changes

## Navigation

- [Back to Summary](../../SUMMARY.md)
- [Exercises](exercises.md)
