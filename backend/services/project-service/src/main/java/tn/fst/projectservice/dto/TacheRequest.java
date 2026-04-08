package tn.fst.projectservice.dto;

import lombok.Data;
import tn.fst.projectservice.entity.StatusProjet;

import java.time.LocalDate;
import java.util.List;

@Data
public class TacheRequest {
    private String titre;
    private String description;
    private StatusProjet status;
    private LocalDate echeance;
    private int progression;
    private List<String> membresEmails;
}