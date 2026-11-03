package com.servicefinder.controller;

import com.servicefinder.entity.RequestOffer;
import com.servicefinder.entity.ServiceRequest;
import com.servicefinder.entity.User;
import com.servicefinder.repository.UserRepository;
import com.servicefinder.service.RequestOfferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/offers")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5174"})
public class RequestOfferController {
    @Autowired private RequestOfferService offerService;
    @Autowired private UserRepository userRepository;

    private Long getUserId(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        return user.getId();
    }

    @GetMapping("/provider")
    public ResponseEntity<?> getMyOffers(Authentication auth) {
        return ResponseEntity.ok(offerService.getAllOffersForProvider(getUserId(auth)));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptOffer(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        try {
            BigDecimal agreedPrice = new BigDecimal(body.getOrDefault("agreedPrice", 1000).toString());
            ServiceRequest request = offerService.acceptOffer(id, getUserId(auth), agreedPrice);
            return ResponseEntity.ok(Map.of("message", "Offer accepted", "request", request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/counter")
    public ResponseEntity<?> counterOffer(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        try {
            BigDecimal counterPrice = new BigDecimal(body.get("counterPrice").toString());
            String message = body.getOrDefault("message", "").toString();
            offerService.counterOffer(id, getUserId(auth), counterPrice, message);
            return ResponseEntity.ok(Map.of("message", "Counter offer sent"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectOffer(@PathVariable Long id, Authentication auth) {
        try {
            offerService.rejectOffer(id, getUserId(auth));
            return ResponseEntity.ok(Map.of("message", "Offer rejected"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
