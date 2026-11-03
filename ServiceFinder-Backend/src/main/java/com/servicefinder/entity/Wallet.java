package com.servicefinder.entity;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal;
@Entity @Table(name = "wallets") @Data @NoArgsConstructor @AllArgsConstructor
public class Wallet {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true) private Long userId;
    @Column(nullable = false) private BigDecimal balance = BigDecimal.ZERO;
    @Column(nullable = false) private String currency = "PKR";
}
