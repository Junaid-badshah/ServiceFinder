package com.servicefinder.controller;

import com.servicefinder.entity.Provider;
import com.servicefinder.entity.User;
import com.servicefinder.entity.Wallet;
import com.servicefinder.entity.CommissionRule;
import com.servicefinder.repository.ProviderRepository;
import com.servicefinder.repository.UserRepository;
import com.servicefinder.repository.WalletRepository;
import com.servicefinder.repository.CommissionRuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*")
public class ProfileController {

    private final java.util.Map<String, String> otpStore = new java.util.concurrent.ConcurrentHashMap<>();

    @Autowired private UserRepository userRepository;
    @Autowired private ProviderRepository providerRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private WalletRepository walletRepository;
    @Autowired private CommissionRuleRepository commissionRuleRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("name", user.getName());
        result.put("email", user.getEmail());
        result.put("phone", user.getPhone());
        result.put("role", user.getRole().name());
        result.put("profilePicture", user.getProfilePicture());

        if (user.getRole().name().equals("PROVIDER")) {
            Optional<Provider> providerOpt = providerRepository.findByUserId(user.getId()).stream().findFirst();
            if (providerOpt.isPresent()) {
                Provider p = providerOpt.get();
                Map<String, Object> providerData = new HashMap<>();
                providerData.put("id", p.getId());
                providerData.put("service", p.getService());
                providerData.put("location", p.getLocation());
                providerData.put("experience", p.getExperience());
                providerData.put("rate", p.getRate());
                providerData.put("description", p.getDescription());
                providerData.put("availableDays", p.getAvailableDays());
                providerData.put("availableTime", p.getAvailableTime());
                providerData.put("rating", p.getRating());

                // 👇 EXACT COMMISSION CALCULATION (No Hardcoded Numbers) 👇
                BigDecimal balance = walletRepository.findByUserId(user.getId()).map(Wallet::getBalance).orElse(BigDecimal.ZERO);
                
                BigDecimal commissionPct = commissionRuleRepository.findFirstByActiveTrue()
                        .map(CommissionRule::getCommissionPercentage)
                        .orElse(new BigDecimal("10.00"));

                double providerRate = (p.getRate() != null && p.getRate() > 0) ? p.getRate() : 1000.0;
                BigDecimal rate = BigDecimal.valueOf(providerRate);
                
                // Exact commission = Rate * Percentage / 100
                BigDecimal requiredCommission = rate.multiply(commissionPct).divide(new BigDecimal("100"));

                boolean isHidden = balance.compareTo(requiredCommission) < 0;
                
                providerData.put("isHidden", isHidden);
                providerData.put("requiredCommission", requiredCommission);

                result.put("providerProfile", providerData);
            }
        }
        return ResponseEntity.ok(result);
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(Authentication auth, @RequestBody Map<String, String> body) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (body.get("name") != null) user.setName(body.get("name"));
        if (body.get("phone") != null) user.setPhone(body.get("phone"));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Profile updated"));
    }

    @PutMapping("/picture")
    public ResponseEntity<?> updatePicture(Authentication auth, @RequestBody Map<String, String> body) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        String picture = body.get("profilePicture");
        if (picture == null) return ResponseEntity.badRequest().body(Map.of("error", "No picture provided"));
        user.setProfilePicture(picture);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Picture updated", "profilePicture", picture));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(Authentication auth, @RequestBody Map<String, String> body) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        if (currentPassword == null || newPassword == null) return ResponseEntity.badRequest().body(Map.of("error", "Current and new password required"));
        if (newPassword.length() < 6) return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 6 characters"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> body) {
        String newPhone = body.get("newPhone");
        if (newPhone == null || newPhone.length() < 10) return ResponseEntity.badRequest().body(Map.of("error", "Invalid phone number"));
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        otpStore.put(newPhone, otp);
        System.out.println("=========================================");
        System.out.println("📱 MOCK SMS TO: " + newPhone);
        System.out.println("🔑 YOUR OTP IS: " + otp);
        System.out.println("=========================================");
        return ResponseEntity.ok(Map.of("message", "OTP sent successfully (Check backend terminal)"));
    }

    @PutMapping("/verify-otp-and-update")
    public ResponseEntity<?> verifyOtpAndUpdate(Authentication auth, @RequestBody Map<String, String> body) {
        String email = auth.getName();
        String newPhone = body.get("newPhone");
        String otp = body.get("otp");
        if (newPhone == null || otp == null) return ResponseEntity.badRequest().body(Map.of("error", "Phone and OTP required"));
        String storedOtp = otpStore.get(newPhone);
        if (storedOtp == null || !storedOtp.equals(otp)) return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP"));
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        user.setPhone(newPhone);
        userRepository.save(user);
        otpStore.remove(newPhone);
        return ResponseEntity.ok(Map.of("message", "Phone number updated successfully!"));
    }
}
