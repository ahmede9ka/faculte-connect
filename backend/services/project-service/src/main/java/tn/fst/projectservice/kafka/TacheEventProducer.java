package tn.fst.projectservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import tn.fst.projectservice.dto.TacheAssigneeEvent;

@Service
@RequiredArgsConstructor
@Slf4j
public class TacheEventProducer {

    private final KafkaTemplate<String, TacheAssigneeEvent> kafkaTemplate;
    public static final String TACHE_ASSIGNEE_TOPIC = "tache-assignee";

    public void publishTacheAssignee(TacheAssigneeEvent event) {
        // Send one message — notification-service will fan out to each member
        kafkaTemplate.send(TACHE_ASSIGNEE_TOPIC, event.getTacheId(), event);
        log.info("Event tache-assignee publié pour tache: {}", event.getTacheId());
    }
}
