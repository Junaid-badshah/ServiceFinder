package com.servicefinder.controller;

import com.servicefinder.entity.User;
import com.servicefinder.entity.WalletTransaction;
import com.servicefinder.repository.ProviderRepository;
import com.servicefinder.repository.ServiceRequestRepository;
import com.servicefinder.repository.UserRepository;
import com.servicefinder.repository.WalletTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5174")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProviderRepository providerRepository;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

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
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (body.get("role") != null) {
            user.setRole(com.servicefinder.entity.Role.valueOf(body.get("role")));
        }
        if (body.get("name") != null) {
            user.setName(body.get("name"));
        }

        User saved = userRepository.save(user);
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        List<com.servicefinder.entity.ServiceRequest> userReqs = serviceRequestRepository.findByUser_Id(id);
        serviceRequestRepository.deleteAll(userReqs);

        List<com.servicefinder.entity.Provider> userProviders = providerRepository.findByUserId(id);

        for (com.servicefinder.entity.Provider p : userProviders) {
            List<com.servicefinder.entity.ServiceRequest> provReqs = serviceRequestRepository.findByProvider_Id(p.getId());
            serviceRequestRepository.deleteAll(provReqs);
            providerRepository.delete(p);
        }

        userRepository.deleteById(id);

        return ResponseEntity.ok(Map.of(
                "message", "User deleted with all related data",
                "providersDeleted", userProviders.size(),
                "requestsDeleted", userReqs.size()
        ));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('REPORT_VIEW_ALL')")
    public ResponseEntity<?> getStats() {
        List<User> all = userRepository.findAll();
        long totalUsers = all.size();
        long admins = all.stream().filter(u -> u.getRole().name().equals("ADMIN")).count();
        long providers = all.stream().filter(u -> u.getRole().name().equals("PROVIDER")).count();
        long customers = all.stream().filter(u -> u.getRole().name().equals("CUSTOMER")).count();

        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "admins", admins,
                "providers", providers,
                "customers", customers
        ));
    }

    // 👇 NAYA ENDPOINT: Pure Java Filtering (No SQL Errors) 👇
    @GetMapping("/chart-data")
    @PreAuthorize("hasAuthority('REPORT_VIEW_ALL')")
    public ResponseEntity<?> getChartData(
            @RequestParam String filterType,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        try {
            List<WalletTransaction> allTxns = walletTransactionRepository.findAll();

            // Sirf commission deduction wale transactions filter karein
            List<WalletTransaction> comms = allTxns.stream()
                    .filter(t -> "COMMISSION_DEDUCTION".equalsIgnoreCase(t.getTransactionType()))
                    .collect(Collectors.toList());

            Map<String, Double> groupedData = new LinkedHashMap<>();

            if ("DAILY".equals(filterType) && startDate != null) {
                LocalDate targetDate = LocalDate.parse(startDate);
                double sum = comms.stream()
                        .filter(t -> t.getCreatedAt().toLocalDate().equals(targetDate))
                        .mapToDouble(t -> t.getAmount().abs().doubleValue())
                        .sum();
                groupedData.put(targetDate.toString(), sum);

            } else if ("MONTHLY".equals(filterType) && startDate != null) {
                LocalDate target = LocalDate.parse(startDate.substring(0, 7) + "-01");
                Map<LocalDate, Double> dailyMap = comms.stream()
                        .filter(t -> t.getCreatedAt().getYear() == target.getYear() && t.getCreatedAt().getMonth() == target.getMonth())
                        .collect(Collectors.groupingBy(t -> t.getCreatedAt().toLocalDate(), TreeMap::new, Collectors.summingDouble(t -> t.getAmount().abs().doubleValue())));
                dailyMap.forEach((k, v) -> groupedData.put(k.toString(), v));

            } else if ("YEARLY".equals(filterType) && startDate != null) {
                int targetYear = LocalDate.parse(startDate.substring(0, 4) + "-01-01").getYear();
                Map<String, Double> monthMap = comms.stream()
                        .filter(t -> t.getCreatedAt().getYear() == targetYear)
                        .collect(Collectors.groupingBy(t -> String.format("%04d-%02d", t.getCreatedAt().getYear(), t.getCreatedAt().getMonthValue()), TreeMap::new, Collectors.summingDouble(t -> t.getAmount().abs().doubleValue())));
                groupedData.putAll(monthMap);

            } else if ("CUSTOM".equals(filterType) && startDate != null && endDate != null) {
                LocalDate start = LocalDate.parse(startDate);
                LocalDate end = LocalDate.parse(endDate);
                Map<LocalDate, Double> customMap = comms.stream()
                        .filter(t -> !t.getCreatedAt().toLocalDate().isBefore(start) && !t.getCreatedAt().toLocalDate().isAfter(end))
                        .collect(Collectors.groupingBy(t -> t.getCreatedAt().toLocalDate(), TreeMap::new, Collectors.summingDouble(t -> t.getAmount().abs().doubleValue())));
                customMap.forEach((k, v) -> groupedData.put(k.toString(), v));

            } else {
                // Default: Pichle 7 din (aaj se peeche tak)
                LocalDate today = LocalDate.now();
                LocalDate weekAgo = today.minusDays(7);
                Map<LocalDate, Double> weekMap = comms.stream()
                        .filter(t -> !t.getCreatedAt().toLocalDate().isBefore(weekAgo) && !t.getCreatedAt().toLocalDate().isAfter(today))
                        .collect(Collectors.groupingBy(t -> t.getCreatedAt().toLocalDate(), TreeMap::new, Collectors.summingDouble(t -> t.getAmount().abs().doubleValue())));
                weekMap.forEach((k, v) -> groupedData.put(k.toString(), v));
            }

            List<Map<String, Object>> chartData = new ArrayList<>();
            for (Map.Entry<String, Double> entry : groupedData.entrySet()) {
                Map<String, Object> map = new HashMap<>();
                map.put("name", entry.getKey());
                map.put("revenue", entry.getValue());
                chartData.add(map);
            }

            return ResponseEntity.ok(chartData);

        } catch (Exception e) {
            System.err.println("Chart data error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
}
