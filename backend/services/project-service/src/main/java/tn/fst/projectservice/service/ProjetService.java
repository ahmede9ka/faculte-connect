package tn.fst.projectservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.fst.projectservice.client.AuthServiceClient;
import tn.fst.projectservice.dto.ApprobationRequest;
import tn.fst.projectservice.dto.ProjetRequest;
import tn.fst.projectservice.dto.TacheRequest;
import tn.fst.projectservice.entity.*;
import tn.fst.projectservice.repository.ProjetRepository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjetService {

    private final ProjetRepository projetRepository;
    private final AuthServiceClient authServiceClient;

    // ✅ Create project
    public Projet create(ProjetRequest request) {
        if (!authServiceClient.userExists(request.getChefProjet())) {
            throw new RuntimeException("Chef " + request.getChefProjet() + " not found");
        }

        if (request.getMembres() != null) {
            for (String email : request.getMembres()) {
                if (!authServiceClient.userExists(email)) {
                    throw new RuntimeException("Member " + email + " not found");
                }
            }
        }

        Projet projet = Projet.builder()
                .titre(request.getTitre())
                .desc(request.getDesc())
                .chefProjet(request.getChefProjet())
                .organisation(request.getOrganisation())
                .deadline(request.getDeadline())
                .validite(request.isValidite())
                .status(StatusProjet.EN_ATTENTE)
                .approbation(StatusApprobation.EN_ATTENTE)
                .progression(0)
                .membres(request.getMembres() != null ? request.getMembres() : new ArrayList<>())
                .taches(request.getTaches() != null ? request.getTaches() : new ArrayList<>())
                .objectifs(request.getObjectifs() != null ? request.getObjectifs() : new ArrayList<>())
                .ressources(request.getRessources() != null ? request.getRessources() : new ArrayList<>())
                .affectations(request.getAffectations() != null ? request.getAffectations() : new HashMap<>())
                .build();
        return projetRepository.save(projet);
    }

    public List<Projet> getAll() {
        return projetRepository.findAll();
    }

    public Projet getById(String id) {
        return projetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Projet not found: " + id));
    }

    public List<Projet> getByChef(String email) {
        return projetRepository.findByChefProjet(email);
    }

    public List<Projet> getByMembre(String email) {
        return projetRepository.findByMembresContaining(email);
    }

    public List<Projet> getByOrganisation(String organisation) {
        return projetRepository.findByOrganisation(organisation);
    }

    public List<Projet> getByStatus(StatusProjet status) {
        return projetRepository.findByStatus(status);
    }

    public List<Projet> getByApprobation(StatusApprobation approbation) {
        return projetRepository.findByApprobation(approbation);
    }

    // ✅ Admin approval
    public Projet updateApprobation(String id, ApprobationRequest request) {
        Projet projet = getById(id);
        projet.setApprobation(request.getApprobation());
        projet.setCommentaireAdmin(request.getCommentaireAdmin());

        if (request.getApprobation() == StatusApprobation.APPROUVE) {
            projet.setStatus(StatusProjet.EN_COURS);
        }
        if (request.getApprobation() == StatusApprobation.REJETE) {
            projet.setStatus(StatusProjet.ANNULE);
        }

        return projetRepository.save(projet);
    }

    // ✅ Update progression manually
    public Projet updateProgression(String id, int progression) {
        Projet projet = getById(id);
        projet.setProgression(progression);
        if (progression == 100) {
            projet.setStatus(StatusProjet.TERMINE);
        }
        return projetRepository.save(projet);
    }

    // ✅ Full update
    public Projet update(String id, ProjetRequest request) {
        Projet projet = getById(id);
        projet.setTitre(request.getTitre());
        projet.setDesc(request.getDesc());
        projet.setDeadline(request.getDeadline());
        projet.setStatus(request.getStatus());
        projet.setMembres(request.getMembres());
        projet.setTaches(request.getTaches());
        projet.setObjectifs(request.getObjectifs());
        projet.setRessources(request.getRessources());
        projet.setAffectations(request.getAffectations());
        return projetRepository.save(projet);
    }

    public void delete(String id) {
        projetRepository.deleteById(id);
    }

    // ✅ Add task to project
    public Projet addTache(String projetId, TacheRequest request) {
        Projet projet = getById(projetId); // ✅ declare projet FIRST

        // ✅ then validate members
        for (String email : request.getMembresEmails()) {
            if (!authServiceClient.userExists(email)) {
                throw new RuntimeException("User " + email + " not found");
            }
            if (!projet.getMembres().contains(email)) {
                throw new RuntimeException("Member " + email + " is not in this project");
            }
        }

        Tache tache = Tache.builder()
                .id(UUID.randomUUID().toString())
                .titre(request.getTitre())
                .description(request.getDescription())
                .status(StatusProjet.EN_ATTENTE)
                .echeance(request.getEcheance())
                .progression(0)
                .membresEmails(request.getMembresEmails())
                .build();

        projet.getTaches().add(tache);

        // update affectations for each member
        for (String email : request.getMembresEmails()) {
            projet.getAffectations()
                    .computeIfAbsent(email, k -> new ArrayList<>())
                    .add(tache.getId());
        }

        return projetRepository.save(projet);
    }

    // ✅ Update task
    public Projet updateTache(String projetId, String tacheId, TacheRequest request) {
        Projet projet = getById(projetId);

        projet.getTaches().stream()
                .filter(t -> t.getId().equals(tacheId))
                .findFirst()
                .ifPresent(tache -> {
                    tache.setTitre(request.getTitre());
                    tache.setDescription(request.getDescription());
                    tache.setStatus(request.getStatus());
                    tache.setEcheance(request.getEcheance());
                    tache.setProgression(request.getProgression());
                    tache.setMembresEmails(request.getMembresEmails());
                });

        // recalculate project progression from tasks average
        int avgProgression = (int) projet.getTaches().stream()
                .mapToInt(Tache::getProgression)
                .average()
                .orElse(0);
        projet.setProgression(avgProgression);

        if (avgProgression == 100) {
            projet.setStatus(StatusProjet.TERMINE);
        }

        return projetRepository.save(projet);
    }

    // ✅ Delete task
    public Projet deleteTache(String projetId, String tacheId) {
        Projet projet = getById(projetId);
        projet.getTaches().removeIf(t -> t.getId().equals(tacheId));
        projet.getAffectations().values()
                .forEach(tacheIds -> tacheIds.remove(tacheId));
        return projetRepository.save(projet);
    }

    // ✅ Get tasks by member
    public List<Tache> getTachesByMembre(String projetId, String membreEmail) {
        Projet projet = getById(projetId);
        return projet.getTaches().stream()
                .filter(t -> t.getMembresEmails().contains(membreEmail))
                .toList();
    }
}