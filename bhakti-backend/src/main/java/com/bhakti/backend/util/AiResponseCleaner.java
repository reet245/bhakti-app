package com.bhakti.backend.util;

public final class AiResponseCleaner {

    private AiResponseCleaner() {
    }

    public static String removeThinkingTags(String text) {
        if (text == null) {
            return "";
        }

        return text.replaceAll("(?is)<think>.*?</think>", "").trim();
    }
}
