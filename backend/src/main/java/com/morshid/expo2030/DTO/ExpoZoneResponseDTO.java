
package com.morshid.expo2030.DTO;

import tools.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Response DTO for Expo zones.
 * Returns zone data without exposing the JPA entity directly.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpoZoneResponseDTO {

    private String zoneId;

    private Integer zoneNumber;

    private String kind;

    private JsonNode nameJson;

    private JsonNode summaryJson;

    private String color;

    private JsonNode polygonJson;

    private JsonNode labelAtJson;

    private JsonNode imageJson;

    private String provenance;
}
