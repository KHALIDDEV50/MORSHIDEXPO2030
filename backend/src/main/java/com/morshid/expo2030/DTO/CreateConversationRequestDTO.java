
package com.morshid.expo2030.DTO;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateConversationRequestDTO {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Character ID is required")
    private Long characterId;

    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;
}
