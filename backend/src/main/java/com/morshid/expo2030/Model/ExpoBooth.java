
package com.morshid.expo2030.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "expo_booths")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpoBooth {

    @Id
    @Column(name = "booth_id", length = 100, nullable = false)
    private String boothId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "zone_id", nullable = false)
    private ExpoZone zone;

    @Column(name = "booth_number", length = 20, nullable = false)
    private String boothNumber;

    @Column(name = "category", length = 80, nullable = false)
    private String category;

    // Store the localized summary as JSON.
    @Column(name = "summary_json", columnDefinition = "json", nullable = false)
    private String summaryJson;

    // Store the localized description as JSON.
    @Column(name = "description_json", columnDefinition = "json", nullable = false)
    private String descriptionJson;

    // Store booth activities as a JSON array.
    @Column(name = "activities_json", columnDefinition = "json", nullable = false)
    private String activitiesJson;

    // Suggested visitor duration in minutes.
    @Column(name = "suggested_duration_min")
    private Integer suggestedDurationMin;

    // Store the booth position as JSON.
    @Column(name = "position_json", columnDefinition = "json", nullable = false)
    private String positionJson;

    // Store booth images as a JSON array.
    @Column(name = "images_json", columnDefinition = "json", nullable = false)
    private String imagesJson;

    // Keep the complete payload for the frontend.
    @Column(name = "payload_json", columnDefinition = "json", nullable = false)
    private String payloadJson;

    @Column(name = "provenance", length = 40, nullable = false)
    private String provenance;
}
