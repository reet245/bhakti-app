package com.bhakti.backend.util;

import com.bhakti.backend.exception.ExternalApiException;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class ProviderRequestBudgetTest {
    @Test
    void exhaustedBudgetStopsFurtherProviderCallsAndIsClearedForNextRequest() {
        assertThatThrownBy(() -> ProviderRequestBudget.within(0,
                () -> ProviderRequestBudget.remainingTimeout(30000))).isInstanceOf(ExternalApiException.class);
        assertThat(ProviderRequestBudget.remainingTimeout(30000)).isEqualTo(8000);
    }
}
