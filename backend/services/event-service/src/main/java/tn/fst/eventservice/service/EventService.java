package tn.fst.eventservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.fst.eventservice.kafka.EventParticipationProducer;
import tn.fst.eventservice.dto.EventRequest;
import tn.fst.eventservice.dto.EventResponse;
import tn.fst.eventservice.dto.EventParticipationEvent;
import tn.fst.eventservice.entity.Event;
import tn.fst.eventservice.repository.EventRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventParticipationProducer eventParticipationProducer;

    public EventResponse create(EventRequest request) {
        Event event = Event.builder()
                .titre(request.getTitre())
                .description(request.getDescription())
                .type(request.getType())
                .organisateur(request.getOrganisateur())
                .dateHeure(request.getDateHeure())
                .lieu(request.getLieu())
                .nombrePlaces(request.getNombrePlaces())
                .participants(new ArrayList<>())
                .partenaires(request.getPartenaires() != null ? request.getPartenaires() : new ArrayList<>())
                .affiche(request.getAffiche())
                .build();

        Event saved = eventRepository.save(event);
        return toResponse(saved);
    }

    public List<EventResponse> getAll() {
        return eventRepository.findAllByOrderByDateHeureDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public EventResponse getById(String id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé avec l'id: " + id));
        return toResponse(event);
    }

    public List<EventResponse> getByOrganisateur(String email) {
        return eventRepository.findByOrganisateur(email)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<EventResponse> getUpcomingEvents() {
        return eventRepository.findByDateHeureAfter(LocalDateTime.now())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public EventResponse update(String id, EventRequest request) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé avec l'id: " + id));

        event.setTitre(request.getTitre());
        event.setDescription(request.getDescription());
        event.setType(request.getType());
        event.setDateHeure(request.getDateHeure());
        event.setLieu(request.getLieu());
        event.setNombrePlaces(request.getNombrePlaces());
        event.setPartenaires(request.getPartenaires());
        event.setAffiche(request.getAffiche());

        Event updated = eventRepository.save(event);
        return toResponse(updated);
    }

    public void delete(String id) {
        if (!eventRepository.existsById(id)) {
            throw new RuntimeException("Événement non trouvé avec l'id: " + id);
        }
        eventRepository.deleteById(id);
    }

    public EventResponse participate(String id, String userEmail) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé avec l'id: " + id));

        if (event.getParticipants().contains(userEmail)) {
            throw new RuntimeException("Vous êtes déjà inscrit à cet événement");
        }

        if (event.getPlacesRestantes() <= 0) {
            throw new RuntimeException("Aucune place disponible pour cet événement");
        }

        event.getParticipants().add(userEmail);
        Event updated = eventRepository.save(event);

        if (updated.getOrganisateur() != null && !updated.getOrganisateur().isBlank()) {
            eventParticipationProducer.publishParticipation(EventParticipationEvent.builder()
                    .eventId(updated.getId())
                    .eventTitle(updated.getTitre())
                    .participantEmail(userEmail)
                    .organizerEmail(updated.getOrganisateur())
                    .build());
        }

        return toResponse(updated);
    }

    public EventResponse cancelParticipation(String id, String userEmail) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé avec l'id: " + id));

        if (!event.getParticipants().contains(userEmail)) {
            throw new RuntimeException("Vous n'êtes pas inscrit à cet événement");
        }

        event.getParticipants().remove(userEmail);
        Event updated = eventRepository.save(event);
        return toResponse(updated);
    }

    public List<EventResponse> getMyParticipations(String email) {
        return eventRepository.findByParticipantsContaining(email)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private EventResponse toResponse(Event event) {
        return EventResponse.builder()
                .id(event.getId())
                .titre(event.getTitre())
                .description(event.getDescription())
                .type(event.getType())
                .organisateur(event.getOrganisateur())
                .dateHeure(event.getDateHeure())
                .lieu(event.getLieu())
                .nombrePlaces(event.getNombrePlaces())
                .placesRestantes(event.getPlacesRestantes())
                .participants(event.getParticipants())
                .partenaires(event.getPartenaires())
                .affiche(event.getAffiche())
                .build();
    }
}
