package com.servicefinder.controller;

import com.servicefinder.entity.Wallet;
import com.servicefinder.entity.WalletTransaction;
import com.servicefinder.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.servicefinder.repository.UserRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5174"})
public class WalletController {

    @Autowired private WalletService walletService;
    @Autowired private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getMyWallet(Authentication auth) {
        String email = auth.getName();
        Long userId = userRepository.findByEmail(email).orElseThrow().getId();
        return ResponseEntity.ok(walletService.getWalletByUserId(userId));
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getMyTransactions(Authentication auth) {
        String email = auth.getName();
        Long userId = userRepository.findByEmail(email).orElseThrow().getId();
        return ResponseEntity.ok(walletService.getTransactions(userId));
    }

    @PostMapping("/topup")
    public ResponseEntity<?> topUpWallet(Authentication auth, @RequestBody Map<String, Object> body) {
        String email = auth.getName();
        Long userId = userRepository.findByEmail(email).orElseThrow().getId();
        
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        if(amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Amount must be greater than 0"));
        }

        Wallet updatedWallet = walletService.addFunds(userId, amount, "EASYPAISA_MOCK");
        return ResponseEntity.ok(Map.of("message", "Wallet topped up successfully", "wallet", updatedWallet));
    }
}
