
package com.morshid.expo2030.Model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "visit_plan_items",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_plan_booth",
                        columnNames = {"plan_id", "booth_id"}
                ),
                @UniqueConstraint(
                        name = "uk_plan_sequence",
                        columnNames = {"plan_id", "sequence_number"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VisitPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Long itemId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private VisitPlan visitPlan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booth_id", nullable = false)
    private ExpoBooth booth;

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "PENDING";

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at", nullable = false)
    private LocalDateTime endAt;

    @Column(name = "target_type", nullable = false, length = 30)
    private String targetType = "BOOTH";

    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "notes", length = 500)
    private String notes;
}
