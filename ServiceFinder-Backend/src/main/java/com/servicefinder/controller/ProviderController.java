package com.servicefinder.controller;

import com.servicefinder.entity.Provider;
import com.servicefinder.entity.Wallet;
import com.servicefinder.entity.CommissionRule;
import com.servicefinder.entity.User;
import com.servicefinder.entity.Role;
import com.servicefinder.repository.ServiceRequestRepository;
import com.servicefinder.repository.WalletRepository;
import com.servicefinder.repository.CommissionRuleRepository;
import com.servicefinder.repository.UserRepository;
import com.servicefinder.service.ProviderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/providers")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class ProviderController {

    @Autowired
    private ProviderService providerService;

    @Autowired
    private com.servicefinder.service.PrivacyService privacyService;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private CommissionRuleRepository commissionRuleRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Provider>> getAll(
            Authentication auth,
            @RequestParam(required = false) String service,
            @RequestParam(required = false) String location) {

        // 👇 1. Check karein ke request bhejne wala ADMIN hai ya CUSTOMER 👇
        boolean isAdmin = false;
        if (auth != null && auth.getName() != null) {
            User currentUser = userRepository.findByEmail(auth.getName()).orElse(null);
            isAdmin = currentUser != null && currentUser.getRole() == Role.ADMIN;
        }

        List<Provider> all = providerService.getAllProviders();

        if (service != null && !service.isEmpty()) {
            all = all.stream().filter(p -> p.getService() != null &&
                    p.getService().toLowerCase().contains(service.toLowerCase())).collect(Collectors.toList());
        }
        if (location != null && !location.isEmpty()) {
            all = all.stream().filter(p -> p.getLocation() != null &&
                    p.getLocation().toLowerCase().contains(location.toLowerCase())).collect(Collectors.toList());
        }

        // Picture aur (sirf Admin ke liye) Wallet balance attach karein
        final boolean adminCheck = isAdmin;
        all.forEach(p -> {
            userRepository.findById(p.getUserId()).ifPresent(u -> {
                p.setProfilePicture(u.getProfilePicture());
            });
            
            if (adminCheck) {
                BigDecimal balance = walletRepository.findByUserId(p.getUserId())
                        .map(Wallet::getBalance)
                        .orElse(BigDecimal.ZERO);
                p.setWalletBalance(balance);
            }
        });

        // 👇 2. Agar ADMIN hai, to bina wallet filter ke SAARE providers return karein 👇
        if (isAdmin) {
            return ResponseEntity.ok(all);
        }

        // 👇 3. Agar CUSTOMER hai, to sirf ELIGIBLE providers filter karein 👇
        List<Provider> affordableProviders = all.stream().filter(p -> {
            if (p.getRate() == null || p.getRate() <= 0) {
                return false;
            }

            BigDecimal balance = walletRepository.findByUserId(p.getUserId())
                    .map(Wallet::getBalance)
                    .orElse(BigDecimal.ZERO);

            BigDecimal commissionPct = commissionRuleRepository.findFirstByActiveTrue()
                    .map(CommissionRule::getCommissionPercentage)
                    .orElse(new BigDecimal("10.00"));

            BigDecimal rate = BigDecimal.valueOf(p.getRate());
            BigDecimal requiredAmount = rate.multiply(commissionPct).divide(new BigDecimal("100"));

            return balance.compareTo(requiredAmount) >= 0;

        }).collect(Collectors.toList());

        affordableProviders.forEach(p -> privacyService.applyProviderPrivacy(p));
        return ResponseEntity.ok(affordableProviders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Provider> getById(@PathVariable Long id) {
        Provider p = providerService.getProviderById(id);

        userRepository.findById(p.getUserId()).ifPresent(u -> {
            p.setProfilePicture(u.getProfilePicture());
        });

        privacyService.applyProviderPrivacy(p);
        return ResponseEntity.ok(p);
    }

    @PostMapping
    public ResponseEntity<Provider> create(@RequestBody Provider provider) {
        return ResponseEntity.ok(providerService.createProvider(provider));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Provider> update(@PathVariable Long id, @RequestBody Provider updated) {
        return ResponseEntity.ok(providerService.updateProvider(id, updated));
    }

    @DeleteMapping("/{id}")
    @Transactional
    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        List<com.servicefinder.entity.ServiceRequest> reqs =
                serviceRequestRepository.findByProvider_Id(id);
        serviceRequestRepository.deleteAll(reqs);
        providerService.deleteProvider(id);
        return ResponseEntity.ok(Map.of(
                "message", "Provider deleted",
                "requestsDeleted", reqs.size()
        ));
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyProviders(Authentication auth) {
        String email = auth.getName();
        com.servicefinder.entity.User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Provider> myProviders = providerService.getAllProviders().stream()
                .filter(p -> p.getUserId().equals(user.getId()))
                .collect(Collectors.toList());
        
        myProviders.forEach(p -> {
            userRepository.findById(p.getUserId()).ifPresent(u -> {
                p.setProfilePicture(u.getProfilePicture());
            });
        });
        
        return ResponseEntity.ok(myProviders);
    }

}
