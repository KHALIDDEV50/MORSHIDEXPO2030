
package com.morshid.expo2030.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserPreferenceRequestDTO {

    // Language selected by the user: ar or en.
    @NotBlank(message = "Language code is required")
    @Pattern(regexp = "ar|en", message = "Language must be ar or en")
    private String languageCode;

    // Interest selected by the user.
    @NotBlank(message = "Interest code is required")
    @Pattern(
            regexp = "TECHNOLOGY|CULTURE|SUSTAINABILITY|TOURISM|ARTS|STARTUPS",
            message = "Invalid interest code"
    )
    private String interestCode;
}
