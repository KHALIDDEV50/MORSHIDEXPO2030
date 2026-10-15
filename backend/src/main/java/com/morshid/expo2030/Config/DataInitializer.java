
package com.morshid.expo2030.Config;

import com.morshid.expo2030.Model.AICharacter;
import com.morshid.expo2030.Model.Event;
import com.morshid.expo2030.Model.Pavilion;
import com.morshid.expo2030.Model.TourismPlace;
import com.morshid.expo2030.Repository.AICharacterRepository;
import com.morshid.expo2030.Repository.EventRepository;
import com.morshid.expo2030.Repository.PavilionRepository;
import com.morshid.expo2030.Repository.TourismPlaceRepository;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
@AllArgsConstructor
public class DataInitializer {

    private final AICharacterRepository aiCharacterRepository;
    private final PavilionRepository pavilionRepository;
    private final EventRepository eventRepository;
    private final TourismPlaceRepository tourismPlaceRepository;

    @Bean
    public CommandLineRunner initializeDemoData() {
        return args -> {

            initializeDemoPlaces();

            // Create Arif if it does not already exist.
            if (!aiCharacterRepository.existsByCode("ARIF")) {
                AICharacter arif = new AICharacter();
                arif.setCode("ARIF");
                arif.setName("عارف");
                arif.setDescription(
                        "DEMO - Technology, innovation, sustainability, and startups."
                );
                arif.setActive(true);

                aiCharacterRepository.save(arif);
            }

            // Create Roaya if it does not already exist.
            if (!aiCharacterRepository.existsByCode("ROAYA")) {
                AICharacter roaya = new AICharacter();
                roaya.setCode("ROAYA");
                roaya.setName("رؤية");
                roaya.setDescription(
                        "DEMO - Saudi culture, heritage, arts, and tourism."
                );
                roaya.setActive(true);

                aiCharacterRepository.save(roaya);
            }

            // Create the technology pavilion if it does not exist.
            Pavilion technologyPavilion = pavilionRepository.findAll()
                    .stream()
                    .filter(p -> "DEMO_TECH_PAVILION".equals(p.getName()))
                    .findFirst()
                    .orElse(null);

            if (technologyPavilion == null) {
                technologyPavilion = new Pavilion();
                technologyPavilion.setName("DEMO_TECH_PAVILION");
                technologyPavilion.setDescription("DEMO - A sample pavilion for technology and innovation.");
                technologyPavilion.setCountry("DEMO");
                technologyPavilion.setCategory("TECHNOLOGY");
                technologyPavilion.setLocation("DEMO LOCATION");
                technologyPavilion.setDataStatus("DEMO");
                technologyPavilion.setActive(true);

                technologyPavilion = pavilionRepository.save(technologyPavilion);
            }

            // Create the sustainability pavilion if it does not exist.
            Pavilion sustainabilityPavilion = pavilionRepository.findAll()
                    .stream()
                    .filter(p -> "DEMO_GREEN_PAVILION".equals(p.getName()))
                    .findFirst()
                    .orElse(null);

            if (sustainabilityPavilion == null) {
                sustainabilityPavilion = new Pavilion();
                sustainabilityPavilion.setName("DEMO_GREEN_PAVILION");
                sustainabilityPavilion.setDescription(
                        "DEMO - A sample pavilion for sustainability."
                );
                sustainabilityPavilion.setCountry("DEMO");
                sustainabilityPavilion.setCategory("SUSTAINABILITY");
                sustainabilityPavilion.setLocation("DEMO LOCATION");
                sustainabilityPavilion.setDataStatus("DEMO");
                sustainabilityPavilion.setActive(true);

                sustainabilityPavilion =
                        pavilionRepository.save(sustainabilityPavilion);
            }

            // Set sample event times relative to application startup.
            LocalDateTime now = LocalDateTime.now();

            // Create a technology event if it does not exist.
            if (eventRepository.findAll().stream()
                    .noneMatch(e -> "DEMO_TECH_EVENT".equals(e.getName()))) {

                Event technologyEvent = new Event();
                technologyEvent.setName("DEMO_TECH_EVENT");
                technologyEvent.setDescription(
                        "DEMO - A sample event about AI and innovation."
                );
                technologyEvent.setPavilion(technologyPavilion);
                technologyEvent.setStartAt(now.plusDays(1));
                technologyEvent.setEndAt(now.plusDays(1).plusHours(1));
                technologyEvent.setLocation("DEMO LOCATION");
                technologyEvent.setDataStatus("DEMO");
                technologyEvent.setActive(true);

                eventRepository.save(technologyEvent);
            }

            // Create a sustainability event if it does not exist.
            if (eventRepository.findAll().stream()
                    .noneMatch(e -> "DEMO_GREEN_EVENT".equals(e.getName()))) {

                Event sustainabilityEvent = new Event();
                sustainabilityEvent.setName("DEMO_GREEN_EVENT");
                sustainabilityEvent.setDescription(
                        "DEMO - A sample event about sustainability."
                );
                sustainabilityEvent.setPavilion(sustainabilityPavilion);
                sustainabilityEvent.setStartAt(now.plusDays(2));
                sustainabilityEvent.setEndAt(now.plusDays(2).plusHours(1));
                sustainabilityEvent.setLocation("DEMO LOCATION");
                sustainabilityEvent.setDataStatus("DEMO");
                sustainabilityEvent.setActive(true);

                eventRepository.save(sustainabilityEvent);
            }
        };
    }

