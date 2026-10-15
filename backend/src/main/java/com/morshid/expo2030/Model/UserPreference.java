
package com.morshid.expo2030.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_preferences", uniqueConstraints = {@UniqueConstraint(name = "uk_user_preference",
        columnNames = {"userId", "interestCode"})})
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long preferenceId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    @Column(nullable = false, length = 10)
    private String languageCode;

    @Column(nullable = false, length = 50)
    private String interestCode;
}
