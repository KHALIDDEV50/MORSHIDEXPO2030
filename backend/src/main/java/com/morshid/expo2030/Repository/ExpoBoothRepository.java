package com.morshid.expo2030.Repository;

import com.morshid.expo2030.Model.ExpoBooth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpoBoothRepository extends JpaRepository<ExpoBooth, String> {

    List<ExpoBooth> findByCategory(String category);

    List<ExpoBooth> findByZone_ZoneId(String zoneId);

    List<ExpoBooth> findByZone_ZoneIdAndCategory(String zoneId, String category);

    List<ExpoBooth> findAllByOrderByBoothNumberAsc();
}