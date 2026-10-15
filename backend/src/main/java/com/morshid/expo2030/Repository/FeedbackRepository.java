
package com.morshid.expo2030.Repository;

import com.morshid.expo2030.Model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    List<Feedback> findByUser_UserIdOrderByCreatedAtDesc(Long userId);
}
