
package com.morshid.expo2030.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ConversationResponseDTO {

    private Long conversationId;
    private Long userId;
    private Long characterId;
    private String characterName;
    private String title;
    private LocalDateTime createdAt;
}
