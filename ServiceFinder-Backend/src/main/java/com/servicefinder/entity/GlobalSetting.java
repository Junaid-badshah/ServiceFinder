package com.servicefinder.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "global_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GlobalSetting {
    @Id
    private Long id = 1L; // Singleton row

    // 👇 NAYA: Master Commission Toggle 👇
    private boolean commissionEnabled = true;

    // Customer Settings
    private boolean hideCustomerPhone = false;
    private boolean hideCustomerEmail = false;
    private boolean hideCustomerName = false;
    private boolean hideCustomerPicture = false;
    private boolean hideCustomerLocation = false;

    // Provider Settings
    private boolean hideProviderPhone = false;
    private boolean hideProviderEmail = false;
    private boolean hideProviderName = false;
    private boolean hideProviderPicture = false;
    private boolean hideProviderLocation = false;
    private boolean hideProviderExperience = false;
    private boolean hideProviderWorkPictures = false;
    private boolean hideProviderPrice = false;
}
