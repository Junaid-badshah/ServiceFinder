package com.servicefinder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // 👈 Timer ke liye zaroori hai
public class ServiceFinderBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServiceFinderBackendApplication.class, args);
    }
}
