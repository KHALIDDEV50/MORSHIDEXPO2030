
package com.morshid.expo2030.Service;

import com.morshid.expo2030.API.ApiException;
import com.morshid.expo2030.DTO.*;
import com.morshid.expo2030.Model.*;
import com.morshid.expo2030.Repository.*;
import com.morshid.expo2030.Service.AI.AIProvider;
import com.morshid.expo2030.DTO.ConversationDetailsResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final AICharacterRepository aiCharacterRepository;
    private final UserRepository userRepository;
    private final AIProvider aiProvider;

    @Value("${morshid.ai.provider:demo}")
    private String providerName;

    @Transactional
    public ConversationResponseDTO createConversation(
            CreateConversationRequestDTO request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ApiException("User not found"));

        AICharacter character = aiCharacterRepository
                .findById(request.getCharacterId())
                .orElseThrow(() ->
                        new ApiException("AI character not found"));

        if (!Boolean.TRUE.equals(character.getActive())) {
            throw new ApiException("AI character is not active");
        }

        Conversation conversation = new Conversation();
        conversation.setUser(user);
        conversation.setAiCharacter(character);
        conversation.setTitle(request.getTitle());

        Conversation saved = conversationRepository.save(conversation);

        return new ConversationResponseDTO(
                saved.getConversationId(),
                user.getUserId(),
                character.getCharacterId(),
                character.getName(),
                saved.getTitle(),
                saved.getCreatedAt()
        );
    }

    @Transactional
    public List<MessageResponseDTO> sendMessage(
            Long conversationId,
            SendMessageRequestDTO request) {

        Conversation conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() ->
                        new ApiException("Conversation not found"));

        AICharacter character = conversation.getAiCharacter();
        String userText = request.getMessage().trim();

        Message userMessage = new Message();
        userMessage.setConversation(conversation);
        userMessage.setRole("USER");
        userMessage.setContent(userText);
        messageRepository.save(userMessage);

        String assistantText = aiProvider.generateResponse(
                character.getCode(),
                character.getName(),
                character.getDescription(),
                userText
        );

        Message assistantMessage = new Message();
        assistantMessage.setConversation(conversation);
        assistantMessage.setRole("ASSISTANT");
        assistantMessage.setContent(assistantText);
        messageRepository.save(assistantMessage);

        return messageRepository
                .findByConversation_ConversationIdOrderByCreatedAtAsc(
                        conversationId)
                .stream()
                .map(this::mapToMessageDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MessageResponseDTO> getMessages(Long conversationId) {

        if (!conversationRepository.existsById(conversationId)) {
            throw new ApiException("Conversation not found");
        }

        return messageRepository
                .findByConversation_ConversationIdOrderByCreatedAtAsc(
                        conversationId)
                .stream()
                .map(this::mapToMessageDTO)
                .toList();
    }

    private MessageResponseDTO mapToMessageDTO(Message message) {
        return new MessageResponseDTO(
                message.getMessageId(),
                message.getConversation().getConversationId(),
                message.getRole(),
                message.getContent(),
                message.getCreatedAt()
        );
    }


    @Transactional(readOnly = true)
    public List<ConversationResponseDTO> getUserConversations(Long userId) {

        if (!userRepository.existsById(userId)) {
            throw new ApiException("User not found");
        }

        return conversationRepository
                .findByUser_UserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(conversation -> new ConversationResponseDTO(
                        conversation.getConversationId(),
                        conversation.getUser().getUserId(),
                        conversation.getAiCharacter().getCharacterId(),
                        conversation.getAiCharacter().getName(),
                        conversation.getTitle(),
                        conversation.getCreatedAt()
                ))
                .toList();
    }

    //...

    @Transactional(readOnly = true)
    public ConversationDetailsResponseDTO getConversationDetails(
            Long conversationId) {

        Conversation conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() ->
                        new ApiException("Conversation not found"));

        List<MessageResponseDTO> messages = messageRepository
                .findByConversation_ConversationIdOrderByCreatedAtAsc(
                        conversationId)
                .stream()
                .map(this::mapToMessageDTO)
                .toList();

        return new ConversationDetailsResponseDTO(
                conversation.getConversationId(),
                conversation.getUser().getUserId(),
                conversation.getAiCharacter().getCharacterId(),
                conversation.getAiCharacter().getName(),
                conversation.getTitle(),
                conversation.getCreatedAt(),
                messages
        );
    }


    @Transactional
    public void deleteConversation(Long conversationId) {

        Conversation conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() ->
                        new ApiException("Conversation not found"));

        // حذف الرسائل المرتبطة أولًا
        messageRepository.deleteByConversation_ConversationId(conversationId);

        // ثم حذف المحادثة
        conversationRepository.delete(conversation);
    }


}
