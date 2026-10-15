
package com.morshid.expo2030.Controller;

import com.morshid.expo2030.DTO.UserResponseDTO;
import com.morshid.expo2030.Service.UserService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@AllArgsConstructor
public class UserController {

    // Service responsible for user business logic.
    // الخدمة المسؤولة عن منطق العمل الخاص بالمستخدمين.
    private final UserService userService;

    // Returns all users as DTOs with HTTP 200 OK.
    // إرجاع جميع المستخدمين باستخدام DTO مع حالة HTTP 200.
    @GetMapping("/get")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {

        return ResponseEntity.status(200).body(userService.getAllUsers());
    }

    // Returns a user by ID with HTTP 200 OK.
    // إرجاع مستخدم محدد باستخدام المعرّف.
    @GetMapping("/get/{userId}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long userId) {

        return ResponseEntity.status(200).body(userService.getUserById(userId));
    }
}
