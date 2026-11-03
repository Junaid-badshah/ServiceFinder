package com.servicefinder.controller;

import com.servicefinder.entity.Message;
import com.servicefinder.entity.ServiceRequest;
import com.servicefinder.entity.User;
import com.servicefinder.repository.MessageRepository;
import com.servicefinder.repository.ServiceRequestRepository;
import com.servicefinder.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired private MessageRepository messageRepository;
    @Autowired private ServiceRequestRepository requestRepository;
    @Autowired private UserRepository userRepository;

    @GetMapping("/history/{requestId}")
    public ResponseEntity<?> getMessages(@PathVariable Long requestId, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        
        User currentUser = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<Message> messages = messageRepository.findByRequestIdOrderByTimestampAsc(requestId);
        
        for (Message m : messages) {
            if (m.getReceiver().getId().equals(currentUser.getId()) && !m.getIsRead()) {
                m.setIsRead(true);
                messageRepository.save(m);
            }
        }

        List<Map<String, Object>> response = new ArrayList<>();
        for (Message m : messages) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("content", m.getContent());
            map.put("timestamp", m.getTimestamp());
            map.put("senderId", m.getSender().getId());
            map.put("senderName", m.getSender().getName());
            map.put("isRead", m.getIsRead());
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(Authentication auth, @RequestBody Map<String, Object> body) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        
        User sender = userRepository.findByEmail(auth.getName()).orElseThrow();
        Long requestId = Long.valueOf(body.get("requestId").toString());
        Long receiverId = Long.valueOf(body.get("receiverId").toString());
        String content = (String) body.get("content");

        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
        }

        ServiceRequest request = requestRepository.findById(requestId).orElseThrow();
        User receiver = userRepository.findById(receiverId).orElseThrow();

        Message msg = new Message();
        msg.setRequest(request);
        msg.setSender(sender);
        msg.setReceiver(receiver);
        msg.setContent(content.trim());
        msg.setIsRead(false);
        messageRepository.save(msg);

        return ResponseEntity.ok(Map.of("message", "Message sent successfully"));
    }

    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadCounts(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        
        User currentUser = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<Message> unreadMessages = messageRepository.findByReceiverIdAndIsReadFalse(currentUser.getId());

        Map<Long, Long> counts = unreadMessages.stream()
                .collect(Collectors.groupingBy(m -> m.getRequest().getId(), Collectors.counting()));
        
        return ResponseEntity.ok(counts);
    }
}
