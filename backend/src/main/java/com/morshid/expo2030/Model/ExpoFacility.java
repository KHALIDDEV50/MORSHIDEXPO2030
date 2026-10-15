package com.morshid.expo2030.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "expo_facilities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpoFacility {

    @Id
    @Column(name = "facility_id", length = 100, nullable = false)
    private String facilityId;

    @Column(name = "facility_number", length = 20, nullable = false)
    private String facilityNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "zone_id", nullable = false)
    private ExpoZone zone;

    @Column(name = "kind", length = 40, nullable = false)
    private String kind;

    @Column(name = "name_json", columnDefinition = "json", nullable = false)
    private String nameJson;

    @Column(name = "position_json", columnDefinition = "json", nullable = false)
    private String positionJson;
}