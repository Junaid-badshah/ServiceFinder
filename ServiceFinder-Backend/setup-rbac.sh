#!/bin/bash
BASE=src/main/java/com/servicefinder
mkdir -p $BASE/security

cat > $BASE/security/Permission.java << 'JAVA_EOF'
package com.servicefinder.security;

public enum Permission {
    REQUEST_CREATE,
    REQUEST_READ_OWN,
    REQUEST_READ_ALL,
    REQUEST_ACCEPT,
    REQUEST_REJECT,
    REQUEST_ASSIGN,
    USER_MANAGE,
    REPORT_VIEW_ALL
}
JAVA_EOF

cat > $BASE/security/RolePermissions.java << 'JAVA_EOF'
package com.servicefinder.security;

import com.servicefinder.entity.Role;
import java.util.List;
import java.util.Map;

public class RolePermissions {
    public static final Map<Role, List<Permission>> MAP = Map.of(
            Role.ADMIN, List.of(Permission.values()),
            Role.PROVIDER, List.of(Permission.REQUEST_READ_OWN, Permission.REQUEST_ACCEPT, Permission.REQUEST_REJECT),
            Role.CUSTOMER, List.of(Permission.REQUEST_CREATE, Permission.REQUEST_READ_OWN)
    );
    public static List<Permission> getPermissions(Role role) {
        return MAP.getOrDefault(role, List.of());
    }
}
JAVA_EOF

cat > $BASE/security/JwtService.java << 'JAVA_EOF'
package com.servicefinder.security;

import com.servicefinder.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String secret;
    @Value("${jwt.expiration:86400000}")
    private long expiration;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(User user) {
        List<String> permissions = RolePermissions.getPermissions(user.getRole())
                .stream().map(Enum::name).collect(Collectors.toList());
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .claim("permissions", permissions)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getKey())
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser().verifyWith(getKey()).build().parseSignedClaims(token).getPayload();
    }

    public boolean isValid(String token) {
        try { extractClaims(token); return true; } catch (Exception e) { return false; }
    }
}
JAVA_EOF

cat > $BASE/security/JwtAuthFilter.java << 'JAVA_EOF'
package com.servicefinder.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    @Autowired
    private JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtService.isValid(token)) {
                Claims claims = jwtService.extractClaims(token);
                String email = claims.getSubject();
                String role = claims.get("role", String.class);
                List<String> permissions = claims.get("permissions", List.class);
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                if (permissions != null) {
                    authorities.addAll(permissions.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList()));
                }
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(email, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        filterChain.doFilter(request, response);
    }
}
JAVA_EOF

cat > $BASE/config/SecurityConfig.java << 'JAVA_EOF'
package com.servicefinder.config;

import com.servicefinder.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/otp/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/providers/**").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/provider/**").hasAnyRole("PROVIDER", "ADMIN")
                        .requestMatchers("/api/customer/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
JAVA_EOF

cat > $BASE/controller/AdminController.java << 'JAVA_EOF'
package com.servicefinder.controller;

import com.servicefinder.entity.User;
import com.servicefinder.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/users/{id}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        if (body.get("role") != null) user.setRole(com.servicefinder.entity.Role.valueOf(body.get("role")));
        if (body.get("name") != null) user.setName(body.get("name"));
        User saved = userRepository.save(user);
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('REPORT_VIEW_ALL')")
    public ResponseEntity<?> getStats() {
        List<User> all = userRepository.findAll();
        long admins = all.stream().filter(u -> u.getRole().name().equals("ADMIN")).count();
        long providers = all.stream().filter(u -> u.getRole().name().equals("PROVIDER")).count();
        long customers = all.stream().filter(u -> u.getRole().name().equals("CUSTOMER")).count();
        return ResponseEntity.ok(Map.of("totalUsers", all.size(), "admins", admins, "providers", providers, "customers", customers));
    }
}
JAVA_EOF

cat > $BASE/dto/AuthResponse.java << 'JAVA_EOF'
package com.servicefinder.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String token;
    private List<String> permissions;

    public AuthResponse(Long id, String name, String email, String phone, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.role = role;
    }
}
JAVA_EOF

cat > $BASE/service/AuthService.java << 'JAVA_EOF'
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

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));
        if (user.getPassword() == null || !user.getPassword().equals(req.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
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
        user.setName(req.getName()); user.setEmail(email); user.setPhone(phone);
        user.setPassword(password); user.setRole(Role.CUSTOMER);
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
        if (!otpService.isVerified(phone)) throw new RuntimeException("Phone number not verified. Please verify OTP first.");
        User user = new User();
        user.setName((String) payload.get("name")); user.setEmail(email); user.setPhone(phone);
        user.setPassword((String) payload.get("password")); user.setRole(Role.PROVIDER);
        User savedUser = userRepository.save(user);
        Provider provider = new Provider();
        provider.setName((String) payload.get("name"));
        provider.setService((String) payload.get("service"));
        provider.setLocation((String) payload.get("location"));
        provider.setPhone(phone); provider.setEmail(email);
        provider.setDescription((String) payload.get("description"));
        if (payload.get("experience") != null) provider.setExperience(Integer.valueOf(payload.get("experience").toString()));
        if (payload.get("rate") != null) provider.setRate(Double.valueOf(payload.get("rate").toString()));
        provider.setAvailableDays((String) payload.get("availableDays"));
        provider.setAvailableTime((String) payload.get("availableTime"));
        provider.setRating(0.0); provider.setUserId(savedUser.getId());
        providerRepository.save(provider);
        otpService.clearVerification(phone);
        String token = jwtService.generateToken(savedUser);
        List<String> permissions = RolePermissions.getPermissions(savedUser.getRole()).stream().map(Enum::name).toList();
        return new AuthResponse(savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getPhone(), savedUser.getRole().name(), token, permissions);
    }
}
JAVA_EOF

chmod +x setup-rbac.sh
echo ""
echo "=== Script ban gayi ==="
ls -la setup-rbac.sh
