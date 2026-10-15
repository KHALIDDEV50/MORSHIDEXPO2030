
package com.morshid.expo2030.Repository;

import com.morshid.expo2030.Model.ExpoZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpoZoneRepository extends JpaRepository<ExpoZone, String> {

    List<ExpoZone> findAllByOrderByZoneNumberAsc();
}
