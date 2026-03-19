package tn.fst.projectservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.fst.projectservice.dto.ApprobationRequest;
import tn.fst.projectservice.dto.ProjetRequest;
import tn.fst.projectservice.dto.TacheRequest;
import tn.fst.projectservice.entity.Projet;
import tn.fst.projectservice.entity.StatusApprobation;
import tn.fst.projectservice.entity.StatusProjet;
import tn.fst.projectservice.entity.Tache;
import tn.fst.projectservice.service.ProjetService;

import java.util.List;

@RestController
@RequestMapping("/projets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProjetController {

    private final ProjetService projetService;

    // ===== PROJET ENDPOINTS =====

    @PostMapping
    public ResponseEntity<Projet> create(@RequestBody ProjetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projetService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<Projet>> getAll() {
        return ResponseEntity.ok(projetService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Projet> getById(@PathVariable String id) {
        return ResponseEntity.ok(projetService.getById(id));
    }

    @GetMapping("/chef/{email}")
    public ResponseEntity<List<Projet>> getByChef(@PathVariable String email) {
        return ResponseEntity.ok(projetService.getByChef(email));
    }

    @GetMapping("/membre/{email}")
    public ResponseEntity<List<Projet>> getByMembre(@PathVariable String email) {
        return ResponseEntity.ok(projetService.getByMembre(email));
    }

    @GetMapping("/organisation/{organisation}")
    public ResponseEntity<List<Projet>> getByOrganisation(@PathVariable String organisation) {
        return ResponseEntity.ok(projetService.getByOrganisation(organisation));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Projet>> getByStatus(@PathVariable StatusProjet status) {
        return ResponseEntity.ok(projetService.getByStatus(status));
    }

    @GetMapping("/approbation/{approbation}")
    public ResponseEntity<List<Projet>> getByApprobation(@PathVariable StatusApprobation approbation) {
        return ResponseEntity.ok(projetService.getByApprobation(approbation));
    }

    @PatchMapping("/{id}/approbation")
    public ResponseEntity<Projet> updateApprobation(@PathVariable String id,
                                                    @RequestBody ApprobationRequest request) {
        return ResponseEntity.ok(projetService.updateApprobation(id, request));
    }

    @PatchMapping("/{id}/progression")
    public ResponseEntity<Projet> updateProgression(@PathVariable String id,
                                                    @RequestParam int valeur) {
        return ResponseEntity.ok(projetService.updateProgression(id, valeur));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Projet> update(@PathVariable String id,
                                         @RequestBody ProjetRequest request) {
        return ResponseEntity.ok(projetService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        projetService.delete(id);
    }

    // ===== TACHE ENDPOINTS =====

    @PostMapping("/{projetId}/taches")
    public ResponseEntity<Projet> addTache(@PathVariable String projetId,
                                           @RequestBody TacheRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projetService.addTache(projetId, request));
    }

    @PutMapping("/{projetId}/taches/{tacheId}")
    public ResponseEntity<Projet> updateTache(@PathVariable String projetId,
                                              @PathVariable String tacheId,
                                              @RequestBody TacheRequest request) {
        return ResponseEntity.ok(projetService.updateTache(projetId, tacheId, request));
    }

    @DeleteMapping("/{projetId}/taches/{tacheId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTache(@PathVariable String projetId,
                            @PathVariable String tacheId) {
        projetService.deleteTache(projetId, tacheId);
    }

    @GetMapping("/{projetId}/taches/membre/{email}")
    public ResponseEntity<List<Tache>> getTachesByMembre(@PathVariable String projetId,
                                                         @PathVariable String email) {
        return ResponseEntity.ok(projetService.getTachesByMembre(projetId, email));
    }
}