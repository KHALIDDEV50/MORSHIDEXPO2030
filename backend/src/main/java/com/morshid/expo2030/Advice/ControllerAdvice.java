
package com.morshid.expo2030.Advice;

import com.morshid.expo2030.API.ApiException;
import com.morshid.expo2030.API.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/**
 * Centralized exception handling for MORSHID Expo2030.
 * All handled exceptions return a consistent ApiResponse structure.
 */
@RestControllerAdvice
public class ControllerAdvice {

    // Application Exception
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse> handleApiException(ApiException e) {

        String message = e.getMessage();
        HttpStatus status = HttpStatus.BAD_REQUEST;

        if (message != null
                && message.toLowerCase().contains("not found")) {
            status = HttpStatus.NOT_FOUND;
        } else if (message != null
                && message.toLowerCase().contains("already exists")) {
            status = HttpStatus.CONFLICT;
        }

        return ResponseEntity.status(status)
                .body(new ApiResponse(message, null));
    }

    // Response Status Exception (404, 400, etc.)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse> handleResponseStatusException(
            ResponseStatusException e) {

        HttpStatus status = HttpStatus.valueOf(
                e.getStatusCode().value()
        );

        String message = e.getReason() != null
                ? e.getReason()
                : status.getReasonPhrase();

        return ResponseEntity.status(status)
                .body(new ApiResponse(message, null));
    }

    // Validation Exception
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidationException(
            MethodArgumentNotValidException e) {

        String message = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": "
                        + error.getDefaultMessage())
                .findFirst()
                .orElse("Validation failed");

        return ResponseEntity.badRequest()
                .body(new ApiResponse(message, null));
    }

    // Constraint Violation Exception
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse> handleConstraintViolationException(
            ConstraintViolationException e) {

        return ResponseEntity.badRequest()
                .body(new ApiResponse(e.getMessage(), null));
    }

    // Database Exception
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse> handleDataIntegrityViolationException(
            DataIntegrityViolationException e) {

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse(
                        "Database constraint violation",
                        null
                ));
    }

    // Invalid JSON Request Exception
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse> handleInvalidJsonException(
            HttpMessageNotReadableException e) {

        return ResponseEntity.badRequest()
                .body(new ApiResponse(
                        "Invalid JSON request",
                        null
                ));
    }

    // Unsupported HTTP Method Exception
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse> handleMethodNotSupportedException(
            HttpRequestMethodNotSupportedException e) {

        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ApiResponse(
                        "HTTP method not supported",
                        null
                ));
    }

    // General Exception
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleException(Exception e) {

        e.printStackTrace();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse(
                        "Internal server error",
                        null
                ));
    }
}
