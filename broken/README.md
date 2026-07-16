# Broken stack — fix it (student)

This is the same microservices app as the demo, but we planted several bugs. Your
job is to get it fully working: `docker compose up --build` succeeds, the page at
http://localhost:8080 loads **styled**, and BOTH panels (Users and Tasks) show data
and accept new entries.

Do NOT read the solution. Use the diagnosis ladder:
```
1. docker compose ps            what's up / restarting / exited?
2. docker compose logs <svc>    what did it say before it failed?
3. docker compose exec <svc> sh get inside and test its view
4. curl/ping a dependency       can it reach db / redis / another service?
5. docker inspect <svc>         env vars, networks, health
```

There are **4** bugs. They span a Dockerfile, the gateway config, the compose file,
and the frontend. Fix them one at a time, re-running `docker compose up --build`
after each. Keep a note of: the symptom, how you found it, and the fix.
