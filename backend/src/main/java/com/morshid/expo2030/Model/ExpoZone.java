package com.morshid.expo2030.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "expo_zones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpoZone {

    @Id
    @Column(name = "zone_id", length = 100, nullable = false)
    private String zoneId;

    @Column(name = "zone_number", nullable = false)
    private Integer zoneNumber;

    @Column(name = "kind", length = 40, nullable = false)
    private String kind;

    @Column(name = "name_json", columnDefinition = "json", nullable = false)
    private String nameJson;

    @Column(name = "summary_json", columnDefinition = "json", nullable = false)
    private String summaryJson;

    @Column(name = "color", length = 40)
    private String color;

    @Column(name = "polygon_json", columnDefinition = "json", nullable = false)
    private String polygonJson;

    @Column(name = "label_at_json", columnDefinition = "json")
    private String labelAtJson;

    @Column(name = "image_json", columnDefinition = "json")
    private String imageJson;

    @Column(name = "provenance", length = 40, nullable = false)
    private String provenance;
}