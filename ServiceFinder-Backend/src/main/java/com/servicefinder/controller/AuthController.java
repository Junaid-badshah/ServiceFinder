package com.servicefinder.controller;

import com.servicefinder.dto.LoginRequest;
import com.servicefinder.dto.RegisterRequest;
import com.servicefinder.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5174")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            return ResponseEntity.ok(authService.login(req));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        try {
            return ResponseEntity.ok(authService.register(req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register-provider")
    public ResponseEntity<?> registerProvider(@RequestBody Map<String, Object> payload) {
        try {
            return ResponseEntity.ok(authService.registerProvider(payload));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        try {
            String phone = payload.get("phone");
            String newPassword = payload.get("newPassword");
            return ResponseEntity.ok(authService.resetPassword(phone, newPassword));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        if (token == null || token.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token required"));
        }
        try {
            return ResponseEntity.ok(authService.googleLogin(token));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register-email")
    public ResponseEntity<?> registerWithEmail(@RequestBody Map<String, String> payload) {
        try {
            return ResponseEntity.ok(authService.registerWithEmail(payload));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password-email")
    public ResponseEntity<?> resetPasswordWithEmail(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            String newPassword = payload.get("newPassword");
            return ResponseEntity.ok(authService.resetPasswordWithEmail(email, newPassword));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}