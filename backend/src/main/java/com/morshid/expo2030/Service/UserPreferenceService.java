
package com.morshid.expo2030.Service;

import com.morshid.expo2030.API.ApiException;
import com.morshid.expo2030.DTO.UserPreferenceRequestDTO;
import com.morshid.expo2030.DTO.UserPreferenceResponseDTO;
import com.morshid.expo2030.Model.User;
import com.morshid.expo2030.Model.UserPreference;
import com.morshid.expo2030.Repository.UserPreferenceRepository;
import com.morshid.expo2030.Repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class UserPreferenceService {

    private final UserPreferenceRepository userPreferenceRepository;
    private final UserRepository userRepository;

    // Adds a preference for an existing user.
    public UserPreferenceResponseDTO addPreference(Long userId, UserPreferenceRequestDTO requestDTO) {

        User user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            throw new ApiException("User not found");
        }

        boolean exists = userPreferenceRepository.existsByUser_UserIdAndInterestCode(userId, requestDTO.getInterestCode());

        if (exists) {
            throw new ApiException("Preference already exists");
        }

        UserPreference preference = new UserPreference();
        preference.setUser(user);
        preference.setLanguageCode(requestDTO.getLanguageCode());
        preference.setInterestCode(requestDTO.getInterestCode());

        UserPreference savedPreference =
                userPreferenceRepository.save(preference);

        return mapToDTO(savedPreference);
    }

    // Returns all preferences belonging to a user.
    public List<UserPreferenceResponseDTO> getUserPreferences(Long userId) {

        User user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            throw new ApiException("User not found");
        }

        return userPreferenceRepository.findByUser_UserId(userId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // Converts a preference entity into a response DTO.
    private UserPreferenceResponseDTO mapToDTO(
            UserPreference preference) {

        return new UserPreferenceResponseDTO(
                preference.getPreferenceId(),
                preference.getUser().getUserId(),
                preference.getLanguageCode(),
                preference.getInterestCode()
        );
    }
}
