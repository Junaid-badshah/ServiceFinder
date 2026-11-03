package com.servicefinder.repository;

import com.servicefinder.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceRepository extends JpaRepository<Service, Long> {
    List<Service> findByActiveTrueOrderByIdAsc();
    Optional<Service> findByName(String name);
}
