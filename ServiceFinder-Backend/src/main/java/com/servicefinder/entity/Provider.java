package com.servicefinder.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "providers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Provider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private String name;
    private String service;
    private String location;
    private String phone;
    private String email;

    @Column(length = 1000)
    private String description;

    private Integer experience;
    private Double rate;
    private Double rating = 0.0;
    private String availableDays;
    private String availableTime;

    @Column(nullable = false)
    private Double latitude = 0.0;

    @Column(nullable = false)
    private Double longitude = 0.0;

    @Column(nullable = false)
    private Double serviceRadiusKm = 10.0;

    private Boolean available = true;
    private String verificationStatus = "PENDING";

    // 👇 YEH NAYA FIELD ADD KAREIN 👇
    @Transient
    private String profilePicture;
    @jakarta.persistence.Transient
    private java.math.BigDecimal walletBalance;
}