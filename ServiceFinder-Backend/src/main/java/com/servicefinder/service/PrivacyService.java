package com.servicefinder.service;

import com.servicefinder.entity.GlobalSetting;
import com.servicefinder.entity.Provider;
import com.servicefinder.entity.User;
import com.servicefinder.repository.GlobalSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PrivacyService {

    @Autowired
    private GlobalSettingRepository settingRepo;

    public GlobalSetting getSettings() {
        return settingRepo.findById(1L).orElseGet(() -> settingRepo.save(new GlobalSetting()));
    }

    public void applyCustomerPrivacy(User customer) {
        if (customer == null) return;
        GlobalSetting s = getSettings();
        if (s.isHideCustomerPhone()) customer.setPhone("HIDDEN");
        if (s.isHideCustomerEmail()) customer.setEmail("HIDDEN");
        if (s.isHideCustomerName()) customer.setName("Hidden Customer");
        if (s.isHideCustomerPicture()) customer.setProfilePicture(null);
        // Location is usually a string in request, handled in request mapping if needed
    }

    public void applyProviderPrivacy(Provider provider) {
        if (provider == null) return;
        GlobalSetting s = getSettings();
        if (s.isHideProviderPhone()) provider.setPhone("HIDDEN");
        if (s.isHideProviderEmail()) provider.setEmail("HIDDEN");
        if (s.isHideProviderName()) provider.setName("Hidden Provider");
        if (s.isHideProviderPicture()) provider.setProfilePicture(null);
        if (s.isHideProviderLocation()) provider.setLocation("HIDDEN");
        if (s.isHideProviderExperience()) provider.setExperience(0);
        if (s.isHideProviderPrice()) provider.setRate(0.0);
    }
}
