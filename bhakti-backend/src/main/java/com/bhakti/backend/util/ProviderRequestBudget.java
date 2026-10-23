package com.bhakti.backend.util;

import com.bhakti.backend.exception.ExternalApiException;
import java.util.function.Supplier;

/** Budget shared by sequential provider calls within one calculation. Never stores personal data. */
public final class ProviderRequestBudget {
    private static final ThreadLocal<Long> DEADLINE = new ThreadLocal<>();
    private ProviderRequestBudget() {}

    public static <T> T within(long timeoutMs, Supplier<T> calculation) {
        Long previous = DEADLINE.get();
        DEADLINE.set(System.nanoTime() + timeoutMs * 1_000_000L);
        try {
            return calculation.get();
        } finally {
            if (previous == null) DEADLINE.remove(); else DEADLINE.set(previous);
        }
    }

    public static int remainingTimeout(int configuredMs) {
        int configured = Math.min(8000, Math.max(100, configuredMs));
        Long deadline = DEADLINE.get();
        if (deadline == null) return configured;
        long remaining = (deadline - System.nanoTime()) / 1_000_000L;
        if (remaining <= 100) throw new ExternalApiException("Calculation timed out. Please try again later.");
        return (int) Math.min(configured, remaining);
    }
}
