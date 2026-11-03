package com.servicefinder.repository;
import com.servicefinder.entity.CommissionRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CommissionRuleRepository extends JpaRepository<CommissionRule, Long> {
    Optional<CommissionRule> findFirstByActiveTrue();
    Optional<CommissionRule> findByServiceIdAndActiveTrue(Long serviceId);
}
