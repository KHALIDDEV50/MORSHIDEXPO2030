
package com.morshid.expo2030.DTO;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class VisitPlanReorderRequestDTO {

    @NotEmpty(message = "Item IDs are required")
    private List<@NotNull Long> itemIds;
}
