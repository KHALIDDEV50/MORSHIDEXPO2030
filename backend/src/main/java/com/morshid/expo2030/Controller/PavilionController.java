
package com.morshid.expo2030.Controller;

import com.morshid.expo2030.DTO.PavilionResponseDTO;
import com.morshid.expo2030.Service.PavilionService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pavilions")
@AllArgsConstructor
public class PavilionController {

    // Service responsible for pavilion business logic.
    private final PavilionService pavilionService;

    // Returns all active pavilions.
    @GetMapping("/get")
    public ResponseEntity<List<PavilionResponseDTO>> getAllPavilions() {
        return ResponseEntity.status(200).body(pavilionService.getAllPavilions());
    }

    // Returns an active pavilion by ID.
    @GetMapping("/get/{pavilionId}")
    public ResponseEntity<PavilionResponseDTO> getPavilionById(
            @PathVariable Long pavilionId) {
        return ResponseEntity.status(200).body(pavilionService.getPavilionById(pavilionId));
    }

    // Returns active pavilions by category.
    @GetMapping("/category/{category}")
    public ResponseEntity<List<PavilionResponseDTO>> getPavilionsByCategory(
            @PathVariable String category) {
        return ResponseEntity.status(200).body(pavilionService.getPavilionsByCategory(category));
    }
}
