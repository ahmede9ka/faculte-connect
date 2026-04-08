package tn.fst.recommendationservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.fst.recommendationservice.dto.RecommendationResponse;
import tn.fst.recommendationservice.service.RecommendationService;

import java.util.List;

@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/user/{email}")
    public ResponseEntity<List<RecommendationResponse>> getRecommendations(@PathVariable String email) {
        List<RecommendationResponse> recommendations = recommendationService.getByUserId(email);

        // If no recommendations exist, generate them
        if (recommendations.isEmpty()) {
            recommendations = recommendationService.generate(email);
        }

        return ResponseEntity.ok(recommendations);
    }

    @PostMapping("/user/{email}/refresh")
    public ResponseEntity<List<RecommendationResponse>> refreshRecommendations(@PathVariable String email) {
        List<RecommendationResponse> recommendations = recommendationService.refresh(email);
        return ResponseEntity.ok(recommendations);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecommendation(@PathVariable String id) {
        recommendationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
