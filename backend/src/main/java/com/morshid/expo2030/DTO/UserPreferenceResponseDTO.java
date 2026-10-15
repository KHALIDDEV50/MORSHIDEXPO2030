
package com.morshid.expo2030.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserPreferenceResponseDTO {

    private Long preferenceId;
    private Long userId;
    private String languageCode;
    private String interestCode;
}
