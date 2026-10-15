
package com.morshid.expo2030.DTO;

import tools.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Response DTO for Expo facilities.
 * Returns the zone ID instead of exposing the JPA relationship.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpoFacilityResponseDTO {

    private String facilityId;

    private String facilityNumber;

    private String zoneId;

    private String kind;

    private JsonNode nameJson;

    private JsonNode positionJson;
}
