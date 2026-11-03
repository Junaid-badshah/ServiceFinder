package com.servicefinder.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("ServiceFinder - Your OTP Code");
        message.setText(
            "Assalam-o-Alaikum!\n\n" +
            "Aapka OTP code yeh hai: " + otp + "\n\n" +
            "Yeh code 5 minute ke liye valid hai.\n" +
            "Kisi ke saath share na karein.\n\n" +
            "Shukriya,\n" +
            "ServiceFinder Team"
        );
        mailSender.send(message);
    }
}
