
package com.morshid.expo2030.DTO;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class VisitPlanResponseDTO {

    private Long planId;
    private String planName;
    private LocalDate visitDate;
    private String status;
    private LocalDateTime createdAt;
    private List<VisitPlanItemResponseDTO> items;
}
