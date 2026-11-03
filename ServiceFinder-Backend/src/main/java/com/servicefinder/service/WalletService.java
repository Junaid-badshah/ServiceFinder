package com.servicefinder.service;

import com.servicefinder.entity.*;
import com.servicefinder.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class WalletService {

    @Autowired private WalletRepository walletRepository;
    @Autowired private WalletTransactionRepository transactionRepository;
    @Autowired private CommissionRuleRepository commissionRuleRepository;
    @Autowired private GlobalSettingRepository globalSettingRepository; // 👈 Inject kiya

    public Wallet getWalletByUserId(Long userId) {
        return walletRepository.findByUserId(userId).orElseGet(() -> {
            Wallet newWallet = new Wallet();
            newWallet.setUserId(userId);
            newWallet.setBalance(BigDecimal.ZERO);
            return walletRepository.save(newWallet);
        });
    }

    @Transactional
    public Wallet addFunds(Long userId, BigDecimal amount, String referenceId) {
        Wallet wallet = getWalletByUserId(userId);
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);

        WalletTransaction txn = new WalletTransaction();
        txn.setWalletId(wallet.getId());
        txn.setTransactionType("TOP_UP");
        txn.setAmount(amount);
        txn.setStatus("SUCCESS");
        txn.setReferenceId(referenceId != null ? referenceId : "MOCK_TXN_" + System.currentTimeMillis());
        txn.setCreatedAt(LocalDateTime.now());
        transactionRepository.save(txn);
        return wallet;
    }

    @Transactional
    public void deductCommission(Long providerUserId, Long requestId, BigDecimal agreedPrice) {
        // 👇 CHECK: Agar Commission OFF hai, toh yahin se return ho jao 👇
        GlobalSetting settings = globalSettingRepository.findById(1L).orElse(new GlobalSetting());
        if (!settings.isCommissionEnabled()) {
            return; // No commission deduction
        }

        Wallet wallet = getWalletByUserId(providerUserId);
        BigDecimal commissionPercentage = commissionRuleRepository.findFirstByActiveTrue()
                .map(CommissionRule::getCommissionPercentage)
                .orElse(new BigDecimal("10.00"));

        BigDecimal commissionAmount = agreedPrice.multiply(commissionPercentage).divide(new BigDecimal("100"));

        if (wallet.getBalance().compareTo(commissionAmount) < 0) {
            throw new RuntimeException("Insufficient Wallet Balance! Required: Rs. " + commissionAmount);
        }

        wallet.setBalance(wallet.getBalance().subtract(commissionAmount));
        walletRepository.save(wallet);

        WalletTransaction txn = new WalletTransaction();
        txn.setWalletId(wallet.getId());
        txn.setBookingId(requestId);
        txn.setTransactionType("COMMISSION_DEDUCTION");
        txn.setAmount(commissionAmount.negate());
        txn.setStatus("SUCCESS");
        txn.setReferenceId("REQ-" + requestId); 
        txn.setCreatedAt(LocalDateTime.now());
        transactionRepository.save(txn);
    }

    @Transactional
    public void processRefund(Long providerUserId, Long requestId) {
        Optional<WalletTransaction> deductionTxn = transactionRepository.findFirstByBookingIdAndTransactionType(requestId, "COMMISSION_DEDUCTION");
        if (deductionTxn.isPresent()) {
            BigDecimal amountToRefund = deductionTxn.get().getAmount().abs();
            Wallet wallet = getWalletByUserId(providerUserId);
            wallet.setBalance(wallet.getBalance().add(amountToRefund));
            walletRepository.save(wallet);

            WalletTransaction refundTxn = new WalletTransaction();
            refundTxn.setWalletId(wallet.getId());
            refundTxn.setBookingId(requestId);
            refundTxn.setTransactionType("REFUND");
            refundTxn.setAmount(amountToRefund);
            refundTxn.setStatus("SUCCESS");
            refundTxn.setReferenceId("REF-REQ-" + requestId);
            refundTxn.setCreatedAt(LocalDateTime.now());
            transactionRepository.save(refundTxn);
        }
    }

    public List<WalletTransaction> getTransactions(Long userId) {
        Wallet wallet = getWalletByUserId(userId);
        return transactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId());
    }

    public BigDecimal getTotalRevenue() {
        List<WalletTransaction> allTxns = transactionRepository.findAll();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        
        for (WalletTransaction txn : allTxns) {
            if ("COMMISSION_DEDUCTION".equals(txn.getTransactionType())) {
                totalRevenue = totalRevenue.add(txn.getAmount().abs());
            } else if ("REFUND".equals(txn.getTransactionType())) {
                totalRevenue = totalRevenue.subtract(txn.getAmount().abs());
            }
        }
        return totalRevenue;
    }
}
