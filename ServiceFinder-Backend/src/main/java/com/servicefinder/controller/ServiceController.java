package com.servicefinder.controller;

import com.servicefinder.entity.Service;
import com.servicefinder.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = "http://localhost:5174")
public class ServiceController {

    @Autowired
    private ServiceRepository serviceRepository;

    // PUBLIC — sab dekh sakte hain
    @GetMapping
    public ResponseEntity<List<Service>> getAll() {
        return ResponseEntity.ok(serviceRepository.findByActiveTrueOrderByIdAsc());
    }

    // ADMIN — naya service banao
    @PostMapping
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<?> create(@RequestBody Service service) {
        if (serviceRepository.findByName(service.getName()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Service already exists"));
        }
        if (service.getIcon() == null) service.setIcon("🔨");
        if (service.getColor() == null) service.setColor("bg-gray-500");
        if (service.getActive() == null) service.setActive(true);
        return ResponseEntity.ok(serviceRepository.save(service));
    }

    // ADMIN — update karo
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Service updated) {
        Service s = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        if (updated.getName() != null) s.setName(updated.getName());
        if (updated.getIcon() != null) s.setIcon(updated.getIcon());
        if (updated.getColor() != null) s.setColor(updated.getColor());
        if (updated.getActive() != null) s.setActive(updated.getActive());

        return ResponseEntity.ok(serviceRepository.save(s));
    }

    // ADMIN — delete karo
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        serviceRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Service deleted"));
    }
}
