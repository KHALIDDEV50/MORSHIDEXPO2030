
package com.morshid.expo2030.Service;

import com.morshid.expo2030.API.ApiException;
import com.morshid.expo2030.DTO.PavilionResponseDTO;
import com.morshid.expo2030.Model.Pavilion;
import com.morshid.expo2030.Repository.PavilionRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class PavilionService {

    private final PavilionRepository pavilionRepository;

    // Returns all active pavilions as DTOs.
    public List<PavilionResponseDTO> getAllPavilions() {
        return pavilionRepository.findByActiveTrue()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // Returns an active pavilion by ID.
    public PavilionResponseDTO getPavilionById(Long pavilionId) {

        Pavilion pavilion = pavilionRepository
                .findById(pavilionId)
                .orElse(null);

        if (pavilion == null || !Boolean.TRUE.equals(pavilion.getActive())) {
            throw new ApiException("Pavilion not found");
        }

        return mapToDTO(pavilion);
    }

    // Returns active pavilions matching a category.
    public List<PavilionResponseDTO> getPavilionsByCategory(String category) {
        return pavilionRepository
                .findByCategoryIgnoreCaseAndActiveTrue(category)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // Converts a Pavilion entity into a response DTO.
    private PavilionResponseDTO mapToDTO(Pavilion pavilion) {
        return new PavilionResponseDTO(
                pavilion.getPavilionId(),
                pavilion.getName(),
                pavilion.getDescription(),
                pavilion.getCountry(),
                pavilion.getCategory(),
                pavilion.getLocation(),
                pavilion.getDataStatus(),
                pavilion.getActive()
        );
    }
}
