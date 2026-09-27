# Chapter 7: Partitioning

Partitioning (sharding) distributes data across multiple nodes.

## Range Partitioning

Assign ranges of keys to partitions.

## Hash Partitioning

Hash the key to determine the partition. Consistent hashing reduces rebalancing overhead.

## Hotspots

Some keys receive disproportionate traffic. Mitigation:
- Add random suffix to hot keys
- Pre-split hot partitions

## Navigation

- [Previous](../ch06/README.md) | [Next](../ch08/README.md)
