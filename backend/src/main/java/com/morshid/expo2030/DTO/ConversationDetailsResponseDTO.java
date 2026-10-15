
package com.morshid.expo2030.DTO;

import java.time.LocalDateTime;
import java.util.List;

public record ConversationDetailsResponseDTO(
        Long conversationId,
        Long userId,
        Long characterId,
        String characterName,
        String title,
        LocalDateTime createdAt,
        List<MessageResponseDTO> messages) {
}
