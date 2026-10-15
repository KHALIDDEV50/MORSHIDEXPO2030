package com.morshid.expo2030.DTO;

import java.util.List;

/** Generic paginated response expected by the frontend repositories. */
public record PageResponseDTO<T>(List<T> items, int page, int pageSize, long total) {}
