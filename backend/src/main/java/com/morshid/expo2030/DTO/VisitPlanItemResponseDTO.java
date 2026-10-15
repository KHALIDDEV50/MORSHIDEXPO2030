
package com.morshid.expo2030.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VisitPlanItemResponseDTO {

    private Long itemId;
    private String boothId;
    private String boothNumber;
    private String category;
    private Integer sequenceNumber;
    private String status;
    private Integer suggestedDurationMin;
}
