
package com.morshid.expo2030.Controller;

import com.morshid.expo2030.DTO.AICharacterResponseDTO;
import com.morshid.expo2030.Service.AICharacterService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/characters")
@AllArgsConstructor
public class AICharacterController {

    // Service responsible for AI character business logic.
    private final AICharacterService aiCharacterService;

    // Returns all AI characters.
    @GetMapping("/get")
    public ResponseEntity<List<AICharacterResponseDTO>> getAllCharacters() {

        return ResponseEntity.status(200).body(aiCharacterService.getAllCharacters());
    }

    // Returns an AI character by ID.
    @GetMapping("/get/{characterId}")
    public ResponseEntity<AICharacterResponseDTO> getCharacterById(@PathVariable Long characterId) {

        return ResponseEntity.status(200).body(aiCharacterService.getCharacterById(characterId));
    }
}
