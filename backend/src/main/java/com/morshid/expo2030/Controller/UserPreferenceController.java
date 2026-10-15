
package com.morshid.expo2030.Controller;

import com.morshid.expo2030.DTO.UserPreferenceRequestDTO;
import com.morshid.expo2030.DTO.UserPreferenceResponseDTO;
import com.morshid.expo2030.Service.UserPreferenceService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/preferences")
@AllArgsConstructor
public class UserPreferenceController {

    // Service responsible for user preference operations.
    private final UserPreferenceService userPreferenceService;

    // Adds a preference for a specific user.
    @PostMapping("/add/{userId}")
    public ResponseEntity<UserPreferenceResponseDTO> addPreference(
            @PathVariable Long userId,
            @Valid @RequestBody UserPreferenceRequestDTO requestDTO) {

        return ResponseEntity.status(201)
                .body(userPreferenceService.addPreference(
                        userId,
                        requestDTO
                ));
    }

    // Returns all preferences belonging to a specific user.
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserPreferenceResponseDTO>> getUserPreferences(
            @PathVariable Long userId) {

        return ResponseEntity.status(200)
                .body(userPreferenceService.getUserPreferences(userId));
    }
}
