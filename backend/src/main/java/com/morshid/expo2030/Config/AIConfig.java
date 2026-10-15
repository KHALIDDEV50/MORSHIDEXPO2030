package com.morshid.expo2030.Config;

import com.morshid.expo2030.Service.AI.AIProvider;
import com.morshid.expo2030.Service.AI.DemoAIProvider;
import com.morshid.expo2030.Service.AI.OpenAIProvider;
import com.morshid.expo2030.Service.ExpoCatalogService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AIConfig {

    @Bean
    public AIProvider aiProvider(
            ExpoCatalogService expoCatalogService,
            @Value("${morshid.ai.provider:demo}") String provider,
            @Value("${morshid.ai.openai.api-key:}") String apiKey,
            @Value("${morshid.ai.openai.model:gpt-5-mini}") String model
    ) {

        // عرض مزود الذكاء الاصطناعي المستخدم
        System.out.println("AI PROVIDER = " + provider);

        if ("demo".equalsIgnoreCase(provider)) {
            return new DemoAIProvider(expoCatalogService);
        }

        if ("openai".equalsIgnoreCase(provider)) {

            if (apiKey == null || apiKey.isBlank()) {
                throw new IllegalStateException(
                        "OpenAI API key is missing. " +
                                "Please set OPENAI_API_KEY."
                );
            }

            return new OpenAIProvider(
                    expoCatalogService,
                    apiKey,
                    model
            );
        }

        throw new IllegalArgumentException(
                "Unsupported AI provider: " + provider
        );
    }
}