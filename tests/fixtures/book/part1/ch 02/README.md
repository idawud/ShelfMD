# Chapter 2: Network Fundamentals

Understanding network fundamentals is essential for distributed systems design.

## Network Models

Distributed systems operate under different network models:

### Synchronous Model
- Messages are delivered within a bounded time
- Clocks are synchronized within a known bound
- Simplest model to reason about

### Asynchronous Model
- No bounds on message delivery time
- No clock synchronization assumption
- Most realistic for internet-scale systems

## Setup

This section covers the basic setup for network communication.

To set up a basic distributed system environment:

1. Install required dependencies
2. Configure network interfaces
3. Set up service discovery
4. Implement health checking

## TCP vs UDP

| Feature | TCP | UDP |
|---------|-----|-----|
| Reliability | Yes | No |
| Ordering | Yes | No |
| Flow control | Yes | No |
| Overhead | Higher | Lower |

## Navigation

- [Previous Chapter](../ch01/README.md)
- [Next Chapter](../ch03/README.md)
- [Exercises](exercises.md)
