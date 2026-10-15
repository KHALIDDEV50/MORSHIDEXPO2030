
package com.morshid.expo2030.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// DTO used to return event information through the API.
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EventResponseDTO {

    private Long eventId;
    private String name;
    private String description;
    private Long pavilionId;
    private String pavilionName;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String location;
    private String dataStatus;
    private Boolean active;
}
