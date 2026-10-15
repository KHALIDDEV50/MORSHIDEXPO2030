
package com.morshid.expo2030.Repository;

import com.morshid.expo2030.Model.UserPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserPreferenceRepository extends JpaRepository<UserPreference, Long> {

    List<UserPreference> findByUser_UserId(Long userId);

    boolean existsByUser_UserIdAndInterestCode(Long userId, String interestCode);
}
