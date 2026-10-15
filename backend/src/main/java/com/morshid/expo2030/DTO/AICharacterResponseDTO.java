
package com.morshid.expo2030.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// DTO used to return AI character information through the API.
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AICharacterResponseDTO {

    private Long characterId;
    private String code;
    private String name;
    private String description;
    private Boolean active;
}
