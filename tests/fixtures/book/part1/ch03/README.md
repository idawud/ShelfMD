# Chapter 3: Time and Ordering

Time is a fundamental concept in distributed systems. Since nodes do not share a physical clock,
we need logical mechanisms to order events.

## Physical Clocks

Physical clocks use hardware oscillators to measure time. Problems:
- Clock drift
- No global synchronization
- NTP provides approximate sync (approximately 1ms on a LAN, 100ms on internet)

## Lamport Clocks

Lamport clocks provide a partial ordering of events:

```
send(message, t=clock+1)
receive(message, t=max(local_clock, message_clock)+1)
```

## Vector Clocks

Vector clocks capture causality:
- Each process maintains a vector of counters
- On event: increment own counter
- On send: attach current vector
- On receive: merge vectors (element-wise max), then increment

## Navigation

- [Previous](../ch 02/README.md)
- [Next](../ch04/README.md)
