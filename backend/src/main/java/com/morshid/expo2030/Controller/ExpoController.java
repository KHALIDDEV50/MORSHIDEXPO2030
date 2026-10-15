
package com.morshid.expo2030.Controller;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import com.morshid.expo2030.API.ApiException;
import com.morshid.expo2030.API.ApiResponse;
import com.morshid.expo2030.DTO.ExpoBoothRequestDTO;
import com.morshid.expo2030.DTO.ExpoFacilityRequestDTO;
import com.morshid.expo2030.DTO.ExpoFacilityResponseDTO;
import com.morshid.expo2030.DTO.ExpoLayoutRequestDTO;
import com.morshid.expo2030.DTO.ExpoZoneRequestDTO;
import com.morshid.expo2030.DTO.ExpoZoneResponseDTO;
import com.morshid.expo2030.Model.ExpoFacility;
import com.morshid.expo2030.Model.ExpoZone;
import com.morshid.expo2030.Service.ExpoCatalogService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/expo")
@AllArgsConstructor
public class ExpoController {

    private final ExpoCatalogService expoCatalogService;
    private final ObjectMapper objectMapper;

    // ==================== Layout ====================

    @GetMapping(value = "/layout", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<JsonNode> getLayout() {
        return ResponseEntity.ok(expoCatalogService.getLayout());
    }

    @PostMapping("/layouts")
    public ResponseEntity<ApiResponse> createLayout(
            @Valid @RequestBody ExpoLayoutRequestDTO requestDTO) {

        expoCatalogService.createLayout(requestDTO);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse("Expo layout created successfully"));
    }

    @PutMapping("/layouts/{layoutId}")
    public ResponseEntity<ApiResponse> updateLayout(
            @PathVariable String layoutId,
            @Valid @RequestBody ExpoLayoutRequestDTO requestDTO) {

        expoCatalogService.updateLayout(layoutId, requestDTO);

        return ResponseEntity.ok(
                new ApiResponse("Expo layout updated successfully"));
    }

    @DeleteMapping("/layouts/{layoutId}")
    public ResponseEntity<ApiResponse> deleteLayout(
            @PathVariable String layoutId) {

        expoCatalogService.deleteLayout(layoutId);

        return ResponseEntity.ok(
                new ApiResponse("Expo layout deleted successfully"));
    }

    // ==================== Zones ====================

    @GetMapping("/zones")
    public ResponseEntity<ApiResponse> getAllZones() {

        List<ExpoZoneResponseDTO> zones =
                expoCatalogService.getAllZones()
                        .stream()
                        .map(this::toZoneResponseDTO)
                        .toList();

        return ResponseEntity.ok(
                new ApiResponse("Expo zones retrieved successfully", zones));
    }

    @GetMapping("/zones/{zoneId}")
    public ResponseEntity<ApiResponse> getZone(
            @PathVariable String zoneId) {

        ExpoZone zone = expoCatalogService.getZone(zoneId);

        return ResponseEntity.ok(
                new ApiResponse(
                        "Expo zone retrieved successfully",
                        toZoneResponseDTO(zone)));
    }

