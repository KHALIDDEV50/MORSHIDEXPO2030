
package com.morshid.expo2030.Repository;

import com.morshid.expo2030.Model.AICharacter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AICharacterRepository extends JpaRepository<AICharacter, Long> {

    Optional<AICharacter> findByCode(String code);

    boolean existsByCode(String code);
}
