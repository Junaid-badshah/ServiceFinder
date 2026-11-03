package com.servicefinder.repository;

import com.servicefinder.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProviderIdOrderByCreatedAtDesc(Long providerId);
    List<Review> findByCustomerId(Long customerId);
    boolean existsByRequestId(Long requestId);
}
