package com.servicefinder.repository;

import com.servicefinder.entity.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    List<ServiceRequest> findByProvider_Id(Long providerId);
    List<ServiceRequest> findByUser_Id(Long userId);

    // Duplicate check ke liye
    List<ServiceRequest> findByUser_IdAndProvider_IdAndStatusIn(Long userId, Long providerId, List<String> statuses);

    // 👇 YEH METHOD MISSING THA, AB ADD KAR DIYA HAI 👇
    List<ServiceRequest> findByStatusAndExpiresAtBefore(String status, LocalDateTime expiresAt);
}
