package com.servicefinder.controller;

import com.servicefinder.entity.GlobalSetting;
import com.servicefinder.repository.GlobalSettingRepository;
import com.servicefinder.service.PrivacyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/settings")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5174"})
public class AdminSettingsController {

    @Autowired private PrivacyService privacyService;
    @Autowired private GlobalSettingRepository settingRepo;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GlobalSetting> getSettings() {
        return ResponseEntity.ok(privacyService.getSettings());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GlobalSetting> updateSettings(@RequestBody GlobalSetting newSettings) {
        newSettings.setId(1L);
        return ResponseEntity.ok(settingRepo.save(newSettings));
    }
}
