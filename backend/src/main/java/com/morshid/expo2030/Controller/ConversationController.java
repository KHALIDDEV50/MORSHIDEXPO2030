
package com.morshid.expo2030.Controller;

import com.morshid.expo2030.DTO.*;
import com.morshid.expo2030.Service.ConversationService;
import com.morshid.expo2030.DTO.ConversationDetailsResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @PostMapping
    public ResponseEntity<ConversationResponseDTO> createConversation(
            @Valid @RequestBody CreateConversationRequestDTO request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conversationService.createConversation(request));
    }

    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<List<MessageResponseDTO>> sendMessage(
            @PathVariable Long conversationId,
            @Valid @RequestBody SendMessageRequestDTO request) {

        return ResponseEntity.ok(
                conversationService.sendMessage(conversationId, request));
    }

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<MessageResponseDTO>> getMessages(
            @PathVariable Long conversationId) {

        return ResponseEntity.ok(
                conversationService.getMessages(conversationId));
    }


    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ConversationResponseDTO>> getUserConversations(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                conversationService.getUserConversations(userId)
        );
    }


    @GetMapping("/{conversationId}")
    public ResponseEntity<ConversationDetailsResponseDTO> getConversationDetails(
            @PathVariable Long conversationId) {

        return ResponseEntity.ok(
                conversationService.getConversationDetails(conversationId)
        );
    }



    @DeleteMapping("/{conversationId}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable Long conversationId) {

        conversationService.deleteConversation(conversationId);
        return ResponseEntity.noContent().build();
    }


}
