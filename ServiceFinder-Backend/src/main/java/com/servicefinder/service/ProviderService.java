package com.servicefinder.service;

import com.servicefinder.entity.Provider;
import com.servicefinder.repository.ProviderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProviderService {

    @Autowired
    private ProviderRepository providerRepository;

    // ============================================
    // CACHED READS
    // ============================================

    @Cacheable(value = "providers", key = "'all'")
    public List<Provider> getAllProviders() {
        return providerRepository.findAll();
    }

    @Cacheable(value = "providers", key = "'id-' + #id")
    public Provider getProviderById(Long id) {
        return providerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Provider not found with id: " + id));
    }

    @Cacheable(value = "providers", key = "'search-' + #service + '-' + #location")
    public List<Provider> searchProviders(String service, String location) {
        if (service != null && location != null) {
            return providerRepository.findByServiceAndLocation(service, location);
        } else if (service != null) {
            return providerRepository.findByService(service);
        } else if (location != null) {
            return providerRepository.findByLocation(location);
        }
        return providerRepository.findAll();
    }

    // ============================================
    // WRITES — Cache Clear
    // ============================================

    @CacheEvict(value = "providers", allEntries = true)
    public Provider createProvider(Provider provider) {
        return providerRepository.save(provider);
    }

    @CacheEvict(value = "providers", allEntries = true)
    public Provider updateProvider(Long id, Provider updated) {
        Provider p = providerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        p.setName(updated.getName());
        p.setService(updated.getService());
        p.setLocation(updated.getLocation());
        p.setExperience(updated.getExperience());
        p.setRate(updated.getRate());
        p.setPhone(updated.getPhone());
        p.setDescription(updated.getDescription());
        p.setAvailableDays(updated.getAvailableDays());
        p.setAvailableTime(updated.getAvailableTime());
        return providerRepository.save(p);
    }

    @CacheEvict(value = "providers", allEntries = true)
    public void deleteProvider(Long id) {
        providerRepository.deleteById(id);
    }
}