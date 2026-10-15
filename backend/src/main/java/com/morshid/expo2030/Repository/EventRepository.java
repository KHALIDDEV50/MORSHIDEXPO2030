
package com.morshid.expo2030.Repository;

import com.morshid.expo2030.Model.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByActiveTrue();

    List<Event> findByPavilion_PavilionIdAndActiveTrue(Long pavilionId);
}
