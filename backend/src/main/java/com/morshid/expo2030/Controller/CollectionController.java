package com.morshid.expo2030.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Collections are intentionally empty until curated collection data is added. */
@RestController
@RequestMapping("/api/v1/collections")
public class CollectionController {

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getCollections() {
        return ResponseEntity.ok(List.of());
    }
}
