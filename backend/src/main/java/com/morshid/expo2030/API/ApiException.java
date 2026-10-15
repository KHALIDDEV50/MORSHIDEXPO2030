package com.morshid.expo2030.API;

import lombok.Getter;

/**
 * Custom application exception for MORSHID Expo2030.
 */
@Getter
public class ApiException extends RuntimeException {

    // Creates an application exception with a readable message
    public ApiException(String message) {
        super(message);
    }
}