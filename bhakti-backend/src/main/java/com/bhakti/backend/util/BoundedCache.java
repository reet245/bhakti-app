package com.bhakti.backend.util;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Supplier;

/** Bounded cache; network work never blocks unrelated keys and failed loads are never cached. */
public final class BoundedCache<K, V> {
    private final Map<K, Entry<V>> entries = new LinkedHashMap<>();
    private final int capacity;
    private final long ttlMs;

    public BoundedCache(int capacity, long ttlMs) {
        this.capacity = capacity;
        this.ttlMs = ttlMs;
    }

    public V get(K key, Supplier<V> loader) {
        synchronized (entries) {
            long now = System.currentTimeMillis();
            entries.entrySet().removeIf(entry -> now >= entry.getValue().expiresAt());
            Entry<V> cached = entries.get(key);
            if (cached != null) return cached.value();
        }
        V value = loader.get();
        synchronized (entries) {
            if (entries.size() >= capacity) entries.remove(entries.keySet().iterator().next());
            entries.put(key, new Entry<>(value, System.currentTimeMillis() + ttlMs));
        }
        return value;
    }

    private record Entry<V>(V value, long expiresAt) {}
}
