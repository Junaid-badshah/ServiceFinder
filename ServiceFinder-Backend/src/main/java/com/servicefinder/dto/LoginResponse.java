package com.servicefinder.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String token;
    private Boolean profileCompleted;
}
