
package com.morshid.expo2030.Service;

import com.morshid.expo2030.API.ApiException;
import com.morshid.expo2030.DTO.EventResponseDTO;
import com.morshid.expo2030.Model.Event;
import com.morshid.expo2030.Repository.EventRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    // Returns all active events as DTOs.
    public List<EventResponseDTO> getAllEvents() {
        return eventRepository.findByActiveTrue()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // Returns an active event by ID.
    public EventResponseDTO getEventById(Long eventId) {

        Event event = eventRepository.findById(eventId).orElse(null);

        if (event == null || !Boolean.TRUE.equals(event.getActive())) {
            throw new ApiException("Event not found");
        }

        return mapToDTO(event);
    }

    // Returns active events belonging to a specific pavilion.
    public List<EventResponseDTO> getEventsByPavilion(Long pavilionId) {
        return eventRepository
                .findByPavilion_PavilionIdAndActiveTrue(pavilionId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // Converts an Event entity into a response DTO.
    private EventResponseDTO mapToDTO(Event event) {

        Long pavilionId = null;
        String pavilionName = null;

        // Include pavilion details when the event has an associated pavilion.
        if (event.getPavilion() != null) {
            pavilionId = event.getPavilion().getPavilionId();
            pavilionName = event.getPavilion().getName();
        }

        return new EventResponseDTO(
                event.getEventId(),
                event.getName(),
                event.getDescription(),
                pavilionId,
                pavilionName,
                event.getStartAt(),
                event.getEndAt(),
                event.getLocation(),
                event.getDataStatus(),
                event.getActive()
        );
    }
}
