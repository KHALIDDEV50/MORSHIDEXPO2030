
package com.morshid.expo2030.Service.AI;

import com.morshid.expo2030.Service.ExpoCatalogService;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.JsonNode;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class DemoAIProvider implements AIProvider {

    private final ExpoCatalogService expoCatalogService;



    @Override
    public String generateResponse(
            String characterCode,
            String characterName,
            String characterDescription,
            String userMessage
    ) {
        if (userMessage == null || userMessage.isBlank()) {
            return "مرحبًا بك في MORSHID Expo2030! كيف يمكنني مساعدتك؟";
        }

        String message = userMessage.toLowerCase(Locale.ROOT);

        if (containsAny(message, "مرحبا", "السلام", "hello", "hi")) {
            return "أهلًا بك! أنا " + characterName
                    + "، كيف أساعدك في استكشاف Expo 2030؟";
        }

        if (containsAny(
                message,
                "جناح", "أجنحة", "pavilion",
                "ثقافي", "ثقافية", "الثقافة"
        )) {
            return searchBooths(characterName, userMessage);
        }

        if (containsAny(message, "فعالية", "فعاليات", "event")) {
            return "يمكنني مساعدتك في استكشاف الأجنحة المتاحة حاليًا. "
                    + "أما تفاصيل الفعاليات ومواعيدها، فيجب التحقق "
                    + "من بيانات الفعاليات المسجلة في النظام.";
        }

        if (containsAny(message, "خطة", "زيارة", "plan")) {
            return "يسعدني مساعدتك في التخطيط لزيارتك. "
                    + "ما الموضوعات التي تهمك، وكم من الوقت لديك؟";
        }

        return "أهلًا بك! أنا " + characterName
                + "، مساعدك في MORSHID Expo2030. "
                + "يمكنني مساعدتك في استكشاف الأجنحة "
                + "وتحديد اهتماماتك للزيارة.";
    }

    private String searchBooths(String characterName, String query) {

        List<JsonNode> booths = expoCatalogService.searchBooths(
                extractSearchTerm(query),
                null,
                null,
                null
        );

        if (booths.isEmpty()) {
            return "لم أجد أجنحة تطابق بحثك في البيانات الحالية. "
                    + "هل يمكنك تحديد نوع الأجنحة التي تفضلها؟";
        }

        StringBuilder response = new StringBuilder();

        response.append("مرحبًا، أنا ")
                .append(characterName)
                .append(". وجدت هذه الأجنحة في بيانات المعرض:\n");

        int limit = Math.min(booths.size(), 5);

        for (int i = 0; i < limit; i++) {
            JsonNode booth = booths.get(i);

            String name = localizedText(booth.path("name"));

            if (name.isBlank()) {
                name = booth.path("boothId").asText("جناح");
            }

            response.append("\n- ").append(name);

            String summary = localizedText(booth.path("summary"));

            if (!summary.isBlank()) {
                response.append(": ").append(summary);
            }
        }

        return response.toString();
    }

    private String extractSearchTerm(String query) {
        String normalized = query.toLowerCase(Locale.ROOT);

        if (containsAny(normalized, "ثقافي", "ثقافية", "الثقافة")) {
            return "ثقافي";
        }

        if (containsAny(normalized, "تقني", "تقنية", "التكنولوجيا")) {
            return "تقنية";
        }

        return query;
    }

    private String localizedText(JsonNode value) {
        if (value == null || value.isMissingNode() || value.isNull()) {
            return "";
        }

        if (value.isObject()) {
            String arabic = value.path("ar").asText("");

            if (!arabic.isBlank()) {
                return arabic;
            }

            return value.path("en").asText("");
        }

        return value.asText("");
    }

    private boolean containsAny(String text, String... terms) {
        for (String term : terms) {
            if (text.contains(term)) {
                return true;
            }
        }

        return false;
    }
}