    private void initializeDemoPlaces() {
        // Names and coordinates are aligned with the frontend's DEMO_PLACES catalog.
        // Coordinates are referenced to OpenStreetMap/Nominatim; descriptions are editorial summaries.
        // Opening hours and event/pavilion information remain unverified demo data.
        createPlaceIfMissing("plc_masmak", "قصر المصمك", "Masmak Fortress", "الحصن الطيني الذي بدأت منه قصة الرياض الحديثة.", "The clay fort where the story of modern Riyadh began.", "heritage,museums", 24.631249, 46.7133285, 60, "الرياض", "Riyadh", "الديرة", "Al-Dirah", "osm:way/1385940120 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_national_museum", "المتحف الوطني السعودي", "National Museum of Saudi Arabia", "المتحف الوطني السعودي", "National Museum of Saudi Arabia", "museums,culture,family", 24.6471421, 46.7107035, 90, "الرياض", "Riyadh", "المربع", "Al-Murabba", "osm:relation/6196003 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_murabba", "قصر المربع", "Murabba Palace", "قصر المربع", "Murabba Palace", "heritage", 24.646465, 46.7091452, 45, "الرياض", "Riyadh", "المربع", "Al-Murabba", "osm:relation/239102 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_souq_zal", "سوق الزل", "Souq Al-Zal", "سوق الزل", "Souq Al-Zal", "shopping,heritage", 24.628967, 46.7122379, 60, "الرياض", "Riyadh", "الديرة", "Al-Dirah", "osm:node/11871539704 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_turaif", "حي الطريف", "At-Turaif District", "موقع تراث عالمي لليونسكو ومهد الدولة السعودية الأولى.", "UNESCO World Heritage Site and birthplace of the first Saudi state.", "heritage,culture", 24.7329962, 46.5733836, 120, "الدرعية", "Diriyah", "", "", "osm:way/978220391 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_bujairi", "مطلات البجيري", "Al-Bujairi Terrace", "مطاعم ومقاهٍ مطلة على حي الطريف.", "Restaurants and cafés facing At-Turaif.", "food,culture", 24.7357874, 46.5758635, 90, "الدرعية", "Diriyah", "البجيري", "Al-Bujairi", "osm:way/332170438 — Al-Bujairi neighbourhood (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_edge_world", "حافة العالم", "Edge of the World", "منحدرات شاهقة فوق قاع بحر قديم.", "Sheer cliffs above an ancient seabed.", "nature", 24.9472016, 45.9910088, 300, "محافظة حريملاء", "Huraymila", "جبل فهرين", "Jebel Fihrayn", "osm:node/11838399969 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_kingdom_centre", "برج المملكة — جسر السماء", "Kingdom Centre Sky Bridge", "إطلالة على المدينة من الجسر قرب قمة برج المملكة.", "City views from the bridge near the top of Kingdom Centre.", "entertainment", 24.711351, 46.6744121, 60, "الرياض", "Riyadh", "العليا", "Al-Olaya", "osm:way/264745922 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_kafd", "مركز الملك عبدالله المالي", "King Abdullah Financial District", "أبراج حديثة وممرات مشاة ومحطة مترو مميزة.", "Modern towers, pedestrian walkways and a landmark metro station.", "entertainment,culture", 24.7656964, 46.6407087, 75, "الرياض", "Riyadh", "العقيق", "Al-Aqiq", "osm:way/1220645868 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_king_abdullah_park", "حديقة الملك عبدالله", "King Abdullah Park", "حديقة عائلية كبيرة بمساحات خضراء ونافورة راقصة.", "A large family park with lawns and a musical fountain.", "family,nature", 24.6665593, 46.7369593, 90, "الرياض", "Riyadh", "الملز", "Al-Malaz", "osm:way/441769548 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_hegra", "الحِجر", "Hegra", "الحِجر", "Hegra", "heritage,culture", 26.7913624, 37.9598891, 240, "العُلا", "AlUla", "", "", "osm:way/849621507 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_historic_jeddah", "جدة التاريخية (البلد)", "Historic Jeddah (Al-Balad)", "بيوت من الحجر المرجاني برواشين خشبية.", "Coral-stone houses with wooden rawasheen balconies.", "heritage,culture,shopping", 21.4865419, 39.1840388, 180, "جدة", "Jeddah", "", "", "osm:way/1192695373 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_soudah", "منتزه السودة", "Al-Soudah Park", "هواء جبلي بارد وغابات عرعر فوق أبها.", "Cool mountain air and juniper forests above Abha.", "nature,family", 18.2761525, 42.364419, 240, "أبها", "Abha", "السودة", "Al-Soudah", "osm:node/6914190930 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_salam_park", "منتزه السلام", "Salam Park", "بحيرة ونخيل ومساحات خضراء قرب وسط الرياض القديم.", "A lake, palms and lawns close to old central Riyadh.", "nature,family", 24.6200169, 46.7083465, 60, "الرياض", "Riyadh", "الدحو", "Ad Dahu", "osm:way/53158347 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_faisaliah", "برج الفيصلية", "Al Faisaliah Center", "برج الفيصلية", "Al Faisaliah Center", "entertainment,shopping", 24.6900359, 46.6852118, 60, "الرياض", "Riyadh", "العليا", "Al-Olaya", "osm:way/177667555 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_elephant_rock", "جبل الفيل", "Elephant Rock", "صخرة رملية ضخمة على هيئة فيل في صحراء العُلا.", "A huge sandstone rock shaped like an elephant in the AlUla desert.", "nature", 26.6893446, 37.981547, 60, "العُلا", "AlUla", "", "", "osm:way/787880717 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_al_qarah", "جبل القارة", "Al-Qarah Mountain", "جبل من الصخر الجيري بكهوف وممرات ضيقة في واحة الأحساء.", "A limestone hill with caves and narrow passages in the Al-Ahsa Oasis.", "nature,heritage", 25.4098032, 49.6878785, 90, "الأحساء", "Al-Ahsa", "الهفوف", "Al-Hofuf", "osm:way/108128467 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_rijal_almaa", "قرية رجال ألمع التراثية", "Rijal Almaa Heritage Village", "بيوت حجرية متعددة الأدوار بنوافذ ملوّنة في جبال عسير.", "Multi-storey stone houses with colourful windows in the Asir mountains.", "heritage,culture", 18.2124594, 42.2734154, 120, "رجال ألمع", "Rijal Almaa", "عسير", "Asir", "osm:node/7160717585 (Nominatim, 2026-10-11)", true, false, false);
        createPlaceIfMissing("plc_king_fahd_fountain", "نافورة الملك فهد", "King Fahd's Fountain", "من أعلى النوافير في العالم، تُرى من كورنيش جدة.", "One of the world's tallest fountains, seen from Jeddah's Corniche.", "entertainment,family", 21.5156595, 39.1450461, 45, "جدة", "Jeddah", "الكورنيش", "Corniche", "osm:node/3098654094 (Nominatim, 2026-10-11)", true, false, false);
    }

