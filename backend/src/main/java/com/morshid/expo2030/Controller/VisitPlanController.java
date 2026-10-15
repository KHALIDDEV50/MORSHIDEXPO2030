
package com.morshid.expo2030.Controller;

import com.morshid.expo2030.DTO.*;
import com.morshid.expo2030.Service.VisitPlanService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/visit-plans")
@AllArgsConstructor
public class VisitPlanController {

    private final VisitPlanService visitPlanService;

    // 1. Create plan
    @PostMapping("/add")
    public ResponseEntity<VisitPlanResponseDTO> createVisitPlan(@Valid @RequestBody VisitPlanRequestDTO request) {

        return ResponseEntity.status(HttpStatus.CREATED).body(visitPlanService.createVisitPlan(request));
    }

    // 2. Get all plans
    @GetMapping("/get")
    public ResponseEntity<List<VisitPlanResponseDTO>> getAllVisitPlans() {
        return ResponseEntity.ok(visitPlanService.getAllVisitPlans());
    }

    // 3. Get plan by ID
    @GetMapping("/get/{planId}")
    public ResponseEntity<VisitPlanResponseDTO> getVisitPlanById(@PathVariable Long planId) {

        return ResponseEntity.ok(visitPlanService.getVisitPlanById(planId));
    }

    // 4. Get plans by user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<VisitPlanResponseDTO>> getVisitPlansByUser(
            @PathVariable Long userId) {

        return ResponseEntity.ok(visitPlanService.getVisitPlansByUserId(userId));
    }

    // 5. Update plan
    @PutMapping("/update/{planId}")
    public ResponseEntity<VisitPlanResponseDTO> updateVisitPlan(
            @PathVariable Long planId,
            @Valid @RequestBody VisitPlanUpdateRequestDTO request) {

        return ResponseEntity.ok(visitPlanService.updateVisitPlan(planId, request));
    }

    // 6. Delete plan
    @DeleteMapping("/delete/{planId}")
    public ResponseEntity<Void> deleteVisitPlan(@PathVariable Long planId) {

        visitPlanService.deleteVisitPlan(planId);
        return ResponseEntity.noContent().build();
    }

    // 7. Add booth to plan
    @PostMapping("/{planId}/items/add")
    public ResponseEntity<VisitPlanResponseDTO> addBoothToPlan(@PathVariable Long planId, @Valid @RequestBody VisitPlanItemRequestDTO request) {

        return ResponseEntity.status(HttpStatus.CREATED).body(visitPlanService.addBoothToPlan(planId, request));
    }

    // 8. Remove booth from plan
    @DeleteMapping("/{planId}/items/{itemId}")
    public ResponseEntity<VisitPlanResponseDTO> removeBoothFromPlan(@PathVariable Long planId, @PathVariable Long itemId) {

        return ResponseEntity.ok(
                visitPlanService.removeBoothFromPlan(planId, itemId));
    }

    // 9. Reorder booths
    @PutMapping("/{planId}/items/reorder")
    public ResponseEntity<VisitPlanResponseDTO> reorderItems(
            @PathVariable Long planId,
            @Valid @RequestBody VisitPlanReorderRequestDTO request) {

        return ResponseEntity.ok(
                visitPlanService.reorderItems(planId, request));
    }

    // 10. Update booth status
    @PutMapping("/{planId}/items/{itemId}/status")
    public ResponseEntity<VisitPlanResponseDTO> updateItemStatus(
            @PathVariable Long planId,
            @PathVariable Long itemId,
            @Valid @RequestBody VisitPlanItemStatusRequestDTO request) {

        return ResponseEntity.ok(
                visitPlanService.updateItemStatus(
                        planId, itemId, request));
    }
}
