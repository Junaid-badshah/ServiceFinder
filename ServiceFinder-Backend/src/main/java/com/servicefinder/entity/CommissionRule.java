package com.servicefinder.entity;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal;
@Entity @Table(name = "commission_rules") @Data @NoArgsConstructor @AllArgsConstructor
public class CommissionRule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private Long serviceId;
    @Column(nullable = false) private BigDecimal commissionPercentage;
    @Column(nullable = false) private Boolean active = true;
}
