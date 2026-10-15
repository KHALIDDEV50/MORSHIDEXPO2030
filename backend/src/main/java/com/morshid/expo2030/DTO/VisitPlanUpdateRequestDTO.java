
package com.morshid.expo2030.DTO;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class VisitPlanUpdateRequestDTO {

    @Size(max = 150, message = "Name must not exceed 150 characters")
    private String name;

    @Size(max = 100, message = "Plan name must not exceed 100 characters")
    private String planName;

    private LocalDateTime startAt;

    private LocalDateTime endAt;

    private LocalDate visitDate;

    private String status;
}
