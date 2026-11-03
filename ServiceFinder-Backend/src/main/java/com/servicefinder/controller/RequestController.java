package com.servicefinder.controller;

import com.servicefinder.entity.ServiceRequest;
import com.servicefinder.service.RequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "http://localhost:5173")
public class RequestController {

    @Autowired private RequestService requestService;
    @Autowired private com.servicefinder.service.PrivacyService privacyService;
    @Autowired private com.servicefinder.repository.ServiceRequestRepository requestRepository;

    @GetMapping
    public ResponseEntity<List<ServiceRequest>> getAll() {
        return ResponseEntity.ok(requestService.getAll());
    }

    @GetMapping("/provider/{providerId}")
    public ResponseEntity<List<ServiceRequest>> getByProvider(@PathVariable Long providerId) {
        List<ServiceRequest> reqs = requestService.getByProviderId(providerId);
        reqs.forEach(r -> privacyService.applyCustomerPrivacy(r.getUser()));
        return ResponseEntity.ok(reqs);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ServiceRequest>> getByUser(@PathVariable Long userId) {
        List<ServiceRequest> reqs = requestService.getByUserId(userId);
        reqs.forEach(r -> privacyService.applyProviderPrivacy(r.getProvider()));
        return ResponseEntity.ok(reqs);
    }

    // 👇 UPDATE: Catch exception and return 409 Conflict 👇
    @PostMapping
    public ResponseEntity<?> create(@RequestBody ServiceRequest req) {
        try {
            return ResponseEntity.ok(requestService.save(req));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<?> accept(@PathVariable Long id) {
        try { return ResponseEntity.ok(requestService.acceptRequest(id)); } 
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id) {
        return ResponseEntity.ok(requestService.rejectRequest(id));
    }

    @PutMapping("/{id}/location")
    public ResponseEntity<?> updateLocation(@PathVariable Long id, @RequestBody Map<String, Double> body) {
        return ResponseEntity.ok(requestService.updateLocation(id, body.get("lat"), body.get("lng")));
    }

    @PutMapping("/{id}/start-service")
    public ResponseEntity<?> startService(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try { return ResponseEntity.ok(requestService.startService(id, body.get("otp"))); } 
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeService(@PathVariable Long id) {
        try {
            requestService.completeService(id);
            ServiceRequest req = requestRepository.findById(id).orElseThrow();
            req.setStatus("AWAITING_REVIEW");
            requestRepository.save(req);
            return ResponseEntity.ok(Map.of("message", "Awaiting customer review"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/request-cancel")
    public ResponseEntity<?> requestCancel(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(requestService.requestCancellation(id, body.get("cancelledBy"), body.get("category"), body.get("description")));
    }

    @PutMapping("/{id}/admin-cancel-decision")
    public ResponseEntity<?> adminCancelDecision(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        BigDecimal refundAmount = body.get("refundAmount") != null ? new BigDecimal(body.get("refundAmount").toString()) : BigDecimal.ZERO;
        BigDecimal deductionAmount = body.get("deductionAmount") != null ? new BigDecimal(body.get("deductionAmount").toString()) : BigDecimal.ZERO;
        return ResponseEntity.ok(requestService.processCancellationDecision(id, (String) body.get("decision"), refundAmount, deductionAmount, (String) body.get("adminRemarks")));
    }

    @PutMapping("/user/{userId}/mark-read")
    public ResponseEntity<?> markRead(@PathVariable Long userId) {
        requestService.markNotificationsAsRead(userId);
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        requestService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
