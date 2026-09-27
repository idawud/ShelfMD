# Chapter 1: Introduction to Distributed Systems

Distributed systems are collections of independent computers that appear to users as a single coherent system.

## What is a Distributed System?

A distributed system consists of multiple autonomous computers that communicate via a network. The key properties are:

1. **Concurrency**: Multiple components operate simultaneously
2. **No shared clock**: Each node has its own local clock
3. **Independent failures**: Components can fail independently

## Why Distributed Systems?

- **Scalability**: Handle more load by adding nodes
- **Fault tolerance**: Survive individual component failures
- **Low latency**: Place data closer to users geographically
- **Economics**: Commodity hardware is cheaper than mainframes

## Core Challenges

The fundamental challenges in distributed systems include:

- **Network partitions**: Communication between nodes can fail
- **Clock drift**: Local clocks drift and cannot be perfectly synchronized
- **Partial failures**: Some nodes fail while others continue operating
- **Ordering**: Without a shared clock, ordering events across nodes is complex

## The CAP Theorem

The CAP theorem states that a distributed system can provide at most two of:
- **C**onsistency: Every read receives the most recent write
- **A**vailability: Every request receives a response
- **P**artition tolerance: The system continues to operate despite network partitions

See [Chapter 5](../ch05/README.md) for a deeper dive into consistency models.

## Navigation

- [Next Chapter](../ch 02/README.md#setup)
- [Missing Chapter](../missing/chapter.md)
- [Exercises](exercises.md)
- [[Glossary]]

