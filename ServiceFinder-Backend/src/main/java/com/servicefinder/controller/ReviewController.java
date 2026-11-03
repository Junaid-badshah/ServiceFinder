package com.servicefinder.controller;

import com.servicefinder.entity.Provider;
import com.servicefinder.entity.Review;
import com.servicefinder.entity.ServiceRequest;
import com.servicefinder.entity.User;
import com.servicefinder.repository.ProviderRepository;
import com.servicefinder.repository.ReviewRepository;
import com.servicefinder.repository.ServiceRequestRepository;
import com.servicefinder.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired private ReviewRepository reviewRepository;
    @Autowired private ServiceRequestRepository requestRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProviderRepository providerRepository;

    @PostMapping
    public ResponseEntity<?> addReview(Authentication auth, @RequestBody Map<String, Object> body) {
        String email = auth.getName();
        User customer = userRepository.findByEmail(email).orElseThrow();

        Long requestId = Long.valueOf(body.get("requestId").toString());
        Integer rating = Integer.valueOf(body.get("rating").toString());
        String comment = (String) body.get("comment");

        if (reviewRepository.existsByRequestId(requestId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Aap is request ka review pehle hi de chuke hain."));
        }

        ServiceRequest request = requestRepository.findById(requestId).orElseThrow();
        
        Review review = new Review();
        review.setRequest(request);
        review.setProvider(request.getProvider());
        review.setCustomer(customer);
        review.setRating(rating);
        review.setComment(comment);

        reviewRepository.save(review);

        // 👇 Yahan hum request ka status COMPLETED kar rahe hain 👇
        request.setStatus("COMPLETED");
        requestRepository.save(request);

        List<Review> allReviews = reviewRepository.findByProviderIdOrderByCreatedAtDesc(request.getProvider().getId());
        double avg = allReviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        
        Provider provider = request.getProvider();
        provider.setRating(Math.round(avg * 10.0) / 10.0);
        providerRepository.save(provider);

        return ResponseEntity.ok(Map.of("message", "Review submitted successfully!"));
    }

    @GetMapping("/provider/{providerId}")
    public ResponseEntity<?> getProviderReviews(@PathVariable Long providerId) {
        return ResponseEntity.ok(reviewRepository.findByProviderIdOrderByCreatedAtDesc(providerId));
    }

    @GetMapping("/customer")
    public ResponseEntity<?> getCustomerReviews(Authentication auth) {
        String email = auth.getName();
        User customer = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(reviewRepository.findByCustomerId(customer.getId()));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<?> getReviewsByCustomerId(@PathVariable Long customerId) {
        return ResponseEntity.ok(reviewRepository.findByCustomerId(customerId));
    }
}