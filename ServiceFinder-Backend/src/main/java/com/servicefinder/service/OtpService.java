package com.servicefinder.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public String generateOtp(String phone) {
        String otp = String.format("%06d", random.nextInt(1000000));
        otpStore.put(phone, new OtpData(otp, LocalDateTime.now().plusMinutes(10)));

        System.out.println("================================");
        System.out.println(">>> OTP for phone " + phone + ": " + otp);
        System.out.println(">>> Valid for 10 minutes");
        System.out.println("================================");

        return otp;
    }

    public boolean verifyOtp(String phone, String otp) {
        OtpData data = otpStore.get(phone);
        if (data == null) return false;
        if (data.expiry.isBefore(LocalDateTime.now())) {
            otpStore.remove(phone);
            return false;
        }
        if (!data.otp.equals(otp)) return false;

        // Mark as verified — DO NOT remove
        data.verified = true;
        return true;
    }

    public boolean isVerified(String phone) {
        OtpData data = otpStore.get(phone);
        return data != null && data.verified;
    }

    public void clearVerification(String phone) {
        otpStore.remove(phone);
    }

    private static class OtpData {
        String otp;
        LocalDateTime expiry;
        boolean verified = false;

        OtpData(String otp, LocalDateTime expiry) {
            this.otp = otp;
            this.expiry = expiry;
        }
    }
}
