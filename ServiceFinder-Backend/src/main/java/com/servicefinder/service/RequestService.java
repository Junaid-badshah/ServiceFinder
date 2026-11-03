package com.servicefinder.service;

import com.servicefinder.entity.ServiceRequest;
import com.servicefinder.repository.ServiceRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Service
public class RequestService {

    @Autowired private ServiceRequestRepository requestRepository;
    @Autowired private WalletService walletService;

    public List<ServiceRequest> getAll() { return requestRepository.findAll(); }
    public List<ServiceRequest> getByProviderId(Long providerId) { return requestRepository.findByProvider_Id(providerId); }
    public List<ServiceRequest> getByUserId(Long userId) { return requestRepository.findByUser_Id(userId); }
    public void delete(Long id) { requestRepository.deleteById(id); }

    // 👇 UPDATE: Added Duplicate Check & Transactional 👇
    @Transactional
    public ServiceRequest save(ServiceRequest req) { 
        if (req.getUser() != null && req.getProvider() != null) {
            List<String> activeStatuses = Arrays.asList("PENDING", "ACCEPTED", "ARRIVED", "IN_PROGRESS", "CANCELLATION_PENDING");
            List<ServiceRequest> existingActive = requestRepository.findByUser_IdAndProvider_IdAndStatusIn(
                    req.getUser().getId(), req.getProvider().getId(), activeStatuses);

            if (!existingActive.isEmpty()) {
                throw new RuntimeException("You already have an active request with this provider.");
            }
        }
        return requestRepository.save(req); 
    }

    @Scheduled(fixedRate = 60000) 
    @Transactional
    public void expirePendingRequests() {
        List<ServiceRequest> expiredRequests = requestRepository.findByStatusAndExpiresAtBefore("PENDING", LocalDateTime.now());
        for (ServiceRequest req : expiredRequests) {
            req.setStatus("EXPIRED");
            requestRepository.save(req);
            System.out.println("Request #" + req.getId() + " expired.");
        }
    }

    @Transactional
    public ServiceRequest acceptRequest(Long id) {
        ServiceRequest req = requestRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        
        if (!req.getStatus().equals("PENDING")) throw new RuntimeException("Request is no longer pending");
        if (req.getExpiresAt() != null && req.getExpiresAt().isBefore(LocalDateTime.now())) {
            req.setStatus("EXPIRED");
            requestRepository.save(req);
            throw new RuntimeException("Request has expired");
        }

        if (req.getProvider() != null) {
            BigDecimal price = req.getAgreedPrice();
            if (price == null || price.compareTo(BigDecimal.ZERO) == 0) price = req.getOfferedPrice();
            if (price == null || price.compareTo(BigDecimal.ZERO) == 0) {
                price = req.getProvider().getRate() != null ? BigDecimal.valueOf(req.getProvider().getRate()) : new BigDecimal("0");
            }
            walletService.deductCommission(req.getProvider().getUserId(), req.getId(), price);
        }

        req.setStatus("ACCEPTED");
        return requestRepository.save(req);
    }

    @Transactional
    public ServiceRequest rejectRequest(Long id) {
        ServiceRequest req = requestRepository.findById(id).orElseThrow();
        req.setStatus("REJECTED");
        return requestRepository.save(req);
    }

    @Transactional
    public ServiceRequest updateLocation(Long id, Double lat, Double lng) {
        ServiceRequest req = requestRepository.findById(id).orElseThrow();
        req.setProviderLat(lat);
        req.setProviderLng(lng);

        if (req.getLatitude() != null && req.getLongitude() != null) {
            double distance = calculateDistance(lat, lng, req.getLatitude(), req.getLongitude());
            if (distance <= 0.1 && (req.getProviderArrived() == null || !req.getProviderArrived())) {
                req.setProviderArrived(true);
                req.setStatus("ARRIVED");
                req.setOtp(String.format("%04d", new Random().nextInt(10000)));
            }
        }
        return requestRepository.save(req);
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371; 
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Transactional
    public ServiceRequest startService(Long id, String otp) {
        ServiceRequest req = requestRepository.findById(id).orElseThrow();
        if (!req.getStatus().equals("ARRIVED")) throw new RuntimeException("Provider hasn't arrived yet");
        if (req.getOtp() == null || !req.getOtp().equals(otp)) throw new RuntimeException("Invalid OTP");

        req.setStatus("IN_PROGRESS");
        return requestRepository.save(req);
    }

    @Transactional
    public ServiceRequest completeService(Long id) {
        ServiceRequest req = requestRepository.findById(id).orElseThrow();
        req.setStatus("COMPLETED");
        return requestRepository.save(req);
    }

    @Transactional
    public ServiceRequest requestCancellation(Long id, String cancelledBy, String category, String description) {
        ServiceRequest req = requestRepository.findById(id).orElseThrow();
        req.setCancelledBy(cancelledBy);
        req.setCancelReasonCategory(category);
        req.setCancelReasonDescription(description);
        req.setCancellationStatus("PENDING");
        req.setStatus("CANCELLATION_PENDING");
        req.setCancellationRequestedAt(LocalDateTime.now());
        BigDecimal price = req.getAgreedPrice() != null ? req.getAgreedPrice() : req.getOfferedPrice();
        req.setOriginalBookingPrice(price);
        return requestRepository.save(req);
    }

    @Transactional
    public ServiceRequest processCancellationDecision(Long id, String decision, BigDecimal refundAmount, BigDecimal deductionAmount, String adminRemarks) {
        ServiceRequest req = requestRepository.findById(id).orElseThrow();
        req.setCancellationStatus(decision);
        req.setAdminRemarks(adminRemarks);
        req.setAdminRefundAmount(refundAmount != null ? refundAmount : BigDecimal.ZERO);
        req.setAdminDeductionAmount(deductionAmount != null ? deductionAmount : BigDecimal.ZERO);

        if ("APPROVED".equalsIgnoreCase(decision)) {
            req.setStatus("CANCELLED");
        } else if ("REJECTED".equalsIgnoreCase(decision)) {
            req.setStatus("ACCEPTED"); 
        }
        return requestRepository.save(req);
    }

    @Transactional
    public void markNotificationsAsRead(Long userId) {
        List<ServiceRequest> reqs = requestRepository.findByUser_Id(userId);
        boolean updated = false;
        for (ServiceRequest req : reqs) {
            String st = req.getStatus().toUpperCase();
            if (st.equals("REJECTED") || st.equals("CANCELLED") || st.equals("EXPIRED")) {
                if (!Boolean.TRUE.equals(req.getIsReadByCustomer())) {
                    req.setIsReadByCustomer(true);
                    updated = true;
                }
            }
        }
        if (updated) {
            requestRepository.saveAll(reqs);
        }
    }
}
