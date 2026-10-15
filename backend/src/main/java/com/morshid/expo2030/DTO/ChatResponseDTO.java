
package com.morshid.expo2030.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ChatResponseDTO {

    private Long characterId;
    private String characterCode;
    private String characterName;
    private String userMessage;
    private String assistantMessage;
    private String provider;
}
