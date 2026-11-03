package com.servicefinder.service;

import com.servicefinder.entity.CommissionRule;
import com.servicefinder.entity.Provider;
import com.servicefinder.entity.ServiceRequest;
import com.servicefinder.repository.CommissionRuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class CommissionService {

    @Autowired
    private CommissionRuleRepository commissionRuleRepository;

    @Autowired
    private WalletService walletService;

    public BigDecimal getCommissionPercentage(Long serviceId) {
        if (serviceId != null) {
            return commissionRuleRepository.findByServiceIdAndActiveTrue(serviceId)
                    .map(CommissionRule::getCommissionPercentage)
                    .orElseGet(this::getDefaultCommission);
        }
        return getDefaultCommission();
    }

    private BigDecimal getDefaultCommission() {
        return commissionRuleRepository.findFirstByActiveTrue()
                .map(CommissionRule::getCommissionPercentage)
                .orElse(new BigDecimal("10.00")); 
    }
    
    public BigDecimal calculateCommissionAmount(BigDecimal price, Long serviceId) {
        BigDecimal percentage = getCommissionPercentage(serviceId);
        return price.multiply(percentage).divide(new BigDecimal("100"));
    }

    // 👇 Ab yeh method boolean return karega 👇
    public boolean processCommissionDeduction(ServiceRequest request, BigDecimal agreedPrice, Provider provider) {
        try {
            if (provider != null && provider.getUserId() != null) {
                walletService.deductCommission(provider.getUserId(), request.getId(), agreedPrice);
            }
            return true; // Agar deduction kamyab ho gaya
        } catch (Exception e) {
            System.err.println("Commission Deduction Failed: " + e.getMessage());
            return false; // Agar balance kam tha ya koi masla hua
        }
    }
}
