
package com.morshid.expo2030.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pavilions")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Pavilion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pavilionId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(length = 100)
    private String country;

    @Column(length = 50)
    private String category;

    @Column(length = 150)
    private String location;

    @Column(nullable = false, length = 20)
    private String dataStatus = "DEMO";

    @Column(nullable = false)
    private Boolean active = true;
}
