
package com.morshid.expo2030.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class MessageResponseDTO {

    private Long messageId;
    private Long conversationId;
    private String role;
    private String content;
    private LocalDateTime createdAt;
}
