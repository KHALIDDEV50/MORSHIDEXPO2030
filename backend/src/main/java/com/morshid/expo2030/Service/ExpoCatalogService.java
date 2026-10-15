
package com.morshid.expo2030.Service;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import com.morshid.expo2030.API.ApiException;
import com.morshid.expo2030.DTO.ExpoBoothRequestDTO;
import com.morshid.expo2030.DTO.ExpoFacilityRequestDTO;
import com.morshid.expo2030.DTO.ExpoLayoutRequestDTO;
import com.morshid.expo2030.DTO.ExpoZoneRequestDTO;
import com.morshid.expo2030.Model.ExpoBooth;
import com.morshid.expo2030.Model.ExpoFacility;
import com.morshid.expo2030.Model.ExpoLayout;
import com.morshid.expo2030.Model.ExpoZone;
import com.morshid.expo2030.Repository.ExpoBoothRepository;
import com.morshid.expo2030.Repository.ExpoFacilityRepository;
import com.morshid.expo2030.Repository.ExpoLayoutRepository;
import com.morshid.expo2030.Repository.ExpoZoneRepository;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class ExpoCatalogService {

    private final ObjectMapper objectMapper;
    private final ExpoLayoutRepository expoLayoutRepository;
    private final ExpoZoneRepository expoZoneRepository;
    private final ExpoFacilityRepository expoFacilityRepository;
    private final ExpoBoothRepository expoBoothRepository;

    public ExpoCatalogService(
            ObjectMapper objectMapper,
            ExpoLayoutRepository expoLayoutRepository,
            ExpoZoneRepository expoZoneRepository,
            ExpoFacilityRepository expoFacilityRepository,
            ExpoBoothRepository expoBoothRepository
    ) {
        this.objectMapper = objectMapper;
        this.expoLayoutRepository = expoLayoutRepository;
        this.expoZoneRepository = expoZoneRepository;
        this.expoFacilityRepository = expoFacilityRepository;
        this.expoBoothRepository = expoBoothRepository;
    }

    // ==================== Layout ====================

    public JsonNode getLayout() {

        ExpoLayout layout = expoLayoutRepository.findAll()
                .stream()
                .findFirst()
                .orElseThrow(() ->
                        new ApiException("Expo layout not found"));

        JsonNode result = parseJson(layout.getLayoutJson());

        if (!result.isObject() && !result.isArray()) {
            throw new IllegalStateException(
                    "Expo layout JSON must contain a JSON object or array");
        }

        return result;
    }

    public ExpoLayout createLayout(ExpoLayoutRequestDTO request) {

        if (expoLayoutRepository.existsById(request.getLayoutId())) {
            throw new ApiException("Expo layout already exists");
        }

        validateJsonObjectOrArray(request.getLayoutJson(), "layout");

        ExpoLayout layout = new ExpoLayout(
                request.getLayoutId(),
                toJson(request.getLayoutJson()),
                request.getProvenance());

        return expoLayoutRepository.save(layout);
    }

    public ExpoLayout updateLayout(
            String layoutId,
            ExpoLayoutRequestDTO request) {

        ExpoLayout layout = expoLayoutRepository.findById(layoutId)
                .orElseThrow(() ->
                        new ApiException("Expo layout not found"));

        if (!layoutId.equals(request.getLayoutId())) {
            throw new ApiException("Layout ID cannot be changed");
        }

        validateJsonObjectOrArray(request.getLayoutJson(), "layout");

        layout.setLayoutJson(toJson(request.getLayoutJson()));
        layout.setProvenance(request.getProvenance());

        return expoLayoutRepository.save(layout);
    }

    public void deleteLayout(String layoutId) {

        ExpoLayout layout = expoLayoutRepository.findById(layoutId)
                .orElseThrow(() ->
                        new ApiException("Expo layout not found"));

        expoLayoutRepository.delete(layout);
    }

    // ==================== Zones ====================

    public List<ExpoZone> getAllZones() {
        return expoZoneRepository.findAllByOrderByZoneNumberAsc();
    }

    public ExpoZone getZone(String zoneId) {

        return expoZoneRepository.findById(zoneId)
                .orElseThrow(() ->
                        new ApiException("Expo zone not found"));
    }

    public ExpoZone createZone(ExpoZoneRequestDTO request) {

        if (expoZoneRepository.existsById(request.getZoneId())) {
            throw new ApiException("Expo zone already exists");
        }

        validateJsonObjectOrArray(request.getNameJson(), "zone name");
        validateJsonObjectOrArray(request.getSummaryJson(), "zone summary");
        validateJsonObjectOrArray(request.getPolygonJson(), "zone polygon");

        ExpoZone zone = new ExpoZone(
                request.getZoneId(),
                request.getZoneNumber(),
                request.getKind(),
                toJson(request.getNameJson()),
                toJson(request.getSummaryJson()),
                request.getColor(),
                toJson(request.getPolygonJson()),
                toOptionalJson(request.getLabelAtJson()),
                toOptionalJson(request.getImageJson()),
                request.getProvenance());

        return expoZoneRepository.save(zone);
    }

    public ExpoZone updateZone(
            String zoneId,
            ExpoZoneRequestDTO request) {

        ExpoZone zone = expoZoneRepository.findById(zoneId)
                .orElseThrow(() ->
                        new ApiException("Expo zone not found"));

        if (!zoneId.equals(request.getZoneId())) {
            throw new ApiException("Zone ID cannot be changed");
        }

        validateJsonObjectOrArray(request.getNameJson(), "zone name");
        validateJsonObjectOrArray(request.getSummaryJson(), "zone summary");
        validateJsonObjectOrArray(request.getPolygonJson(), "zone polygon");

        zone.setZoneNumber(request.getZoneNumber());
        zone.setKind(request.getKind());
        zone.setNameJson(toJson(request.getNameJson()));
        zone.setSummaryJson(toJson(request.getSummaryJson()));
        zone.setColor(request.getColor());
        zone.setPolygonJson(toJson(request.getPolygonJson()));
        zone.setLabelAtJson(toOptionalJson(request.getLabelAtJson()));
        zone.setImageJson(toOptionalJson(request.getImageJson()));
        zone.setProvenance(request.getProvenance());

        return expoZoneRepository.save(zone);
    }

    public void deleteZone(String zoneId) {

        ExpoZone zone = expoZoneRepository.findById(zoneId)
                .orElseThrow(() ->
                        new ApiException("Expo zone not found"));

        if (!expoBoothRepository.findByZone_ZoneId(zoneId).isEmpty()
                || !expoFacilityRepository.findByZone_ZoneId(zoneId).isEmpty()) {
            throw new ApiException(
                    "Cannot delete zone because it has associated booths or facilities");
        }

        expoZoneRepository.delete(zone);
    }

    // ==================== Facilities ====================

    public List<ExpoFacility> getAllFacilities() {
        return expoFacilityRepository.findAll();
    }

    public ExpoFacility getFacility(String facilityId) {

        return expoFacilityRepository.findById(facilityId)
                .orElseThrow(() ->
                        new ApiException("Expo facility not found"));
    }

    public ExpoFacility createFacility(
            ExpoFacilityRequestDTO request) {

        if (expoFacilityRepository.existsById(request.getFacilityId())) {
            throw new ApiException("Expo facility already exists");
        }

        ExpoZone zone = getZone(request.getZoneId());

        ExpoFacility facility = new ExpoFacility(
                request.getFacilityId(),
                request.getFacilityNumber(),
                zone,
                request.getKind(),
                toJson(request.getNameJson()),
                toJson(request.getPositionJson()));

        return expoFacilityRepository.save(facility);
    }

    public ExpoFacility updateFacility(
            String facilityId,
            ExpoFacilityRequestDTO request) {

        ExpoFacility facility = getFacility(facilityId);

        if (!facilityId.equals(request.getFacilityId())) {
            throw new ApiException("Facility ID cannot be changed");
        }

        ExpoZone zone = getZone(request.getZoneId());

        facility.setFacilityNumber(request.getFacilityNumber());
        facility.setZone(zone);
        facility.setKind(request.getKind());
        facility.setNameJson(toJson(request.getNameJson()));
        facility.setPositionJson(toJson(request.getPositionJson()));

        return expoFacilityRepository.save(facility);
    }

    public void deleteFacility(String facilityId) {

        ExpoFacility facility = getFacility(facilityId);
        expoFacilityRepository.delete(facility);
    }

    // ==================== Booths: Read and Search ====================

    public List<JsonNode> searchBooths(
            String q,
            String category,
            String zoneId,
            List<String> ids) {

        String normalizedQuery = q == null
                ? ""
                : q.trim().toLowerCase(Locale.ROOT);

        return expoBoothRepository.findAll()
                .stream()
                .filter(booth -> matchesQuery(
                        parseJson(booth.getPayloadJson()),
                        normalizedQuery))
                .filter(booth -> matchesCategory(booth, category))
                .filter(booth -> matchesZone(booth, zoneId))
                .filter(booth -> matchesIds(booth, ids))
                .map(booth -> parseJson(booth.getPayloadJson()))
                .toList();
    }

    public JsonNode getBooth(String id) {

        ExpoBooth booth = expoBoothRepository.findById(id)
                .orElseThrow(() ->
                        new ApiException("Expo booth not found"));

        return parseJson(booth.getPayloadJson());
    }

    // ==================== Booths: Create, Update, Delete ====================

    public ExpoBooth createBooth(ExpoBoothRequestDTO request) {

        if (expoBoothRepository.existsById(request.getBoothId())) {
            throw new ApiException("Expo booth already exists");
        }

        ExpoZone zone = getZone(request.getZoneId());
        JsonNode payload = request.getPayloadJson();

        validateBoothPayload(
                payload, request.getBoothId(), request.getCategory());

        JsonNode summary = payload.get("summary");
        JsonNode description = payload.get("description");
        JsonNode activities = payload.get("activities");
        JsonNode position = payload.get("position");
        JsonNode images = payload.get("images");
        JsonNode duration = payload.get("suggestedDurationMin");

        validateJsonObjectOrArray(summary, "booth summary");
        validateJsonObjectOrArray(description, "booth description");
        validateJsonArray(activities, "booth activities");
        validateJsonObjectOrArray(position, "booth position");
        validateJsonArray(images, "booth images");

        Integer suggestedDurationMin = parseDuration(duration);

        ExpoBooth booth = new ExpoBooth(
                request.getBoothId(),
                zone,
                request.getBoothNumber(),
                request.getCategory(),
                toJson(summary),
                toJson(description),
                toJson(activities),
                suggestedDurationMin,
                toJson(position),
                toJson(images),
                toJson(payload),
                request.getProvenance());

        return expoBoothRepository.save(booth);
    }

    public ExpoBooth updateBooth(
            String boothId,
            ExpoBoothRequestDTO request) {

        ExpoBooth booth = expoBoothRepository.findById(boothId)
                .orElseThrow(() ->
                        new ApiException("Expo booth not found"));

        if (!boothId.equals(request.getBoothId())) {
            throw new ApiException("Booth ID cannot be changed");
        }

        ExpoZone zone = getZone(request.getZoneId());
        JsonNode payload = request.getPayloadJson();

        validateBoothPayload(
                payload, boothId, request.getCategory());

        JsonNode summary = payload.get("summary");
        JsonNode description = payload.get("description");
        JsonNode activities = payload.get("activities");
        JsonNode position = payload.get("position");
        JsonNode images = payload.get("images");
        JsonNode duration = payload.get("suggestedDurationMin");

        validateJsonObjectOrArray(summary, "booth summary");
        validateJsonObjectOrArray(description, "booth description");
        validateJsonArray(activities, "booth activities");
        validateJsonObjectOrArray(position, "booth position");
        validateJsonArray(images, "booth images");

        Integer suggestedDurationMin = parseDuration(duration);

        booth.setZone(zone);
        booth.setBoothNumber(request.getBoothNumber());
        booth.setCategory(request.getCategory());
        booth.setSummaryJson(toJson(summary));
        booth.setDescriptionJson(toJson(description));
        booth.setActivitiesJson(toJson(activities));
        booth.setSuggestedDurationMin(suggestedDurationMin);
        booth.setPositionJson(toJson(position));
        booth.setImagesJson(toJson(images));
        booth.setPayloadJson(toJson(payload));
        booth.setProvenance(request.getProvenance());

        return expoBoothRepository.save(booth);
    }

    public void deleteBooth(String boothId) {

        ExpoBooth booth = expoBoothRepository.findById(boothId)
                .orElseThrow(() ->
                        new ApiException("Expo booth not found"));

        expoBoothRepository.delete(booth);
    }

    // ==================== Booth Validation ====================

    private void validateBoothPayload(
            JsonNode payload,
            String boothId,
            String category) {

        if (payload == null || !payload.isObject()) {
            throw new ApiException("Booth payload must be a JSON object");
        }

        // The payload is returned verbatim to the frontend, whose ExpoBooth contract uses "id";
        // "boothId" is still accepted for older admin requests.
        JsonNode payloadId = payload.hasNonNull("id")
                ? payload.get("id")
                : payload.get("boothId");

        if (payloadId == null
                || !payloadId.isTextual()
                || !boothId.equals(payloadId.asText())) {
            throw new ApiException("Payload ID must match boothId");
        }

        JsonNode payloadCategory = payload.get("category");

        if (payloadCategory == null
                || !payloadCategory.isTextual()
                || !category.equals(payloadCategory.asText())) {
            throw new ApiException(
                    "Payload category must match category");
        }
    }

    private void validateJsonArray(JsonNode json, String fieldName) {

        if (json == null || !json.isArray()) {
            throw new ApiException(
                    fieldName + " must be a JSON array");
        }
    }

    private Integer parseDuration(JsonNode duration) {

        if (duration == null || duration.isNull()) {
            return null;
        }

        if (!duration.isIntegralNumber()
                || !duration.canConvertToInt()
                || duration.asInt() < 0) {
            throw new ApiException(
                    "suggestedDurationMin must be a non-negative integer");
        }

        return duration.asInt();
    }

    // ==================== Search Helpers ====================

    private boolean matchesQuery(JsonNode booth, String query) {

        return query.isBlank()
                || contains(booth, "name", query)
                || contains(booth, "summary", query)
                || contains(booth, "description", query);
    }

    private boolean matchesCategory(
            ExpoBooth booth,
            String category) {

        return category == null
                || category.isBlank()
                || category.equalsIgnoreCase(booth.getCategory());
    }

    private boolean matchesZone(
            ExpoBooth booth,
            String zoneId) {

        return zoneId == null
                || zoneId.isBlank()
                || zoneId.equals(booth.getZone().getZoneId());
    }

    private boolean matchesIds(
            ExpoBooth booth,
            List<String> ids) {

        return ids == null
                || ids.isEmpty()
                || ids.contains(booth.getBoothId());
    }

    private boolean contains(
            JsonNode booth,
            String fieldName,
            String query) {

        JsonNode field = booth.path(fieldName);

        if (!field.isObject()) {
            return field.asText("")
                    .toLowerCase(Locale.ROOT)
                    .contains(query);
        }

        return field.path("ar")
                .asText("")
                .toLowerCase(Locale.ROOT)
                .contains(query)
                || field.path("en")
                .asText("")
                .toLowerCase(Locale.ROOT)
                .contains(query);
    }

    // ==================== JSON Helpers ====================

    private JsonNode parseJson(String json) {

        try {
            return objectMapper.readTree(json);
        } catch (JacksonException exception) {
            throw new IllegalStateException(
                    "Unable to parse JSON stored in the Expo database",
                    exception);
        }
    }

    private String toJson(JsonNode json) {

        try {
            return objectMapper.writeValueAsString(json);
        } catch (JacksonException exception) {
            throw new ApiException("Invalid JSON data");
        }
    }

    private String toOptionalJson(JsonNode json) {
        return json == null || json.isNull()
                ? null
                : toJson(json);
    }

    private void validateJsonObjectOrArray(
            JsonNode json,
            String fieldName) {

        if (json == null
                || json.isNull()
                || (!json.isObject() && !json.isArray())) {
            throw new ApiException(
                    "Invalid JSON structure for " + fieldName);
        }
    }
}
