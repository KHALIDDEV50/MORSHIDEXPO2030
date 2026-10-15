package com.morshid.expo2030.Repository;

import com.morshid.expo2030.Model.ExpoFacility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpoFacilityRepository extends JpaRepository<ExpoFacility, String> {

    List<ExpoFacility> findByZone_ZoneId(String zoneId);
}