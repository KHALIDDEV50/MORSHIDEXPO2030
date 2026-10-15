
package com.morshid.expo2030.DTO;

import tools.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for creating and updating the Expo layout.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpoLayoutRequestDTO {

    @NotBlank
    private String layoutId;

    @NotNull
    private JsonNode layoutJson;

    @NotBlank
    private String provenance;
}
