
package com.morshid.expo2030.Service;

import com.morshid.expo2030.DTO.*;
import com.morshid.expo2030.Model.*;
import com.morshid.expo2030.Repository.*;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class VisitPlanService {

    private final VisitPlanRepository visitPlanRepository;
    private final VisitPlanItemRepository visitPlanItemRepository;
    private final ExpoBoothRepository expoBoothRepository;
    private final UserRepository userRepository;

    // =====================================================
    // 1. Create visit plan
    // =====================================================

    @Transactional
    public VisitPlanResponseDTO createVisitPlan(
            VisitPlanRequestDTO request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> notFound("User not found"));

        validateTimes(request.getStartAt(), request.getEndAt());

        List<String> boothIds = request.getBoothIds() == null
                ? List.of()
                : request.getBoothIds();

        if (new HashSet<>(boothIds).size() != boothIds.size()) {
            throw badRequest(
                    "Duplicate booth IDs are not allowed");
        }

        VisitPlan plan = new VisitPlan();

        plan.setUser(user);
        plan.setName(request.getName());
        plan.setPlanName(request.getPlanName());
        plan.setStartAt(request.getStartAt());
        plan.setEndAt(request.getEndAt());
        plan.setVisitDate(request.getVisitDate());
        plan.setStatus("PLANNED");

        VisitPlan savedPlan = visitPlanRepository.save(plan);

        List<VisitPlanItem> items = new ArrayList<>();

        for (int i = 0; i < boothIds.size(); i++) {

            ExpoBooth booth = findBooth(boothIds.get(i));

            if (visitPlanItemRepository
                    .existsByVisitPlan_PlanIdAndBooth_BoothId(
                            savedPlan.getPlanId(),
                            booth.getBoothId())) {
                throw badRequest(
                        "This booth is already in the plan");
            }

            VisitPlanItem item = new VisitPlanItem();

            prepareItemForPlan(
                    item,
                    savedPlan,
                    booth,
                    i + 1
            );

            items.add(item);
        }

        if (!items.isEmpty()) {
            visitPlanItemRepository.saveAll(items);
        }

        return toResponse(savedPlan, items);
    }

    // =====================================================
    // 2. Get all plans
    // =====================================================

    @Transactional
    public List<VisitPlanResponseDTO> getAllVisitPlans() {

        return visitPlanRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =====================================================
    // 3. Get plan by ID
    // =====================================================

    @Transactional
    public VisitPlanResponseDTO getVisitPlanById(Long planId) {

        VisitPlan plan = findPlan(planId);

        return toResponse(plan);
    }

    // =====================================================
    // 4. Get plans by user ID
    // =====================================================

    @Transactional
    public List<VisitPlanResponseDTO> getVisitPlansByUserId(
            Long userId) {

        if (!userRepository.existsById(userId)) {
            throw notFound("User not found");
        }

        return visitPlanRepository.findAllByUser_UserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =====================================================
    // 5. Update plan
    // =====================================================

    @Transactional
    public VisitPlanResponseDTO updateVisitPlan(
            Long planId,
            VisitPlanUpdateRequestDTO request) {

        VisitPlan plan = findPlan(planId);

        if (request.getName() != null) {
            plan.setName(request.getName());
        }

        if (request.getPlanName() != null) {
            plan.setPlanName(request.getPlanName());
        }

        if (request.getStartAt() != null) {
            plan.setStartAt(request.getStartAt());
        }

        if (request.getEndAt() != null) {
            plan.setEndAt(request.getEndAt());
        }

        if (request.getVisitDate() != null) {
            plan.setVisitDate(request.getVisitDate());
        }

        if (request.getStatus() != null) {
            plan.setStatus(request.getStatus());
        }

        validateTimes(plan.getStartAt(), plan.getEndAt());

        VisitPlan savedPlan = visitPlanRepository.save(plan);

        // Keep every existing item synchronized with plan times.
        synchronizeItemTimes(savedPlan);

        return toResponse(savedPlan);
    }

    // =====================================================
    // 6. Delete plan and its items
    // =====================================================

    @Transactional
    public void deleteVisitPlan(Long planId) {

        VisitPlan plan = findPlan(planId);

        visitPlanItemRepository
                .deleteAllByVisitPlan_PlanId(planId);

        visitPlanRepository.delete(plan);
    }

    // =====================================================
    // 7. Add booth to plan
    // =====================================================

    @Transactional
    public VisitPlanResponseDTO addBoothToPlan(
            Long planId,
            VisitPlanItemRequestDTO request) {

        VisitPlan plan = findPlan(planId);

        // Validate before creating an item.
        validateTimes(plan.getStartAt(), plan.getEndAt());

        ExpoBooth booth = findBooth(request.getBoothId());

        boolean alreadyExists =
                visitPlanItemRepository
                        .existsByVisitPlan_PlanIdAndBooth_BoothId(
                                planId,
                                booth.getBoothId());

        if (alreadyExists) {
            throw badRequest(
                    "This booth is already in the plan");
        }

        List<VisitPlanItem> items =
                visitPlanItemRepository
                        .findAllByVisitPlan_PlanIdOrderBySequenceNumberAsc(
                                planId);

        VisitPlanItem item = new VisitPlanItem();

        prepareItemForPlan(
                item,
                plan,
                booth,
                items.size() + 1
        );

        visitPlanItemRepository.save(item);

        return toResponse(plan);
    }

    // =====================================================
    // 8. Remove booth from plan
    // =====================================================

    @Transactional
    public VisitPlanResponseDTO removeBoothFromPlan(
            Long planId,
            Long itemId) {

        VisitPlan plan = findPlan(planId);

        VisitPlanItem item = visitPlanItemRepository
                .findByItemIdAndVisitPlan_PlanId(itemId, planId)
                .orElseThrow(() ->
                        notFound("Visit plan item not found"));

        visitPlanItemRepository.delete(item);
        visitPlanItemRepository.flush();

        resequenceItems(planId);

        return toResponse(plan);
    }

    // =====================================================
    // 9. Reorder booths
    // =====================================================

    @Transactional
    public VisitPlanResponseDTO reorderItems(
            Long planId,
            VisitPlanReorderRequestDTO request) {

        VisitPlan plan = findPlan(planId);

        List<VisitPlanItem> items =
                visitPlanItemRepository
                        .findAllByVisitPlan_PlanIdOrderBySequenceNumberAsc(
                                planId);

        List<Long> requestedIds = request.getItemIds();

        if (requestedIds == null) {
            throw badRequest("Item IDs are required");
        }

        if (new HashSet<>(requestedIds).size()
                != requestedIds.size()) {
            throw badRequest(
                    "Duplicate item IDs are not allowed");
        }

        Set<Long> currentIds = items.stream()
                .map(VisitPlanItem::getItemId)
                .collect(Collectors.toSet());

        if (requestedIds.size() != currentIds.size()
                || !currentIds.equals(new HashSet<>(requestedIds))) {
            throw badRequest(
                    "Provide every item ID in this plan exactly once");
        }

        Map<Long, VisitPlanItem> itemMap = items.stream()
                .collect(Collectors.toMap(
                        VisitPlanItem::getItemId,
                        Function.identity()
                ));

        int offset = items.size() + 1000;

        // Temporary sequence numbers avoid unique-key conflicts.
        for (int i = 0; i < requestedIds.size(); i++) {
            itemMap.get(requestedIds.get(i))
                    .setSequenceNumber(offset + i);
        }

        visitPlanItemRepository.saveAllAndFlush(items);

        // Apply final sequence numbers.
        for (int i = 0; i < requestedIds.size(); i++) {
            itemMap.get(requestedIds.get(i))
                    .setSequenceNumber(i + 1);
        }

        visitPlanItemRepository.saveAllAndFlush(items);

        return toResponse(plan);
    }

    // =====================================================
    // 10. Update booth visit status
    // =====================================================

    @Transactional
    public VisitPlanResponseDTO updateItemStatus(
            Long planId,
            Long itemId,
            VisitPlanItemStatusRequestDTO request) {

        VisitPlan plan = findPlan(planId);

        VisitPlanItem item = visitPlanItemRepository
                .findByItemIdAndVisitPlan_PlanId(itemId, planId)
                .orElseThrow(() ->
                        notFound("Visit plan item not found"));

        if (request.getStatus() == null
                || request.getStatus().isBlank()) {
            throw badRequest("Item status is required");
        }

        item.setStatus(request.getStatus());

        // Preserve required time fields before saving.
        applyPlanTimes(item, plan);

        visitPlanItemRepository.save(item);

        return toResponse(plan);
    }

    // =====================================================
    // 11. Find plan
    // =====================================================

    private VisitPlan findPlan(Long planId) {

        return visitPlanRepository.findById(planId)
                .orElseThrow(() ->
                        notFound("Visit plan not found"));
    }

    // =====================================================
    // 12. Find booth
    // =====================================================

    private ExpoBooth findBooth(String boothId) {

        return expoBoothRepository.findById(boothId)
                .orElseThrow(() ->
                        notFound("Booth not found: " + boothId));
    }

    // =====================================================
    // 13. Validate plan times
    // =====================================================

    private void validateTimes(
            java.time.LocalDateTime startAt,
            java.time.LocalDateTime endAt) {

        if (startAt == null || endAt == null) {
            throw badRequest(
                    "Start time and end time are required. "
                            + "Check the VisitPlan startAt/endAt mapping "
                            + "and the saved plan data.");
        }

        if (!endAt.isAfter(startAt)) {
            throw badRequest(
                    "End time must be after start time");
        }
    }

    // =====================================================
    // 14. Prepare a new item
    // =====================================================

    private void prepareItemForPlan(
            VisitPlanItem item,
            VisitPlan plan,
            ExpoBooth booth,
            int sequenceNumber) {

        validateTimes(plan.getStartAt(), plan.getEndAt());

        item.setVisitPlan(plan);
        item.setBooth(booth);
        item.setSequenceNumber(sequenceNumber);
        item.setStatus("PENDING");

        applyPlanTimes(item, plan);

        item.setTargetType("BOOTH");
        item.setTargetId(null);
        item.setNotes(null);
    }

    // =====================================================
    // 15. Apply plan times to an item
    // =====================================================

    private void applyPlanTimes(
            VisitPlanItem item,
            VisitPlan plan) {

        validateTimes(plan.getStartAt(), plan.getEndAt());

        item.setStartAt(plan.getStartAt());
        item.setEndAt(plan.getEndAt());
    }

    // =====================================================
    // 16. Synchronize existing item times after plan update
    // =====================================================

    private void synchronizeItemTimes(VisitPlan plan) {

        validateTimes(plan.getStartAt(), plan.getEndAt());

        List<VisitPlanItem> items =
                visitPlanItemRepository
                        .findAllByVisitPlan_PlanIdOrderBySequenceNumberAsc(
                                plan.getPlanId());

        for (VisitPlanItem item : items) {
            applyPlanTimes(item, plan);
        }

        if (!items.isEmpty()) {
            visitPlanItemRepository.saveAll(items);
        }
    }

    // =====================================================
    // 17. Resequence items after deletion
    // =====================================================

    private void resequenceItems(Long planId) {

        List<VisitPlanItem> items =
                visitPlanItemRepository
                        .findAllByVisitPlan_PlanIdOrderBySequenceNumberAsc(
                                planId);

        if (items.isEmpty()) {
            return;
        }

        // Move to temporary numbers first to avoid unique conflicts.
        int offset = items.size() + 1000;

        for (int i = 0; i < items.size(); i++) {
            items.get(i).setSequenceNumber(offset + i);
        }

        visitPlanItemRepository.saveAllAndFlush(items);

        for (int i = 0; i < items.size(); i++) {
            items.get(i).setSequenceNumber(i + 1);
        }

        visitPlanItemRepository.saveAllAndFlush(items);
    }

    // =====================================================
    // 18. Convert entity to response DTO
    // =====================================================

    private VisitPlanResponseDTO toResponse(VisitPlan plan) {

        List<VisitPlanItem> items =
                visitPlanItemRepository
                        .findAllByVisitPlan_PlanIdOrderBySequenceNumberAsc(
                                plan.getPlanId());

        return toResponse(plan, items);
    }

    private VisitPlanResponseDTO toResponse(
            VisitPlan plan,
            List<VisitPlanItem> items) {

        VisitPlanResponseDTO response =
                new VisitPlanResponseDTO();

        response.setPlanId(plan.getPlanId());
        response.setPlanName(plan.getPlanName());
        response.setVisitDate(plan.getVisitDate());
        response.setStatus(plan.getStatus());
        response.setCreatedAt(plan.getCreatedAt());

        List<VisitPlanItemResponseDTO> itemDTOs =
                items.stream()
                        .map(item -> {

                            VisitPlanItemResponseDTO dto =
                                    new VisitPlanItemResponseDTO();

                            dto.setItemId(item.getItemId());
                            dto.setBoothId(
                                    item.getBooth().getBoothId());
                            dto.setBoothNumber(
                                    item.getBooth().getBoothNumber());
                            dto.setCategory(
                                    item.getBooth().getCategory());
                            dto.setSequenceNumber(
                                    item.getSequenceNumber());
                            dto.setStatus(item.getStatus());
                            dto.setSuggestedDurationMin(
                                    item.getBooth()
                                            .getSuggestedDurationMin());

                            return dto;
                        })
                        .toList();

        response.setItems(itemDTOs);

        return response;
    }

    // =====================================================
    // 19. Exception helpers
    // =====================================================

    private ResponseStatusException notFound(String message) {

        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                message);
    }

    private ResponseStatusException badRequest(String message) {

        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                message);
    }
}
