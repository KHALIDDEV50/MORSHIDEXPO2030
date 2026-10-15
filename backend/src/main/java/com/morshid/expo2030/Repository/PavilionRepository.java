
package com.morshid.expo2030.Repository;

import com.morshid.expo2030.Model.Pavilion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PavilionRepository extends JpaRepository<Pavilion, Long> {

    List<Pavilion> findByActiveTrue();

    List<Pavilion> findByCategoryIgnoreCaseAndActiveTrue(String category);
}
