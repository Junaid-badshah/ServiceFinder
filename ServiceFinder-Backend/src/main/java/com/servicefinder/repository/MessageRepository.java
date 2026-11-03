package com.servicefinder.repository;

import com.servicefinder.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByRequestIdOrderByTimestampAsc(Long requestId);
    List<Message> findByReceiverIdAndIsReadFalse(Long receiverId);
}
