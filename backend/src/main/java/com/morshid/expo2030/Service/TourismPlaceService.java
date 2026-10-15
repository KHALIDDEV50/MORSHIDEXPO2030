package com.morshid.expo2030.Service;

import com.morshid.expo2030.API.ApiException;
import com.morshid.expo2030.DTO.PageResponseDTO;
import com.morshid.expo2030.DTO.PlaceResponseDTO;
import com.morshid.expo2030.Model.TourismPlace;
import com.morshid.expo2030.Repository.TourismPlaceRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class TourismPlaceService {

    private static final Set<String> ALLOWED_CATEGORIES = Set.of(
            "heritage", "museums", "nature", "food", "shopping", "entertainment", "family", "culture"
    );

    private final TourismPlaceRepository tourismPlaceRepository;

    public PageResponseDTO<PlaceResponseDTO> search(
            String q, List<String> categories, String regionCode,
            Integer maxDurationMin, Boolean familyFriendly, Boolean indoor, String bounds,
            String sort, Integer page, Integer pageSize, Boolean featured,
            List<String> ids) {

        int safePage = page == null || page < 1 ? 1 : page;
        int safePageSize = pageSize == null || pageSize < 1 ? 20 : Math.min(pageSize, 100);

        List<PlaceResponseDTO> filtered = tourismPlaceRepository.findByActiveTrue().stream()
                .filter(place -> place.getLatitude() != null && place.getLongitude() != null)
                .map(this::mapToDTO)
                .filter(place -> q == null || q.isBlank() ||
                        (place.name().ar() + " " + place.name().en() + " " + place.description().ar() + " " + place.description().en())
                                .toLowerCase(Locale.ROOT).contains(q.toLowerCase(Locale.ROOT)))
                .filter(place -> categories == null || categories.isEmpty() ||
                        place.categories().stream().anyMatch(categories::contains))
                .filter(place -> regionCode == null || regionCode.equals(place.region().regionCode()))
                .filter(place -> maxDurationMin == null || place.suggestedDurationMin() <= maxDurationMin)
                .filter(place -> familyFriendly == null || place.attributes().familyFriendly() == familyFriendly)
                .filter(place -> indoor == null || place.attributes().indoor() == indoor)
                .filter(place -> isWithinBounds(place, bounds))
                .filter(place -> featured == null || place.featured() == featured)
                .filter(place -> ids == null || ids.isEmpty() || ids.contains(place.id()))
                .collect(Collectors.toCollection(ArrayList::new));

        if ("name".equalsIgnoreCase(sort)) {
            filtered.sort((a, b) -> a.name().en().compareToIgnoreCase(b.name().en()));
        } else if ("duration".equalsIgnoreCase(sort)) {
            filtered.sort((a, b) -> Integer.compare(a.suggestedDurationMin(), b.suggestedDurationMin()));
        }

        long total = filtered.size();
        int fromIndex = Math.min((safePage - 1) * safePageSize, filtered.size());
        int toIndex = Math.min(fromIndex + safePageSize, filtered.size());
        return new PageResponseDTO<>(filtered.subList(fromIndex, toIndex), safePage, safePageSize, total);
    }

    public PlaceResponseDTO getById(String id) {
        Long numericId = parseId(id);
        TourismPlace place = tourismPlaceRepository.findByExternalIdAndActiveTrue(id)
                .orElseGet(() -> tourismPlaceRepository.findById(numericId)
                        .filter(TourismPlace::getActive)
                        .orElseThrow(() -> new ApiException("Tourism place not found")));
        if (place.getLatitude() == null || place.getLongitude() == null) {
            throw new ApiException("Tourism place location is not available");
        }
        return mapToDTO(place);
    }

    private Long parseId(String id) {
        if (id != null && id.startsWith("plc_")) {
            try {
                return Long.parseLong(id.substring(4));
            } catch (NumberFormatException ignored) {
                // Stable string IDs are looked up through externalId below.
            }
        }
        return -1L;
    }

    private PlaceResponseDTO mapToDTO(TourismPlace place) {
        List<String> categories = Arrays.stream(place.getCategory().split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(this::normalizeCategory)
                .distinct()
                .toList();
        String nameAr = safe(place.getNameAr(), "وجهة سياحية تجريبية");
        String nameEn = safe(place.getNameEn(), "Demo tourism place");
        String descriptionAr = safe(place.getDescriptionAr(), "بيانات تجريبية غير معتمدة رسميًا.");
        String descriptionEn = safe(place.getDescriptionEn(), "Illustrative demo data; not officially verified.");
        String cityAr = safe(place.getCityAr(), "غير محدد");
        String cityEn = safe(place.getCityEn(), "Unspecified");
        String region = "saudi".equalsIgnoreCase(place.getRegionCode()) ? "saudi" : "riyadh";

        PlaceResponseDTO.LocalizedTextDTO name = tx(nameAr, nameEn);
        PlaceResponseDTO.LocalizedTextDTO description = tx(descriptionAr, descriptionEn);
        PlaceResponseDTO.LocalizedTextDTO summary = tx(descriptionAr, descriptionEn);
        PlaceResponseDTO.LocalizedTextDTO city = tx(cityAr, cityEn);

        PlaceResponseDTO.OpeningHoursDTO hours = place.getOpeningHours() == null || place.getOpeningHours().isBlank()
                ? null
                : new PlaceResponseDTO.OpeningHoursDTO(tx(place.getOpeningHours(), place.getOpeningHours()), "demo");

        PlaceResponseDTO.PlaceImageDTO placeholder = new PlaceResponseDTO.PlaceImageDTO(
                "", tx("لا تتوفر صورة موثقة لهذه الوجهة", "No verified image available for this place"),
                true, null, null, null);

        return new PlaceResponseDTO(
                (place.getExternalId() == null || place.getExternalId().isBlank()
                        ? "plc_" + place.getPlaceId() : place.getExternalId()), name, categories,
                new PlaceResponseDTO.PlaceRegionDTO(city,
                        place.getDistrictAr() == null && place.getDistrictEn() == null ? null :
                                tx(safe(place.getDistrictAr(), ""), safe(place.getDistrictEn(), "")), region),
                new PlaceResponseDTO.LatLngDTO(place.getLatitude(), place.getLongitude()),
                safe(place.getLocationSource(), "demo:coordinate-source-not-recorded"),
                summary, description, null, List.of(),
                place.getVisitDurationMinutes() == null || place.getVisitDurationMinutes() < 1 ? 60 : place.getVisitDurationMinutes(),
                null, hours,
                new PlaceResponseDTO.PlaceAttributesDTO(
                        Boolean.TRUE.equals(place.getFamilyFriendly()),
                        Boolean.TRUE.equals(place.getIndoor()), place.getFreeEntry()),
                List.of(placeholder), null, Boolean.TRUE.equals(place.getFeatured()), List.of(), List.of());
    }

    private boolean isWithinBounds(PlaceResponseDTO place, String bounds) {
        if (bounds == null || bounds.isBlank()) return true;
        String[] values = bounds.split(",");
        if (values.length != 4) return true;
        try {
            double west = Double.parseDouble(values[0]);
            double south = Double.parseDouble(values[1]);
            double east = Double.parseDouble(values[2]);
            double north = Double.parseDouble(values[3]);
            double lat = place.location().lat();
            double lng = place.location().lng();
            return lng >= west && lng <= east && lat >= south && lat <= north;
        } catch (NumberFormatException exception) {
            return true;
        }
    }

    private PlaceResponseDTO.LocalizedTextDTO tx(String ar, String en) {
        return new PlaceResponseDTO.LocalizedTextDTO(ar, en);
    }

    private String safe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String normalizeCategory(String category) {
        if (category == null) return "culture";
        String normalized = category.toLowerCase(Locale.ROOT).replace('_', '-');
        if (ALLOWED_CATEGORIES.contains(normalized)) return normalized;
        if (normalized.contains("museum")) return "museums";
        if (normalized.contains("heritage") || normalized.contains("histor")) return "heritage";
        if (normalized.contains("nature") || normalized.contains("park")) return "nature";
        if (normalized.contains("food") || normalized.contains("restaurant")) return "food";
        if (normalized.contains("shop")) return "shopping";
        if (normalized.contains("entertain")) return "entertainment";
        return "culture";
    }
}
