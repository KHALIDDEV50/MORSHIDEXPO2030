
package com.morshid.expo2030.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VisitPlanItemRequestDTO {

    @NotBlank(message = "Booth ID is required")
    private String boothId;
}
