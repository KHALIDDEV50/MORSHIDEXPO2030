
package com.morshid.expo2030.DTO;

import tools.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for creating and updating Expo zones.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpoZoneRequestDTO {

    @NotBlank
    private String zoneId;

    @NotNull
    private Integer zoneNumber;

    @NotBlank
    private String kind;

    @NotNull
    private JsonNode nameJson;

    @NotNull
    private JsonNode summaryJson;

    private String color;

    @NotNull
    private JsonNode polygonJson;

    private JsonNode labelAtJson;

    private JsonNode imageJson;

    @NotBlank
    private String provenance;
}
