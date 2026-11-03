package com.servicefinder.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "request_offers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequestOffer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "request_id", nullable = false)
    private ServiceRequest request;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "provider_id", nullable = false)
    private Provider provider;

    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED, COUNTER_OFFERED

    private BigDecimal counterPrice; 
    private String providerMessage;

    private LocalDateTime sentAt = LocalDateTime.now();
    private LocalDateTime respondedAt;
}
