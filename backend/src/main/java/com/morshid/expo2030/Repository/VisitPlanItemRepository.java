
package com.morshid.expo2030.Repository;

import com.morshid.expo2030.Model.VisitPlanItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VisitPlanItemRepository
        extends JpaRepository<VisitPlanItem, Long> {

    List<VisitPlanItem> findAllByVisitPlan_PlanIdOrderBySequenceNumberAsc(Long planId);

    boolean existsByVisitPlan_PlanIdAndBooth_BoothId(Long planId, String boothId);

    Optional<VisitPlanItem> findByItemIdAndVisitPlan_PlanId(Long itemId, Long planId);

    void deleteAllByVisitPlan_PlanId(Long planId);
}
