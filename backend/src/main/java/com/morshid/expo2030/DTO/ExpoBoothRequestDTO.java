
package com.morshid.expo2030.DTO;

import tools.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for creating and updating Expo booths.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpoBoothRequestDTO {

    @NotBlank
    private String boothId;

    @NotBlank
    private String zoneId;

    @NotBlank
    private String boothNumber;

    @NotBlank
    private String category;

    @NotNull
    private JsonNode payloadJson;

    @NotBlank
    private String provenance;
}
