
package com.morshid.expo2030.Service;

import com.morshid.expo2030.API.ApiException;
import com.morshid.expo2030.DTO.AICharacterResponseDTO;
import com.morshid.expo2030.Model.AICharacter;
import com.morshid.expo2030.Repository.AICharacterRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class AICharacterService {

    private final AICharacterRepository aiCharacterRepository;

    // Returns all AI characters as DTOs.
    public List<AICharacterResponseDTO> getAllCharacters() {
        return aiCharacterRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // Returns an AI character by ID.
    public AICharacterResponseDTO getCharacterById(Long characterId) {

        AICharacter character = aiCharacterRepository.findById(characterId).orElse(null);

        if (character == null) {
            throw new ApiException("AI character not found");
        }

        return mapToDTO(character);
    }

    // Converts the entity into a response DTO.
    private AICharacterResponseDTO mapToDTO(AICharacter character) {
        return new AICharacterResponseDTO(
                character.getCharacterId(),
                character.getCode(),
                character.getName(),
                character.getDescription(),
                character.getActive()
        );
    }
}
