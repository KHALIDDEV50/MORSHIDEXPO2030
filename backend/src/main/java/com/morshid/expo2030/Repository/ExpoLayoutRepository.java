
package com.morshid.expo2030.Repository;

import com.morshid.expo2030.Model.ExpoLayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpoLayoutRepository extends JpaRepository<ExpoLayout, String> {
}
