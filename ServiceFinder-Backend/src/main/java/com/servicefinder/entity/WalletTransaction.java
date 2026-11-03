package com.servicefinder.entity;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal; import java.time.LocalDateTime;
@Entity @Table(name = "wallet_transactions") @Data @NoArgsConstructor @AllArgsConstructor
public class WalletTransaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private Long walletId;
    private Long bookingId;
    @Column(nullable = false) private String transactionType;
    @Column(nullable = false) private BigDecimal amount;
    private String status = "SUCCESS"; private String referenceId;
    private LocalDateTime createdAt = LocalDateTime.now();
}
