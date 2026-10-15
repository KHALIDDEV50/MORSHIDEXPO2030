
package com.morshid.expo2030.DTO;

import tools.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for creating and updating Expo facilities.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpoFacilityRequestDTO {

    @NotBlank
    private String facilityId;

    @NotBlank
    private String facilityNumber;

    @NotBlank
    private String zoneId;

    @NotBlank
    private String kind;

    @NotNull
    private JsonNode nameJson;

    @NotNull
    private JsonNode positionJson;
}
