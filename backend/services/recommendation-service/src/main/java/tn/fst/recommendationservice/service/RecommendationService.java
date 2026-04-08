package tn.fst.recommendationservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.fst.recommendationservice.client.AuthServiceClient;
import tn.fst.recommendationservice.client.ProjectServiceClient;
import tn.fst.recommendationservice.client.ProjetDto;
import tn.fst.recommendationservice.client.UserDto;
import tn.fst.recommendationservice.dto.RecommendationResponse;
import tn.fst.recommendationservice.entity.Recommendation;
import tn.fst.recommendationservice.repository.RecommendationRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final AuthServiceClient authServiceClient;
    private final ProjectServiceClient projectServiceClient;

    public List<RecommendationResponse> generate(String userId) {
        try {
            // Get user competences
            UserDto user = authServiceClient.getUserByEmail(userId);
            List<String> userCompetences = user.getCompetences();

            if (userCompetences == null || userCompetences.isEmpty()) {
                return new ArrayList<>();
            }

            // Get all projects
            List<ProjetDto> projects = projectServiceClient.getAllProjets();

            // Clear old recommendations
            recommendationRepository.deleteByUserId(userId);

            // Generate recommendations
            List<Recommendation> recommendations = new ArrayList<>();

            for (ProjetDto project : projects) {
                // Skip projects user is already part of
                if (project.getMembres() != null && project.getMembres().contains(userId)) {
                    continue;
                }

                // Calculate match (simple algorithm - can be improved)
                List<String> matchedCompetences = new ArrayList<>();
                int matchScore = 0;

                // For simplicity, match based on project title/description containing competence keywords
                String projectText = (project.getTitre() + " " + project.getDesc()).toLowerCase();

                for (String competence : userCompetences) {
                    if (projectText.contains(competence.toLowerCase())) {
                        matchedCompetences.add(competence);
                        matchScore += 20; // Each match adds 20%
                    }
                }

                // Only recommend if there's at least some match
                if (matchScore > 0) {
                    matchScore = Math.min(matchScore, 100); // Cap at 100%

                    Recommendation recommendation = Recommendation.builder()
                            .userId(userId)
                            .projetId(project.getId())
                            .titre(project.getTitre())
                            .categorie(project.getCategorie())
                            .competenceMatch(matchScore)
                            .dateRecommendation(LocalDateTime.now())
                            .competencesMatched(matchedCompetences)
                            .build();

                    recommendations.add(recommendation);
                }
            }

            // Sort by match score and save top 10
            recommendations.sort((a, b) -> Integer.compare(b.getCompetenceMatch(), a.getCompetenceMatch()));
            List<Recommendation> topRecommendations = recommendations.stream()
                    .limit(10)
                    .collect(Collectors.toList());

            List<Recommendation> saved = recommendationRepository.saveAll(topRecommendations);

            return saved.stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            // Log error and return empty list
            System.err.println("Error generating recommendations: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<RecommendationResponse> getByUserId(String userId) {
        return recommendationRepository.findByUserIdOrderByCompetenceMatchDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<RecommendationResponse> refresh(String userId) {
        return generate(userId);
    }

    public void delete(String id) {
        if (!recommendationRepository.existsById(id)) {
            throw new RuntimeException("Recommendation non trouvée avec l'id: " + id);
        }
        recommendationRepository.deleteById(id);
    }

    private RecommendationResponse toResponse(Recommendation recommendation) {
        return RecommendationResponse.builder()
                .id(recommendation.getId())
                .userId(recommendation.getUserId())
                .projetId(recommendation.getProjetId())
                .titre(recommendation.getTitre())
                .categorie(recommendation.getCategorie())
                .competenceMatch(recommendation.getCompetenceMatch())
                .dateRecommendation(recommendation.getDateRecommendation())
                .competencesMatched(recommendation.getCompetencesMatched())
                .build();
    }
}
