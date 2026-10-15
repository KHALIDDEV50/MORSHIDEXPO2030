package com.morshid.expo2030.Service;

import com.morshid.expo2030.API.ApiException;
import com.morshid.expo2030.DTO.UserResponseDTO;
import com.morshid.expo2030.Model.User;
import com.morshid.expo2030.Repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class UserService {

    private final UserRepository userRepository;


    // Returns all users as DTOs.
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // Returns a user by ID or throws an exception if not found.
    public UserResponseDTO getUserById(Long userId) {

        User user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            throw new ApiException("User not found");
        }

        return mapToDTO(user);
    }

    // Converts User entity to DTO without exposing the password.
    private UserResponseDTO mapToDTO(User user) {
        return new UserResponseDTO(
                user.getUserId(),
                user.getName(),
                user.getUsername(),
                user.getEmail()
        );
    }
}