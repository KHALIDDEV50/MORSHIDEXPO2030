package com.morshid.expo2030.Config;

import com.morshid.expo2030.DTO.ExpoBoothRequestDTO;
import com.morshid.expo2030.DTO.ExpoFacilityRequestDTO;
import com.morshid.expo2030.DTO.ExpoLayoutRequestDTO;
import com.morshid.expo2030.DTO.ExpoZoneRequestDTO;
import com.morshid.expo2030.Repository.ExpoBoothRepository;
import com.morshid.expo2030.Repository.ExpoFacilityRepository;
import com.morshid.expo2030.Repository.ExpoLayoutRepository;
import com.morshid.expo2030.Repository.ExpoZoneRepository;
import com.morshid.expo2030.Service.ExpoCatalogService;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;

/**
 * Seeds the Expo site plan (layout, zones, facilities, booths) from the classpath demo fixtures
 * (demo/expo-layout.json, demo/expo-booths.json) so GET /api/v1/expo/layout and /expo/booths work
 * on a fresh database. Idempotent: existing records are never overwritten or deleted.
 */
@Configuration
@AllArgsConstructor
public class ExpoDataSeeder {

    private static final String LAYOUT_ID = "expo2030_riyadh_demo";
    private static final String PROVENANCE = "DEMO";

    private final ObjectMapper objectMapper;
    private final ExpoCatalogService expoCatalogService;
    private final ExpoLayoutRepository expoLayoutRepository;
    private final ExpoZoneRepository expoZoneRepository;
    private final ExpoFacilityRepository expoFacilityRepository;
    private final ExpoBoothRepository expoBoothRepository;

    @Bean
    public CommandLineRunner seedExpoDemoData() {
        return args -> {
            JsonNode layout = readFixture("demo/expo-layout.json");
            JsonNode booths = readFixture("demo/expo-booths.json");

            if (expoLayoutRepository.count() == 0) {
                expoCatalogService.createLayout(
                        new ExpoLayoutRequestDTO(LAYOUT_ID, layout, PROVENANCE));
            }

            for (JsonNode zone : layout.path("zones")) {
                String zoneId = zone.path("id").asString();
                if (expoZoneRepository.existsById(zoneId)) continue;
                expoCatalogService.createZone(new ExpoZoneRequestDTO(
                        zoneId,
                        zone.path("number").asInt(),
                        zone.path("kind").asString(),
                        zone.get("name"),
                        zone.get("summary"),
                        zone.hasNonNull("color") ? zone.get("color").asString() : null,
                        zone.get("polygon"),
                        zone.get("labelAt"),
                        zone.get("image"),
                        PROVENANCE));
            }

            for (JsonNode facility : layout.path("facilities")) {
                String facilityId = facility.path("id").asString();
                if (expoFacilityRepository.existsById(facilityId)) continue;
                expoCatalogService.createFacility(new ExpoFacilityRequestDTO(
                        facilityId,
                        facility.path("number").asString(),
                        facility.path("zoneId").asString(),
                        facility.path("kind").asString(),
                        facility.get("name"),
                        facility.get("position")));
            }

            for (JsonNode booth : booths) {
                String boothId = booth.path("id").asString();
                if (expoBoothRepository.existsById(boothId)) continue;
                expoCatalogService.createBooth(new ExpoBoothRequestDTO(
                        boothId,
                        booth.path("zoneId").asString(),
                        booth.path("number").asString(),
                        booth.path("category").asString(),
                        booth,
                        PROVENANCE));
            }
        };
    }

    private JsonNode readFixture(String path) throws IOException {
        try (InputStream in = new ClassPathResource(path).getInputStream()) {
            return objectMapper.readTree(in);
        }
    }
}
