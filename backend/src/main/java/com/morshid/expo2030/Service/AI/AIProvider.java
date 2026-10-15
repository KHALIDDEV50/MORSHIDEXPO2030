
package com.morshid.expo2030.Service.AI;

public interface AIProvider {

    String generateResponse(
            String characterCode,
            String characterName,
            String characterDescription,
            String userMessage
    );
}
