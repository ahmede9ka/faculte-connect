import { useEffect, useMemo, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { fetchMyProjects, fetchProjectMessages } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { ChatMessage, ProjectMember } from '@/lib/types';

const WS_URL = (import.meta as { env?: Record<string, string> }).env?.VITE_WS_URL
  ?? 'http://localhost:8082/ws/chat';

function formatTime(value: string) {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function StudentChatPage() {
  const { userEmail, userName } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const stompRef = useRef<Client | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['student-chat-projects', userEmail],
    queryFn: fetchMyProjects,
    enabled: Boolean(userEmail),
  });

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const { data: history = [] } = useQuery({
    queryKey: ['chat-history', selectedProjectId],
    queryFn: () => fetchProjectMessages(selectedProjectId),
    enabled: Boolean(selectedProjectId),
  });

  useEffect(() => {
    setMessages(history);
  }, [history]);

  useEffect(() => {
    if (!selectedProjectId || !userEmail) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/projects/${selectedProjectId}`, (frame) => {
          try {
            const payload = JSON.parse(frame.body) as ChatMessage;
            setMessages((prev) => [...prev, payload]);
          } catch {
            // ignore malformed messages
          }
        });
      },
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
      stompRef.current = null;
    };
  }, [selectedProjectId, userEmail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const members = useMemo<ProjectMember[]>(() => selectedProject?.membres || [], [selectedProject]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || !selectedProjectId || !userEmail) return;

    const payload = {
      projectId: selectedProjectId,
      senderEmail: userEmail,
      senderName: userName || userEmail,
      content: trimmed,
    };

    stompRef.current?.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload),
    });

    setDraft('');
  };

  return (
    <DashboardLayout>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr_260px]">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium">Projets en commun</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun projet</p>
          ) : (
            <div className="space-y-2">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger><SelectValue placeholder="Choisir un projet" /></SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.titre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                {selectedProject ? `Projet selectionne: ${selectedProject.titre}` : 'Choisissez un projet'}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card flex flex-col min-h-[520px]">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="font-medium">Discussion</h2>
              <p className="text-xs text-muted-foreground">Canal du projet en commun</p>
            </div>
            {selectedProject && (
              <Badge variant="outline">{selectedProject.titre}</Badge>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun message pour le moment.</p>
            ) : (
              messages.map((message) => {
                const isMine = message.senderEmail === userEmail;
                return (
                  <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${isMine ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <div className="text-xs opacity-80 mb-1">
                        {message.senderName}{' '}•{' '}{formatTime(message.createdAt)}
                      </div>
                      <div>{message.content}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t p-3 flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ecrire un message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button onClick={handleSend} disabled={!draft.trim() || !selectedProjectId}>Envoyer</Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium">Membres et roles</h2>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun membre</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.email} className="flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <div className="font-medium">{member.nom || member.email}</div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </div>
                  <Badge variant="outline">{member.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
