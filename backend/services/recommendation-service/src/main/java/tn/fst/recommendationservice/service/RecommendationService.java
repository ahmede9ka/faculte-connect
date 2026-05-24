package tn.fst.recommendationservice.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tn.fst.recommendationservice.client.AuthServiceClient;
import tn.fst.recommendationservice.client.EventDto;
import tn.fst.recommendationservice.client.EventServiceClient;
import tn.fst.recommendationservice.client.ProjectServiceClient;
import tn.fst.recommendationservice.client.ProjetDto;
import tn.fst.recommendationservice.client.UserDto;
import tn.fst.recommendationservice.dto.RecommendationResponse;
import tn.fst.recommendationservice.entity.Recommendation;
import tn.fst.recommendationservice.repository.RecommendationRepository;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);
    private static final int MAX_RECOMMENDATIONS = 10;
    private static final double MIN_SCORE = 8.0;
    private static final Set<String> STOP_WORDS = Set.of(
            "a", "an", "and", "are", "as", "at", "avec", "be", "by", "de", "des", "du", "en", "et",
            "for", "from", "in", "is", "la", "le", "les", "of", "on", "or", "pour", "the", "to",
            "un", "une", "with"
    );

    private final RecommendationRepository recommendationRepository;
    private final AuthServiceClient authServiceClient;
    private final ProjectServiceClient projectServiceClient;
    private final EventServiceClient eventServiceClient;

    public List<RecommendationResponse> generate(String userId) {
        try {
            UserDto user = authServiceClient.getUserByEmail(userId);
            List<ProjetDto> projects = safeProjects();
            List<EventDto> events = safeEvents();
            List<String> competences = cleanCompetences(user != null ? user.getCompetences() : null);
            List<ProjetDto> workedProjects = projects.stream()
                    .filter(project -> isWorkedProject(project, userId))
                    .collect(Collectors.toList());

            String profileText = buildUserProfileText(user, competences, workedProjects);
            if (tokens(profileText).isEmpty()) {
                safeClearUserRecommendations(userId);
                return Collections.emptyList();
            }

            List<Candidate> candidates = new ArrayList<>();
            projects.stream()
                    .filter(project -> isAvailableProject(project, userId))
                    .forEach(project -> candidates.add(Candidate.project(project, projectText(project))));
            events.stream()
                    .filter(event -> isAvailableEvent(event, userId))
                    .forEach(event -> candidates.add(Candidate.event(event, eventText(event))));

            if (candidates.isEmpty()) {
                safeClearUserRecommendations(userId);
                return Collections.emptyList();
            }

            Map<String, Double> profileVector = vectorize(profileText, candidates);
            List<ScoredCandidate> scoredCandidates = candidates.stream()
                    .map(candidate -> score(candidate, profileVector, competences, workedProjects))
                    .filter(scored -> scored.score() >= MIN_SCORE)
                    .sorted(Comparator.comparingDouble(ScoredCandidate::score).reversed())
                    .limit(MAX_RECOMMENDATIONS)
                    .collect(Collectors.toList());

            List<Recommendation> recommendations = scoredCandidates.stream()
                    .map(scored -> toRecommendation(userId, scored))
                    .collect(Collectors.toList());

            return saveOrReturn(userId, recommendations);

        } catch (Exception e) {
            log.error("Error generating recommendations for user {}", userId, e);
            return Collections.emptyList();
        }
    }

    public List<RecommendationResponse> getByUserId(String userId) {
        try {
            return recommendationRepository.findByUserIdOrderByCompetenceMatchDesc(userId)
                    .stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Unable to read cached recommendations for user {}", userId, e);
            return Collections.emptyList();
        }
    }

    public List<RecommendationResponse> getOrGenerate(String userId) {
        List<RecommendationResponse> recommendations = getByUserId(userId);
        if (recommendations.isEmpty()) {
            return generate(userId);
        }
        return recommendations;
    }

    public List<RecommendationResponse> refresh(String userId) {
        return generate(userId);
    }

    public void delete(String id) {
        if (!recommendationRepository.existsById(id)) {
            throw new RuntimeException("Recommendation non trouvee avec l'id: " + id);
        }
        recommendationRepository.deleteById(id);
    }

    private ScoredCandidate score(
            Candidate candidate,
            Map<String, Double> profileVector,
            List<String> competences,
            List<ProjetDto> workedProjects
    ) {
        Map<String, Double> candidateVector = vectorize(candidate.text(), Collections.emptyList());
        double semanticScore = cosine(profileVector, candidateVector) * 100.0;

        List<String> matchedCompetences = matchedCompetences(candidate.text(), competences);
        double skillScore = competences.isEmpty()
                ? 0.0
                : ((double) matchedCompetences.size() / competences.size()) * 100.0;

        double experienceScore = workedProjects.stream()
                .mapToDouble(project -> cosine(candidateVector, vectorize(projectText(project), Collections.emptyList())))
                .max()
                .orElse(0.0) * 100.0;

        double availabilityBoost = candidate.type().equals("PROJECT") ? projectAvailabilityBoost(candidate.project()) : 8.0;
        double finalScore = (semanticScore * 0.55) + (skillScore * 0.30) + (experienceScore * 0.15) + availabilityBoost;
        return new ScoredCandidate(candidate, Math.min(finalScore, 100.0), matchedCompetences);
    }

    private Map<String, Double> vectorize(String text, List<Candidate> candidates) {
        List<String> profileTokens = tokens(text);
        List<List<String>> documents = new ArrayList<>();
        documents.add(profileTokens);
        candidates.stream()
                .map(candidate -> tokens(candidate.text()))
                .forEach(documents::add);

        Map<String, Double> vector = new HashMap<>();
        Map<String, Long> termFrequency = profileTokens.stream()
                .collect(Collectors.groupingBy(token -> token, Collectors.counting()));

        for (Map.Entry<String, Long> entry : termFrequency.entrySet()) {
            String token = entry.getKey();
            long docsContainingToken = documents.stream()
                    .filter(document -> document.contains(token))
                    .count();
            double idf = Math.log((1.0 + documents.size()) / (1.0 + docsContainingToken)) + 1.0;
            vector.put(token, entry.getValue() * idf);
        }

        return vector;
    }

    private double cosine(Map<String, Double> left, Map<String, Double> right) {
        if (left.isEmpty() || right.isEmpty()) {
            return 0.0;
        }

        double dot = 0.0;
        for (Map.Entry<String, Double> entry : left.entrySet()) {
            dot += entry.getValue() * right.getOrDefault(entry.getKey(), 0.0);
        }

        double leftNorm = Math.sqrt(left.values().stream().mapToDouble(value -> value * value).sum());
        double rightNorm = Math.sqrt(right.values().stream().mapToDouble(value -> value * value).sum());
        if (leftNorm == 0.0 || rightNorm == 0.0) {
            return 0.0;
        }

        return dot / (leftNorm * rightNorm);
    }

    private String buildUserProfileText(UserDto user, List<String> competences, List<ProjetDto> workedProjects) {
        StringBuilder profile = new StringBuilder();
        appendRepeated(profile, safe(user != null ? user.getName() : null), 1);
        appendRepeated(profile, safe(user != null ? user.getFaculte() : null), 2);
        appendRepeated(profile, safe(user != null ? user.getSpecialite() : null), 3);
        competences.forEach(competence -> appendRepeated(profile, competence, 5));
        workedProjects.forEach(project -> appendRepeated(profile, projectText(project), 3));
        return profile.toString();
    }

    private String projectText(ProjetDto project) {
        return join(
                project.getTitre(),
                project.getDesc(),
                project.getCategorie(),
                project.getOrganisation(),
                project.getStatus(),
                project.getApprobation()
        );
    }

    private String eventText(EventDto event) {
        return join(
                event.getTitre(),
                event.getDescription(),
                event.getType(),
                event.getOrganisateur(),
                event.getLieu()
        );
    }

    private boolean isWorkedProject(ProjetDto project, String userId) {
        return equalsIgnoreCase(project.getChefProjet(), userId)
                || (project.getMembres() != null && project.getMembres().stream().anyMatch(member -> equalsIgnoreCase(member, userId)));
    }

    private boolean isAvailableProject(ProjetDto project, String userId) {
        if (isWorkedProject(project, userId)) {
            return false;
        }

        String status = normalize(project.getStatus());
        String approbation = normalize(project.getApprobation());
        return !status.equals("termine")
                && !status.equals("annule")
                && !approbation.equals("rejete");
    }

    private boolean isAvailableEvent(EventDto event, String userId) {
        boolean notParticipant = event.getParticipants() == null
                || event.getParticipants().stream().noneMatch(participant -> equalsIgnoreCase(participant, userId));
        boolean upcoming = event.getDateHeure() == null || event.getDateHeure().isAfter(LocalDateTime.now().minusHours(1));
        return notParticipant && upcoming;
    }

    private double projectAvailabilityBoost(ProjetDto project) {
        String status = normalize(project.getStatus());
        String approbation = normalize(project.getApprobation());
        double boost = 0.0;
        if (status.equals("en cours") || status.equals("en attente")) {
            boost += 6.0;
        }
        if (approbation.equals("approuve")) {
            boost += 4.0;
        }
        if (project.getDeadline() != null && project.getDeadline().isAfter(LocalDate.now())) {
            boost += 3.0;
        }
        return boost;
    }

    private List<String> matchedCompetences(String text, List<String> competences) {
        String normalizedText = " " + normalize(text) + " ";
        List<String> matched = new ArrayList<>();
        for (String competence : competences) {
            Set<String> keywords = keywords(competence);
            if (keywords.stream().anyMatch(keyword -> normalizedText.contains(" " + keyword + " "))) {
                matched.add(competence);
            }
        }
        return matched;
    }

    private Set<String> keywords(String value) {
        String normalized = normalize(value);
        Set<String> result = new LinkedHashSet<>();
        if (normalized.length() > 1) {
            result.add(normalized);
        }
        Arrays.stream(normalized.split(" "))
                .filter(token -> token.length() > 1)
                .forEach(result::add);
        return result;
    }

    private List<String> cleanCompetences(List<String> competences) {
        if (competences == null) {
            return Collections.emptyList();
        }

        return competences.stream()
                .filter(competence -> competence != null && !competence.isBlank())
                .map(String::trim)
                .distinct()
                .collect(Collectors.toList());
    }

    private List<String> tokens(String text) {
        String normalized = normalize(text);
        if (normalized.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(normalized.split(" "))
                .filter(token -> token.length() > 1)
                .filter(token -> !STOP_WORDS.contains(token))
                .collect(Collectors.toList());
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }

        String withoutAccents = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return withoutAccents.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private String join(String... values) {
        return Arrays.stream(values)
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.joining(" "));
    }

    private String safe(String value) {
        return value != null ? value : "";
    }

    private void appendRepeated(StringBuilder builder, String value, int times) {
        if (value == null || value.isBlank()) {
            return;
        }
        for (int i = 0; i < times; i++) {
            builder.append(value).append(' ');
        }
    }

    private boolean equalsIgnoreCase(String left, String right) {
        return left != null && right != null && left.equalsIgnoreCase(right);
    }

    private List<ProjetDto> safeProjects() {
        try {
            List<ProjetDto> projects = projectServiceClient.getAllProjets();
            return projects != null ? projects : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Unable to fetch projects for recommendations", e);
            return Collections.emptyList();
        }
    }

    private List<EventDto> safeEvents() {
        try {
            List<EventDto> events = eventServiceClient.getUpcomingEvents();
            return events != null ? events : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Unable to fetch events for recommendations", e);
            return Collections.emptyList();
        }
    }

    private List<RecommendationResponse> saveOrReturn(String userId, List<Recommendation> recommendations) {
        try {
            recommendationRepository.deleteByUserId(userId);
            return recommendationRepository.saveAll(recommendations).stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Unable to cache recommendations for user {}; returning generated recommendations without persistence", userId, e);
            return recommendations.stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
    }

    private void safeClearUserRecommendations(String userId) {
        try {
            recommendationRepository.deleteByUserId(userId);
        } catch (Exception e) {
            log.warn("Unable to clear recommendations for user {}", userId, e);
        }
    }

    private Recommendation toRecommendation(String userId, ScoredCandidate scored) {
        Candidate candidate = scored.candidate();
        Recommendation.RecommendationBuilder builder = Recommendation.builder()
                .userId(userId)
                .recommendationType(candidate.type())
                .titre(candidate.title())
                .categorie(candidate.category())
                .competenceMatch((int) Math.round(scored.score()))
                .dateRecommendation(LocalDateTime.now())
                .competencesMatched(scored.matchedCompetences());

        if (candidate.project() != null) {
            builder.projetId(candidate.project().getId());
        }
        if (candidate.event() != null) {
            builder.eventId(candidate.event().getId());
        }

        return builder.build();
    }

    private RecommendationResponse toResponse(Recommendation recommendation) {
        return RecommendationResponse.builder()
                .id(recommendation.getId())
                .userId(recommendation.getUserId())
                .projetId(recommendation.getProjetId())
                .eventId(recommendation.getEventId())
                .recommendationType(recommendation.getRecommendationType())
                .titre(recommendation.getTitre())
                .categorie(recommendation.getCategorie())
                .competenceMatch(recommendation.getCompetenceMatch())
                .dateRecommendation(recommendation.getDateRecommendation())
                .competencesMatched(recommendation.getCompetencesMatched())
                .build();
    }

    private record Candidate(String type, ProjetDto project, EventDto event, String text) {
        static Candidate project(ProjetDto project, String text) {
            return new Candidate("PROJECT", project, null, text);
        }

        static Candidate event(EventDto event, String text) {
            return new Candidate("EVENT", null, event, text);
        }

        String title() {
            return project != null ? project.getTitre() : event.getTitre();
        }

        String category() {
            if (project != null) {
                return project.getCategorie() != null && !project.getCategorie().isBlank()
                        ? project.getCategorie()
                        : project.getOrganisation();
            }
            return event.getType();
        }
    }

    private record ScoredCandidate(Candidate candidate, double score, List<String> matchedCompetences) {
    }
}
