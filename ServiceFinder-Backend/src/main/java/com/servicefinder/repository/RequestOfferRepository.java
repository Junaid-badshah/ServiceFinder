package com.servicefinder.repository;

import com.servicefinder.entity.RequestOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RequestOfferRepository extends JpaRepository<RequestOffer, Long> {
    List<RequestOffer> findByProvider_Id(Long providerId);
    List<RequestOffer> findByProvider_IdIn(List<Long> providerIds);
    List<RequestOffer> findByProvider_IdAndStatus(Long providerId, String status);
    List<RequestOffer> findByRequest_Id(Long requestId);
}
