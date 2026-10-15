
package com.morshid.expo2030.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// DTO used to return pavilion information through the API.
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PavilionResponseDTO {

    private Long pavilionId;
    private String name;
    private String description;
    private String country;
    private String category;
    private String location;
    private String dataStatus;
    private Boolean active;
}
