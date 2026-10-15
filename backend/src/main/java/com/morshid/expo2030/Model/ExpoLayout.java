package com.morshid.expo2030.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "expo_layout")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExpoLayout {

    @Id
    @Column(name = "layout_id", length = 80, nullable = false)
    private String layoutId;

    @Column(name = "layout_json", columnDefinition = "json", nullable = false)
    private String layoutJson;

    @Column(name = "provenance", length = 40, nullable = false)
    private String provenance;
}