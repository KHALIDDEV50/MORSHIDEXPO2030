
package com.morshid.expo2030.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// DTO (Data Transfer Object) used to return user information through the API.
// يُستخدم لنقل بيانات المستخدم إلى الواجهة دون إرجاع كيان قاعدة البيانات مباشرة.
@Data
// Generates getters, setters, equals(), hashCode(), and toString().
// ينشئ دوال القراءة والتعديل والمقارنة وتحويل الكائن إلى نص.
@AllArgsConstructor
// Generates a constructor that accepts all fields as parameters.
// ينشئ Constructor يستقبل جميع الحقول.
@NoArgsConstructor
// Generates a constructor without parameters.
// ينشئ Constructor فارغًا دون معاملات.
public class UserResponseDTO {

    // Unique identifier of the user.
    // المعرّف الأساسي للمستخدم.
    private Long userId;

    // Full name displayed in the application.
    // اسم المستخدم الذي يمكن عرضه في التطبيق.
    private String name;

    // Username used to identify the user.
    // اسم المستخدم الذي سيُستخدم مستقبلًا عند تسجيل الدخول.
    private String username;

    // User's email address.
    // البريد الإلكتروني للمستخدم.
    private String email;
}
