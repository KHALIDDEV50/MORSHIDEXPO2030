package com.morshid.expo2030.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Allowed frontend origins (comma-separated patterns). Defaults cover local Next.js dev (port 3000),
     * Expo web (8081) and Vercel; set MORSHID_CORS_ALLOWED_ORIGINS to add the production domain.
     */
    @Value("${morshid.cors.allowed-origins:http://localhost:*,http://127.0.0.1:*,https://*.vercel.app}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/v1/**")
                .allowedOriginPatterns(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
