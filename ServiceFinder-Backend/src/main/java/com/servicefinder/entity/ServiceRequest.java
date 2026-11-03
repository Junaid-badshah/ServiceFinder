package com.servicefinder.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

@Entity
@Table(name = "service_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "provider_id", nullable = true)
    private Provider provider;

    @Column(length = 1000)
    private String message;

    private LocalDate preferredDate;
    private LocalTime preferredTime;

    @Column(length = 255)
    private String location;
    @Column(length = 50)
    private String locationType;
    @Column(length = 255)
    private String locationNote;

    private Double latitude;
    private Double longitude;
    private Integer hours;
    private BigDecimal offeredPrice;
    private BigDecimal agreedPrice;
    private BigDecimal commissionAmount;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(columnDefinition = "LONGTEXT")
    private String imageData;
    private Double providerLat;
    private Double providerLng;

    private LocalDateTime expiresAt;
    private Boolean providerArrived = false;
    @Column(length = 10)
    private String otp;

    @Column(length = 50)
    private String cancelledBy; 

    @Column(length = 255)
    private String cancelReasonCategory;

    @Column(length = 1000)
    private String cancelReasonDescription;

    @Column(length = 50)
    private String cancellationStatus;

    private BigDecimal originalBookingPrice;
    
    @JsonProperty("refundAmount")
    private BigDecimal adminRefundAmount;
    
    @JsonProperty("deductionAmount")
    private BigDecimal adminDeductionAmount;

    @Column(length = 1000)
    private String adminRemarks;

    private LocalDateTime cancellationRequestedAt;

    // 👇 NAYA FIELD: Notification Read Status Track Karne Ke Liye 👇
    @Column(name = "is_read_by_customer")
    private Boolean isReadByCustomer = false;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now(ZoneId.of("Asia/Karachi"));
        if (this.status.equals("PENDING") && this.expiresAt == null) {
            this.expiresAt = this.createdAt.plusMinutes(3);
        }
    }
}
