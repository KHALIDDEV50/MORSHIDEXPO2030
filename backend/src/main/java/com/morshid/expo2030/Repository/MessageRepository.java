
package com.morshid.expo2030.Repository;

import com.morshid.expo2030.Model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository
        extends JpaRepository<Message, Long> {

    List<Message> findByConversation_ConversationIdOrderByCreatedAtAsc(Long conversationId);


    void deleteByConversation_ConversationId(Long conversationId);

}
