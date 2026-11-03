package com.servicefinder.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "services")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String icon = "🔨";

    @Column(nullable = false)
    private String color = "bg-gray-500";

    @Column(nullable = false)
    private Boolean active = true;
}
