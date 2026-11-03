package com.servicefinder.controller;

import com.servicefinder.entity.CommissionRule;
import com.servicefinder.entity.Wallet;
import com.servicefinder.entity.User;
import com.servicefinder.entity.WalletTransaction;
import com.servicefinder.entity.Role; // 👈 Role import kiya
import com.servicefinder.repository.CommissionRuleRepository;
import com.servicefinder.repository.UserRepository;
import com.servicefinder.repository.WalletRepository;
import com.servicefinder.repository.WalletTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/wallet")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5174"})
public class AdminWalletController {

    @Autowired private WalletRepository walletRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CommissionRuleRepository commissionRuleRepository;
    @Autowired private WalletTransactionRepository transactionRepository;

    @GetMapping("/all")
    public ResponseEntity<?> getAllWallets() {
        List<Wallet> wallets = walletRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Wallet w : wallets) {
            User user = userRepository.findById(w.getUserId()).orElse(null);
            
            // 👇 FIX: Sirf PROVIDER role wale wallets show honge 👇
            if (user != null && user.getRole() == Role.PROVIDER) {
                Map<String, Object> map = new HashMap<>();
                map.put("walletId", w.getId());
                map.put("userId", user.getId());
                map.put("name", user.getName());
                map.put("email", user.getEmail());
                map.put("balance", w.getBalance());
                result.add(map);
            }
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/commission")
    public ResponseEntity<?> getAllCommissions() {
        return ResponseEntity.ok(commissionRuleRepository.findAll());
    }

    @PostMapping("/commission")
    public ResponseEntity<?> updateCommission(@RequestBody Map<String, Object> body) {
        BigDecimal newPercentage = new BigDecimal(body.get("percentage").toString());
        Long serviceId = body.get("serviceId") != null ? Long.valueOf(body.get("serviceId").toString()) : null;
        
        if (serviceId != null) {
            CommissionRule rule = commissionRuleRepository.findByServiceIdAndActiveTrue(serviceId)
                .orElse(new CommissionRule());
            rule.setServiceId(serviceId);
            rule.setCommissionPercentage(newPercentage);
            rule.setActive(true);
            commissionRuleRepository.save(rule);
        } else {
            List<CommissionRule> rules = commissionRuleRepository.findAll();
            if (rules.isEmpty()) {
                CommissionRule newRule = new CommissionRule();
                newRule.setServiceId(0L);
                newRule.setCommissionPercentage(newPercentage);
                newRule.setActive(true);
                commissionRuleRepository.save(newRule);
            } else {
                CommissionRule rule = rules.get(0);
                rule.setCommissionPercentage(newPercentage);
                commissionRuleRepository.save(rule);
            }
        }
        return ResponseEntity.ok(Map.of("message", "Commission updated successfully"));
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getAllTransactions() {
        List<WalletTransaction> transactions = transactionRepository.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> result = new ArrayList<>();

        for (WalletTransaction txn : transactions) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", txn.getId());
            
            walletRepository.findById(txn.getWalletId()).ifPresent(w -> {
                userRepository.findById(w.getUserId()).ifPresent(u -> {
                    map.put("providerName", u.getName());
                });
            });
            
            map.put("type", txn.getTransactionType());
            map.put("amount", txn.getAmount());
            map.put("status", txn.getStatus());
            map.put("referenceId", txn.getReferenceId());
            map.put("createdAt", txn.getCreatedAt());
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/revenue")
    public ResponseEntity<?> getTotalRevenue() {
        List<WalletTransaction> transactions = transactionRepository.findAll();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        
        for (WalletTransaction txn : transactions) {
            if ("COMMISSION_DEDUCTION".equals(txn.getTransactionType())) {
                totalRevenue = totalRevenue.add(txn.getAmount().abs());
            } else if ("REFUND".equals(txn.getTransactionType())) {
                totalRevenue = totalRevenue.subtract(txn.getAmount().abs());
            }
        }
        return ResponseEntity.ok(Map.of("totalRevenue", totalRevenue));
    }
}
