package com.morshid.expo2030.DTO;

import java.util.List;

/** Response contract consumed by the MORSHID frontend place repository. */
public record PlaceResponseDTO(
        String id,
        LocalizedTextDTO name,
        List<String> categories,
        PlaceRegionDTO region,
        LatLngDTO location,
        String locationSource,
        LocalizedTextDTO summary,
        LocalizedTextDTO description,
        LocalizedTextDTO history,
        List<LocalizedTextDTO> tips,
        int suggestedDurationMin,
        LocalizedTextDTO bestTime,
        OpeningHoursDTO openingHours,
        PlaceAttributesDTO attributes,
        List<PlaceImageDTO> images,
        LocalizedTextDTO narration,
        boolean featured,
        List<String> collectionIds,
        List<String> relatedPlaceIds
) {
    public record LocalizedTextDTO(String ar, String en) {}
    public record LatLngDTO(double lat, double lng) {}
    public record PlaceRegionDTO(LocalizedTextDTO city, LocalizedTextDTO district, String regionCode) {}
    public record OpeningHoursDTO(LocalizedTextDTO text, String provenance) {}
    public record PlaceAttributesDTO(boolean familyFriendly, boolean indoor, Boolean freeEntry) {}
    public record PlaceImageDTO(String src, LocalizedTextDTO alt, boolean placeholder,
                                String credit, String license, String sourceUrl) {}
}