    @PostMapping("/zones")
    public ResponseEntity<ApiResponse> createZone(
            @Valid @RequestBody ExpoZoneRequestDTO requestDTO) {

        expoCatalogService.createZone(requestDTO);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse("Expo zone created successfully"));
    }

    @PutMapping("/zones/{zoneId}")
    public ResponseEntity<ApiResponse> updateZone(
            @PathVariable String zoneId,
            @Valid @RequestBody ExpoZoneRequestDTO requestDTO) {

        expoCatalogService.updateZone(zoneId, requestDTO);

        return ResponseEntity.ok(
                new ApiResponse("Expo zone updated successfully"));
    }

    @DeleteMapping("/zones/{zoneId}")
    public ResponseEntity<ApiResponse> deleteZone(
            @PathVariable String zoneId) {

        expoCatalogService.deleteZone(zoneId);

        return ResponseEntity.ok(
                new ApiResponse("Expo zone deleted successfully"));
    }

    // ==================== Facilities ====================

    @GetMapping("/facilities")
    public ResponseEntity<ApiResponse> getAllFacilities() {

        List<ExpoFacilityResponseDTO> facilities =
                expoCatalogService.getAllFacilities()
                        .stream()
                        .map(this::toFacilityResponseDTO)
                        .toList();

        return ResponseEntity.ok(
                new ApiResponse(
                        "Expo facilities retrieved successfully",
                        facilities));
    }

    @GetMapping("/facilities/{facilityId}")
    public ResponseEntity<ApiResponse> getFacility(
            @PathVariable String facilityId) {

        ExpoFacility facility =
                expoCatalogService.getFacility(facilityId);

        return ResponseEntity.ok(
                new ApiResponse(
                        "Expo facility retrieved successfully",
                        toFacilityResponseDTO(facility)));
    }

    @PostMapping("/facilities")
    public ResponseEntity<ApiResponse> createFacility(
            @Valid @RequestBody ExpoFacilityRequestDTO requestDTO) {

        expoCatalogService.createFacility(requestDTO);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse("Expo facility created successfully"));
    }

    @PutMapping("/facilities/{facilityId}")
    public ResponseEntity<ApiResponse> updateFacility(
            @PathVariable String facilityId,
            @Valid @RequestBody ExpoFacilityRequestDTO requestDTO) {

        expoCatalogService.updateFacility(facilityId, requestDTO);

        return ResponseEntity.ok(
                new ApiResponse("Expo facility updated successfully"));
    }

    @DeleteMapping("/facilities/{facilityId}")
    public ResponseEntity<ApiResponse> deleteFacility(
            @PathVariable String facilityId) {

        expoCatalogService.deleteFacility(facilityId);

        return ResponseEntity.ok(
                new ApiResponse("Expo facility deleted successfully"));
    }

    // ==================== Booths ====================

    @GetMapping(value = "/booths", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<JsonNode> searchBooths(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false, name = "zone") String zoneId,
            @RequestParam(required = false) List<String> ids) {

        List<JsonNode> results =
                expoCatalogService.searchBooths(q, category, zoneId, ids);

        JsonNode response = objectMapper.valueToTree(results);

        return ResponseEntity.ok(response);
    }

    @GetMapping(
            value = "/booths/{boothId}",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<JsonNode> getBooth(
            @PathVariable String boothId) {

        JsonNode booth = expoCatalogService.getBooth(boothId);

        return ResponseEntity.ok(booth);
    }

    @PostMapping("/booths")
    public ResponseEntity<ApiResponse> createBooth(
            @Valid @RequestBody ExpoBoothRequestDTO requestDTO) {

        var savedBooth = expoCatalogService.createBooth(requestDTO);

        JsonNode boothData =
                expoCatalogService.getBooth(savedBooth.getBoothId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse(
                        "Expo booth created successfully", boothData));
    }

    @PutMapping("/booths/{boothId}")
    public ResponseEntity<ApiResponse> updateBooth(
            @PathVariable String boothId,
            @Valid @RequestBody ExpoBoothRequestDTO requestDTO) {

        expoCatalogService.updateBooth(boothId, requestDTO);

        JsonNode updatedBooth = expoCatalogService.getBooth(boothId);

        return ResponseEntity.ok(
                new ApiResponse(
                        "Expo booth updated successfully",
                        updatedBooth));
    }

    @DeleteMapping("/booths/{boothId}")
    public ResponseEntity<ApiResponse> deleteBooth(
            @PathVariable String boothId) {

        expoCatalogService.deleteBooth(boothId);

        return ResponseEntity.ok(
                new ApiResponse(
                        "Expo booth deleted successfully",
                        Map.of(
                                "boothId", boothId,
                                "deleted", true)));
    }

    // ==================== DTO Mapping ====================

    private ExpoZoneResponseDTO toZoneResponseDTO(ExpoZone zone) {

        return new ExpoZoneResponseDTO(
                zone.getZoneId(),
                zone.getZoneNumber(),
                zone.getKind(),
                readOptionalJson(zone.getNameJson()),
                readOptionalJson(zone.getSummaryJson()),
                zone.getColor(),
                readOptionalJson(zone.getPolygonJson()),
                readOptionalJson(zone.getLabelAtJson()),
                readOptionalJson(zone.getImageJson()),
                zone.getProvenance());
    }

    private ExpoFacilityResponseDTO toFacilityResponseDTO(
            ExpoFacility facility) {

        return new ExpoFacilityResponseDTO(
                facility.getFacilityId(),
                facility.getFacilityNumber(),
                facility.getZone().getZoneId(),
                facility.getKind(),
                readOptionalJson(facility.getNameJson()),
                readOptionalJson(facility.getPositionJson()));
    }

    private JsonNode readOptionalJson(String json) {

        if (json == null || json.isBlank()) {
            return null;
        }

        try {
            return objectMapper.readTree(json);
        } catch (JacksonException e) {
            throw new ApiException("Invalid JSON data");
        }
    }

    // ==================== Diagnostic Endpoints ====================

    @GetMapping("/test-json")
    public ResponseEntity<String> testJsonSerialization() {

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"en\":\"Earth\",\"ar\":\"الأرض\"}");
    }

    @GetMapping("/test-object-mapper")
    public ResponseEntity<String> testObjectMapper() {

        JsonNode jsonNode = objectMapper.readTree(
                "{\"en\":\"Earth\",\"ar\":\"الأرض\"}");

        String json = objectMapper.writeValueAsString(jsonNode);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(json);
    }
}
