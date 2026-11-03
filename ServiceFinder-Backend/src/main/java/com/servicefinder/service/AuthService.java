package com.servicefinder.service;

import com.servicefinder.dto.AuthResponse;
import com.servicefinder.dto.LoginRequest;
import com.servicefinder.dto.RegisterRequest;
import com.servicefinder.entity.Provider;
import com.servicefinder.entity.Role;
import com.servicefinder.entity.User;
import com.servicefinder.repository.ProviderRepository;
import com.servicefinder.repository.UserRepository;
import com.servicefinder.security.JwtService;
import com.servicefinder.security.RolePermissions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired private UserRepository userRepository;
    @Autowired private ProviderRepository providerRepository;
    @Autowired private OtpService otpService;
    @Autowired private JwtService jwtService;
    @Autowired private PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest req) {
        String identifier = req.getEmail(); 
        
        Optional<User> userOpt = userRepository.findByEmail(identifier);
        if (userOpt.isEmpty()) userOpt = userRepository.findByPhone(identifier);

        User user = userOpt.orElseThrow(() -> new RuntimeException("Invalid email/phone or password"));

        String rawPassword = req.getPassword();
        String storedPassword = user.getPassword();
        boolean matches = false;

        if (storedPassword != null && rawPassword != null) {
            if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
                matches = passwordEncoder.matches(rawPassword, storedPassword);
            } else {
                matches = storedPassword.equals(rawPassword);
            }
        }

        if (!matches) throw new RuntimeException("Invalid email/phone or password");

        String token = jwtService.generateToken(user);
        List<String> permissions = RolePermissions.getPermissions(user.getRole()).stream().map(Enum::name).toList();

        return new AuthResponse(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getRole().name(), token, permissions);
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String phone = req.getPhone();
        if (!otpService.isVerified(phone)) throw new RuntimeException("Phone number not verified. Please verify OTP first.");

        Optional<User> existing = userRepository.findByPhone(phone);
        if (existing.isPresent()) {
            User u = existing.get();
            otpService.clearVerification(phone);
            String token = jwtService.generateToken(u);
            List<String> permissions = RolePermissions.getPermissions(u.getRole()).stream().map(Enum::name).toList();
            return new AuthResponse(u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getRole().name(), token, permissions);
        }

        String email = req.getEmail();
        if (email == null || email.trim().isEmpty()) email = phone.replaceAll("[^0-9]", "") + "@customer.local";
        if (userRepository.findByEmail(email).isPresent()) throw new RuntimeException("Email already registered");

        String password = req.getPassword();
        if (password == null || password.trim().isEmpty()) password = phone;

        User user = new User();
        user.setName(req.getName());
        user.setEmail(email);
        user.setPhone(phone);
        user.setPassword(password);
        user.setRole(Role.CUSTOMER);

        User saved = userRepository.save(user);
        otpService.clearVerification(phone);

        String token = jwtService.generateToken(saved);
        List<String> permissions = RolePermissions.getPermissions(saved.getRole()).stream().map(Enum::name).toList();

        return new AuthResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getPhone(), saved.getRole().name(), token, permissions);
    }

    @Transactional
    public AuthResponse registerProvider(Map<String, Object> payload) {
        String email = (String) payload.get("email");
        String phone = (String) payload.get("phone");

        if (userRepository.findByEmail(email).isPresent()) throw new RuntimeException("Email already registered");
        
        // 👇 FIX: Agar phone null hai (Email se register kar raha hai) to OTP check skip karo 👇
        if (phone != null && !phone.trim().isEmpty()) {
            if (!otpService.isVerified(phone)) throw new RuntimeException("Phone number not verified. Please verify OTP first.");
        }

        User user = new User();
        user.setName((String) payload.get("name"));
        user.setEmail(email);
        user.setPhone(phone != null ? phone : ""); 
        user.setPassword((String) payload.get("password"));
        user.setRole(Role.PROVIDER);
        User savedUser = userRepository.save(user);

        Provider provider = new Provider();
        provider.setName((String) payload.get("name"));
        provider.setService(payload.get("service") != null ? (String) payload.get("service") : "Not Specified");
        provider.setLocation(payload.get("location") != null ? (String) payload.get("location") : "Not Specified");
        provider.setPhone(phone != null ? phone : "");
        provider.setEmail(email);
        provider.setDescription(payload.get("description") != null ? (String) payload.get("description") : "");
        
        if (payload.get("experience") != null && !payload.get("experience").toString().isEmpty()) {
            provider.setExperience(Integer.valueOf(payload.get("experience").toString()));
        } else {
            provider.setExperience(0);
        }
        
        if (payload.get("rate") != null && !payload.get("rate").toString().isEmpty()) {
            provider.setRate(Double.valueOf(payload.get("rate").toString()));
        } else {
            provider.setRate(0.0);
        }

        provider.setAvailableDays((String) payload.get("availableDays"));
        provider.setAvailableTime((String) payload.get("availableTime"));
        provider.setRating(0.0);
        provider.setUserId(savedUser.getId());
        providerRepository.save(provider);

        if (phone != null && !phone.trim().isEmpty()) {
            otpService.clearVerification(phone);
        }

        String token = jwtService.generateToken(savedUser);
        List<String> permissions = RolePermissions.getPermissions(savedUser.getRole()).stream().map(Enum::name).toList();

        return new AuthResponse(savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getPhone(), savedUser.getRole().name(), token, permissions);
    }

    @Transactional
    public String resetPassword(String phone, String newPassword) {
        User user = userRepository.findByPhone(phone).orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(newPassword);
        userRepository.save(user);
        return "Password reset successfully";
    }

    @Transactional
    public AuthResponse googleLogin(String token) {
        throw new RuntimeException("Google Login not implemented.");
    }

    @Transactional
    public AuthResponse registerWithEmail(Map<String, String> payload) {
        String email = payload.get("email");
        if (userRepository.findByEmail(email).isPresent()) throw new RuntimeException("Email already registered");
        
        User user = new User();
        user.setName(payload.get("name"));
        user.setEmail(email);
        user.setPassword(payload.get("password"));
        user.setRole(Role.CUSTOMER);
        
        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved);
        List<String> permissions = RolePermissions.getPermissions(saved.getRole()).stream().map(Enum::name).toList();
        return new AuthResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getPhone(), saved.getRole().name(), token, permissions);
    }

    @Transactional
    public String resetPasswordWithEmail(String email, String newPassword) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(newPassword);
        userRepository.save(user);
        return "Password reset successfully";
    }
}