    private void createPlaceIfMissing(String id, String nameAr, String nameEn,
                                      String descriptionAr, String descriptionEn, String category,
                                      double latitude, double longitude, int duration,
                                      String cityAr, String cityEn, String districtAr, String districtEn,
                                      String locationSource, boolean familyFriendly, boolean indoor,
                                      boolean freeEntry) {
        // Upsert the curated catalog so existing four-place demo rows are refreshed too.
        TourismPlace place = tourismPlaceRepository.findByExternalIdAndActiveTrue(id)
                .orElseGet(TourismPlace::new);
        place.setExternalId(id);
        place.setNameAr(nameAr);
        place.setNameEn(nameEn);
        place.setDescriptionAr(descriptionAr);
        place.setDescriptionEn(descriptionEn);
        place.setCategory(category);
        place.setLatitude(latitude);
        place.setLongitude(longitude);
        place.setVisitDurationMinutes(duration);
        place.setCityAr(cityAr);
        place.setCityEn(cityEn);
        place.setDistrictAr(districtAr);
        place.setDistrictEn(districtEn);
        place.setRegionCode(("الرياض".equals(cityAr) || "الدرعية".equals(cityAr)) ? "riyadh" : "saudi");
        place.setLocationSource(locationSource);
        place.setFamilyFriendly(familyFriendly);
        place.setIndoor(indoor);
        place.setFreeEntry(freeEntry);
        place.setFeatured(false);
        place.setDataStatus("DEMO");
        place.setActive(true);
        tourismPlaceRepository.save(place);
    }
}
