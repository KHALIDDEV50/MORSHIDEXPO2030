
package com.morshid.expo2030.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VisitPlanItemStatusRequestDTO {

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "PENDING|VISITED|SKIPPED", message = "Status must be PENDING, VISITED or SKIPPED")
    private String status;
}
