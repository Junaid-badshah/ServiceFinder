package com.servicefinder.repository;

import com.servicefinder.entity.Provider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProviderRepository extends JpaRepository<Provider, Long> {
    List<Provider> findByService(String service);
    List<Provider> findByLocation(String location);
    List<Provider> findByServiceAndLocation(String service, String location);
    List<Provider> findByUserId(Long userId);
}
