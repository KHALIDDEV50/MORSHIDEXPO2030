
package com.morshid.expo2030.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tourism_places")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TourismPlace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long placeId;

    /** Stable frontend identifier, e.g. plc_masmak. */
    @Column(unique = true, length = 80)
    private String externalId;

    @Column(nullable = false, length = 150)
    private String nameAr;

    @Column(nullable = false, length = 150)
    private String nameEn;

    @Column(length = 1000)
    private String descriptionAr;

    @Column(length = 1000)
    private String descriptionEn;

    @Column(nullable = false, length = 50)
    private String category;

    private Double latitude;

    private Double longitude;

    @Column(length = 100)
    private String cityAr;

    @Column(length = 100)
    private String cityEn;

    @Column(length = 100)
    private String districtAr;

    @Column(length = 100)
    private String districtEn;

    @Column(length = 20)
    private String regionCode = "riyadh";

    @Column(length = 255)
    private String locationSource = "demo:coordinate-source-not-recorded";

    @Column(nullable = false)
    private Boolean familyFriendly = true;

    @Column(nullable = false)
    private Boolean indoor = false;

    private Boolean freeEntry;

    @Column(nullable = false)
    private Boolean featured = false;

    private Integer visitDurationMinutes;

    @Column(length = 1000)
    private String openingHours;

    @Column(length = 500)
    private String ticketInfo;

    @Column(nullable = false, length = 20)
    private String dataStatus = "DEMO";

    @Column(nullable = false)
    private Boolean active = true;
}
