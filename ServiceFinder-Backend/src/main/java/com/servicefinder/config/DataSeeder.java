package com.servicefinder.config;

import com.servicefinder.entity.Role;
import com.servicefinder.entity.Service;
import com.servicefinder.entity.User;
import com.servicefinder.repository.ServiceRepository;
import com.servicefinder.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Override
    public void run(String... args) {
        seedUser("Customer Demo", "customer@test.com", "0300-1111111", "123456", Role.CUSTOMER);
        seedUser("Provider Demo", "provider@test.com", "0300-2222222", "123456", Role.PROVIDER);
        seedUser("Admin Demo", "admin@test.com", "0300-3333333", "admin123", Role.ADMIN);
        seedServices();
    }

    private void seedUser(String name, String email, String phone, String password, Role role) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPhone(phone);
            user.setPassword(password);
            user.setRole(role);
            userRepository.save(user);
            System.out.println(">>> SEEDED USER: " + email + " (" + role + ")");
        }
    }

    private void seedServices() {
        if (serviceRepository.count() == 0) {
            String[][] data = {
                {"Electrician", "⚡", "bg-yellow-500"},
                {"Plumber", "🔧", "bg-blue-500"},
                {"AC Technician", "❄️", "bg-cyan-500"},
                {"Computer Repair", "💻", "bg-purple-500"},
                {"Tutor", "📚", "bg-green-500"},
                {"Painter", "🎨", "bg-pink-500"},
                {"Carpenter", "🪚", "bg-orange-500"},
                {"Mobile Repair", "📱", "bg-indigo-500"},
                {"Cleaning Service", "🧹", "bg-teal-500"},
                {"Mover & Packer", "📦", "bg-red-500"},
                {"Beautician", "💇", "bg-rose-500"},
                {"Other", "🔨", "bg-gray-500"},
            };
            for (String[] d : data) {
                Service s = new Service();
                s.setName(d[0]);
                s.setIcon(d[1]);
                s.setColor(d[2]);
                s.setActive(true);
                serviceRepository.save(s);
            }
            System.out.println(">>> SEEDED " + data.length + " SERVICES");
        }
    }
}
