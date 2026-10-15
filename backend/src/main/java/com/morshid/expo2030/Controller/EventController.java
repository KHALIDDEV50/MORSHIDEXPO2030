
package com.morshid.expo2030.Controller;

import com.morshid.expo2030.DTO.EventResponseDTO;
import com.morshid.expo2030.Service.EventService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
@AllArgsConstructor
public class EventController {

    // Service responsible for event business logic.
    private final EventService eventService;

    // Returns all active events.
    @GetMapping("/get")
    public ResponseEntity<List<EventResponseDTO>> getAllEvents() {

        return ResponseEntity.status(200).body(eventService.getAllEvents());
    }

    // Returns an active event by ID.
    @GetMapping("/get/{eventId}")
    public ResponseEntity<EventResponseDTO> getEventById(@PathVariable Long eventId) {

        return ResponseEntity.status(200).body(eventService.getEventById(eventId));
    }

    // Returns active events belonging to a specific pavilion.
    @GetMapping("/pavilion/{pavilionId}")
    public ResponseEntity<List<EventResponseDTO>> getEventsByPavilion(@PathVariable Long pavilionId) {

        return ResponseEntity.status(200).body(eventService.getEventsByPavilion(pavilionId));
    }
}
