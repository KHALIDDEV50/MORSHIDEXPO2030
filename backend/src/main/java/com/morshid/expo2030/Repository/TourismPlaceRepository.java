
package com.morshid.expo2030.Repository;

import com.morshid.expo2030.Model.TourismPlace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TourismPlaceRepository
        extends JpaRepository<TourismPlace, Long> {

    List<TourismPlace> findByActiveTrue();

    List<TourismPlace> findByCategoryIgnoreCaseAndActiveTrue(String category);

    List<TourismPlace> findByNameArContainingIgnoreCaseAndActiveTrue(String nameAr);

    java.util.Optional<TourismPlace> findByExternalIdAndActiveTrue(String externalId);
}
