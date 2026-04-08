package tn.fst.authservice.service;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class ListService {

    private static final List<String> COMPETENCES = Arrays.asList(
            "Java",
            "Python",
            "JavaScript",
            "TypeScript",
            "React",
            "Angular",
            "Vue.js",
            "Spring Boot",
            "Node.js",
            "Django",
            "Machine Learning",
            "Data Science",
            "DevOps",
            "Cloud Computing",
            "AWS",
            "Azure",
            "Docker",
            "Kubernetes",
            "CI/CD",
            "MySQL",
            "PostgreSQL",
            "MongoDB",
            "Redis",
            "Microservices",
            "REST API",
            "GraphQL",
            "Git",
            "Agile",
            "Scrum",
            "UI/UX Design",
            "Mobile Development",
            "Android",
            "iOS",
            "Flutter",
            "React Native",
            "Cybersecurity",
            "Blockchain",
            "IoT",
            "AI/ML",
            "Big Data"
    );

    private static final List<String> FACULTES = Arrays.asList(
            "Faculté des Sciences de Tunis",
            "Faculté des Sciences Économiques et de Gestion de Tunis",
            "Faculté de Médecine de Tunis",
            "Faculté de Droit et des Sciences Politiques de Tunis",
            "École Nationale d'Ingénieurs de Tunis",
            "Institut Supérieur de Gestion de Tunis",
            "École Supérieure des Sciences et Techniques de Tunis",
            "Institut Préparatoire aux Études d'Ingénieurs",
            "Faculté des Lettres et des Sciences Humaines de Tunis",
            "École Nationale des Sciences de l'Informatique",
            "Institut Supérieur d'Informatique",
            "Faculté des Sciences Juridiques, Politiques et Sociales de Tunis"
    );

    public List<String> getCompetences() {
        return COMPETENCES;
    }

    public List<String> getFacultes() {
        return FACULTES;
    }
}
