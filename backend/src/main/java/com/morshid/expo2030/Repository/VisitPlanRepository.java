
package com.morshid.expo2030.Repository;

import com.morshid.expo2030.Model.VisitPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VisitPlanRepository extends JpaRepository<VisitPlan, Long> {

    List<VisitPlan> findAllByUser_UserId(Long userId);
}
