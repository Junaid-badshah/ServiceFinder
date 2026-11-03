package com.servicefinder.controller;

import com.servicefinder.service.EmailService;
import com.servicefinder.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/otp")
@CrossOrigin(origins = "http://localhost:5174")
public class OtpController {

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    // Email OTP storage (in-memory for demo)
    private final Map<String, String> emailOtpStore = new ConcurrentHashMap<>();

    // ============================================
    // PHONE OTP
    // ============================================

    @PostMapping("/send")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> payload) {
        String phone = payload.get("phone");
        if (phone == null || phone.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phone number required"));
        }

        String otp = otpService.generateOtp(phone);

        return ResponseEntity.ok(Map.of(
                "message", "OTP sent successfully (check console for demo)",
                "demoOtp", otp
        ));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String phone = payload.get("phone");
        String otp = payload.get("otp");

        if (phone == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phone and OTP required"));
        }

        boolean valid = otpService.verifyOtp(phone, otp);

        if (valid) {
            return ResponseEntity.ok(Map.of("message", "OTP verified", "verified", true));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP"));
        }
    }

    // ============================================
    // EMAIL OTP
    // ============================================

    @PostMapping("/send-email")
    public ResponseEntity<?> sendEmailOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || !email.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid email"));
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        emailOtpStore.put(email, otp);

        try {
            emailService.sendOtpEmail(email, otp);
            System.out.println("=========================================");
            System.out.println("📧 EMAIL OTP SENT");
            System.out.println("📩 To: " + email);
            System.out.println("🔑 OTP: " + otp);
            System.out.println("=========================================");
            return ResponseEntity.ok(Map.of("message", "OTP sent to email"));
        } catch (Exception e) {
            System.err.println("❌ Email send failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to send email: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmailOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");

        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and OTP required"));
        }

        String storedOtp = emailOtpStore.get(email);
        if (storedOtp == null || !storedOtp.equals(otp)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP"));
        }

        emailOtpStore.remove(email);
        return ResponseEntity.ok(Map.of("message", "Email verified successfully", "verified", true));
    }
}