package com.morshid.expo2030.Controller;

import com.morshid.expo2030.DTO.PageResponseDTO;
import com.morshid.expo2030.DTO.PlaceResponseDTO;
import com.morshid.expo2030.Service.TourismPlaceService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/places")
@AllArgsConstructor
public class TourismPlaceController {

    private final TourismPlaceService tourismPlaceService;

    @GetMapping
    public ResponseEntity<PageResponseDTO<PlaceResponseDTO>> searchPlaces(
            @RequestParam(required = false) String q,
            @RequestParam(required = false, name = "category") List<String> categories,
            @RequestParam(required = false, name = "region") String regionCode,
            @RequestParam(required = false, name = "maxDuration") Integer maxDurationMin,
            @RequestParam(required = false, name = "family") Boolean familyFriendly,
            @RequestParam(required = false) Boolean indoor,
            @RequestParam(required = false) String bounds,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer pageSize,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false, name = "ids") List<String> ids) {

        return ResponseEntity.ok(tourismPlaceService.search(q, categories, regionCode,
                maxDurationMin, familyFriendly, indoor, bounds, sort, page, pageSize, featured, ids));
    }

    @GetMapping("/{placeId}")
    public ResponseEntity<PlaceResponseDTO> getPlace(@PathVariable String placeId) {
        return ResponseEntity.ok(tourismPlaceService.getById(placeId));
    }
}
