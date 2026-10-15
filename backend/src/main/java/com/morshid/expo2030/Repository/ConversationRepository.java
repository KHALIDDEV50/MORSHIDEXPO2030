
package com.morshid.expo2030.Repository;

import com.morshid.expo2030.Model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConversationRepository
        extends JpaRepository<Conversation, Long> {

    List<Conversation> findByUser_UserIdOrderByCreatedAtDesc(
            Long userId
    );
}
